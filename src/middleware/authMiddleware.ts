import { Request, Response, NextFunction } from "express";
import { Role } from "../generated/prisma/client";
import Jwt from "jsonwebtoken";

//request may carrythe logged-in user's data
export interface AuthRequest extends Request {
  user?: { id: number; role: Role };
}

//middleware to check the token before reaching private routes
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Access denied" });
    return;
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({ message: "server configuration error" });
    return;
  }

  try {
    const decoded = Jwt.verify(token, secret) as { id: number; role: Role };
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ message: "Invalid or expired token" });
  }
};

//middleware to allow only a specific role

export const authorizeRole = (role: Role) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }
    next();
  };
};
