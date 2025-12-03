// src/routes/users.route.ts
import { Router } from "express";
import {
  createUser,
  listUsers,
  getUserById,
} from "../controllers/users.controller";

const router = Router();

router.post("/", createUser); // Create user
router.get("/", listUsers); // Get all users
router.get("/:id", getUserById); // Get single user

export default router;
