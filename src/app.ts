import express, { NextFunction, Request, Response } from "express";
import route from "./routes/userRoute";
import productRoute from "./routes/productRoute";
import helmet from "helmet";
import cors from "cors";
import orderRoute from "./routes/orderRoute";

const app = express();
app.use(helmet());
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.use("/api/auth", route);
app.use("/api/products", productRoute);
app.use("/api/orders", orderRoute);

//error hundler

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  //malformed JSON body
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ message: "Invalid JSON body" });
    return;
  }
  //anything unexpected
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

export default app;
