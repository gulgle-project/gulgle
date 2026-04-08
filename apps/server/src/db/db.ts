import mongoDB from "mongodb";
import { requireEnv } from "../utils";

export async function getDb(): Promise<mongoDB.Db> {
  return (await getConnection()).db();
}

export async function executeQuery<T>(collection: string, query: (db: mongoDB.Collection) => Promise<T>): Promise<T> {
  const db = await getDb();
  return query(db.collection(collection));
}

let client: mongoDB.MongoClient | undefined;
let initializing = false;
export async function getConnection(): Promise<mongoDB.MongoClient> {
  if (client) {
    return client;
  }

  if (initializing) {
    while (initializing) {
      await Atomics.pause(500);
    }

    if (client) {
      return client;
    }
  }

  initializing = true;
  const newClient = new mongoDB.MongoClient(requireEnv("MONGO_URL"));

  await newClient.connect();

  client = newClient;
  initializing = false;

  return client;
}
