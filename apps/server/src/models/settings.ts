import { ObjectId } from "bson";
import z from "zod";

// Bang schemas matching shared types
const BuiltInBangSchema = z.object({
  t: z.string(),
  s: z.string(),
  u: z.string(),
  d: z.string(),
  ts: z.array(z.string()).optional(),
});

const CustomBangSchema = BuiltInBangSchema.extend({
  c: z.literal(true),
});

const BangSchema = z.union([BuiltInBangSchema, CustomBangSchema]);

export const SettingsSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  userId: z.string(),
  customBangs: z.array(CustomBangSchema).default([]),
  defaultBang: BangSchema.optional(),
  lastModified: z.date(),
});

export type Settings = z.infer<typeof SettingsSchema>;
