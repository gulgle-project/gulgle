import mongoDB from "mongodb";
import { requireEnv } from "../utils";

export async function getDb(): Promise<mongoDB.Db> {
  return (await getConnection()).db();
}

export async function executeQuery<T>(collection: string, query: (db: mongoDB.Collection) => Promise<T>): Promise<T> {
  const db = await getDb();
  return query(db.collection(collection));
}

let connection: Promise<mongoDB.MongoClient> | undefined;
export async function getConnection(): Promise<mongoDB.MongoClient> {
  if (!connection) {
    connection = new mongoDB.MongoClient(requireEnv("MONGO_URL")).connect();
  }
  const pendingConnection = connection;

  try {
    return await pendingConnection;
  } catch (error) {
    if (connection === pendingConnection) {
      connection = undefined;
    }
    throw error;
  }
}
