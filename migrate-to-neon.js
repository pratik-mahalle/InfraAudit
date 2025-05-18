const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

// Using the NeonDB connection string you provided
const NEON_DATABASE_URL = 'postgresql://infra_owner:npg_b1VqtoSrW0wE@ep-calm-snow-a4uvy34l-pooler.us-east-1.aws.neon.tech/infra?sslmode=require';

// Source database (current database)
const sourcePool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Target NeonDB database
const targetPool = new Pool({
  connectionString: NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrateToNeon() {
  console.log('Starting migration to NeonDB...');
  
  try {
    // 1. Get list of tables
    const tablesResult = await sourcePool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log('Tables to migrate:', tables);

    // 2. For each table, create it in the target and migrate data
    for (const table of tables) {
      try {
        console.log(`\nProcessing table: ${table}`);
        
        // Create the table in the target database
        const tableSchemaResult = await sourcePool.query(`
          SELECT 
            column_name, 
            data_type, 
            is_nullable, 
            column_default,
            character_maximum_length
          FROM 
            information_schema.columns 
          WHERE 
            table_name = $1
          ORDER BY 
            ordinal_position
        `, [table]);
        
        if (tableSchemaResult.rows.length === 0) {
          console.log(`No schema information found for table ${table}, skipping...`);
          continue;
        }
        
        console.log(`Creating table ${table} in NeonDB...`);
        
        // Generate CREATE TABLE statement
        let createTableSQL = `CREATE TABLE IF NOT EXISTS ${table} (\n`;
        
        for (let i = 0; i < tableSchemaResult.rows.length; i++) {
          const column = tableSchemaResult.rows[i];
          
          createTableSQL += `  "${column.column_name}" ${column.data_type}`;
          
          // Add character length for varchar/char types
          if (column.character_maximum_length !== null) {
            createTableSQL += `(${column.character_maximum_length})`;
          }
          
          // Add NOT NULL constraint if needed
          if (column.is_nullable === 'NO') {
            createTableSQL += ' NOT NULL';
          }
          
          // Add default value if present
          if (column.column_default !== null) {
            createTableSQL += ` DEFAULT ${column.column_default}`;
          }
          
          // Add comma if not the last column
          if (i < tableSchemaResult.rows.length - 1) {
            createTableSQL += ',\n';
          }
        }
        
        // End the CREATE TABLE statement
        createTableSQL += '\n)';
        
        // Create the table in NeonDB
        await targetPool.query(createTableSQL);
        console.log(`✅ Table ${table} created successfully`);
        
        // Get primary key info if available
        const pkResult = await sourcePool.query(`
          SELECT 
            kcu.column_name
          FROM 
            information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
          WHERE 
            tc.constraint_type = 'PRIMARY KEY' 
            AND tc.table_name = $1
        `, [table]);
        
        const pkColumns = pkResult.rows.map(row => row.column_name);
        
        if (pkColumns.length > 0) {
          console.log(`Adding primary key to ${table}...`);
          try {
            await targetPool.query(`
              ALTER TABLE ${table} 
              ADD PRIMARY KEY (${pkColumns.map(col => `"${col}"`).join(', ')})
            `);
            console.log(`✅ Primary key added to ${table}`);
          } catch (pkError) {
            // Primary key might already exist
            console.log(`Note: ${pkError.message}`);
          }
        }
        
        // Copy data
        console.log(`Copying data from ${table}...`);
        const countResult = await sourcePool.query(`SELECT COUNT(*) FROM ${table}`);
        const rowCount = parseInt(countResult.rows[0].count);
        
        if (rowCount === 0) {
          console.log(`Table ${table} is empty, skipping data copy...`);
          continue;
        }
        
        console.log(`Found ${rowCount} rows to copy from ${table}`);
        
        // Get all data
        const dataResult = await sourcePool.query(`SELECT * FROM ${table}`);
        
        // Insert in batches
        const batchSize = 100;
        let successCount = 0;
        
        for (let i = 0; i < dataResult.rows.length; i += batchSize) {
          const batch = dataResult.rows.slice(i, i + batchSize);
          
          for (const row of batch) {
            try {
              const columns = Object.keys(row);
              const values = Object.values(row);
              const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
              
              await targetPool.query(
                `INSERT INTO ${table} (${columns.map(c => `"${c}"`).join(', ')}) 
                 VALUES (${placeholders})
                 ON CONFLICT DO NOTHING`,
                values
              );
              
              successCount++;
            } catch (insertError) {
              console.log(`Error inserting row in ${table}:`, insertError.message);
            }
          }
          
          // Log progress for large tables
          if (batch.length === batchSize) {
            console.log(`Progress: ${i + batch.length}/${rowCount} rows`);
          }
        }
        
        console.log(`✅ Copied ${successCount} of ${rowCount} rows from ${table}`);
        
        // Update sequences if needed
        const sequenceResult = await sourcePool.query(`
          SELECT column_name, column_default
          FROM information_schema.columns
          WHERE table_name = $1
          AND column_default LIKE 'nextval%'
        `, [table]);
        
        if (sequenceResult.rows.length > 0) {
          console.log(`Updating sequences for ${table}...`);
          
          for (const seqRow of sequenceResult.rows) {
            try {
              // Get current max value
              const maxResult = await sourcePool.query(`
                SELECT COALESCE(MAX("${seqRow.column_name}"), 0) as max_value 
                FROM ${table}
              `);
              
              const maxValue = parseInt(maxResult.rows[0].max_value);
              
              if (maxValue > 0) {
                // Update sequence in target
                await targetPool.query(`
                  SELECT setval(pg_get_serial_sequence('${table}', '${seqRow.column_name}'), ${maxValue})
                `);
                console.log(`✅ Updated sequence for ${table}.${seqRow.column_name} to ${maxValue}`);
              }
            } catch (seqError) {
              console.log(`Error updating sequence for ${table}.${seqRow.column_name}:`, seqError.message);
            }
          }
        }
      } catch (tableError) {
        console.log(`Error processing table ${table}:`, tableError.message);
      }
    }
    
    console.log('\n✅ Migration to NeonDB completed successfully!');
    console.log(`\nTo use NeonDB in your application, update your .env file:`);
    console.log(`DATABASE_URL=${NEON_DATABASE_URL}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
}

// Run the migration
migrateToNeon().catch(error => {
  console.error('Migration script error:', error);
});