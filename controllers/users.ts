import { Router } from "express";
import { createUser } from "../services/users.service";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const user = req.body;
    const response = await createUser(user);
    res.json(response);
  } catch (error: any) {
    next(error);
  }
});

export { router };
