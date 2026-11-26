import { Router } from "express";
import { authenticateToken, authorizeRole } from "../middleware/authMiddleware";
import {
  addProduct,
  listProducts,
  updateProductById,
  deleteProductById,
} from "../controllers/productController";

const route = Router();

//puplic route
route.get("/", listProducts);

//Admin only routes //

//create product
route.post("/", authenticateToken, authorizeRole("ADMIN"), addProduct);

//update product
route.put("/:id", authenticateToken, authorizeRole("ADMIN"), updateProductById);

//delete product
route.delete(
  "/:id",
  authenticateToken,
  authorizeRole("ADMIN"),
  deleteProductById,
);

export default route;
