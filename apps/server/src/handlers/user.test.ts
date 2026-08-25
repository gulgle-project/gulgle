import { ObjectId } from "bson";
import type { executeQuery } from "../db/db";
import { RequestContext, USER_KEY } from "../middleware/context";
import { deleteCurrentUser, deleteUserData } from "./user";

test("deletes a user and all of their cloud and session data", async () => {
  const userId = new ObjectId().toString();
  const familyIds = ["family-1", "family-2"];
  const calls: Array<{ collection: string; filter: object }> = [];
  const query = (async (collection, operation) => {
    if (collection === "refreshTokenFamily") {
      return operation({
        find: () => ({
          toArray: async () => familyIds.map((familyId) => ({ familyId })),
        }),
        deleteMany: async (filter: object) => {
          calls.push({ collection, filter });
        },
      } as never);
    }

    return operation({
      deleteMany: async (filter: object) => {
        calls.push({ collection, filter });
      },
      deleteOne: async (filter: object) => {
        calls.push({ collection, filter });
      },
    } as never);
  }) as typeof executeQuery;

  await deleteUserData(userId, query);

  assert.deepEqual(calls, [
    { collection: "user", filter: { _id: new ObjectId(userId) } },
    { collection: "refreshTokenFamily", filter: { userId } },
    { collection: "refreshToken", filter: { familyId: { $in: familyIds } } },
    { collection: "settings", filter: { userId } },
  ]);
});

test("returns success when account data was already deleted", async () => {
  const userId = new ObjectId().toString();
  const context = new RequestContext(new Request("http://localhost/api/user/v1.0/current", { method: "DELETE" }));
  context.addData(USER_KEY, userId);
  let deletedUserId: string | undefined;

  const response = await deleteCurrentUser(context, async (id) => {
    deletedUserId = id;
  });

  assert.equal(response.status, 204);
  assert.equal(deletedUserId, userId);
});

test("rejects invalid user ids without deleting data", async () => {
  const context = new RequestContext(new Request("http://localhost/api/user/v1.0/current", { method: "DELETE" }));
  context.addData(USER_KEY, "not-an-object-id");
  let wasCalled = false;

  const response = await deleteCurrentUser(context, async () => {
    wasCalled = true;
  });

  assert.equal(response.status, 400);
  assert.equal(wasCalled, false);
});
