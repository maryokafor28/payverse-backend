import express from "express";
import transactionsRouter from "./routes/transactions.route";
import { errorHandler } from "./middlewares/errorHandler"; // ← Import your error middleware

export const createApp = () => {
  const app = express();

  //middleware
  app.use(express.json());

  //Routes
  app.use("/api/transactions", transactionsRouter);

  //Health check

  app.get("/health", (req, res) => {
    res.json({ status: "ok", message: "payverse is running sucessfully " });
  });

  app.get("/", (req, res) => {
    res.json({
      message: "Welcome to PayVerse API",
      endpoints: {
        health: "/health",
        transactions: "/api/transactions",
      },
    });
  });

  app.use(errorHandler);
  return app;
};
