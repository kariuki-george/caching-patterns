import db from "../providers/db";
import redis from "../providers/redis";

interface ICreatePost {
  imageUrl: string;
  caption: string;
}

export type IPost = ICreatePost & { id: number };

export const createPost = async (
  { caption, imageUrl }: ICreatePost,
  userId: number
): Promise<IPost> => {
  const post = await db.posts.create({
    data: { caption, imageUrl, author: { connect: { id: userId } } },
  });
  return post;
};


export const cachePosts = async () => {
  const posts = await db.posts.findMany({ take: 30 });
  await redis.set("posts", JSON.stringify(posts));
};

export const getPosts = async (): Promise<IPost[]> => {
  // Master data-lookup
  const postsString = await redis.get("posts");

  let posts: IPost[] = [];
  if (postsString && postsString !== "null") {
    posts = JSON.parse(postsString);
  }

  return posts;
};
