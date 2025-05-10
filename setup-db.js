import pg from 'pg';
import fs from 'fs';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function executeQueries() {
  try {
    // Create organizations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "organizations" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL,
        "display_name" text,
        "billing_email" text NOT NULL,
        "billing_address" text,
        "plan_type" text DEFAULT 'free',
        "resource_limit" integer DEFAULT 10,
        "user_limit" integer DEFAULT 2,
        "stripe_customer_id" text,
        "stripe_subscription_id" text,
        "subscription_status" text DEFAULT 'inactive',
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log('Organizations table created');

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" serial PRIMARY KEY,
        "username" text NOT NULL UNIQUE,
        "email" text NOT NULL UNIQUE,
        "password" text NOT NULL,
        "full_name" text,
        "role" text DEFAULT 'user',
        "organization_id" integer REFERENCES "organizations"("id"),
        "plan_type" text DEFAULT 'free',
        "stripe_customer_id" text,
        "stripe_subscription_id" text,
        "subscription_status" text DEFAULT 'inactive',
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        "last_login_at" timestamp
      );
    `);
    console.log('Users table created');

    // Create resources table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "resources" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL,
        "type" text NOT NULL,
        "provider" text NOT NULL,
        "region" text NOT NULL,
        "status" text NOT NULL,
        "tags" jsonb,
        "cost" integer,
        "organization_id" integer NOT NULL REFERENCES "organizations"("id"),
        "user_id" integer REFERENCES "users"("id"),
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log('Resources table created');

    // Create security_drifts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "security_drifts" (
        "id" serial PRIMARY KEY,
        "resource_id" integer NOT NULL,
        "drift_type" text NOT NULL,
        "severity" text NOT NULL,
        "details" jsonb,
        "detected_at" timestamp DEFAULT now() NOT NULL,
        "status" text NOT NULL
      );
    `);
    console.log('Security drifts table created');

    // Create cost_anomalies table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "cost_anomalies" (
        "id" serial PRIMARY KEY,
        "resource_id" integer NOT NULL,
        "anomaly_type" text NOT NULL,
        "severity" text NOT NULL,
        "percentage" integer NOT NULL,
        "previous_cost" integer NOT NULL,
        "current_cost" integer NOT NULL,
        "detected_at" timestamp DEFAULT now() NOT NULL,
        "status" text NOT NULL
      );
    `);
    console.log('Cost anomalies table created');

    // Create alerts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "alerts" (
        "id" serial PRIMARY KEY,
        "title" text NOT NULL,
        "message" text NOT NULL,
        "type" text NOT NULL,
        "severity" text NOT NULL,
        "resource_id" integer,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "status" text NOT NULL
      );
    `);
    console.log('Alerts table created');

    // Create recommendations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "recommendations" (
        "id" serial PRIMARY KEY,
        "title" text NOT NULL,
        "description" text NOT NULL,
        "type" text NOT NULL,
        "potential_savings" integer NOT NULL,
        "resources_affected" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "status" text NOT NULL
      );
    `);
    console.log('Recommendations table created');

    // Create cloud_credentials table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "cloud_credentials" (
        "id" serial PRIMARY KEY,
        "user_id" integer NOT NULL REFERENCES "users"("id"),
        "provider" text NOT NULL,
        "name" text,
        "encrypted_credentials" text NOT NULL,
        "encryption_iv" text NOT NULL,
        "is_active" boolean DEFAULT true,
        "last_synced" timestamp,
        "last_sync_status" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log('Cloud credentials table created');

    console.log('All tables created successfully');
    
  } catch (err) {
    console.error('Error executing queries:', err);
  } finally {
    await pool.end();
  }
}

executeQueries();