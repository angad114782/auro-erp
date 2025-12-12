// drop-db.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import readline from "readline";

dotenv.config();

const MONGO_URI = 'mongodb+srv://ay114782_db_user:ay114782_db_user@cluster0.7ssb13i.mongodb.net/footwear_erp?appName=Cluster0';
const DB_NAME = process.env.DB_NAME || null;

if (!MONGO_URI) {
  console.error("ERROR: MONGO_URI missing in env. Set MONGO_URI and retry.");
  process.exit(1);
}

function question(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(prompt, (ans) => { rl.close(); res(ans); }));
}

async function dropDatabase(conn) {
  console.log("Dropping entire database using connection.db.dropDatabase() ...");
  const result = await conn.db.dropDatabase();
  console.log("dropDatabase result:", result);
}

async function dropAllCollections(conn) {
  console.log("Dropping all non-system collections ...");
  const collections = await conn.db.listCollections().toArray();
  for (const c of collections) {
    const name = c.name;
    if (name.startsWith("system.")) {
      console.log("Skipping system collection:", name);
      continue;
    }
    try {
      console.log("Dropping collection:", name);
      await conn.dropCollection(name);
    } catch (err) {
      console.warn("Warning dropping collection", name, err.message);
    }
  }
  console.log("All user collections processed.");
}

async function run() {
  console.log("Connecting to MongoDB...");
  // Connect without specifying dbName in options so we can inspect/confirm selected DB
  await mongoose.connect(MONGO_URI, { connectTimeoutMS: 10000 });

  const conn = mongoose.connection;
  const currentDbName = conn.db.databaseName;
  console.log("Connected. Detected DB name from connection:", currentDbName);

  // If user provided DB_NAME env, show both and require they match (extra safety)
  if (DB_NAME && DB_NAME !== currentDbName) {
    console.log(`NOTE: env DB_NAME="${DB_NAME}" does not match detected DB "${currentDbName}".`);
  }

  console.log("\nChoose action:");
  console.log("  1) Drop entire database (dropDatabase) — deletes everything in this DB");
  console.log("  2) Drop all non-system collections (keeps system collections)");
  console.log("  3) Abort");

  const choice = (await question("Enter 1, 2 or 3: ")).trim();
  if (!["1", "2"].includes(choice)) {
    console.log("Aborting. No changes made.");
    await conn.close();
    process.exit(0);
  }

  // Extra, strong confirmation: require typing exact DB name
  const confirmPrompt = `Type the database name "${currentDbName}" to CONFIRM deletion: `;
  const typed = (await question(confirmPrompt)).trim();

  if (typed !== currentDbName) {
    console.log("Confirmation mismatch. Aborting. No changes made.");
    await conn.close();
    process.exit(0);
  }

  try {
    if (choice === "1") {
      await dropDatabase(conn);
    } else if (choice === "2") {
      await dropAllCollections(conn);
    }
    console.log("Operation finished.");
  } catch (err) {
    console.error("Fatal error during drop operation:", err);
  } finally {
    await conn.close();
    process.exit(0);
  }
}

run().catch(err => {
  console.error("Run failed:", err);
  process.exit(1);
});
