import { MongoClient, Db, ServerApiVersion } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is not configured in environment variables");
}

// MongoDB client configuration with best practices
const client: MongoClient = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
});

let db: Db;
let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) {
    console.log("Already connected to MongoDB");
    return;
  }

  try {
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Connected to MongoDB successfully");

    db = client.db(process.env.DB_NAME || "MOH");
    isConnected = true;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

export function getDB(): Db {
  if (!db) {
    throw new Error("Database not initialized. Call connectDB() first.");
  }
  return db;
}

export async function closeDB(): Promise<void> {
  if (isConnected) {
    await client.close();
    isConnected = false;
    console.log("✅ MongoDB connection closed");
  }
}

/**
 * Disconnect from MongoDB (alias for closeDB)
 */
export async function disconnectDB(): Promise<void> {
  await closeDB();
}
