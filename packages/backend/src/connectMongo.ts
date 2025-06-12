// packages/backend/src/connectMongo.ts

import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";

// Load .env (so process.env.MONGO_* is populated)
dotenv.config();

const {
  MONGO_USER,
  MONGO_PWD,
  MONGO_CLUSTER,
  DB_NAME
} = process.env;

if (!MONGO_USER || !MONGO_PWD || !MONGO_CLUSTER || !DB_NAME) {
  throw new Error(
    "Missing one of MONGO_USER, MONGO_PWD, MONGO_CLUSTER, or DB_NAME in .env"
  );
}

// Build the connection URI
const uri = `mongodb+srv://${encodeURIComponent(MONGO_USER)}:${encodeURIComponent(
  MONGO_PWD
)}@${MONGO_CLUSTER}/${DB_NAME}?retryWrites=true&w=majority`;
console.log("🔌 Mongo URI:", uri);

/**
 * Returns a new MongoClient configured with our Atlas URI.
 * Caller is responsible for calling client.connect().
 */
export function connectMongo(): MongoClient {
  return new MongoClient(uri);
}
