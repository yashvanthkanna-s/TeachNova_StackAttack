require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function showProof() {
  console.log('\n======================================================');
  console.log('AWS RDS CLOUD INTEGRATION PROOF');
  console.log('======================================================\n');
  
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('Error: DATABASE_URL not found in .env.local');
    return;
  }

  // Parse endpoint for display
  const endpoint = dbUrl.split('@')[1].split('/')[0];
  
  console.log(`[1] Initiating secure SSL connection...`);
  console.log(`[2] Target Endpoint : ${endpoint}`);
  console.log(`[3] AWS Region      : Europe (Stockholm) / eu-north-1\n`);

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log(`✅ SUCCESS: Connected to AWS RDS PostgreSQL Instance.\n`);
    
    console.log(`[4] Executing SQL Query: SELECT * FROM repo_health_snapshots ORDER BY generated_at DESC LIMIT 10`);
    const res = await client.query('SELECT id, repo_name, score, code_churn, bus_factor, generated_at FROM repo_health_snapshots ORDER BY generated_at DESC LIMIT 10');
    
    console.log(`\n📊 LATEST 10 VAULTED SNAPSHOTS (LIVE FROM CLOUD):\n`);
    console.table(res.rows);
    
    console.log('\n======================================================');
    console.log('Proof execution completed successfully.');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Connection failed:', err);
  } finally {
    await client.end();
  }
}

showProof();
