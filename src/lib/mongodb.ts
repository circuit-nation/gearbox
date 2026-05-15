import mongoose from "mongoose";
import { ENV } from "@/config/config";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
   
  var mongoose: MongooseCache | undefined;
}

const MONGODB_URI = ENV.CN_MONGODB_URI;

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error("MongoDB is not configured.");
  }

  if (!global.mongoose) {
    global.mongoose = { conn: null, promise: null };
  }

  const cached = global.mongoose;

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
