import { ObjectId } from "bson";
import z from "zod";

export const SettingsSchema = z.object({
  id: z.instanceof(ObjectId).optional(),
  userId: z.string(),
  lastModified: z.date(),
});

export type Settings = z.infer<typeof SettingsSchema>;
