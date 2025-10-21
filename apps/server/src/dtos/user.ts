import { z } from "zod";

export const UserDTOSchema = z.object({
  email: z.email(),
});

export type UserDTO = z.infer<typeof UserDTOSchema>;
