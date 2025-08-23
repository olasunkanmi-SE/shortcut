import "reflect-metadata";
import { Container } from "inversify";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import services and controllers
import { TYPES } from "./types";
import { AppController } from "./controllers/AppController";
import { UserController } from "./controllers/UserController";
import { AuctionController } from "./controllers/AuctionController";
import { UserService } from "./services/UserService";
import { AuctionService } from "./services/AuctionService";
import { UserRepository } from "./repositories/UserRepository";
import { AuctionRepository } from "./repositories/auctionRepository";
import { connectDB, closeDB } from "./infrastructure/db";

// Import middleware
import { 
  standardizeResponses, 
  globalErrorHandler, 
  notFoundHandler 
} from "./middleware/responseHandler";

class Server {
  private app: express.Application;
  private container: Container;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || "3001", 10);
    this.container = new Container();

    this.setupContainer();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupContainer(): void {
    // Bind repositories
    this.container.bind<UserRepository>(TYPES.UserRepository).to(UserRepository);
    this.container.bind<AuctionRepository>(TYPES.AuctionRepository).to(AuctionRepository);

    // Bind services
    this.container.bind<UserService>(TYPES.UserService).to(UserService);
    this.container.bind<AuctionService>(TYPES.AuctionService).to(AuctionService);

    // Bind controllers
    this.container.bind<AppController>(TYPES.AppController).to(AppController);
    this.container.bind<UserController>(TYPES.UserController).to(UserController);
    this.container.bind<AuctionController>(TYPES.AuctionController).to(AuctionController);
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limit each IP to 1000 requests per windowMs
      message: {
        success: false,
        error: 'Too many requests from this IP, please try again later'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // CORS configuration
    this.app.use(
      cors({
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.FRONTEND_URL 
          : [
              "http://localhost:3000",
              "http://localhost:5173",
              "http://127.0.0.1:3000",
              "http://127.0.0.1:5173"
            ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
          'Origin',
          'X-Requested-With',
          'Content-Type',
          'Accept',
          'Authorization',
          'Cache-Control',
          'Pragma'
        ],
        exposedHeaders: ['X-Total-Count']
      })
    );

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser());

    // Custom middleware
    this.app.use(standardizeResponses);

    // Request logging in development
    if (process.env.NODE_ENV === 'development') {
      this.app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
      });
    }
  }

  private setupRoutes(): void {
    const appController = this.container.get<AppController>(TYPES.AppController);
    const userController = this.container.get<UserController>(TYPES.UserController);
    const auctionController = this.container.get<AuctionController>(TYPES.AuctionController);

    // Health check - should be accessible without auth
    this.app.get("/health", appController.healthCheck.bind(appController));

    // API routes
    this.app.use("/api/users", userController.getRouter());
    this.app.use("/api/auctions", auctionController.getRouter());

    // 404 handler for undefined routes
    this.app.use("*", notFoundHandler);

    // Global error handler (must be last)
    this.app.use(globalErrorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Connect to database first
      await connectDB();

      // Start the server
      const server = this.app.listen(this.port, () => {
        console.log(`🚀 Backend server running on http://localhost:${this.port}`);
        console.log(`📊 Health check available at http://localhost:${this.port}/health`);
        console.log(`🔗 API endpoints available at http://localhost:${this.port}/api`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      });

      // Graceful shutdown handlers
      const gracefulShutdown = async (signal: string) => {
        console.log(`⚠️  Received ${signal}, shutting down gracefully...`);
        
        server.close(async () => {
          console.log('🔐 HTTP server closed');
          
          try {
            await closeDB();
            console.log('✅ Database connection closed');
            console.log('👋 Process terminated gracefully');
            process.exit(0);
          } catch (error) {
            console.error('❌ Error during shutdown:', error);
            process.exit(1);
          }
        });
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));

      // Handle uncaught exceptions
      process.on('uncaughtException', (error) => {
        console.error('💀 Uncaught Exception:', error);
        process.exit(1);
      });

      // Handle unhandled rejections
      process.on('unhandledRejection', (reason, promise) => {
        console.error('💀 Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1);
      });

    } catch (error) {
      console.error("Failed to start server:", error);
      process.exit(1);
    }
  }
}

// Start the server
async function startServer() {
  const server = new Server();
  await server.start();
}

startServer().catch((error) => {
  console.error("Failed to start application:", error);
  process.exit(1);
});
