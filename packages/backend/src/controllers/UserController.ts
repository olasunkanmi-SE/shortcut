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
    this.router.get("/:id", this.getUserById.bind(this));
    this.router.post("/", this.createUser.bind(this));
  }

  public getRouter(): Router {
    return this.router;
  }

  private async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await this.userService.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  }

  private async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  }

  private async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { name, email } = req.body;

      if (!name || !email) {
        res.status(400).json({ error: "Name and email are required" });
        return;
      }

      const user = await this.userService.createUser({ name, email });
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to create user" });
    }
  }
}
