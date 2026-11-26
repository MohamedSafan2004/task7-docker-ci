import app from "./app";
import { connectRedis } from "./config/redis";

async function start() {
  try {
    await connectRedis();
  } catch (err) {
    console.error("Redis unavailable, running without cache");
  }
  app.listen(3000, () => {
    console.log("server is Running");
  });
}

start();
