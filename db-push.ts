import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import * as schema from "./shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

async function main() {
  console.log("🔄 Pushing schema to database...");
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool, schema });

  // This creates tables if they don't exist and alters them if they do
  await migrate(db, { migrationsFolder: 'migrations' });
  
  console.log("✅ Schema pushed to database!");
  
  // Close the connection
  await pool.end();
}

main().catch((err) => {
  console.error("Error pushing schema:", err);
  process.exit(1);
});