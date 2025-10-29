import { executeQuery } from "../db/db";
import { SettingsDTOSchema } from "../dtos/settings";
import type { RequestContext } from "../middleware/context";
import { USER_KEY } from "../middleware/context";
import { type Settings, SettingsSchema } from "../models/settings";
import { wrapOrNotFound } from "../utils";

export async function pullSettings(req: RequestContext): Promise<Response> {
  const userId = req.requireData(USER_KEY);
  let settings = await executeQuery("settings", (col) => col.findOne<Settings>({ userId }));

  // If no settings exist, create default settings
  if (!settings) {
    const defaultSettings = SettingsSchema.parse({
      userId,
      customBangs: [],
      defaultBang: undefined,
      lastModified: new Date(),
    });

    await executeQuery("settings", (col) => col.insertOne(defaultSettings));
    settings = defaultSettings;
  }

  return wrapOrNotFound(SettingsDTOSchema, settings);
}

export async function pushSettings(req: RequestContext): Promise<Response> {
  const body = await req.request.json();
  const parsed = await SettingsDTOSchema.parseAsync(body);
  const userId = req.requireData(USER_KEY);

  const stored = await executeQuery("settings", (col) => col.findOne<Settings>({ userId }));

  if (!stored) {
    // Create new settings if they don't exist
    const newSettings = SettingsSchema.parse({
      ...parsed,
      userId,
    });

    await executeQuery("settings", (col) => col.insertOne(newSettings));
    return wrapOrNotFound(SettingsDTOSchema, newSettings);
  }

  // Check for conflicts
  if (stored.lastModified > parsed.lastModified) {
    return new Response("Conflict", { status: 409 });
  }

  const newValue = SettingsSchema.parse({
    ...parsed,
    _id: stored._id,
    userId,
  });

  await executeQuery("settings", (col) => col.updateOne({ _id: stored._id }, { $set: newValue }));
  return wrapOrNotFound(SettingsDTOSchema, newValue);
}
