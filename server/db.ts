import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import session from 'express-session';
import pgSession from 'connect-pg-simple'; // Added import for PostgreSQL session store

neonConfig.webSocketConstructor = ws;

// Create a function to initialize the database connection
const createDbConnection = () => {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn(
        "DATABASE_URL is not set. Using memory storage instead. For production deployment, ensure DATABASE_URL is set."
      );
      return null;
    }

    return new Pool({ connectionString: process.env.DATABASE_URL });
  } catch (error) {
    console.error("Failed to initialize database connection:", error);
    return null;
  }
};

// Create the pool and db objects
const pool = createDbConnection();
export const db = pool ? drizzle({ client: pool, schema }) : null;
export const poolInstance = pool; // Export the pool for session store

// Export a flag indicating if we have a database connection
export const hasDatabaseConnection = !!pool;


// Example of how to use the pool with express-session:
// This is illustrative and needs to be integrated into your express app setup.
//  const pgStore = pgSession({ pool: poolInstance }); // Initialize PostgreSQL session store
// app.use(session({
//     store: pgStore,
//     secret: 'your_secret_key', // Replace with a strong, randomly generated secret
//     resave: false,
//     saveUninitialized: true,
//     cookie: { secure: process.env.NODE_ENV === 'production' }
// }));