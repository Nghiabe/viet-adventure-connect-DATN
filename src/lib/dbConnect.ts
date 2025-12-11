import mongoose from 'mongoose';

type GlobalWithMongoose = typeof globalThis & {
  mongooseConn?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

const globalWithMongoose = global as GlobalWithMongoose;

if (!globalWithMongoose.mongooseConn) {
  globalWithMongoose.mongooseConn = { conn: null, promise: null };
}

export default async function dbConnect(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error('Missing MONGODB_URI (or VITE_MONGODB_URI) environment variable');
  }
  const cached = globalWithMongoose.mongooseConn!;

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      // Keep pool reasonable for local dev
      maxPoolSize: 5,
    }).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}


