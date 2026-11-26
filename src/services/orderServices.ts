import { prisma } from "../prisma";
import { Prisma } from "../generated/prisma/client";
import { invalidateProductsCache } from "./productServices";

//error for problems caused by the client (missing product, not enough stock)

export class orderError extends Error {}

export const createOrder = async (
  userId: number,
  items: { productId: number; quantity: number }[],
) => {
  const order = await prisma.$transaction(async (tx) => {
    let total = new Prisma.Decimal(0);
    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) {
        throw new orderError(`Product ${item.productId} not found`);
      }
      //deduct stock only if there is enough of it
      const updated = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (updated.count === 0) {
        throw new orderError(`not enough stock for ${product.name}`);
      }
      total = total.add(product.price.mul(item.quantity));
    }

    return tx.order.create({
      data: {
        total,
        user: { connect: { id: userId } },
        orderItems: { create: items },
      },
      include: { orderItems: true },
    });
  });

  // stock changed, so the cached products lists are stale
  // (runs only after the transaction committed successfully)
  await invalidateProductsCache();
  return order;
};
