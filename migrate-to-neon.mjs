import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import { neon } from '@neondatabase/serverless';
import ws from 'ws';

// Load environment variables
dotenv.config();

const { Pool } = pg;

// This script migrates data from your current database to NeonDB
// To use: 
// 1. Create a NeonDB account and database at https://neon.tech/
// 2. Set the NEON_DATABASE_URL environment variable to your NeonDB connection string
// 3. Run this script with: node migrate-to-neon.mjs

// Source database (current database)
const sourceConfig = {
  connectionString: process.env.DATABASE_URL,
};

// Target NeonDB database
const NEON_DATABASE_URL = process.env.NEON_DATABASE_URL;

if (!NEON_DATABASE_URL) {
  console.error("❌ NEON_DATABASE_URL environment variable is not set!");
  console.error("Please create a NeonDB account, set up a database, and set the connection string.");
  process.exit(1);
}

const neonConfig = {
  webSocketConstructor: ws,
  useSecureWebSocket: true,
};

async function migrateToNeon() {
  console.log('Starting migration to NeonDB...');
  
  // Connect to source database
  const sourcePool = new Pool(sourceConfig);
  
  // Connect to NeonDB database
  const neonClient = neon(NEON_DATABASE_URL, neonConfig);
  
  try {
    // 1. Get list of tables
    const tablesResult = await sourcePool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log('Tables to migrate:', tables);

    // First we need to create tables in the target database
    console.log('\nCreating tables in NeonDB...');
    
    for (const table of tables) {
      try {
        // Get table schema
        const schemaResult = await sourcePool.query(`
          SELECT column_name, data_type, character_maximum_length, 
                 column_default, is_nullable
          FROM information_schema.columns 
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [table]);
        
        if (schemaResult.rows.length === 0) {
          console.log(`No schema information for ${table}, skipping...`);
          continue;
        }
        
        // Generate CREATE TABLE command
        let createTableSQL = `CREATE TABLE IF NOT EXISTS ${table} (\n`;
        
        for (let i = 0; i < schemaResult.rows.length; i++) {
          const column = schemaResult.rows[i];
          createTableSQL += `  "${column.column_name}" ${column.data_type}`;
          
          // Add length for character types
          if (column.character_maximum_length) {
            createTableSQL += `(${column.character_maximum_length})`;
          }
          
          // Nullable
          if (column.is_nullable === 'NO') {
            createTableSQL += ' NOT NULL';
          }
          
          // Default value
          if (column.column_default) {
            createTableSQL += ` DEFAULT ${column.column_default}`;
          }
          
          // Comma if not the last column
          if (i < schemaResult.rows.length - 1) {
            createTableSQL += ',\n';
          }
        }
        
        // Close the CREATE TABLE statement
        createTableSQL += '\n);';
        
        // Execute CREATE TABLE
        await neonClient.query(createTableSQL);
        console.log(`✅ Created table ${table}`);
      } catch (err) {
        console.log(`❌ Error creating table ${table}:`, err.message);
      }
    }

    // 2. Migrate data table by table
    for (const table of tables) {
      try {
        console.log(`\nMigrating data for table: ${table}`);
        
        // Get data
        const dataResult = await sourcePool.query(`SELECT * FROM ${table}`);
        console.log(`Found ${dataResult.rows.length} rows in ${table}`);
        
        if (dataResult.rows.length === 0) {
          console.log(`No data in ${table}, skipping...`);
          continue;
        }
        
        // For each row, insert into target
        let successCount = 0;
        
        for (const row of dataResult.rows) {
          try {
            const columns = Object.keys(row);
            const values = Object.values(row);
            const placeholders = Array(values.length).fill(0).map((_, i) => `$${i + 1}`).join(', ');
            
            await neonClient.query(
              `INSERT INTO ${table}(${columns.join(', ')}) 
               VALUES(${placeholders})
               ON CONFLICT DO NOTHING`,
              values
            );
            successCount++;
          } catch (rowError) {
            console.log(`❌ Error inserting row in ${table}:`, rowError.message);
          }
        }
        
        console.log(`✅ Successfully migrated ${successCount} out of ${dataResult.rows.length} rows from ${table}`);
      } catch (tableError) {
        console.log(`❌ Error migrating table ${table}:`, tableError.message);
      }
    }
    
    // 3. Add sequences/indexes (if needed)
    console.log('\nSetting up sequences for serial columns...');
    for (const table of tables) {
      try {
        const sequenceResult = await sourcePool.query(`
          SELECT column_name, column_default
          FROM information_schema.columns
          WHERE table_name = $1
            AND column_default LIKE 'nextval%'
        `, [table]);
        
        for (const seqRow of sequenceResult.rows) {
          try {
            // Get current max value to set sequence properly
            const maxResult = await sourcePool.query(`
              SELECT COALESCE(MAX("${seqRow.column_name}"), 0) as max_value
              FROM ${table}
            `);
            
            const maxValue = maxResult.rows[0].max_value;
            
            // Set the sequence value
            if (maxValue > 0) {
              await neonClient.query(`
                SELECT setval(pg_get_serial_sequence('${table}', '${seqRow.column_name}'), ${maxValue}, true)
              `);
              console.log(`✅ Set sequence for ${table}.${seqRow.column_name} to ${maxValue}`);
            }
          } catch (seqError) {
            console.log(`❌ Error setting sequence for ${table}.${seqRow.column_name}:`, seqError.message);
          }
        }
      } catch (err) {
        console.log(`❌ Error handling sequences for ${table}:`, err.message);
      }
    }
    
    console.log('\n✅ Migration to NeonDB completed!');
    console.log('\nTo use NeonDB in your application, update your .env file with:');
    console.log('DB_TYPE=neon');
    console.log('NEON_DATABASE_URL=your_neon_connection_string');
    
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    // Close source database connection
    await sourcePool.end();
    // NeonDB serverless connections auto-close
  }
}

// Run the migration
migrateToNeon().then(() => {
  console.log('Migration script completed');
  process.exit(0);
}).catch(err => {
  console.error('Migration script error:', err);
  process.exit(1);
});