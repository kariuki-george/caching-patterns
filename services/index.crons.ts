import * as cron from "node-cron";
import { cachePosts } from "./posts.service";
import { writeBehindComments } from "./comments.service";

// Execute task every ten minutes
export const prefetchTasks = cron.schedule(
  "*/10 * * * *",
  async () => {
    await cachePosts();
  },
  { name: "prefetchPosts", scheduled: true, runOnInit: true }
);

// To run after every minute
export const bulkWriteComments = cron.schedule(
  "* * * * *",
  async () => {
    await writeBehindComments();
  },
  {
    name: "bulkWriteComments",
    scheduled: true,
    runOnInit: true,
  }
);

const crons = [prefetchTasks];

export default crons;
