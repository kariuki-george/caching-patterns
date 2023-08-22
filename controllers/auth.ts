import { Router } from "express";
import { login, logout } from "../services/auth.service";

const router = Router();

router.post("/login", async (req, res, next) => {
  try {
    //   Can do more data validation
    const { email, password } = req.body;
    const data = await login(email, password);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    const data = await logout(req.user);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export { router };
