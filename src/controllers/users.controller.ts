// src/controllers/users.controller.ts
import { Request, Response, NextFunction } from "express";
import * as userService from "../services/users.service";

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, name } = req.body;

    // Basic validation
    if (!email || !name) {
      return res.status(400).json({ message: "email and name are required" });
    }

    const user = await userService.createUser({ email, name });
    return res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await userService.getAllUsers();
    return res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await userService.getUserById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json(user);
  } catch (error) {
    next(error);
  }
};
