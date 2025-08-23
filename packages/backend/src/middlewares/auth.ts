import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function authenticateToken(req: any, res: Response, next: NextFunction) {
  const authToken = req.headers["authorization"];
  if (!authToken) {
    return res.status(401).json({ error: "You are not authorized to access this resource" });
  }
  const token = authToken.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "You are not authorized to access this resource" });
  }
  const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
  if (!accessTokenSecret) {
    return res.status(401).json({ error: "Error while verifying access token" });
  }
  jwt.verify(token, accessTokenSecret, (error: any, user: any) => {
    if (error) {
      return res.status(401).json({ error: "You are not authorized to access this resource" });
    }
    req.user = user;
    next();
  });
}
