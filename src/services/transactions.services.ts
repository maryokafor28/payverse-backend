// src/services/transaction.service.ts
import { db } from "../db/pgClients";
import { redisClient } from "../cache/redisClient";

export interface CreateTxnInput {
  userId: number;
  amount: number;
  currency?: string;
  reference?: string;
}

export async function createTransaction(input: CreateTxnInput) {
  const client = await db().connect(); // ← Use db() function
  try {
    const { userId, amount, currency = "USD", reference } = input;

    const result = await client.query(
      `INSERT INTO transactions (user_id, amount, currency, reference) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, amount, currency, reference]
    );

    const txn = result.rows[0];

    // Cache recent transactions for user
    const cacheKey = `user:${userId}:recent_txns`;
    await redisClient.lPush(cacheKey, JSON.stringify(txn));
    await redisClient.lTrim(cacheKey, 0, 49);

    // Broadcast via WebSocket
    const { WebSocketServer } = await import("../websocket/wsServer");
    WebSocketServer.broadcast(
      JSON.stringify({
        type: "transaction_created",
        data: txn,
      })
    );

    return txn;
  } finally {
    client.release();
  }
}

export async function getTransactionsByUser(userId: number) {
  // Try cache first
  const cacheKey = `user:${userId}:recent_txns`;
  const cached = await redisClient.lRange(cacheKey, 0, -1);

  if (cached && cached.length > 0) {
    return cached.map((s) => JSON.parse(s));
  }

  // Fallback to DB
  const result = await db().query(
    `SELECT * FROM transactions 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT 50`,
    [userId]
  );

  return result.rows;
}
