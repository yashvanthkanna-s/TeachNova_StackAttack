"use client";

import { useState } from "react";
import { Activity, GitCommit, RefreshCw, Users, Clock, GitPullRequest } from "lucide-react";
import { RepoMetrics } from "./api/sync/route";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    metrics: RepoMetrics;
    calculatedScore: number;
    aiRecommendation: string;
    dbSaved?: boolean;
  } | null>(null);

  const handleSync = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
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
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex justify-between items-center border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Activity className="text-blue-500" size={32} />
              Git Repository Health Dashboard
            </h1>
            <p className="text-gray-400 mt-2 font-medium">Powered by GitHub REST API & AWS RDS</p>
          </div>
          <button
            onClick={handleSync}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded font-bold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={loading ? "animate-spin" : ""} size={18} />
            {loading ? "Fetching GitHub Data..." : "Sync Telemetry"}
          </button>
        </div>

        {/* Dashboard Content */}
        {!data ? (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-800 rounded-xl bg-gray-900/30">
            <p className="text-gray-400 font-bold text-lg">Click "Sync Telemetry" to fetch live GitHub data & calculate health score.</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Top Level Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Health Score Card */}
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
                <h3 className="text-gray-400 font-bold mb-2 uppercase tracking-wider text-sm">Overall Health Score</h3>
                <div className="flex items-baseline gap-2">
                  <span className={`text-6xl font-extrabold ${data.calculatedScore > 80 ? 'text-green-500' : data.calculatedScore > 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {data.calculatedScore}
                  </span>
                  <span className="text-gray-500 font-bold">/ 100</span>
                </div>
                {data.dbSaved && (
                  <div className="mt-4">
                    <span className="px-3 py-1 text-xs font-bold text-green-400 bg-green-900/50 border border-green-800 rounded">
                      Successfully Saved to AWS RDS
                    </span>
                  </div>
                )}
              </div>

              {/* Deterministic Rules Engine Insight Panel */}
              <div className="md:col-span-2 bg-gray-900 border border-blue-900/50 p-6 rounded-xl">
                <h3 className="text-blue-400 font-bold mb-3 uppercase tracking-wider text-sm flex items-center gap-2">
                  Deterministic Rules Engine Advice
                </h3>
                <p className="text-white leading-relaxed text-lg font-medium">
                  {data.aiRecommendation}
                </p>
              </div>
            </div>

            {/* Metrics Grid */}
            <h3 className="text-xl font-bold text-white pt-4 border-b border-gray-800 pb-2">Live GitHub Metrics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <MetricCard 
                icon={<GitCommit className="text-blue-400" size={24} />}
                title="Code Churn"
                value={`${data.metrics.codeChurn.toLocaleString()}`}
                subtitle="lines changed"
                isWarning={data.metrics.codeChurn > 5000}
              />
              <MetricCard 
                icon={<Clock className="text-green-400" size={24} />}
                title="Stagnation Risk"
                value={`${data.metrics.stagnationRiskDays}`}
                subtitle="days since last commit"
                isWarning={data.metrics.stagnationRiskDays > 7}
              />
              <MetricCard 
                icon={<Users className="text-orange-400" size={24} />}
                title="Bus Factor Dominance"
                value={`${Math.round(data.metrics.busFactorPercent * 100)}%`}
                subtitle="top contributor share"
                isWarning={data.metrics.busFactorPercent > 0.5}
              />
              <MetricCard 
                icon={<GitPullRequest className="text-purple-400" size={24} />}
                title="PR Bottlenecks"
                value={`${data.metrics.openPrsCount || 0}`}
                subtitle="open pull requests"
                isWarning={(data.metrics.openPrsCount || 0) > 5}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon, title, value, subtitle, isWarning }: { icon: React.ReactNode, title: string, value: string, subtitle: string, isWarning: boolean }) {
  return (
    <div className={`bg-gray-900 border p-6 rounded-xl flex flex-col gap-3 ${isWarning ? 'border-red-600' : 'border-gray-800'}`}>
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">{title}</span>
      </div>
      <div>
        <div className={`text-4xl font-extrabold ${isWarning ? 'text-red-500' : 'text-white'}`}>
          {value}
        </div>
        <div className="text-gray-500 text-sm font-medium mt-1">{subtitle}</div>
      </div>
    </div>
  );
}
