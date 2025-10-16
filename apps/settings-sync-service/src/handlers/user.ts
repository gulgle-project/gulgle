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
