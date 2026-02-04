import { z } from "zod";

export const toggleLikeSchema = z.object({
  action: z.enum(["like", "dislike"], {
    required_error: "Action is required",
    invalid_type_error: "Action must be either 'like' or 'dislike'",
  }),
});
