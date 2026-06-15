import mongoose from "mongoose";

// Cache the connection across hot-reloads in development
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalCache = global as typeof globalThis & {
  mongoose?: MongooseCache;
};

const cached: MongooseCache =
  globalCache.mongoose ?? (globalCache.mongoose = { conn: null, promise: null });

export async function connectDB() {
  if (cached.conn) return cached.conn;

  // Checked here (not at import) so `next build` doesn't need the env var.
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("Please define MONGODB_URI in your .env.local file");
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      minPoolSize: 5,   // keep 5 connections alive
      maxPoolSize: 20,  // cap at 20 concurrent connections
    }).then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
