import { prisma } from "../prisma";
import { Prisma } from "../generated/prisma/client";
import redisClinet from "../config/redis";

const CACHE_TTL__SECONDS = 3600; // one hour TTL ( Time-To-Live )

// delete every cached products list (all pages / searches)
export const invalidateProductsCache = async () => {
  if (!redisClinet.isReady) return;
  try {
    let cursor = "0";
    let deleted = 0;
    do {
      const reply = await redisClinet.scan(cursor, {
        MATCH: "products:list:*",
        COUNT: 100,
      });
      cursor = reply.cursor;
      if (reply.keys.length > 0) {
        await redisClinet.del(reply.keys);
        deleted += reply.keys.length;
      }
    } while (cursor !== "0");
    console.log(`cache invalidated: ${deleted} key(s) deleted`);
  } catch (err) {
    console.error("cache invalidation failed:", err);
  }
};

// Get products with pagination and optional name search

export const getProducts = async (
  page: number,
  limit: number,
  search?: string,
) => {
  const cacheKey = `products:list:${page}:${limit}:${search ?? ""}`;

  // check first if there is cache
  if (redisClinet.isReady) {
    const cached = await redisClinet.get(cacheKey);
    if (cached) {
      console.log("cache hit:", cacheKey);
      return JSON.parse(cached);
    }
  }

  //if cache miss : ask database
  console.log("cache Miss", cacheKey);

  const where: Prisma.ProductWhereInput = search
    ? { name: { contains: search, mode: "insensitive" } }
    : {};

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { id: "asc" },
    }),
    prisma.product.count({ where }),
  ]);

  const result = { items, total, page, totalPages: Math.ceil(total / limit) };

  //store cache for 1 hour

  if (redisClinet.isReady) {
    await redisClinet.setEx(
      cacheKey,
      CACHE_TTL__SECONDS,
      JSON.stringify(result),
    );
  }

  return { items, total, page, totalPages: Math.ceil(total / limit) };
};

//create product
export const createProduct = async (
  name: string,
  price: number,
  stock: number,
) => {
  const prodact = await prisma.product.create({ data: { name, price, stock } });

  await invalidateProductsCache();
  return;
};

//update product
export const updateProduct = async (
  id: number,
  name: string,
  price: number,
  stock: number,
) => {
  const product = await prisma.product.update({
    where: { id },
    data: {
      name,
      price,
      stock,
    },
  });

  //to update cache

  await invalidateProductsCache();
  return product;
};

// delete product

export const deleteProduct = async (id: number) => {
  const product = await prisma.product.delete({
    where: { id },
  });
  //update cache for validation
  await invalidateProductsCache();
  return product;
};
