import { injectable, inject } from "inversify";
import { Router, Request, Response } from "express";
import { TYPES } from "../types";
import { UserService } from "../services/UserService";

@injectable()
export class UserController {
  private router: Router;

  constructor(@inject(TYPES.UserService) private userService: UserService) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.get("/", this.getUsers.bind(this));
    this.router.get("/count", this.getUserCount.bind(this));
    this.router.get("/:id", this.getUserById.bind(this));
    this.router.post("/", this.createUser.bind(this));
    this.router.put("/:id", this.updateUser.bind(this));
    this.router.delete("/:id", this.deleteUser.bind(this));
  }

  public getRouter(): Router {
    return this.router;
  }

  private async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await this.userService.getAllUsers();
      res.json({
        success: true,
        data: users,
        count: users.length,
      });
    } catch (error) {
      console.error("Error in getUsers:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch users",
      });
    }
  }

  private async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);

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
      });
    } catch (error) {
      console.error("Error in getUserById:", error);
      const message = error instanceof Error ? error.message : "Failed to fetch user";
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  }

  private async getUserCount(req: Request, res: Response): Promise<void> {
    try {
      const count = await this.userService.getUserCount();
      res.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      console.error("Error in getUserCount:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get user count",
      });
    }
  }

  private async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { name, email } = req.body;

      if (!name || !email) {
        res.status(400).json({
          success: false,
          error: "Name and email are required",
        });
        return;
      }

      const user = await this.userService.createUser({ name, email });
      res.status(201).json({
        success: true,
        data: user,
        message: "User created successfully",
      });
    } catch (error) {
      console.error("Error in createUser:", error);
      const message = error instanceof Error ? error.message : "Failed to create user";
      const statusCode = message.includes("already exists") ? 409 : 500;

      res.status(statusCode).json({
        success: false,
        error: message,
      });
    }
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
}
