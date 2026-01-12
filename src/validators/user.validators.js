import { z } from "zod";

export const userChangePasswordSchema = z.object({
    currentPassword: z.string("Current password is required").min(6, "Password must be at least 6 characters long").max(50, "Password must be at most 50 characters long"),
    newPassword: z.string("New password is required").min(6, "Password must be at least 6 characters long").max(50, "Password must be at most 50 characters long"),
})
export const userUpdateAccountInfoSchema = z.object({
    username: z.string("Username is required").min(3, "Username must be at least 3 characters long").max(20, "Username must be at most 20 characters long"),
    fullName: z.string("Full name is required").min(3, "Full name must be at least 3 characters long").max(50, "Full name must be at most 50 characters long").regex(/^[A-Za-z\s]+$/, "Name can only contain alphabets"),
    email: z.string("Email is required").email("Please fill a valid email address"),
    
});
