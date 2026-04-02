"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Playfair_Display } from "next/font/google";
import {
  Flame,
  TrendingUp,
  Camera,
  Star,
  Crown,
  Lock,
  BarChart2,
  RefreshCw,
  TriangleAlert,
  Gauge,
  Target,
} from "lucide-react";
import { db } from "@/lib/db";
import { formatCategoryLabel, getCategoryScores, getOverallScore, getPriorityOrder } from "@/lib/feedback";
import { getStreak } from "@/lib/streak";
import { getUser, setPro, FREE_ANALYSIS_LIMIT } from "@/lib/user";
import { generateWeeklyReport, getLatestReport } from "@/lib/report";
import type { Post, Report } from "@/types";

const playfair = Playfair_Display({ subsets: ["latin"], style: "italic", weight: "700" });

type CategoryTrend = {
  key: string;
  avg: number;
  latest: number;
  delta: number;
};

function computeStats(posts: Post[]) {
  const photos = posts.filter((p) => !p.type || p.type === "photo");
  const analyzed = photos
    .filter((p) => p.aiFeedback)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const totalPosts = photos.length;
  const analyzedCount = analyzed.length;
  const avgScore =
    analyzedCount > 0
      ? analyzed.reduce((sum, p) => sum + getOverallScore(p.aiFeedback!), 0) / analyzedCount
      : 0;

  const recentScores = analyzed.slice(-8).map((p) => getOverallScore(p.aiFeedback!));
  const firstScore = analyzedCount > 0 ? getOverallScore(analyzed[0].aiFeedback!) : 0;
  const latestScore = analyzedCount > 0 ? getOverallScore(analyzed[analyzedCount - 1].aiFeedback!) : 0;
  const scoreDelta = analyzedCount > 1 ? latestScore - firstScore : 0;

  const categorySeries: Record<string, number[]> = {
    face: [],
    hair: [],
    grooming: [],
    style: [],
    posture: [],
  };

  for (const p of analyzed) {
    const scores = getCategoryScores(p.aiFeedback!);
    for (const [key, value] of Object.entries(scores)) {
      if (key !== "skin") categorySeries[key]?.push(value);
    }
  }

  const categoryTrends: CategoryTrend[] = Object.entries(categorySeries)
    .filter(([, values]) => values.length > 0)
    .map(([key, values]) => ({
      key,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      latest: values[values.length - 1],
      delta: values.length > 1 ? values[values.length - 1] - values[0] : 0,
    }))
    .sort((a, b) => b.avg - a.avg);

  const bestCategory = categoryTrends[0]?.key ?? null;
  const weakestCategory = [...categoryTrends].sort((a, b) => a.avg - b.avg)[0]?.key ?? null;
  const latestPriority = analyzedCount > 0 ? getPriorityOrder(analyzed[analyzedCount - 1].aiFeedback!).slice(0, 3) : [];

  return {
    totalPosts,
    analyzedCount,
    avgScore: Math.round(avgScore * 10) / 10,
    recentScores,
    bestCategory,
    weakestCategory,
    latestScore: Math.round(latestScore * 10) / 10,
    scoreDelta: Math.round(scoreDelta * 10) / 10,
    categoryTrends,
    latestPriority,
  };
}

