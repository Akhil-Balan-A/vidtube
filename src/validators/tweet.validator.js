import { z } from "zod";

export const tweetSchema = z
  .object({
    content: z.string().trim().max(3000, "Tweet must be less than 3000 characters").optional(),
    parentTweet: z.string().optional(),
  })
  .refine(
    (data) => {
      // At least one of content or image (file) must be present
      return Boolean(data.content);
    },
    {
      message: "Tweet must have either content or image",
      path: ["content", "image"],
      code: "INVALID_TWEET",
    }
  );