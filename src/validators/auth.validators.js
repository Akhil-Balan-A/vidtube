import { z } from "zod";

export const userRegisterSchema = z.object({
  username: z.string({ required_error: "Username is required", invalid_type_error: "Username must be a string" }).min(3, "Username must be at least 3 characters long").max(20, "Username must be at most 20 characters long"),
  fullName: z.string({ required_error: "Full name is required", invalid_type_error: "Full name must be a string"}).min(3, "Full name must be at least 3 characters long").max(50, "Full name must be at most 50 characters long").regex(/^[A-Za-z\s]+$/, "Name can only contain alphabets"),
  email: z.string().email("Please fill a valid email address"),
  password: z.string("Password is required").min(6, "Password must be at least 6 characters long").max(50, "Password must be at most 50 characters long"),
});

export const userLoginSchema = z.object({
  email: z.string("Email is required").email("Please fill a valid email address"),
  password: z.string("Password is required").min(6, "Password must be at least 6 characters long").max(50, "Password must be at most 50 characters long"),
});
