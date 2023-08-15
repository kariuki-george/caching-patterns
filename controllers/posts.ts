import { Router } from "express";
import { createPost, getPosts } from "../services/posts.service";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const newPost = await createPost(req.body, req.user.id);
    res.json(newPost);
  } catch (error) {
    next(error);
  }
});

router.get("/", async (_req, res, next) => {
  try {
    const posts = await getPosts();
    res.json(posts);
  } catch (error) {
    next(error);
  }
});

export { router };
