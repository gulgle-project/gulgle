import type { ObjectId } from "bson";

export default class User {
  constructor(
    public email: string,
    public password?: string,
    public _id?: ObjectId,
  ) {}
}
