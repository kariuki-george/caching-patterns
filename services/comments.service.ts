import db from "../providers/db";
import redis from "../providers/redis";
import { v4 as uuidv4 } from "uuid";

export interface ICreateComment {
  comment: string;
  postId: number;
}

export type IComment = ICreateComment & {
  uuid: string;
  authorId: number;
};

export const createComment = async (
  { comment, postId }: ICreateComment,
  userId: number
): Promise<IComment> => {
  // Give every comment a unique uuid
  const newComment: IComment = {
    uuid: uuidv4(),
    comment,
    postId,
    authorId: userId,
  };

  // Add the comment into redis list
  await redis.rpush("comments", JSON.stringify(newComment));

  return newComment;
};

// TODO: Perform error handling.
export const writeBehindComments = async () => {
  // Get the length of the comments list
  const length = await redis.llen("comments");
  const elements: IComment[] = [];

  if (length == 0) {
    return;
  }

  // Get the range of all items in the list that were
  // counted in the length above.
  const elemString = await redis.lrange("comments", 0, length - 1);
  for (const m in elemString) {
    elements.push(JSON.parse(elemString[m]) as IComment);
  }

  // Save the elements in db.
  await db.comments.createMany({ data: elements });

  // Remove the elements in redis after successfully saving them in db.
  await redis.ltrim("comments", length, -1);
};

// TODO: filter the comments by post
export const getComments = async (): Promise<IComment[]> => {
  return db.comments.findMany();
};
