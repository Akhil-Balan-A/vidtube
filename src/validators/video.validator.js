import { z } from "zod";

export const videoUploadSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .min(3, "Title must be at least 3 characters long")
    .max(100, "Title can't be more than 100 charactors long"),
  description: z
    .string({ required_error: "Description is required" })
    .min(10, "Description must be at least 10 characters long")
    .max(500, "Description can't be more than 500 charactors long"),
  isPublished: z.preprocess((val) => {
    if (val === "true") return true;
    if (val === "false") return false;
    if (typeof val === "boolean") return val;
    return true; // Default
  }, z.boolean()),
});

export const videoUpdateSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .min(3, "Title must be at least 3 characters long")
    .max(100, "Title can't be more than 100 charactors long"),
  description: z
    .string({ required_error: "Description is required" })
    .min(10, "Description must be at least 10 characters long")
    .max(500, "Description can't be more than 500 charactors long"),
  isPublished: z.preprocess((val) => {
    if (val === "true") return true;
    if (val === "false") return false;
    if (typeof val === "boolean") return val;
    return true; // Default
  }, z.boolean()),
});