function Sparkline({ scores }: { scores: number[] }) {
  if (scores.length < 2) {
    return (
      <p className="text-xs text-zinc-600 italic">Analyze more photos to see your trend.</p>
    );
  }

  const W = 220;
  const H = 48;
  const pad = 4;

  const points = scores
    .map((s, i) => {
      const x = pad + (i / (scores.length - 1)) * (W - pad * 2);
      const y = H - pad - ((s - 1) / 9) * (H - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const lastX = pad + (W - pad * 2);
  const lastY = H - pad - ((scores[scores.length - 1] - 1) / 9) * (H - pad * 2);

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      {[3, 5, 7, 9].map((v) => {
        const y = H - pad - ((v - 1) / 9) * (H - pad * 2);
        return (
          <line key={v} x1={pad} y1={y} x2={W - pad} y2={y}
            stroke="#27272a" strokeWidth="1" strokeDasharray="3,3" />
        );
      })}
      <polyline points={points} fill="none" stroke="#a78bfa" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="3.5" fill="#a78bfa" />
    </svg>
  );
}

async function fetchProfileData() {
  const [posts, streak, user, latestReport] = await Promise.all([
    db.posts.orderBy("createdAt").reverse().toArray(),
    getStreak(),
    getUser(),
    getLatestReport(),
  ]);
  const stats = computeStats(posts);
  return { ...stats, streak, user, latestReport };
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfileData,
  });

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      await generateWeeklyReport();
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleUpgrade = async () => {
    await setPro(true);
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    setShowUpgrade(false);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
      </main>
    );
  }

  const {
    totalPosts,
    analyzedCount,
    avgScore,
    recentScores,
    bestCategory,
    weakestCategory,
    latestScore,
    scoreDelta,
    categoryTrends,
    latestPriority,
    streak,
    user,
    latestReport,
  } = data ?? {
    totalPosts: 0,
    analyzedCount: 0,
    avgScore: 0,
    recentScores: [],
    bestCategory: null,
    weakestCategory: null,
    latestScore: 0,
    scoreDelta: 0,
    categoryTrends: [],
    latestPriority: [],
    streak: null,
    user: null,
    latestReport: null,
  };

  const isPro = user?.isPro ?? false;
  const analysisCount = user?.analysisCount ?? 0;
  const analysesLeft = Math.max(0, FREE_ANALYSIS_LIMIT - analysisCount);

  return (
    <main className="min-h-screen bg-black">
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-zinc-800/40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className={`${playfair.className} text-[22px] text-white`}>Profile</h1>
          {isPro && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded-full">
              <Crown size={11} /> Pro
            </span>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pb-28 space-y-4 pt-5">
        <div className="flex items-center gap-4 py-2">
          <div
            className="p-[2.5px] rounded-full"
            style={{ background: "linear-gradient(135deg, #a78bfa, #60a5fa)" }}
          >
            <div className="p-[2px] bg-black rounded-full">
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                <span className="text-2xl font-bold text-zinc-300">Y</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-base font-bold text-white">You</p>
            <p className="text-xs text-zinc-500">Private journal</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <StatCard icon={<Camera size={14} className="text-sky-400" />} value={totalPosts} label="Posts" />
          <StatCard icon={<Star size={14} className="text-violet-400" />} value={avgScore > 0 ? avgScore.toFixed(1) : "-"} label="Avg" />
          <StatCard icon={<Gauge size={14} className="text-emerald-400" />} value={latestScore > 0 ? latestScore.toFixed(1) : "-"} label="Latest" />
          <StatCard icon={<Flame size={14} className="text-orange-400" />} value={streak?.currentStreak ?? 0} label="Streak" />
        </div>

        <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-violet-400" />
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Progress Tracker</span>
            </div>
            <span className={`text-xs font-semibold ${scoreDelta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {scoreDelta >= 0 ? "+" : ""}{scoreDelta.toFixed(1)}
            </span>
          </div>
          <Sparkline scores={recentScores} />
          <p className="text-xs text-zinc-500">
            {analyzedCount > 0
              ? `${analyzedCount} analyzed posts tracked locally.`
              : "No analyzed posts yet."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <InsightCard
            icon={<BarChart2 size={15} className="text-emerald-400" />}
            label="Strongest Area"
            value={bestCategory ? formatCategoryLabel(bestCategory) : "-"}
            note="Highest average category so far."
          />
          <InsightCard
            icon={<TriangleAlert size={15} className="text-red-400" />}
            label="Biggest Liability"
            value={weakestCategory ? formatCategoryLabel(weakestCategory) : "-"}
            note="Lowest average category. This is your drag point."
          />
        </div>

        <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-red-400" />
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Priority Stack</span>
          </div>
          {latestPriority.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {latestPriority.map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  className="rounded-full border border-zinc-700 bg-black px-3 py-1 text-[11px] text-zinc-300"
                >
                  {index + 1}. {formatCategoryLabel(item)}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-600">Analyze a photo to get a ranked weakness stack.</p>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <BarChart2 size={14} className="text-sky-400" />
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Category Breakdown</span>
          </div>
          {categoryTrends.length > 0 ? (
            <div className="space-y-3">
              {categoryTrends.map((item) => (
                <CategoryRow key={item.key} trend={item} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-600">No category data yet.</p>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw size={14} className="text-zinc-400" />
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Weekly Report</span>
            </div>
            {isPro ? (
              <button
                onClick={handleGenerateReport}
                disabled={generatingReport}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-40"
              >
                {generatingReport ? "Generating..." : "Generate"}
              </button>
            ) : (
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Lock size={11} /> Pro
              </span>
            )}
          </div>

          {latestReport ? (
            <ReportSummary report={latestReport} />
          ) : (
            <p className="text-xs text-zinc-600">
              {isPro
                ? "No report yet. Generate your first weekly summary."
                : "Upgrade to Pro to unlock weekly reports."}
            </p>
          )}
        </div>

        {!isPro && (
          <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Free Plan</p>
              <span className="text-xs text-zinc-500 tabular-nums">
                {analysesLeft} / {FREE_ANALYSIS_LIMIT} analyses left
              </span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all"
                style={{ width: `${(analysesLeft / FREE_ANALYSIS_LIMIT) * 100}%` }}
              />
            </div>
            <button
              onClick={() => setShowUpgrade(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-white text-black text-xs font-bold rounded-xl hover:bg-zinc-100 active:scale-[0.98] transition-all"
            >
              <Crown size={13} />
              Upgrade to Pro
            </button>
          </div>
        )}

        {streak && streak.longestStreak > 0 && (
          <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-orange-400" />
              <span className="text-sm font-semibold text-white">
                {streak.currentStreak} day streak
              </span>
            </div>
            <span className="text-xs text-zinc-500">
              Best: {streak.longestStreak} days
            </span>
          </div>
        )}
      </div>

      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-t-3xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Crown size={20} className="text-amber-400" />
              <h2 className="text-lg font-bold text-white">Looksmaxx Pro</h2>
            </div>
            <ul className="space-y-2 text-sm text-zinc-300">
              {["Unlimited AI analyses", "Full daily program", "Weekly progress reports", "Advanced score trends"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckIcon /> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={handleUpgrade}
              className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-100 transition-all"
            >
              Unlock Pro (free in beta)
            </button>
            <button
              onClick={() => setShowUpgrade(false)}
              className="w-full py-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-3 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">{icon}<span className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</span></div>
      <p className="text-xl font-bold text-white tabular-nums">{value}</p>
    </div>
  );
}

function InsightCard({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-4 space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-base font-bold text-white">{value}</p>
      <p className="text-xs text-zinc-500">{note}</p>
    </div>
  );
}

function CategoryRow({ trend }: { trend: { key: string; avg: number; latest: number; delta: number } }) {
  const pct = `${Math.max(0, Math.min(100, (trend.avg / 10) * 100))}%`;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-zinc-300">{formatCategoryLabel(trend.key)}</span>
        <div className="flex items-center gap-3 text-xs tabular-nums">
          <span className="text-zinc-500">avg {trend.avg.toFixed(1)}</span>
          <span className="text-zinc-500">latest {trend.latest.toFixed(1)}</span>
          <span className={trend.delta >= 0 ? "text-emerald-400" : "text-red-400"}>
            {trend.delta >= 0 ? "+" : ""}{trend.delta.toFixed(1)}
          </span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-black overflow-hidden">
        <div className="h-full rounded-full bg-white" style={{ width: pct }} />
      </div>
    </div>
  );
}

function ReportSummary({ report }: { report: Report }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-zinc-300 leading-relaxed">{report.summary}</p>
      <div className="flex gap-3 text-xs text-zinc-500 tabular-nums">
        <span>Avg: <span className="text-white font-semibold">{report.avgScore}/10</span></span>
        <span>Posts: <span className="text-white font-semibold">{report.postCount}</span></span>
        <span>Best: <span className="text-white font-semibold capitalize">{formatCategoryLabel(report.bestCategory)}</span></span>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 text-emerald-400">
      <circle cx="7" cy="7" r="7" fill="currentColor" fillOpacity="0.15" />
      <path d="M4 7l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
