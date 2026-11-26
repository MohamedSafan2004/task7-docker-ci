import { Request, Response } from "express";
import { Prisma } from "../generated/prisma/client";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/productServices";

// validate the body shared by POST and PUT

const parseProductBody = (body: unknown) => {
  const { name, price, stock } = (body ?? {}) as Record<string, unknown>;
  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof price !== "number" ||
    price < 0 ||
    typeof stock !== "number" ||
    !Number.isInteger(stock) ||
    stock < 0
  ) {
    return null;
  }
  return { name: name.trim(), price, stock };
};

//validate the :id param (positive integer)

const parseId = (value: unknown) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

//GET /api/products?page=1&limit=10&search=shirt

export const listProducts = async (req: Request, res: Response) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
  const search =
    typeof req.query.search === "string" ? req.query.search : undefined;

  const result = await getProducts(page, limit, search);
  res.status(200).json(result);
};

//POST /api/prodact (Admin only)

export const addProduct = async (req: Request, res: Response) => {
  const data = parseProductBody(req.body);
  if (!data) {
    res.status(400).json({
      message: "name (text), price (number) and stock (integer) are required",
    });
    return;
  }
  const product = await createProduct(data.name.trim(), data.price, data.stock);
  res.status(201).json(product);
};

// PUT /api/product/:id (Admin only)

export const updateProductById = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const data = parseProductBody(req.body);
  if (id === null || !data) {
    res.status(400).json({
      message:
        "valid id in the URL and name (text), price (number), stock (integer) are required",
    });
    return;
  }
  try {
    const prodact = await updateProduct(id, data.name, data.price, data.stock);
    res.status(200).json(prodact);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    throw err;
  }
};

// DELETE /api/product/:id (Admin only)
export const deleteProductById = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ message: "valid id is required in the URL" });
    return;
  }
  try {
    await deleteProduct(id);
    res.status(204).send();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        res.status(404).json({ message: "Product not found" });
        return;
      }
      if (err.code === "P2003") {
        res.status(409).json({
          message: "Product is used in existing orders and can't be deleted",
        });
        return;
      }
    }
    throw err;
  }
};
