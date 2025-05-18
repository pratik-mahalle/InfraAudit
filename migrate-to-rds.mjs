import pg from 'pg';
import { exec } from 'child_process';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Source database (current database)
const sourceConfig = {
  connectionString: process.env.DATABASE_URL,
};

// Target AWS RDS database
const targetConfig = {
  host: 'infra.cpuki6mbomx637.ap-south-1.rds.amazonaws.com',
  port: 5432, 
  database: 'postgres', // Default database name
  user: 'postgres', // Default username
  password: 'InfraAudit',
};

async function migrateToRDS() {
  console.log('Starting migration to AWS RDS...');
  
  try {
    // 1. First, create the "infra" database in RDS if it doesn't exist
    const adminPool = new Pool(targetConfig);
    try {
      await adminPool.query('CREATE DATABASE infra;');
      console.log('Created "infra" database');
    } catch (err) {
      // Database might already exist
      console.log('Note: infra database already exists or error creating it:', err.message);
    }
    await adminPool.end();
    
    // 2. Now connect to the infra database
    const rdsConfig = {
      ...targetConfig,
      database: 'infra'
    };
    
    // 3. Connect to the source database
    const sourcePool = new Pool(sourceConfig);
    
    // 4. Connect to the target database
    const targetPool = new Pool(rdsConfig);
    
    // 5. Get list of tables
    const tablesResult = await sourcePool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log('Tables to migrate:', tables);

    // First we need to create tables in the target database
    console.log('\nCreating tables in the target database...');
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
        await targetPool.query(createTableSQL);
        console.log(`Created table ${table}`);
      } catch (err) {
        console.log(`Error creating table ${table}:`, err.message);
      }
    }

    // 6. Migrate data table by table
    for (const table of tables) {
      try {
        console.log(`\nMigrating table: ${table}`);
        
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
            
            await targetPool.query(
              `INSERT INTO ${table}(${columns.join(', ')}) 
               VALUES(${placeholders})
               ON CONFLICT DO NOTHING`,
              values
            );
            successCount++;
          } catch (rowError) {
            console.log(`Error inserting row in ${table}:`, rowError.message);
          }
        }
        
        console.log(`Successfully migrated ${successCount} out of ${dataResult.rows.length} rows from ${table}`);
      } catch (tableError) {
        console.log(`Error migrating table ${table}:`, tableError.message);
      }
    }
    
    // 7. Close connections
    await sourcePool.end();
    await targetPool.end();
    
    console.log('\nMigration completed!');
    console.log('\nTo connect to the AWS RDS database, add the following to your .env file:');
    console.log('USE_RDS=true');
    
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

// Run the migration
migrateToRDS().then(() => {
  console.log('Migration script completed');
}).catch(err => {
  console.error('Migration script error:', err);
});