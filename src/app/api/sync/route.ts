import { NextResponse } from 'next/server';

// --- Types ---
export type RepoMetrics = {
  repoName: string;
  prVelocityDays: number;
  ciFailureRate: number;
  openDependabotAlerts: number; 
  daysSinceLastCommit: number;
  burnoutRiskPercent: number;
};

// --- 1. The Defensible Health Score Algorithm ---
export function calculateHealthScore(metrics: RepoMetrics): number {
  let score = 100;

  if (metrics.prVelocityDays > 2) {
    const penalty = Math.min((metrics.prVelocityDays - 2) * 2, 20);
    score -= penalty;
  }

  const ciPenalty = Math.min(metrics.ciFailureRate * 50, 30);
  score -= ciPenalty;

  const securityPenalty = Math.min(metrics.openDependabotAlerts * 5, 30);
  score -= securityPenalty;

  if (metrics.daysSinceLastCommit > 14) {
    const activityPenalty = Math.min((metrics.daysSinceLastCommit - 14) * 1, 20);
    score -= activityPenalty;
  }

  if (metrics.burnoutRiskPercent > 0.20) {
    const burnoutPenalty = Math.min((metrics.burnoutRiskPercent - 0.20) * 100, 20);
    score -= burnoutPenalty;
  }

  return Math.max(Math.round(score), 0);
}

// --- 2. The "Sync Now" API Endpoint ---
export async function POST(request: Request) {
  try {
    const { repoOwner, repoName } = await request.json();
    
    // In production, you would fetch real data from GitHub here.
    // We are using mocked data for the initial dashboard wireframing.
    const fetchedMetrics: RepoMetrics = {
      repoName: `${repoOwner}/${repoName}`,
      prVelocityDays: 4.5,
      ciFailureRate: 0.2,
      openDependabotAlerts: 3,
      daysSinceLastCommit: 2,
      burnoutRiskPercent: 0.35,
    };

    const healthScore = calculateHealthScore(fetchedMetrics);

    // Mock AI Insight (We will replace this with real Gemini API call later)
    const aiInsight = `The repository scored ${healthScore}/100. PR velocity is slow at 4.5 days. Recommendation: Implement PR size limits to speed up reviews. You have 3 open security alerts that need immediate patching. Burnout risk is elevated at 35% due to late-night commits.`;

    return NextResponse.json({
      success: true,
      message: 'Sync complete',
      data: {
        metrics: fetchedMetrics,
        calculatedScore: healthScore,
        aiRecommendation: aiInsight
      }
    });

  } catch (error) {
    console.error("Sync failed:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
