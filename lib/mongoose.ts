import "server-only";

import mongoose, { type Mongoose } from "mongoose";

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

// In dev, Next reloads modules on every save. Keeping the cache on
// `globalThis` (which survives reloads) stops each reload from opening
// a new connection.
declare global {
  // `var` is required here: only `var` declarations attach to globalThis
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = (globalThis.mongooseCache ??= {
  conn: null,
  promise: null,
});

const dbConnect = async (): Promise<Mongoose> => {
  if (cached.conn) return cached.conn;

  // Checked here, not at import time, so pages that never touch the
  // database still build and run without MONGODB_URI
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not defined");
  }

  cached.promise ??= mongoose.connect(uri, { dbName: "devflow" });

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // Forget the failed attempt so the next call can retry
    cached.promise = null;
    throw error;
  }

  return cached.conn;
};

export default dbConnect;
