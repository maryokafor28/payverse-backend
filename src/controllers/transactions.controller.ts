// src/controllers/transaction.controller.ts
import { Request, Response, NextFunction } from "express";
import * as transactionService from "../services/transactions.services";

export async function createTransaction(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { userId, amount, currency, reference } = req.body;
    if (!userId || !amount) {
      return res
        .status(400)
        .json({ message: "userId and amount are required" });
    }
    const txn = await transactionService.createTransaction({
      userId,
      amount,
      currency,
      reference,
    });
    return res.status(201).json(txn);
  } catch (err) {
    next(err);
  }
}

export async function listTransactions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }
    const txns = await transactionService.getTransactionsByUser(userId);
    return res.status(200).json(txns);
  } catch (err) {
    next(err);
  }
}
