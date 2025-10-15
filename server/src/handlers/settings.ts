import { executeQuery } from "../db/db";
import { SettingsDTOSchema } from "../dtos/settings";
import type { RequestContext } from "../middleware/context";
import { USER_KEY } from "../middleware/context";
import { type Settings, SettingsSchema } from "../models/settings";
import { notFound, wrapOrNotFound } from "../utils";

export async function pullSettings(req: RequestContext): Promise<Response> {
  const settings = await executeQuery("settings", (col) =>
    col.findOne<Settings>({ userId: req.requireData(USER_KEY) }),
  );
  return wrapOrNotFound(SettingsDTOSchema, settings);
}

export async function pushSettings(req: RequestContext): Promise<Response> {
  const body = await req.request.json();
  const parsed = await SettingsDTOSchema.parseAsync(body);

  const stored = await executeQuery("settings", (col) => col.findOne<Settings>({ userId: req.requireData(USER_KEY) }));
  if (!stored) {
    return notFound();
  }

  if (stored.lastModified > parsed.lastModified) {
    return new Response("Conflict", { status: 409 });
  }

  const newValue = await SettingsSchema.parseAsync(parsed);

  const result = await executeQuery("settings", (col) => col.updateOne({ _id: stored.id }, newValue));
  return wrapOrNotFound(SettingsDTOSchema, newValue);
}
