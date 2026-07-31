import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import pg from 'pg';

const execAsync = promisify(exec);
const { Client } = pg;

// --- Types ---
export type RepoMetrics = {
  repoName: string;
  codeChurn: number;
  stagnationRiskDays: number;
  burnoutRiskPercent: number; // Fraction between 0 and 1
  busFactorPercent: number;    // Fraction between 0 and 1
};

// --- 1. Native Git Telemetry Parser ---
async function fetchLocalGitMetrics(cwd: string = process.cwd()): Promise<RepoMetrics> {
  let repoName = 'git-health-dashboard';
  try {
    const { stdout: remoteUrl } = await execAsync('git config --get remote.origin.url', { cwd });
    if (remoteUrl.trim()) {
      const parts = remoteUrl.trim().replace(/\.git$/, '').split(/[/:]/);
      if (parts.length >= 2) {
        repoName = `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
      }
    }
  } catch {
    // Fallback to directory name if remote is unavailable
  }

  // Fetch commit logs with author, date, timestamp, and shortstat
  const { stdout } = await execAsync('git log -n 100 --shortstat --format="COMMIT|%H|%an|%ad|%at"', { cwd });

  if (!stdout.trim()) {
    return {
      repoName,
      codeChurn: 0,
      stagnationRiskDays: 0,
      burnoutRiskPercent: 0,
      busFactorPercent: 0,
    };
  }

  const chunks = stdout.split('COMMIT|').filter(Boolean);

  let totalAdditions = 0;
  let totalDeletions = 0;
  let latestCommitTimestampSec = 0;
  let offHoursCommits = 0;
  const authorCommitCounts: Record<string, number> = {};

  chunks.forEach((chunk) => {
    const lines = chunk.trim().split('\n');
    const header = lines[0];
    if (!header) return;

    const [hash, author, dateStr, timestampStr] = header.split('|');
    const timestampSec = parseInt(timestampStr, 10);
    const authorName = (author || 'Unknown').trim();

    if (timestampSec > latestCommitTimestampSec) {
      latestCommitTimestampSec = timestampSec;
    }

    // Author commit count for Bus Factor
    authorCommitCounts[authorName] = (authorCommitCounts[authorName] || 0) + 1;

    // Burnout Risk calculation (10 PM to 4 AM or weekends)
    const commitDate = new Date(timestampSec * 1000);
    const hour = commitDate.getHours(); // 0-23
    const dayOfWeek = commitDate.getDay(); // 0 (Sun) to 6 (Sat)
    const isNightCommit = hour >= 22 || hour < 4;
    const isWeekendCommit = dayOfWeek === 0 || dayOfWeek === 6;

    if (isNightCommit || isWeekendCommit) {
      offHoursCommits++;
    }

    // Parse insertions and deletions from --shortstat
    const statLine = lines.find((l) => l.includes('changed'));
    if (statLine) {
      const insMatch = statLine.match(/(\d+)\s+insertion/);
      const delMatch = statLine.match(/(\d+)\s+deletion/);
      if (insMatch) totalAdditions += parseInt(insMatch[1], 10);
      if (delMatch) totalDeletions += parseInt(delMatch[1], 10);
    }
  });

  const totalCommits = chunks.length;
  const codeChurn = totalAdditions + totalDeletions;

  // Stagnation Risk: Days since last commit
  const nowSec = Math.floor(Date.now() / 1000);
  const diffSeconds = latestCommitTimestampSec > 0 ? nowSec - latestCommitTimestampSec : 0;
  const stagnationRiskDays = Math.max(0, Math.floor(diffSeconds / (3600 * 24)));

  // Burnout Risk: Ratio of off-hours/weekend commits
  const burnoutRiskPercent = totalCommits > 0 ? Number((offHoursCommits / totalCommits).toFixed(2)) : 0;

  // Bus Factor: Highest contributor percentage
  let maxAuthorCommits = 0;
  Object.values(authorCommitCounts).forEach((count) => {
    if (count > maxAuthorCommits) maxAuthorCommits = count;
  });
  const busFactorPercent = totalCommits > 0 ? Number((maxAuthorCommits / totalCommits).toFixed(2)) : 0;

  return {
    repoName,
    codeChurn,
    stagnationRiskDays,
    burnoutRiskPercent,
    busFactorPercent,
  };
}

// --- 2. Deterministic Rules Engine (Air-Gapped Recommendation) ---
export function calculateHealthScore(metrics: RepoMetrics): { score: number; recommendations: string[] } {
  let score = 100;
  const recommendations: string[] = [];

  // 1. Stagnation Risk
  if (metrics.stagnationRiskDays > 7) {
    const penalty = Math.min((metrics.stagnationRiskDays - 7) * 2, 25);
    score -= penalty;
    recommendations.push(`High stagnation risk: No commits in ${metrics.stagnationRiskDays} days.`);
  }

  // 2. Burnout Risk
  if (metrics.burnoutRiskPercent > 0.20) {
    const penalty = Math.min((metrics.burnoutRiskPercent - 0.20) * 80, 25);
    score -= penalty;
    recommendations.push(`Elevated burnout risk: ${Math.round(metrics.burnoutRiskPercent * 100)}% of commits were pushed during off-hours/weekends.`);
  }

  // 3. Bus Factor Risk
  if (metrics.busFactorPercent > 0.50) {
    const penalty = Math.min((metrics.busFactorPercent - 0.50) * 60, 25);
    score -= penalty;
    recommendations.push(`High bus factor: Single top contributor accounts for ${Math.round(metrics.busFactorPercent * 100)}% of total commits. Recommend cross-training.`);
  }

  // 4. Code Churn Volatility
  if (metrics.codeChurn > 5000) {
    const penalty = Math.min(Math.floor((metrics.codeChurn - 5000) / 1000) * 2, 20);
    score -= penalty;
    recommendations.push(`High code churn (${metrics.codeChurn} LOC changed). Consider breaking PRs into smaller, modular iterations.`);
  }

  if (recommendations.length === 0) {
    recommendations.push('Repository health is optimal with low volatility, active commits, and balanced contributor distribution.');
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));
  return { score: finalScore, recommendations };
}

// --- 3. Database Snapshot Persistence ---
async function saveHealthSnapshot(metrics: RepoMetrics, score: number) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.includes('REPLACE_WITH_YOUR_PASSWORD')) {
    console.warn('⚠️ AWS RDS DATABASE_URL not set in .env.local; skipping DB snapshot save.');
    return null;
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const insertQuery = `
      INSERT INTO repo_health_snapshots (repo_name, score, code_churn, stagnation_risk, burnout_risk, bus_factor, generated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *;
    `;
    const res = await client.query(insertQuery, [
      metrics.repoName,
      score,
      metrics.codeChurn,
      metrics.stagnationRiskDays,
      metrics.burnoutRiskPercent,
      metrics.busFactorPercent,
    ]);
    return res.rows[0];
  } catch (err) {
    console.error('❌ Failed to insert snapshot into AWS RDS:', err);
    return null;
  } finally {
    await client.end().catch(() => {});
  }
}

// --- 4. The "Sync Now" API Endpoint ---
export async function POST() {
  try {
    const metrics = await fetchLocalGitMetrics();
    const { score, recommendations } = calculateHealthScore(metrics);
    const recommendationText = `Health Score: ${score}/100. ` + recommendations.join(' ');

    const snapshot = await saveHealthSnapshot(metrics, score);

    return NextResponse.json({
      success: true,
      message: 'Air-gapped sync complete',
      data: {
        metrics,
        calculatedScore: score,
        aiRecommendation: recommendationText,
        dbSaved: !!snapshot,
      },
    });
  } catch (error) {
    console.error('Sync failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
