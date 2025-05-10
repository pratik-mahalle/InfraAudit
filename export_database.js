import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create export directory if it doesn't exist
const exportDir = path.join(__dirname, 'database_exports');
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

async function exportTable(tableName) {
  try {
    console.log(`Exporting table: ${tableName}`);
    
    // Get table data
    const result = await pool.query(`SELECT * FROM ${tableName}`);
    
    if (result.rows.length === 0) {
      console.log(`No data in table: ${tableName}`);
      return;
    }
    
    // Get column names
    const columns = Object.keys(result.rows[0]);
    
    // Create CSV content
    let csvContent = columns.join(',') + '\n';
    
    // Add rows
    result.rows.forEach(row => {
      const values = columns.map(column => {
        const value = row[column];
        // Handle null values and escape commas and quotes
        if (value === null) return '';
        if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      });
      csvContent += values.join(',') + '\n';
    });
    
    // Write to file
    const filePath = path.join(exportDir, `${tableName}.csv`);
    fs.writeFileSync(filePath, csvContent);
    
    console.log(`Exported ${result.rows.length} rows to ${filePath}`);
  } catch (error) {
    console.error(`Error exporting table ${tableName}:`, error);
  }
}

async function main() {
  try {
    console.log('Starting database export...');
    
    // Export each table
    for (const table of tables) {
      await exportTable(table);
    }
    
    console.log('Database export completed successfully.');
    console.log(`CSV files are available in the ${exportDir} directory`);
  } catch (error) {
    console.error('Error exporting database:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

main();