require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

// Current database connection (the one the app is using)
const sourceDbUrl = process.env.DATABASE_URL;

// New NeonDB database connection that we want to use
const targetDbUrl = 'postgresql://infra_owner:npg_b1VqtoSrW0wE@ep-calm-snow-a4uvy34l-pooler.us-east-1.aws.neon.tech/infra?sslmode=require';

// Connect to source database
const sourcePool = new Pool({
  connectionString: sourceDbUrl,
  ssl: { rejectUnauthorized: false }
});

// Connect to target database
const targetPool = new Pool({
  connectionString: targetDbUrl,
  ssl: { rejectUnauthorized: false }
});

// SQL for creating tables in proper order
const createTablesSql = `
-- Organizations table
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
);

-- Users table
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
);

-- Resources table
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
);

-- Security drifts table
CREATE TABLE IF NOT EXISTS security_drifts (
  id SERIAL PRIMARY KEY,
  resource_id INTEGER NOT NULL REFERENCES resources(id),
  drift_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  details JSONB,
  detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL
);

-- Cost anomalies table
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
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  resource_id INTEGER REFERENCES resources(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL
);

-- Recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  potential_savings INTEGER NOT NULL,
  resources_affected JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL
);

-- Cloud credentials table
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
);

-- Cost history table
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
);

-- Cost predictions table
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
);

-- Cost optimization suggestions table
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
);

-- Session table
CREATE TABLE IF NOT EXISTS session (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);
`;

// Order of tables for data migration (respecting foreign key constraints)
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

// Export data from source tables
async function exportData(tableName) {
  try {
    // Check if table exists
    const tableExists = await sourcePool.query(`
      SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = $1
      )
    `, [tableName]);
    
    if (!tableExists.rows[0].exists) {
      console.log(`Table ${tableName} doesn't exist in source database, skipping...`);
      return [];
    }
    
    // Get data from this table
    const result = await sourcePool.query(`SELECT * FROM ${tableName}`);
    console.log(`Exported ${result.rows.length} rows from ${tableName}`);
    return result.rows;
  } catch (err) {
    console.error(`Error exporting data from ${tableName}:`, err.message);
    return [];
  }
}

// Import data into target tables
async function importData(tableName, data) {
  if (!data.length) {
    console.log(`No data to import for ${tableName}`);
    return;
  }
  
  console.log(`Importing ${data.length} rows into ${tableName}...`);
  let successCount = 0;
  
  for (const row of data) {
    try {
      const columns = Object.keys(row);
      const values = Object.values(row);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      
      await targetPool.query(
        `INSERT INTO ${tableName}(${columns.join(', ')}) 
         VALUES(${placeholders})
         ON CONFLICT DO NOTHING`,
        values
      );
      
      successCount++;
    } catch (err) {
      console.error(`Error importing row into ${tableName}:`, err.message);
    }
  }
  
  console.log(`Successfully imported ${successCount} of ${data.length} rows into ${tableName}`);
}

// Fix sequences after import
async function fixSequence(tableName) {
  try {
    // Skip tables without id column
    if (tableName === 'session') {
      return;
    }
    
    const seqName = `${tableName}_id_seq`;
    
    // Get the current max ID
    const result = await targetPool.query(`SELECT COALESCE(MAX(id), 0) as max_id FROM ${tableName}`);
    const maxId = parseInt(result.rows[0].max_id);
    
    if (maxId > 0) {
      // Set the sequence to the max ID + 1
      await targetPool.query(`SELECT setval('${seqName}', ${maxId}, true)`);
      console.log(`Set sequence for ${tableName} to ${maxId}`);
    }
  } catch (err) {
    console.error(`Error fixing sequence for ${tableName}:`, err.message);
  }
}

// Update environment file to use the new database
function updateEnvFile() {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const updatedContent = envContent.replace(
      /DATABASE_URL=.*/,
      `DATABASE_URL=${targetDbUrl}`
    );
    
    // Write to a new file first to be safe
    fs.writeFileSync('.env.new', updatedContent);
    console.log('Created .env.new with updated database URL');
    
    // Uncomment the line below to directly update the .env file
    // fs.writeFileSync('.env', updatedContent);
    // console.log('.env file updated with new database URL');
  } catch (err) {
    console.error('Error updating .env file:', err.message);
  }
}

// Main migration function
async function migrateDatabase() {
  try {
    console.log('Starting database migration process...');
    
    // Create tables in target database
    console.log('Creating tables in target database...');
    await targetPool.query(createTablesSql);
    console.log('Tables created successfully');
    
    // Export and import data for each table
    for (const tableName of tableOrder) {
      console.log(`\nProcessing table: ${tableName}`);
      const data = await exportData(tableName);
      await importData(tableName, data);
      await fixSequence(tableName);
    }
    
    // Create .env.new with the updated database URL
    updateEnvFile();
    
    console.log('\nDatabase migration completed successfully!');
    console.log('To use the new database, rename .env.new to .env and restart your application');
    
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
}

// Run the migration
migrateDatabase();