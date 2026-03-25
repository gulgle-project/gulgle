import type { ObjectId } from "bson";
import type { OIDCProvider } from "./auth";

export default class User {
  constructor(
    public provider: OIDCProvider,
    public externalId: string,
    public displayName?: string,
    public email?: string,
    public _id?: ObjectId,
  ) {}
}
