import { injectable } from "inversify";
import { Request, Response } from "express";

@injectable()
export class AppController {
  public healthCheck(req: Request, res: Response): void {
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      service: "Backend API",
      version: "1.0.0",
    });
  }
}
