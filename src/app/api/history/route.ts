import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { repoName } = body;

    if (!repoName) {
      return NextResponse.json({ success: false, error: 'Missing repoName' }, { status: 400 });
    }

    const result = await pool.query(
      `SELECT generated_at, code_churn, stagnation_risk, bus_factor, score 
       FROM repo_health_snapshots 
       WHERE repo_name = $1 
       ORDER BY generated_at DESC 
       LIMIT 15`,
      [repoName]
    );

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('History API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
