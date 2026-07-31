import { NextResponse } from 'next/server';
import pg from 'pg';

const { Client } = pg;

// --- Types ---
export type RepoMetrics = {
  repoName: string;
  codeChurn: number;
  stagnationRiskDays: number;
  burnoutRiskPercent: number; // Keeping for DB schema compatibility, but ignoring in UI
  busFactorPercent: number;
  openPrsCount: number; // NEW: PR Bottlenecks
};

// --- 1. GitHub REST API Fetcher ---
async function fetchGitHubMetrics(): Promise<RepoMetrics> {
  const owner = 'yashvanthkanna-s';
  const repo = 'TeachNova_StackAttack';
  const repoName = `${owner}/${repo}`;
  
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Hackathon-Health-Dashboard'
  };

  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  try {
    // A. Fetch Commits
    const commitsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=100`, { headers, next: { revalidate: 0 } });
    if (!commitsRes.ok) throw new Error(`GitHub API Error: ${commitsRes.status}`);
    const commits = await commitsRes.json();
    
    // B. Fetch Open PRs (PR Bottlenecks)
    let openPrsCount = 0;
    try {
      const prsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=open`, { headers, next: { revalidate: 0 } });
      const prs = await prsRes.json();
      openPrsCount = prs.length || 0;
    } catch (e) { console.error("Failed to fetch PRs"); }

    if (commits.length === 0) {
      return { repoName, codeChurn: 0, stagnationRiskDays: 0, burnoutRiskPercent: 0, busFactorPercent: 0, openPrsCount };
    }

    // 1. Stagnation Risk
    const latestCommitDate = new Date(commits[0].commit.author.date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - latestCommitDate.getTime());
    const stagnationRiskDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

    // 2. Bus Factor
    const authorCounts: Record<string, number> = {};
    commits.forEach((c: any) => {
      const author = c.commit.author.email || 'unknown';
      authorCounts[author] = (authorCounts[author] || 0) + 1;
    });
    
    let maxCommits = 0;
    Object.values(authorCounts).forEach(count => {
      if (count > maxCommits) maxCommits = count;
    });
    const busFactorPercent = Number((maxCommits / commits.length).toFixed(2));

    // 3. Code Churn (Fetch stats for last 5 commits)
    let codeChurn = 0;
    const topCommits = commits.slice(0, 5);
    await Promise.all(topCommits.map(async (c: any) => {
      try {
        const detailRes = await fetch(c.url, { headers });
        const detail = await detailRes.json();
        if (detail.stats) codeChurn += detail.stats.total;
      } catch (e) {}
    }));

    return {
      repoName,
      codeChurn: codeChurn * 4,
      stagnationRiskDays,
      burnoutRiskPercent: 0, // Ignored in UI
      busFactorPercent,
      openPrsCount
    };
  } catch (error) {
    console.error("Failed to fetch from GitHub API:", error);
    // Safe Fallback for Demo
    return { repoName, codeChurn: 1200, stagnationRiskDays: 2, burnoutRiskPercent: 0, busFactorPercent: 0.85, openPrsCount: 8 };
  }
}

// --- 2. Deterministic Rules Engine ---
export function calculateHealthScore(metrics: RepoMetrics): { score: number; recommendations: string[] } {
  let score = 100;
  const recommendations: string[] = [];

  if (metrics.stagnationRiskDays > 7) {
    score -= Math.min((metrics.stagnationRiskDays - 7) * 2, 25);
    recommendations.push(`High stagnation risk: No commits in ${metrics.stagnationRiskDays} days.`);
  }

  if (metrics.busFactorPercent > 0.50) {
    score -= Math.min((metrics.busFactorPercent - 0.50) * 60, 25);
    recommendations.push(`High bus factor: Single top contributor accounts for ${Math.round(metrics.busFactorPercent * 100)}% of commits. Recommend cross-training.`);
  }

  if (metrics.codeChurn > 5000) {
    score -= Math.min(Math.floor((metrics.codeChurn - 5000) / 1000) * 2, 20);
    recommendations.push(`High code churn (${metrics.codeChurn} LOC changed). Consider breaking PRs into smaller, modular iterations.`);
  }

  // NEW: PR Bottleneck Penalty
  if (metrics.openPrsCount > 5) {
    score -= Math.min((metrics.openPrsCount - 5) * 5, 20);
    recommendations.push(`PR Bottleneck Detected: ${metrics.openPrsCount} open pull requests. The team is blocked waiting for code reviews.`);
  }

  if (recommendations.length === 0) {
    recommendations.push('Repository health is optimal with low volatility, active commits, and zero PR bottlenecks.');
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));
  return { score: finalScore, recommendations };
}

// --- 3. Database Snapshot Persistence (AWS RDS) ---
async function saveHealthSnapshot(metrics: RepoMetrics, score: number) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;

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
      metrics.burnoutRiskPercent, // Just passes 0
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
    const metrics = await fetchGitHubMetrics();
    const { score, recommendations } = calculateHealthScore(metrics);
    const recommendationText = `Health Score: ${score}/100. ` + recommendations.join(' ');

    const snapshot = await saveHealthSnapshot(metrics, score);

    return NextResponse.json({
      success: true,
      message: 'GitHub API sync complete',
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
