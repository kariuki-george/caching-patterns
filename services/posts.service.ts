import prisma from "../providers/db";

interface ICreatePost {
  imageUrl: string;
  caption: string;
}

export type IPost = ICreatePost & { id: number };

export const createPost = async (
  { caption, imageUrl }: ICreatePost,
  userId: number
): Promise<IPost> => {
  const post = await prisma.posts.create({
    data: { caption, imageUrl, author: { connect: { id: userId } } },
  });
  return post;
};

export const getPosts = async (): Promise<IPost[]> => {
  return prisma.posts.findMany();
};
