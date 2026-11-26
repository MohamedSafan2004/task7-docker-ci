import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { addOrder } from "../controllers/orderController";
const route = Router();

route.post("/", authenticateToken, addOrder);

export default route;
