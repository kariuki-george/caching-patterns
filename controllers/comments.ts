import { Router } from "express";
import { createComment, getComments } from "../services/comments.service";

const router = Router();

router.get("/", async (_res, res, next) => {
  try {
    //   Cache aside
    const comments = await getComments();
    res.json(comments);
  } catch (error: any) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const newComment = await createComment(req.body, req.user.id);
    res.json(newComment);
  } catch (error) {
    next(error);
  }
});

export { router };
