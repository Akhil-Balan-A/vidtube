import {z} from "zod";

export const playlistSchema = z.object({
    name: z.string().min(3, "Playlist name must be at least 3 characters long").max(50, "Playlist name must be at most 50 characters long"),
    description: z.string().min(3, "Description must be at least 3 characters long").max(500, "Description must be at most 500 characters long"),
    isPublic: z.boolean().default(false),
});
