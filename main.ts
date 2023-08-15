import express, { NextFunction, Request, Response } from "express";
import * as dotenv from "dotenv";
import db from "./providers/db";
import { json } from "body-parser";
import {
  UsersRouter,
  AuthRouter,
  PostsRouter,
  CommentsRouter,
} from "./controllers";
import { IUser } from "./services/users.service";
import { authMiddleware } from "./services/auth.service";
import crons from "./services/index.crons";

// Setup user globally
declare global {
  namespace Express {
    export interface Request {
      user: IUser;
    }
  }
}

dotenv.config();
const app = express();
app.use(json());

// Start c

// Router - no auth required
app.use("/users", UsersRouter);
app.use("/auth", AuthRouter);

// Routers with auth

app.use("/posts", authMiddleware, PostsRouter);
app.use("/comments", authMiddleware, CommentsRouter);

// Shutdown services after request and handle errors

app.use(async (err: any, _req: Request, res: Response, _next: NextFunction) => {
  try {
    await db.$disconnect();
    if (err) {
      throw new Error(err);
    }
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Something went wrong" });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started successfully");
  for (const m in crons) {
    console.log("Starting cron jobs");
    crons[m].start();
  }
});
