import * as argon from "argon2";
import { IUser, getUserByEmail } from "./users.service";
import prisma from "../providers/db";
import { sign, verify } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";

export const hashPass = async (pass: string): Promise<string> => {
  const hash = await argon.hash(pass, {
    secret: Buffer.from(process.env.PASS_SECRET as string),
  });
  return hash;
};

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  // Auth token in passed in aid header
  const aid = req.headers["aid"] as string;

  try {
    const payload: IUser = verify(aid, process.env.JWT_SECRET as string, {
      issuer: "Caching-Code-Login",
      audience: "Caching-Code-Auth",
    }) as IUser;

    const user = await getUserByEmail(payload.email);

    if (!user) {
      throw new Error("Authentication failed");
    }
    req.user = user;
  } catch (error) {
    next(error);
  }
};

export const login = async (
  email: string,
  password: string
): Promise<{ token: string; user: IUser }> => {
  // Get user
  const user = await prisma.users.findUnique({ where: { email } });
  if (!user) {
    throw new Error("User with the provided email not found");
  }
  // Validate pass
  const isValid = await argon.verify(user.password, password, {
    secret: Buffer.from(process.env.PASS_SECRET as string),
  });

  if (!isValid) {
    throw new Error("Wrong email or password");
  }

  // User is valid thus provide jwt access token
  const token = sign(
    { email, name: user.name, id: user.id },
    process.env.JWT_SECRET as string,
    { issuer: "Caching-Code-Login", audience: "Caching-Code-Auth" }
  );

  return { token, user: { email, name: user.name, id: user.id } };
};
