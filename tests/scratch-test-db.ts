import { prismaTest, DbHelper } from "./helpers/db.helper.js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

async function run() {
  console.log("Connecting to test DB...");
  const usersCount = await prismaTest.user.count();
  console.log(`Current users count: ${usersCount}`);

  console.log("Truncating tables...");
  await DbHelper.clear();
  console.log("Truncation complete!");

  await DbHelper.disconnect();
  console.log("Disconnected successfully!");
}

run().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
