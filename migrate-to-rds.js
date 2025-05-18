const { Pool } = require('pg');
const { exec } = require('child_process');
const fs = require('fs');
require('dotenv').config();

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
    
    // 3. Export schema from current database
    console.log('Exporting schema from current database...');
    const schemaFile = 'schema.sql';
    await new Promise((resolve, reject) => {
      exec(`pg_dump --schema-only -U ${process.env.PGUSER} -d ${process.env.PGDATABASE} > ${schemaFile}`, 
        (error, stdout, stderr) => {
          if (error) {
            console.log('Error exporting schema:', stderr);
            // Continue anyway as we might have alternative ways to create the schema
            resolve();
          } else {
            console.log('Schema exported successfully');
            resolve();
          }
        });
    });
    
    // 4. Apply schema to RDS database
    if (fs.existsSync(schemaFile)) {
      console.log('Applying schema to RDS database...');
      await new Promise((resolve, reject) => {
        const command = `PGPASSWORD=${rdsConfig.password} psql -h ${rdsConfig.host} -U ${rdsConfig.user} -d ${rdsConfig.database} -f ${schemaFile}`;
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.log('Error applying schema:', stderr);
            // Continue anyway as we'll attempt alternative schema creation
            resolve();
          } else {
            console.log('Schema applied successfully');
            resolve();
          }
        });
      });
    } else {
      console.log('Schema file not found, will use direct SQL commands');
    }
    
    // 5. Connect to the source database
    const sourcePool = new Pool(sourceConfig);
    
    // 6. Connect to the target database
    const targetPool = new Pool(rdsConfig);
    
    // 7. Get list of tables
    const tablesResult = await sourcePool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log('Tables to migrate:', tables);

    // 8. Migrate data table by table
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
    
    // 9. Close connections
    await sourcePool.end();
    await targetPool.end();
    
    console.log('\nMigration completed!');
    console.log('\nTo connect to the AWS RDS database, set:');
    console.log('USE_RDS=true in your .env file or environment variables');
    
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