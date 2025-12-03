// src/routes/transaction.route.ts
import { Router } from "express";
import {
  createTransaction,
  listTransactions,
} from "../controllers/transactions.controller";

const router = Router();

router.post("/", createTransaction);
router.get("/:userId", listTransactions);

export default router;
