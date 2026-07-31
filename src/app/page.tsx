"use client";

import { useState } from "react";
import { Activity, ShieldAlert, GitCommit, HeartPulse, RefreshCw, Users, Clock } from "lucide-react";
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
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Activity className="text-emerald-500" size={32} />
              Git Repository Health Dashboard
            </h1>
            <p className="text-slate-400 mt-1">Air-Gapped Telemetry Engine (No External APIs & No AI)</p>
          </div>
          <button
            onClick={handleSync}
            disabled={loading}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-md font-medium transition-all disabled:opacity-50"
          >
            <RefreshCw className={loading ? "animate-spin" : ""} size={18} />
            {loading ? "Parsing Git Log..." : "Sync Telemetry"}
          </button>
        </div>

        {/* Dashboard Content */}
        {!data ? (
          <div className="flex flex-col items-center justify-center h-64 border border-dashed border-slate-800 rounded-xl bg-slate-900/50">
            <p className="text-slate-500">Click "Sync Telemetry" to parse native Git logs & calculate health score.</p>
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
                {data.dbSaved && (
                  <span className="inline-block mt-3 px-2.5 py-1 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 rounded-full">
                    Saved to AWS RDS
                  </span>
                )}
              </div>

              {/* Deterministic Rules Engine Insight Panel */}
              <div className="md:col-span-2 bg-slate-900 border border-indigo-900/50 p-6 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                <h3 className="text-indigo-400 font-medium mb-3 flex items-center gap-2">
                  <span className="text-lg">⚙️</span> Deterministic Rules Engine Advice
                </h3>
                <p className="text-slate-300 leading-relaxed text-sm">
                  {data.aiRecommendation}
                </p>
              </div>
            </div>

            {/* Metrics Grid */}
            <h3 className="text-xl font-semibold text-white pt-4">Native Git Telemetry Metrics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <MetricCard 
                icon={<GitCommit className="text-blue-400" />}
                title="Code Churn (LOC)"
                value={`${data.metrics.codeChurn.toLocaleString()} lines`}
                isWarning={data.metrics.codeChurn > 5000}
              />
              <MetricCard 
                icon={<Clock className="text-emerald-400" />}
                title="Stagnation Risk"
                value={`${data.metrics.stagnationRiskDays} days`}
                isWarning={data.metrics.stagnationRiskDays > 7}
              />
              <MetricCard 
                icon={<ShieldAlert className="text-red-400" />}
                title="Burnout Risk"
                value={`${Math.round(data.metrics.burnoutRiskPercent * 100)}%`}
                isWarning={data.metrics.burnoutRiskPercent > 0.2}
              />
              <MetricCard 
                icon={<Users className="text-amber-400" />}
                title="Bus Factor Dominance"
                value={`${Math.round(data.metrics.busFactorPercent * 100)}%`}
                isWarning={data.metrics.busFactorPercent > 0.5}
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
