import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Client } = pg;

async function run() {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("REPLACE_WITH_YOUR_PASSWORD")) {
    console.error("❌ ERROR: Please replace 'REPLACE_WITH_YOUR_PASSWORD' in your .env.local file with your actual RDS master password.");
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for AWS RDS outside VPC
    }
  });

  try {
    console.log("Connecting to AWS RDS...");
    await client.connect();
    console.log("✅ Successfully connected to AWS RDS!");

    const createTableQuery = `
      DROP TABLE IF EXISTS repo_health_snapshots;
      CREATE TABLE repo_health_snapshots (
          id SERIAL PRIMARY KEY,
          repo_name VARCHAR(255) NOT NULL,
          score INTEGER NOT NULL,
          code_churn INTEGER,
          stagnation_risk INTEGER,
          burnout_risk DECIMAL(5,2),
          bus_factor DECIMAL(5,2),
          generated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    console.log("Creating table repo_health_snapshots...");
    await client.query(createTableQuery);
    console.log("✅ Table created successfully!");
    
  } catch (err) {
    console.error("❌ Error setting up database:", err);
  } finally {
    await client.end();
  }
}

run();
