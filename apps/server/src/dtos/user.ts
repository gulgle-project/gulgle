import { z } from "zod";

export const UserDTOSchema = z.object({
  displayName: z.string(),
  email: z.email().nullish(),
});

export type UserDTO = z.infer<typeof UserDTOSchema>;
