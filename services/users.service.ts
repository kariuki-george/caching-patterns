import db from "../providers/db";
import redis from "../providers/redis";
import { hashPass } from "./auth.service";

interface ICreateUser {
  email: string;
  name: string;
  password: string;
}

export interface IUser {
  email: string;
  name: string;
  id: number;
  jwtVersion: number;
}

export const createUser = async ({ email, name, password }: ICreateUser) => {
  // Verify user is unique
  const user = await getUserByEmail(email);
  if (user) {
    throw new Error("User with the provided email already exists");
  }

  const hashedPassword = await hashPass(password);
  try {
    const { id } = await db.users.create({
      data: { email, name, password: hashedPassword },
      select: { id: true },
    });

    return {
      email,
      id,
      name,
    };
  } catch (error: any) {
    throw new Error(error?.message || "Something went wrong");
  }
};

export const getUserByEmail = async (email: string): Promise<IUser | null> => {
  // Cache aside to improve performance.

  // 1. Get user from redis
  const userString = await redis.get("user-" + email);
  // 2. If user: return user
  if (userString && userString !== "null") {
    return JSON.parse(userString);
  }

  // 3. User not in cache. Get user from DB
  const user = await db.users.findUnique({
    where: { email },
    select: { email: true, name: true, id: true, jwtVersion: true },
  });

  // 4. Cache the user
  await redis.set("user-" + email, JSON.stringify(user));

  // 5. Return the user
  return user;
};
