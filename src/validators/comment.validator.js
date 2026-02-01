import { z} from "zod";

export const commentSchema = z.object({
    comment: z.string().trim().min(1, "Comment cannot be empty").max(2000, "Comment cannot be more than 2000 characters")
})

export const updateCommentSchema = z.object({
    comment: z.string().trim().min(1, "Comment cannot be empty").max(2000, "Comment cannot be more than 2000 characters")
});