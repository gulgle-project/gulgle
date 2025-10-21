import z from "zod";

export const SettingsDTOSchema = z.object({
  userId: z.string(),
  lastModified: z.date(),
});

export type SettingsDTO = z.infer<typeof SettingsDTOSchema>;
