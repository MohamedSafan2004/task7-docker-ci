import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { createOrder, orderError } from "../services/orderServices";

//POST /api/orders (any logged-in user)
export const addOrder = async (req: AuthRequest, res: Response) => {
  const items = req.body?.items;

  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    !items.every(
      (item) =>
        Number.isInteger(item.productId) &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0,
    )
  ) {
    res.status(400).json({
      message: "items must be a non-empty array of { productId, quantity }",
    });
    return;
  }
  if (!req.user) {
    res.status(401).json({ message: "Access denied" });
    return;
  }

  try {
    const order = await createOrder(req.user.id, items);
    res.status(201).json(order);
  } catch (error) {
    if (error instanceof orderError) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error(error);
    res.status(500).json({ message: "could not create this order" });
  }
};
