import { z } from "zod";

export const tweetSchema = z.object({
  content: z.string().trim().max(3000, "Tweet must be less than 3000 characters").optional(),
  parentTweet: z.string().optional(),
});

export const tweetUpdateSchema = z.object({
  content: z.string().trim().max(3000, "Tweet must be less than 3000 characters").optional(),
})