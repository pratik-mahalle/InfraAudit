import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Source database (current Neon database being used)
const SOURCE_DB_URL = process.env.DATABASE_URL;

// Target database (the new Neon database we want to switch to)
const TARGET_DB_URL = 'postgresql://infra_owner:npg_b1VqtoSrW0wE@ep-calm-snow-a4uvy34l-pooler.us-east-1.aws.neon.tech/infra?sslmode=require';

console.log('Source DB:', SOURCE_DB_URL.replace(/:[^:]*@/, ':***@'));
console.log('Target DB:', TARGET_DB_URL.replace(/:[^:]*@/, ':***@'));

// Connect to source database
const sourcePool = new Pool({
  connectionString: SOURCE_DB_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Connect to target database
const targetPool = new Pool({
  connectionString: TARGET_DB_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Table order for migration to respect foreign keys
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

async function migrateData() {
  console.log('\nMigrating data between NeonDB instances...');
  
  for (const tableName of tableOrder) {
    try {
      console.log(`\nMigrating data for table: ${tableName}`);
      
      // Check if table exists in source database
      try {
        await sourcePool.query(`SELECT 1 FROM ${tableName} LIMIT 1`);
      } catch (err) {
        console.log(`Table ${tableName} doesn't exist in source database, skipping...`);
        continue;
      }
      
      // Get data from source table
      const { rows } = await sourcePool.query(`SELECT * FROM ${tableName}`);
      console.log(`Found ${rows.length} records in ${tableName}`);
      
      if (rows.length === 0) {
        console.log(`No data to migrate for ${tableName}`);
        continue;
      }
      
      // Insert data into target table
      let migratedCount = 0;
      
      for (const row of rows) {
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
          
          migratedCount++;
        } catch (err) {
          console.error(`❌ Error inserting into ${tableName}:`, err.message);
        }
      }
      
      console.log(`✅ Migrated ${migratedCount} of ${rows.length} records for ${tableName}`);
    } catch (error) {
      console.error(`❌ Error migrating data for table ${tableName}:`, error.message);
    }
  }
}

async function fixSequences() {
  console.log('\nFixing sequences in target database...');
  
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

async function updateEnvFile() {
  console.log('\nUpdating .env file to use the new NeonDB connection...');
  
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const newEnvContent = envContent.replace(
      /DATABASE_URL=.*/,
      `DATABASE_URL=${TARGET_DB_URL}`
    );
    
    fs.writeFileSync('.env', newEnvContent);
    console.log('✅ Updated .env file successfully');
  } catch (error) {
    console.error('❌ Error updating .env file:', error.message);
  }
}

async function main() {
  try {
    console.log('Starting NeonDB data migration...');
    
    // Migrate data
    await migrateData();
    
    // Fix sequences
    await fixSequences();
    
    // Update .env file
    // await updateEnvFile(); // Uncomment this line to update the .env file
    
    console.log('\n✅ Data migration between NeonDB instances complete!');
    console.log('To complete the migration, update your .env file to use the new connection string:');
    console.log(TARGET_DB_URL);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close database connections
    await sourcePool.end();
    await targetPool.end();
  }
}

// Run the migration
main().catch(console.error);