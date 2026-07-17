import { ObjectId } from "bson";
import type { Collection } from "mongodb";
import { executeQuery } from "../db/db";
import { UserDTOSchema } from "../dtos/user";
import { type RequestContext, USER_KEY } from "../middleware/context";
import type User from "../models/user";
import type { RefreshTokenFamily } from "../refresh-tokens";
import { wrapOrNotFound } from "../utils";

export async function getCurrentUser(req: RequestContext): Promise<Response> {
  const user = await executeQuery("user", (col) => col.findOne<User>({ _id: new ObjectId(req.requireData(USER_KEY)) }));
  return await wrapOrNotFound(UserDTOSchema, user);
}

export async function deleteUserData(userId: string, query = executeQuery): Promise<void> {
  const families = await query("refreshTokenFamily", (col) =>
    (col as unknown as Collection<RefreshTokenFamily>)
      .find({ userId }, { projection: { _id: 0, familyId: 1 } })
      .toArray(),
  );

  // Delete the identity first so an access token used concurrently cannot
  // recreate user-owned data while the remaining records are being removed.
  await query("user", (col) => col.deleteOne({ _id: new ObjectId(userId) }));
  await query("refreshTokenFamily", (col) => col.deleteMany({ userId }));
  if (families.length > 0) {
    await query("refreshToken", (col) =>
      col.deleteMany({ familyId: { $in: families.map(({ familyId }) => familyId) } }),
    );
  }
  await query("settings", (col) => col.deleteMany({ userId }));
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
