import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables from .env.rds
dotenv.config({ path: '.env.rds' });

const { Pool } = pg;

// RDS connection configuration
const rdsConfig = {
  host: process.env.RDS_HOSTNAME,
  port: parseInt(process.env.RDS_PORT || '5432'),
  database: process.env.RDS_DATABASE,
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  ssl: process.env.RDS_SSL === 'true' ? { rejectUnauthorized: false } : undefined
};

console.log('Attempting to connect to RDS with the following config:');
console.log({
  host: rdsConfig.host,
  port: rdsConfig.port,
  database: rdsConfig.database,
  user: rdsConfig.user,
  ssl: process.env.RDS_SSL === 'true' ? 'enabled' : 'disabled'
});

async function testConnection() {
  const pool = new Pool(rdsConfig);
  
  try {
    console.log('Testing connection...');
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('Connection successful!');
    console.log('Current time on database:', result.rows[0].current_time);
    
    // Test if we can create a table
    console.log('\nTesting ability to create tables...');
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS connection_test (
          id SERIAL PRIMARY KEY,
          test_timestamp TIMESTAMP DEFAULT NOW(),
          test_message TEXT
        )
      `);
      console.log('✓ Successfully created test table');
      
      // Insert a test row
      await pool.query(`
        INSERT INTO connection_test (test_message) 
        VALUES ('Connection test successful')
      `);
      console.log('✓ Successfully inserted test data');
      
      // Query the data back
      const testData = await pool.query('SELECT * FROM connection_test');
      console.log('✓ Successfully retrieved test data:');
      console.log(testData.rows);
      
    } catch (tableError) {
      console.error('Error creating test table:', tableError.message);
    }
    
  } catch (err) {
    console.error('Connection failed:', err.message);
    
    if (err.message.includes('getaddrinfo')) {
      console.log('\nDNS resolution failed. This could be due to:');
      console.log('1. The endpoint URL is incorrect');
      console.log('2. The RDS instance may not be publicly accessible');
      console.log('3. Network connectivity issues between this environment and AWS');
    }
    
    if (err.message.includes('password authentication failed')) {
      console.log('\nAuthentication failed. Please check:');
      console.log('1. The username is correct');
      console.log('2. The password is correct');
    }
    
    if (err.message.includes('connection timed out')) {
      console.log('\nConnection timed out. This could be due to:');
      console.log('1. Security group rules not allowing access from your current IP');
      console.log('2. Network ACLs blocking the connection');
      console.log('3. Firewall rules in your environment');
    }
  } finally {
    await pool.end();
  }
}

testConnection();