import { injectable, inject } from "inversify";
import { Router, Request, Response } from "express";
import { TYPES } from "../types";
import { UserService } from "../services/UserService";
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import { 
  validate, 
  createUserSchema, 
  updateUserSchema, 
  loginSchema, 
  validateIdParam 
} from '../middleware/validation';
import { asyncHandler } from '../middleware/responseHandler';

@injectable()
export class UserController {
  private router: Router;

  constructor(@inject(TYPES.UserService) private userService: UserService) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Public routes
    this.router.post('/register', validate(createUserSchema), asyncHandler(this.createUser.bind(this)));
    this.router.post('/login', validate(loginSchema), asyncHandler(this.loginUser.bind(this)));
    
    // Protected/Optional auth routes
    this.router.get("/", optionalAuthMiddleware, asyncHandler(this.getUsers.bind(this)));
    this.router.get("/count", optionalAuthMiddleware, asyncHandler(this.getUserCount.bind(this)));
    this.router.get("/:id", validateIdParam, optionalAuthMiddleware, asyncHandler(this.getUserById.bind(this)));
    this.router.put("/:id", validateIdParam, authMiddleware, validate(updateUserSchema), asyncHandler(this.updateUser.bind(this)));
    this.router.delete("/:id", validateIdParam, authMiddleware, asyncHandler(this.deleteUser.bind(this)));
    
    // Profile routes
    this.router.get('/profile/me', authMiddleware, asyncHandler(this.getProfile.bind(this)));
    this.router.put('/profile/me', authMiddleware, validate(updateUserSchema), asyncHandler(this.updateProfile.bind(this)));
    this.router.post('/logout', authMiddleware, asyncHandler(this.logout.bind(this)));
  }

  public getRouter(): Router {
    return this.router;
  }

  private async getUsers(req: Request, res: Response): Promise<void> {
    const users = await this.userService.getAllUsers();
    res.success(users, `Found ${users.length} users`, users.length);
  }

  private async getUserById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const user = await this.userService.getUserById(id);
    
    if (!user) {
      res.error('User not found', null, 404);
      return;
    }
    
    res.success(user);
  }

  private async getUserCount(req: Request, res: Response): Promise<void> {
    const count = await this.userService.getUserCount();
    res.success({ count }, `Total users: ${count}`);
  }

  private async createUser(req: Request, res: Response): Promise<void> {
    const user = await this.userService.createUser(req.body);
    res.success(user, 'User created successfully');
  }

  private async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (Object.keys(updateData).length === 0) {
        res.status(400).json({
          success: false,
          error: "No update data provided",
        });
        return;
      }

      const user = await this.userService.updateUser(id, updateData);

      if (!user) {
        res.status(404).json({
          success: false,
          error: "User not found",
        });
        return;
      }

      res.json({
        success: true,
        data: user,
        message: "User updated successfully",
      });
    } catch (error) {
      console.error("Error in updateUser:", error);
      const message = error instanceof Error ? error.message : "Failed to update user";
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  }

  private async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await this.userService.deleteUser(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: "User not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error("Error in deleteUser:", error);
      const message = error instanceof Error ? error.message : "Failed to delete user";
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  }

  /**
   * New authentication methods
   */
  private async loginUser(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    const result = await this.userService.authenticateUser(email, password);
    
    if (!result) {
      res.error('Invalid email or password', null, 401);
      return;
    }
    
    // Set HTTP-only cookie for security
    res.cookie('accessToken', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    res.success({
      user: result.user,
      token: result.token
    }, 'Login successful');
  }

  private async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.error('Authentication required', null, 401);
      return;
    }
    
    const user = await this.userService.getUserById(req.user.id.toString());
    
    if (!user) {
      res.error('User not found', null, 404);
      return;
    }
    
    res.success(user, 'Profile retrieved successfully');
  }

  private async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.error('Authentication required', null, 401);
      return;
    }
    
    const user = await this.userService.updateUser(req.user.id.toString(), req.body);
    
    if (!user) {
      res.error('User not found', null, 404);
      return;
    }
    
    res.success(user, 'Profile updated successfully');
  }

  private async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Clear the HTTP-only cookie
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    res.success(null, 'Logout successful');
  }
}
