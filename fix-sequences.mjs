import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;

// NeonDB connection string
const NEON_DATABASE_URL = process.env.DATABASE_URL;

// Connect to NeonDB
const pool = new Pool({
  connectionString: NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Tables with serial IDs
const TABLES_WITH_SERIAL = [
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

async function fixSequences() {
  console.log('Starting sequence repair for NeonDB...');
  
  try {
    // Process each table
    for (const table of TABLES_WITH_SERIAL) {
      try {
        console.log(`\nFixing table: ${table}`);
        
        // 1. Ensure the table exists
        try {
          const tableCheck = await pool.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public'
              AND table_name = $1
            )
          `, [table]);
          
          if (!tableCheck.rows[0].exists) {
            console.log(`Table ${table} does not exist, creating it...`);
            
            // Create a minimal version of the table with ID
            await pool.query(`
              CREATE TABLE IF NOT EXISTS ${table} (
                id SERIAL PRIMARY KEY
              )
            `);
            console.log(`✅ Created minimal table ${table}`);
          }
        } catch (tableCheckError) {
          console.log(`Error checking table ${table}:`, tableCheckError.message);
        }
        
        // 2. Fix sequences - create if they don't exist
        try {
          // First check if the sequence exists
          const seqName = `${table}_id_seq`;
          const seqCheck = await pool.query(`
            SELECT EXISTS (
              SELECT FROM pg_sequences
              WHERE schemaname = 'public'
              AND sequencename = $1
            )
          `, [seqName]);
          
          if (!seqCheck.rows[0].exists) {
            console.log(`Sequence ${seqName} doesn't exist, creating it...`);
            
            // Create the sequence
            await pool.query(`
              CREATE SEQUENCE IF NOT EXISTS ${seqName}
              START WITH 1
              INCREMENT BY 1
              NO MINVALUE
              NO MAXVALUE
              CACHE 1
            `);
            
            // Alter table to use the sequence
            await pool.query(`
              ALTER TABLE ${table} 
              ALTER COLUMN id SET DEFAULT nextval('${seqName}')
            `);
            
            console.log(`✅ Created and linked sequence ${seqName}`);
          } else {
            console.log(`Sequence ${seqName} already exists`);
          }
          
          // Get current max ID to set sequence properly
          const maxResult = await pool.query(`
            SELECT COALESCE(MAX(id), 0) as max_id FROM ${table}
          `);
          
          const maxId = parseInt(maxResult.rows[0].max_id);
          
          if (maxId > 0) {
            await pool.query(`
              SELECT setval('${seqName}', ${maxId}, true)
            `);
            console.log(`✅ Set sequence ${seqName} to current max ID: ${maxId}`);
          } else {
            console.log(`Table ${table} is empty, keeping sequence at default value`);
          }
        } catch (seqError) {
          console.log(`Error fixing sequence for ${table}:`, seqError.message);
        }
      } catch (tableError) {
        console.log(`Error processing table ${table}:`, tableError.message);
      }
    }
    
    console.log('\n✅ All sequences fixed successfully!');
    console.log('Your NeonDB database is now ready to use.');
    
  } catch (error) {
    console.error('Sequence repair failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the fixing script
fixSequences().catch(error => {
  console.error('Script error:', error);
});