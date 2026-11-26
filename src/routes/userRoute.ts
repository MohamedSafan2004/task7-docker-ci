import { Router } from "express";
import { authenticateToken, authorizeRole } from "../middleware/authMiddleware";
import {
  register,
  login,
  getProfile,
  getAdminDashboard,
} from "../controllers/userController";
import { loginLimiter } from "../middleware/rateLimiter";

const route = Router();

//puplic routes no token needed
route.post("/register", register);
route.post("/login", loginLimiter, login);

//protected routes
route.get("/profile", authenticateToken, getProfile);
route.get(
  "/admindashboard",
  authenticateToken,
  authorizeRole("ADMIN"),
  getAdminDashboard,
);

export default route;
