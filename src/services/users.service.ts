// src/services/users.service.ts
import { db } from "../db/pgClients";

interface CreateUserDTO {
  email: string;
  name: string;
}

export const createUser = async (data: CreateUserDTO) => {
  const { email, name } = data;

  // Check if email already exists
  const existing = await db().query(
    "SELECT id FROM users WHERE email = $1 LIMIT 1",
    [email]
  );

  if (existing.rows.length > 0) {
    throw new Error("Email already exists");
  }

  const result = await db().query(
    `INSERT INTO users (email, name)
     VALUES ($1, $2)
     RETURNING *`,
    [email, name]
  );

  return result.rows[0];
};

export const getAllUsers = async () => {
  const result = await db().query("SELECT * FROM users ORDER BY id DESC");
  return result.rows;
};

export const getUserById = async (id: number) => {
  const result = await db().query("SELECT * FROM users WHERE id = $1", [id]);
  return result.rows[0] || null;
};
