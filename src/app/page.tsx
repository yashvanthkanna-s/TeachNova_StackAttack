"use client";

import { useState } from "react";
import { Activity, ShieldAlert, GitPullRequest, GitCommit, HeartPulse, RefreshCw } from "lucide-react";
import { RepoMetrics } from "./api/sync/route";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    metrics: RepoMetrics;
    calculatedScore: number;
    aiRecommendation: string;
  } | null>(null);

  const handleSync = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoOwner: "my-org", repoName: "core-service" }),
      });
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Sync failed", error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Activity className="text-emerald-500" size={32} />
              Git Repository Health
            </h1>
            <p className="text-slate-400 mt-1">Live AI-driven observability dashboard</p>
          </div>
          <button
            onClick={handleSync}
            disabled={loading}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-md font-medium transition-all disabled:opacity-50"
          >
            <RefreshCw className={loading ? "animate-spin" : ""} size={18} />
            {loading ? "Syncing metrics..." : "Sync Now"}
          </button>
        </div>

        {/* Dashboard Content */}
        {!data ? (
          <div className="flex flex-col items-center justify-center h-64 border border-dashed border-slate-800 rounded-xl bg-slate-900/50">
            <p className="text-slate-500">Click "Sync Now" to fetch live repository metrics.</p>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Top Level Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Health Score Card */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <HeartPulse size={100} />
                </div>
                <h3 className="text-slate-400 font-medium mb-2">Overall Health Score</h3>
                <div className="flex items-baseline gap-2">
                  <span className={`text-5xl font-bold ${data.calculatedScore > 80 ? 'text-emerald-500' : data.calculatedScore > 60 ? 'text-amber-500' : 'text-red-500'}`}>
                    {data.calculatedScore}
                  </span>
                  <span className="text-slate-500">/ 100</span>
                </div>
              </div>

              {/* AI Insight Panel */}
              <div className="md:col-span-2 bg-slate-900 border border-indigo-900/50 p-6 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                <h3 className="text-indigo-400 font-medium mb-3 flex items-center gap-2">
                  <span className="text-lg">✨</span> AI DevOps Recommendation
                </h3>
                <p className="text-slate-300 leading-relaxed text-sm">
                  {data.aiRecommendation}
                </p>
              </div>
            </div>

            {/* Metrics Grid */}
            <h3 className="text-xl font-semibold text-white pt-4">Deep Dive Metrics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <MetricCard 
                icon={<GitPullRequest className="text-blue-400" />}
                title="Avg PR Velocity"
                value={`${data.metrics.prVelocityDays} days`}
                isWarning={data.metrics.prVelocityDays > 2}
              />
              <MetricCard 
                icon={<Activity className="text-emerald-400" />}
                title="CI Failure Rate"
                value={`${data.metrics.ciFailureRate * 100}%`}
                isWarning={data.metrics.ciFailureRate > 0.1}
              />
              <MetricCard 
                icon={<ShieldAlert className="text-red-400" />}
                title="Security Alerts"
                value={data.metrics.openDependabotAlerts.toString()}
                isWarning={data.metrics.openDependabotAlerts > 0}
              />
              <MetricCard 
                icon={<GitCommit className="text-amber-400" />}
                title="Burnout Risk"
                value={`${data.metrics.burnoutRiskPercent * 100}%`}
                isWarning={data.metrics.burnoutRiskPercent > 0.2}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon, title, value, isWarning }: { icon: React.ReactNode, title: string, value: string, isWarning: boolean }) {
  return (
    <div className={`bg-slate-900 border p-5 rounded-xl flex flex-col gap-3 transition-colors ${isWarning ? 'border-red-900/50 bg-red-900/10' : 'border-slate-800'}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-800 rounded-lg">
          {icon}
        </div>
        <span className="text-slate-400 text-sm font-medium">{title}</span>
      </div>
      <div className="text-2xl font-semibold text-white">
        {value}
      </div>
    </div>
  );
}
