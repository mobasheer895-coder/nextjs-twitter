import z from "zod";

export const postSchima = z.object({
    description: z
    .string({message:'description type should be a string'})
    .min(5,{message:'description length should be at least 5 characters'})
    .max(500,{message:'title length should be at least 500 characters'})
})