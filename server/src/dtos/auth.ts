import z from "zod";

export const LoginSchema = z.strictObject({
  email: z.email(),
  password: z.string(),
});

export const LoginResponseSchema = z.strictObject({
  token: z.string(),
});

export type LoginDTO = z.infer<typeof LoginSchema>;
export type LoginResponseDTO = z.infer<typeof LoginResponseSchema>;
