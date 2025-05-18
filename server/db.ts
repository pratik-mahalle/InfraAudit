import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg;

// Check if we're using AWS RDS or local database
const useRDS = process.env.USE_RDS === 'true';

let poolConfig;

if (useRDS) {
  console.log('Using AWS RDS database connection');
  poolConfig = {
    host: process.env.RDS_HOSTNAME || 'infra.cpuki6mbomx637.ap-south-1.rds.amazonaws.com',
    port: parseInt(process.env.RDS_PORT || '5432'),
    database: process.env.RDS_DATABASE || 'infra',
    user: process.env.RDS_USERNAME || 'postgres',
    password: process.env.RDS_PASSWORD || 'InfraAudit',
    ssl: process.env.RDS_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  };
} else {
  console.log('Using local database connection');
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set when not using AWS RDS. Did you forget to provision a database?",
    );
  }
  poolConfig = { connectionString: process.env.DATABASE_URL };
}

export const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });