import express, { NextFunction, Request, Response } from "express";
import * as dotenv from "dotenv";
import prisma from "./providers/db";
import { json } from "body-parser";
import { UsersRouter, AuthRouter } from "./controllers";
import { IUser } from "./services/users.service";
import { authMiddleware } from "./services/auth.service";

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

// Router - no auth required
app.use("/users", UsersRouter);
app.use("/auth", AuthRouter);

// Routers with auth
app.use((req, res, next) => {
  authMiddleware(req, res, next);
  next();
});

// Shutdown services after request and handle errors

app.use(async (err: any, _req: Request, res: Response, _next: NextFunction) => {
  try {
    await prisma.$disconnect();
    if (err) {
      throw new Error(err);
    }
  } catch (error: any) {
    res.status(400).json({ message: error.message || "Something went wrong" });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started successfully");
});
