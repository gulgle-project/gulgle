import { ObjectId } from "bson";
import { executeQuery } from "../db/db";
import { UserDTOSchema } from "../dtos/user";
import { type RequestContext, USER_KEY } from "../middleware/context";
import type User from "../models/user";
import { wrapOrNotFound } from "../utils";

export async function getCurrentUser(req: RequestContext): Promise<Response> {
  const user = await executeQuery("user", (col) => col.findOne<User>({ _id: new ObjectId(req.requireData(USER_KEY)) }));
  return await wrapOrNotFound(UserDTOSchema, user);
}

export async function deleteUserData(userId: string, query = executeQuery): Promise<void> {
  await query("settings", (col) => col.deleteMany({ userId }));
  await query("user", (col) => col.deleteOne({ _id: new ObjectId(userId) }));
}

export async function deleteCurrentUser(
  req: RequestContext,
  deleteData: (userId: string) => Promise<void> = deleteUserData,
): Promise<Response> {
  const userId = req.requireData(USER_KEY);

  if (!ObjectId.isValid(userId)) {
    return new Response(null, { status: 400 });
  }

  await deleteData(userId);
  return new Response(null, { status: 204 });
}
