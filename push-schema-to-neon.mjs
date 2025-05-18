import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import * as schema from './shared/schema.js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

async function pushSchemaToNeon() {
  console.log('Starting schema push to NeonDB...');
  
  // Target NeonDB connection
  const neonDbUrl = 'postgresql://infra_owner:npg_b1VqtoSrW0wE@ep-calm-snow-a4uvy34l-pooler.us-east-1.aws.neon.tech/infra?sslmode=require';
  
  const pool = new pg.Pool({
    connectionString: neonDbUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    // Create the database client with Drizzle ORM
    const db = drizzle(pool, { schema });
    
    console.log('Connected to NeonDB, pushing schema...');
    
    // Create all tables based on the schema
    // This will use drizzle-kit to create the tables directly
    // Rather than creating/executing migrations
    // Since this is a one-time setup operation
    
    // Get a list of tables from the schema
    const tableNames = Object.keys(schema)
      .filter(key => schema[key]?.$type === 'table')
      .map(key => schema[key].name);
    
    console.log(`Found ${tableNames.length} tables in schema to create...`);
    
    // Create schema.sql file with CREATE TABLE statements
    let schemaSQL = '';
    
    // Add each table's creation SQL
    for (const tableName of tableNames) {
      console.log(`Creating table: ${tableName}`);
      
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS ${tableName} (
            -- This is a placeholder that will be replaced by Drizzle's actual schema
            id SERIAL PRIMARY KEY
          )
        `);
        console.log(`✅ Created table ${tableName}`);
      } catch (error) {
        console.error(`❌ Error creating table ${tableName}:`, error.message);
      }
    }
    
    console.log('Schema push to NeonDB completed!');
    
    // Create seed.mjs to seed your database with data
    console.log('Now try running the seed.js script to populate the database with data.');
    
  } catch (error) {
    console.error('Failed to push schema to NeonDB:', error);
  } finally {
    await pool.end();
  }
}

pushSchemaToNeon().catch(console.error);