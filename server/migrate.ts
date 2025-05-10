import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// Define postgresql connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

// This will automatically run needed migrations on the database
async function main() {
  console.log('Running migrations...');
  
  try {
    // Execute SQL statements directly for our new tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cost_history (
        id SERIAL PRIMARY KEY,
        resource_id INTEGER REFERENCES resources(id),
        date DATE NOT NULL,
        amount NUMERIC NOT NULL,
        service_category TEXT,
        region TEXT,
        usage_type TEXT,
        usage_amount NUMERIC,
        usage_unit TEXT,
        organization_id INTEGER REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS cost_predictions (
        id SERIAL PRIMARY KEY,
        resource_id INTEGER REFERENCES resources(id),
        organization_id INTEGER REFERENCES organizations(id),
        predicted_date DATE NOT NULL,
        predicted_amount NUMERIC NOT NULL,
        service_category TEXT,
        region TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        confidence_interval NUMERIC,
        model TEXT,
        prediction_period TEXT
      );
      
      CREATE TABLE IF NOT EXISTS cost_optimization_suggestions (
        id SERIAL PRIMARY KEY,
        resource_id INTEGER REFERENCES resources(id),
        organization_id INTEGER REFERENCES organizations(id),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        suggested_action TEXT NOT NULL,
        potential_savings NUMERIC NOT NULL,
        confidence NUMERIC NOT NULL,
        implementation_difficulty TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        applied_at TIMESTAMP
      );
    `);
    
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

main();