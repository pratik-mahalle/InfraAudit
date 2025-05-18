import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg;

// Use the DATABASE_URL environment variable for all database connections
// For NeonDB, just set the DATABASE_URL to the NeonDB connection string
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Determine if this is a NeonDB connection
const isNeonDb = process.env.DATABASE_URL.includes('neon.tech');

// Set up SSL for NeonDB if needed
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: isNeonDb ? { rejectUnauthorized: false } : undefined
};

console.log(`Database connection type: ${isNeonDb ? 'NeonDB' : 'Standard PostgreSQL'}`);

export const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });