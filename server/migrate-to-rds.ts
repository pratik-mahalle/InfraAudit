import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/pg-core';
import * as schema from '../shared/schema';
import { migrate } from 'drizzle-orm/pg-core/migrate';
import fs from 'fs';
import { exit } from 'process';

// Source database (current database)
const sourceConfig = {
  connectionString: process.env.DATABASE_URL,
};

// Target AWS RDS database
const targetConfig = {
  host: 'infra.cpuki6mbomx637.ap-south-1.rds.amazonaws.com',
  port: 5432, 
  database: 'infra', // Assuming database name is 'infra'
  user: 'postgres', // Assuming username is 'postgres'
  password: 'InfraAudit',
};

async function migrateToRDS() {
  console.log('Starting migration to AWS RDS...');
  
  // Connect to source database
  const sourcePool = new Pool(sourceConfig);
  const sourceDb = drizzle(sourcePool, { schema });
  
  // Connect to target database
  const targetPool = new Pool(targetConfig);
  const targetDb = drizzle(targetPool, { schema });
  
  try {
    // First, create the schema in the target database
    console.log('Creating schema in the target database...');
    
    // Get table creation queries from schema.ts
    const tables = Object.values(schema)
      .filter(obj => typeof obj === 'object' && obj !== null && 'name' in obj)
      .map(table => table as any);
    
    // Execute schema creation
    for (const table of tables) {
      if (table.createIfNotExists) {
        try {
          await targetDb.query.raw(table.createIfNotExists.toString());
          console.log(`Created table ${table.name}`);
        } catch (e) {
          console.error(`Error creating table ${table.name}:`, e);
        }
      }
    }
    
    // Extract data from each table in source database and insert into target database
    // List of tables to migrate
    const tableNames = [
      'users',
      'organizations',
      'resources',
      'security_drifts',
      'cost_anomalies',
      'alerts',
      'recommendations',
      'cloud_credentials',
      'cost_history',
      'cost_predictions',
      'cost_optimization_suggestions'
    ];
    
    for (const tableName of tableNames) {
      try {
        console.log(`Migrating data from ${tableName}...`);
        
        // Get all records from source
        const { rows } = await sourcePool.query(`SELECT * FROM ${tableName}`);
        
        if (rows.length === 0) {
          console.log(`No data in ${tableName}, skipping...`);
          continue;
        }
        
        // Insert records into target
        for (const row of rows) {
          const columns = Object.keys(row).join(', ');
          const placeholders = Object.keys(row).map((_, i) => `$${i + 1}`).join(', ');
          const values = Object.values(row);
          
          await targetPool.query(
            `INSERT INTO ${tableName}(${columns}) VALUES(${placeholders}) ON CONFLICT DO NOTHING`,
            values
          );
        }
        
        console.log(`Successfully migrated ${rows.length} records from ${tableName}`);
      } catch (error) {
        console.error(`Error migrating ${tableName}:`, error);
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close database connections
    await sourcePool.end();
    await targetPool.end();
  }
}

// Run the migration
migrateToRDS()
  .then(() => {
    console.log('Migration process completed.');
    exit(0);
  })
  .catch((error) => {
    console.error('Migration process failed:', error);
    exit(1);
  });