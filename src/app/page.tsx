"use client";

import { useState, useEffect } from "react";
import { Activity, GitCommit, RefreshCw, Users, Clock, GitPullRequest, CheckCircle2, AlertTriangle, XCircle, CheckCircle } from "lucide-react";
import { RepoMetrics, RuleAlert } from "./api/sync/route";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [data, setData] = useState<{
    metrics: RepoMetrics;
    calculatedScore: number;
    aiRecommendation: string;
    alerts?: RuleAlert[];
    dbSaved?: boolean;
  } | null>(null);

  const [selectedRepo, setSelectedRepo] = useState("yashvanthkanna-s/TeachNova_StackAttack");
  const availableRepos = [
    "yashvanthkanna-s/TeachNova_StackAttack",
    "kmanojb0622/Discourse",
    "asanalmahathir/Music-Player",
    "yashvanthkanna-s/SaaSVera",
    "yashvanthkanna-s/AegisVison-AI",
    "yashvanthkanna-s/chatbox",
    "yashvanthkanna-s/VaultiFy",
    "yashvanthkanna-s/MUSIC-PLAYER-UI",
    "yashvanthkanna-s/saas-ui"
  ];

  const fetchHistory = async (repo: string) => {
    try {
      const res = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoName: repo }),
      });
      const result = await res.json();
      if (result.success) {
        setHistory(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch history", error);
    }
  };

  useEffect(() => {
    fetchHistory(selectedRepo);
  }, [selectedRepo]);

  const handleSync = async () => {
    setLoading(true);
    try {
      const [owner, repo] = selectedRepo.split('/');
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo }),
      });
      const result = await res.json();
      if (result.success) {
        setData(result.data);
        fetchHistory(selectedRepo);
      }
    } catch (error) {
      console.error("Sync failed", error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 p-6 md:p-12 font-sans antialiased selection:bg-blue-500/30">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-8 gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-3">
              <Activity className="text-blue-500" size={24} />
              Git Repository Health
            </h1>
            <p className="text-gray-400 mt-1.5 text-sm">Enterprise Telemetry via GitHub REST API & AWS RDS</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="bg-[#111] border border-white/10 text-white px-4 py-2.5 rounded-md text-sm font-medium outline-none focus:border-blue-500 transition-colors"
            >
              {availableRepos.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <button
              onClick={handleSync}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={loading ? "animate-spin" : ""} size={16} />
              {loading ? "Syncing..." : "Sync Telemetry"}
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        {!data ? (
          <div className="flex flex-col items-center justify-center h-[40vh] border border-white/10 rounded-lg bg-[#111]">
            <p className="text-gray-400 text-sm">Click "Sync Telemetry" to fetch live data and run the rules engine.</p>
          </div>
        ) : (
          <main className="space-y-8">
            
            {/* Top Level Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Health Score Card */}
              <div className="bg-[#111] border border-white/10 p-8 rounded-lg flex flex-col justify-between">
                <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-4 text-center">Overall Health Score</h3>
                <ScoreGauge score={data.calculatedScore} />
                {data.dbSaved && (
                  <div className="mt-6 flex items-center gap-2 text-xs text-emerald-400/80 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1.5 rounded w-fit">
                    <CheckCircle2 size={14} />
                    Persisted to AWS RDS
                  </div>
                )}
              </div>

              {/* Deterministic Rules Engine Insight Panel */}
              <div className="lg:col-span-2 bg-[#111] border-l-4 border-blue-500 border-y border-r border-white/10 p-6 rounded-lg rounded-l-none flex flex-col">
                <h3 className="text-blue-400 text-xs font-semibold uppercase tracking-widest mb-4 flex items-center gap-2">
                  Rules Engine Analysis
                </h3>
                <p className="text-gray-300 leading-relaxed text-base mb-6">
                  {data.aiRecommendation}
                </p>
                <div className="flex-1 flex flex-col gap-3">
                  {data.alerts?.map((alert, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-start gap-3 p-3 rounded border bg-opacity-10 ${
                        alert.type === 'success' ? 'bg-emerald-500 border-emerald-500/20 text-emerald-400' :
                        alert.type === 'warning' ? 'bg-amber-500 border-amber-500/20 text-amber-400' :
                        'bg-rose-500 border-rose-500/20 text-rose-400'
                      }`}
                    >
                      <div className="mt-0.5">
                        {alert.type === 'success' && <CheckCircle size={16} />}
                        {alert.type === 'warning' && <AlertTriangle size={16} />}
                        {alert.type === 'error' && <XCircle size={16} />}
                      </div>
                      <span className="text-sm font-medium leading-tight text-gray-200">{alert.message}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Engineer Profiler */}
              <div className="bg-[#111] border border-white/10 p-6 rounded-lg flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/50"></div>
                <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-4">Key Engineer Risk</h3>
                
                {data.metrics.topContributor ? (
                  <>
                    <img 
                      src={data.metrics.topContributor.avatarUrl} 
                      alt="Top Contributor" 
                      className="w-20 h-20 rounded-full border-2 border-amber-500/30 mb-3 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    />
                    <div className="text-white font-bold text-lg mb-1">@{data.metrics.topContributor.login}</div>
                    <div className="text-amber-400/80 text-xs font-medium bg-amber-400/10 px-3 py-1 rounded-full">
                      Bottleneck: {data.metrics.topContributor.commitsCount} Commits
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500 text-sm italic mt-4">No dominant contributor</div>
                )}
              </div>
            </div>

            {/* Metrics Grid */}
            <section>
              <h3 className="text-sm font-semibold text-white mb-4">Live Repository Metrics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard 
                  icon={<GitCommit className="text-blue-400" size={20} />}
                  title="Code Churn"
                  value={`${data.metrics.codeChurn.toLocaleString()}`}
                  subtitle="Lines changed"
                  isWarning={data.metrics.codeChurn > 5000}
                />
                <MetricCard 
                  icon={<Clock className="text-emerald-400" size={20} />}
                  title="Stagnation Risk"
                  value={`${data.metrics.stagnationRiskDays}`}
                  subtitle="Days since last commit"
                  isWarning={data.metrics.stagnationRiskDays > 7}
                />
                <MetricCard 
                  icon={<Users className="text-amber-400" size={20} />}
                  title="Bus Factor"
                  value={`${Math.round(data.metrics.busFactorPercent * 100)}%`}
                  subtitle="Top contributor share"
                  isWarning={data.metrics.busFactorPercent > 0.5}
                />
                <MetricCard 
                  icon={<GitPullRequest className="text-purple-400" size={20} />}
                  title="PR Bottlenecks"
                  value={`${data.metrics.openPrsCount || 0}`}
                  subtitle="Open pull requests"
                  isWarning={(data.metrics.openPrsCount || 0) > 5}
                />
              </div>
            </section>

            {/* Grafana Direct Panel Embeds */}
            <section className="pt-4">
              <h3 className="text-sm font-semibold text-white mb-4">Historical Trends (Grafana)</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Panel 1: Code Churn */}
                <div className="bg-[#111] border border-white/10 rounded-lg overflow-hidden h-[400px] w-full relative">
                  <iframe 
                    src={`https://mellowstarfish834.grafana.net/d-solo/yagvm9h/new-dashboard?orgId=1&from=now-24h&to=now&theme=dark&timezone=browser&var-repo_name=${encodeURIComponent(selectedRepo)}&panelId=panel-1`}
                    width="100%" 
                    height="100%" 
                    frameBorder="0"
                    title="Code Churn Over Time"
                    className="w-full h-full relative z-10"
                  ></iframe>
                </div>

                {/* Panel 2: Bus Factor */}
                <div className="bg-[#111] border border-white/10 rounded-lg overflow-hidden h-[400px] w-full relative">
                  <iframe 
                    src={`https://mellowstarfish834.grafana.net/d-solo/yagvm9h/new-dashboard?orgId=1&from=now-24h&to=now&theme=dark&timezone=browser&var-repo_name=${encodeURIComponent(selectedRepo)}&panelId=panel-2`}
                    width="100%" 
                    height="100%" 
                    frameBorder="0"
                    title="Bus Factor Trends"
                    className="w-full h-full relative z-10"
                  ></iframe>
                </div>

              </div>
            </section>



          </main>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon, title, value, subtitle, isWarning }: { icon: React.ReactNode, title: string, value: string, subtitle: string, isWarning: boolean }) {
  return (
    <div className={`bg-[#111] border p-6 rounded-lg transition-colors hover:border-gray-600 ${isWarning ? 'border-rose-500/50' : 'border-white/10'}`}>
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <span className="text-gray-400 text-xs font-semibold uppercase tracking-widest">{title}</span>
      </div>
      <div>
        <div className={`text-3xl font-bold tracking-tight ${isWarning ? 'text-rose-400' : 'text-white'}`}>
          {value}
        </div>
        <div className="text-gray-500 text-xs mt-1.5">{subtitle}</div>
      </div>
    </div>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const radius = 60;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const colorClass = score > 80 ? "text-emerald-400" : score > 60 ? "text-amber-400" : "text-rose-400";
  const strokeColor = score > 80 ? "#34d399" : score > 60 ? "#fbbf24" : "#fb7185";

  return (
    <div className="relative flex flex-col items-center justify-center mt-2">
      <svg className="w-48 h-28" viewBox="0 0 160 100">
        <path
          d="M 20 90 A 60 60 0 0 1 140 90"
          fill="none"
          stroke="#222"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M 20 90 A 60 60 0 0 1 140 90"
          fill="none"
          stroke={strokeColor}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute bottom-0 flex items-baseline gap-1">
        <span className={`text-5xl font-bold tracking-tighter ${colorClass}`}>
          {score}
        </span>
      </div>
    </div>
  );
}
