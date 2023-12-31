import * as argon from "argon2";
import { IUser, getUserByEmail } from "./users.service";
import db from "../providers/db";
import { sign, verify } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import redis from "../providers/redis";

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
  try {
    // Auth token in passed in aid header
    const aid = req.headers["aid"] as string;
    if (!aid) {
      throw new Error("Auth token has not been provided");
    }
    // Verify the JWT
    const payload: IUser = verify(aid, process.env.JWT_SECRET as string, {
      issuer: "Caching-Code-Login",
      audience: "Caching-Code-Auth",
    }) as IUser;

    // Get the user using the email
    const user = await getUserByEmail(payload.email);

    // Verify the token version
    if (payload.jwtVersion !== user?.jwtVersion) {
      throw new Error("Expired auth token provided");
    }

    if (!user) {
      throw new Error("Authentication failed");
    }

    // Attach a user to the request
    req.user = user;

    //  Successfully authenticated. Call the next handler.
    next();
  } catch (error) {
    next(error);
  }
};

export const login = async (
  email: string,
  password: string
): Promise<{ token: string; user: IUser }> => {
  // Get user
  const user = await db.users.findUnique({ where: { email } });
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
    { email, name: user.name, id: user.id, jwtVersion: user.jwtVersion },
    process.env.JWT_SECRET as string,
    { issuer: "Caching-Code-Login", audience: "Caching-Code-Auth" }
  );

  return {
    token,
    user: { email, name: user.name, id: user.id, jwtVersion: user.jwtVersion },
  };
};

export const logout = async ({ email }: IUser) => {
  // Update the JWT version in the db
  const user = await db.users.update({
    where: { email },
    data: { jwtVersion: { increment: 1 } },
    select: { email: true, name: true, id: true, jwtVersion: true },
  });
  // Update the user in Redis
  await redis.set("user-" + email, JSON.stringify(user));
  // Return success
  return true;
};
