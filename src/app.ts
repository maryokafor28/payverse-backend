import express from "express";
import cors from "cors";
import transactionsRouter from "./routes/transactions.route";
import usersRouter from "./routes/users.route";
import { errorHandler } from "./middlewares/errorHandler";

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
    })
  );

  //middleware
  app.use(express.json());

  //Routes
  app.use("/api/transactions", transactionsRouter);
  app.use("/api/users", usersRouter);
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
