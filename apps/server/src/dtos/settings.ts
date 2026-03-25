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

export const SettingsDTOSchema = z.object({
  customBangs: z.array(CustomBangSchema).default([]),
  defaultBang: BangSchema.nullish(),
  lastModified: z.coerce.date(),
});

export type SettingsDTO = z.infer<typeof SettingsDTOSchema>;
