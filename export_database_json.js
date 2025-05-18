import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create export directory if it doesn't exist
const exportDir = path.join(__dirname, 'json_exports');
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir);
}

// Connect to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Tables to export
const tables = [
  'session',
  'organizations',
  'users',
  'alerts',
  'resources',
  'security_drifts',
  'cost_anomalies',
  'recommendations',
  'cloud_credentials',
  'cost_history',
  'cost_predictions',
  'cost_optimization_suggestions'
];

// Database export as a single JSON object
const databaseExport = {};

async function exportTable(tableName) {
  try {
    console.log(`Exporting table: ${tableName}`);
    
    // Get table data
    const result = await pool.query(`SELECT * FROM ${tableName}`);
    
    if (result.rows.length === 0) {
      console.log(`No data in table: ${tableName}`);
      databaseExport[tableName] = [];
      return;
    }
    
    // Store rows
    databaseExport[tableName] = result.rows;
    
    console.log(`Exported ${result.rows.length} rows from ${tableName}`);
  } catch (error) {
    console.error(`Error exporting table ${tableName}:`, error);
    databaseExport[tableName] = { error: error.message };
  }
}

async function main() {
  try {
    console.log('Starting database export to JSON...');
    
    // Export each table
    for (const table of tables) {
      await exportTable(table);
    }
    
    // Write the combined JSON file
    const combinedJsonPath = path.join(exportDir, 'database_export.json');
    fs.writeFileSync(combinedJsonPath, JSON.stringify(databaseExport, null, 2));
    
    // Also save individual table JSON files
    for (const table in databaseExport) {
      const tableJsonPath = path.join(exportDir, `${table}.json`);
      fs.writeFileSync(tableJsonPath, JSON.stringify(databaseExport[table], null, 2));
    }
    
    console.log('Database export to JSON completed successfully.');
    console.log(`JSON files are available in the ${exportDir} directory`);
  } catch (error) {
    console.error('Error exporting database to JSON:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

main();