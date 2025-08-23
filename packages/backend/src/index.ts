import "reflect-metadata";
import { Container } from "inversify";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import services and controllers
import { TYPES } from "./types";
import { AppController } from "./controllers/AppController";
import { UserController } from "./controllers/UserController";
import { UserService } from "./services/UserService";

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
    // Bind services
    this.container.bind<UserService>(TYPES.UserService).to(UserService);

    // Bind controllers
    this.container.bind<AppController>(TYPES.AppController).to(AppController);
    this.container.bind<UserController>(TYPES.UserController).to(UserController);
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(
      cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
      })
    );
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    const appController = this.container.get<AppController>(TYPES.AppController);
    const userController = this.container.get<UserController>(TYPES.UserController);

    // Health check
    this.app.get("/health", appController.healthCheck.bind(appController));

    // API routes
    this.app.use("/api/users", userController.getRouter());

    // 404 handler
    this.app.use("*", (req, res) => {
      res.status(404).json({ error: "Route not found" });
    });
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log(`🚀 Backend server running on http://localhost:${this.port}`);
      console.log(`📊 Health check available at http://localhost:${this.port}/health`);
    });
  }
}

// Start the server
const server = new Server();
server.start();
