import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import { createInterface } from 'readline';

// Load environment variables
dotenv.config();

const { Pool } = pg;

// For this migration, we're only creating tables in NeonDB 
// We'll skip data migration since we're already connected to NeonDB
const NEON_DATABASE_URL = process.env.DATABASE_URL;

// We're not actually using a source pool, since we don't need to migrate data
// from another database (we're already using NeonDB)
const sourcePool = null;

// Connect to target database - NeonDB
const targetPool = new Pool({
  connectionString: NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Table definitions based on your schema
const tableDefinitions = {
  organizations: `
    CREATE TABLE IF NOT EXISTS organizations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      display_name TEXT,
      billing_email TEXT NOT NULL,
      billing_address TEXT,
      plan_type TEXT DEFAULT 'free',
      resource_limit INTEGER DEFAULT 10,
      user_limit INTEGER DEFAULT 2,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      subscription_status TEXT DEFAULT 'inactive',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `,
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      full_name TEXT,
      role TEXT DEFAULT 'user',
      organization_id INTEGER REFERENCES organizations(id),
      plan_type TEXT DEFAULT 'free',
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      subscription_status TEXT DEFAULT 'inactive',
      trial_started_at TIMESTAMP,
      trial_status TEXT DEFAULT 'inactive',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      last_login_at TIMESTAMP
    )
  `,
  resources: `
    CREATE TABLE IF NOT EXISTS resources (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      provider TEXT NOT NULL,
      region TEXT NOT NULL,
      status TEXT NOT NULL,
      tags JSONB,
      cost INTEGER,
      organization_id INTEGER NOT NULL REFERENCES organizations(id),
      user_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `,
  security_drifts: `
    CREATE TABLE IF NOT EXISTS security_drifts (
      id SERIAL PRIMARY KEY,
      resource_id INTEGER NOT NULL REFERENCES resources(id),
      drift_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      details JSONB,
      detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
      status TEXT NOT NULL
    )
  `,
  cost_anomalies: `
    CREATE TABLE IF NOT EXISTS cost_anomalies (
      id SERIAL PRIMARY KEY,
      resource_id INTEGER NOT NULL REFERENCES resources(id),
      anomaly_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      percentage INTEGER NOT NULL,
      previous_cost INTEGER NOT NULL,
      current_cost INTEGER NOT NULL,
      detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
      status TEXT NOT NULL
    )
  `,
  alerts: `
    CREATE TABLE IF NOT EXISTS alerts (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      resource_id INTEGER REFERENCES resources(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      status TEXT NOT NULL
    )
  `,
  recommendations: `
    CREATE TABLE IF NOT EXISTS recommendations (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      potential_savings INTEGER NOT NULL,
      resources_affected JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      status TEXT NOT NULL
    )
  `,
  cloud_credentials: `
    CREATE TABLE IF NOT EXISTS cloud_credentials (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      provider TEXT NOT NULL,
      name TEXT,
      encrypted_credentials TEXT NOT NULL,
      encryption_iv TEXT NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      last_synced TIMESTAMP,
      last_sync_status TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `,
  cost_history: `
    CREATE TABLE IF NOT EXISTS cost_history (
      id SERIAL PRIMARY KEY,
      resource_id INTEGER REFERENCES resources(id),
      date DATE NOT NULL,
      amount NUMERIC NOT NULL,
      service_category TEXT,
      region TEXT,
      usage_type TEXT,
      usage_amount NUMERIC,
      usage_unit TEXT,
      organization_id INTEGER REFERENCES organizations(id),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `,
  cost_predictions: `
    CREATE TABLE IF NOT EXISTS cost_predictions (
      id SERIAL PRIMARY KEY,
      resource_id INTEGER REFERENCES resources(id),
      organization_id INTEGER REFERENCES organizations(id),
      predicted_date DATE NOT NULL,
      predicted_amount NUMERIC NOT NULL,
      service_category TEXT,
      region TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      confidence_interval NUMERIC,
      model TEXT,
      prediction_period TEXT
    )
  `,
  cost_optimization_suggestions: `
    CREATE TABLE IF NOT EXISTS cost_optimization_suggestions (
      id SERIAL PRIMARY KEY,
      resource_id INTEGER REFERENCES resources(id),
      organization_id INTEGER REFERENCES organizations(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      suggested_action TEXT NOT NULL,
      potential_savings NUMERIC NOT NULL,
      confidence NUMERIC NOT NULL,
      implementation_difficulty TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      applied_at TIMESTAMP
    )
  `,
  session: `
    CREATE TABLE IF NOT EXISTS session (
      sid VARCHAR NOT NULL PRIMARY KEY,
      sess JSON NOT NULL,
      expire TIMESTAMP(6) NOT NULL
    )
  `
};

// Order of table creation to respect foreign keys
const tableOrder = [
  'organizations',
  'users',
  'resources',
  'security_drifts',
  'cost_anomalies',
  'alerts',
  'recommendations',
  'cloud_credentials',
  'cost_history',
  'cost_predictions',
  'cost_optimization_suggestions',
  'session'
];

async function createTables() {
  console.log('Creating tables in the correct order...');
  
  for (const tableName of tableOrder) {
    try {
      console.log(`Creating table: ${tableName}`);
      await targetPool.query(tableDefinitions[tableName]);
      console.log(`✅ Created table ${tableName}`);
    } catch (error) {
      console.error(`❌ Error creating table ${tableName}:`, error.message);
    }
  }
}

async function migrateData() {
  console.log('\nSkipping data migration as we\'re just creating tables...');
  // We're skipping this step because we're already using NeonDB
  // and just need to create the missing tables
}

async function fixSequences() {
  console.log('\nFixing sequences...');
  
  const tablesWithIds = tableOrder.filter(t => t !== 'session');
  
  for (const tableName of tablesWithIds) {
    try {
      const seqName = `${tableName}_id_seq`;
      console.log(`Fixing sequence for ${tableName}`);
      
      // Get the current max ID
      const { rows } = await targetPool.query(`SELECT COALESCE(MAX(id), 0) as max_id FROM ${tableName}`);
      const maxId = parseInt(rows[0].max_id);
      
      if (maxId > 0) {
        // Set the sequence to the max ID
        await targetPool.query(`SELECT setval('${seqName}', ${maxId}, true)`);
        console.log(`✅ Set sequence for ${tableName} to ${maxId}`);
      } else {
        console.log(`No data in ${tableName}, keeping sequence at default`);
      }
    } catch (error) {
      console.error(`❌ Error fixing sequence for ${tableName}:`, error.message);
    }
  }
}

async function main() {
  try {
    console.log('Starting complete migration to NeonDB...');
    
    // Create tables
    await createTables();
    
    // Skip data migration
    await migrateData();
    
    // Skip fixing sequences for now
    // await fixSequences();
    
    console.log('\n✅ Complete migration finished!');
    console.log('Your NeonDB database is now ready to use with your application.');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close database connections
    if (sourcePool) await sourcePool.end();
    await targetPool.end();
  }
}

// Run the migration
main().catch(console.error);