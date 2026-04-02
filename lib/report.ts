import { db } from "./db";
import { formatCategoryLabel, getCategoryScores, getOverallScore, getPriorityOrder } from "./feedback";
import type { Post, Report } from "@/types";

function dateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function avgScore(posts: Post[]): number {
  const analyzed = posts.filter((p) => p.aiFeedback);
  if (!analyzed.length) return 0;
  return analyzed.reduce((s, p) => s + getOverallScore(p.aiFeedback!), 0) / analyzed.length;
}

function bestAndWorstCategory(posts: Post[]): { best: string; worst: string } {
  const analyzed = posts.filter((p) => p.aiFeedback);
  if (!analyzed.length) return { best: "-", worst: "-" };

  const totals: Record<string, number[]> = {
    face: [],
    hair: [],
    grooming: [],
    style: [],
    posture: [],
  };

  for (const p of analyzed) {
    const scores = getCategoryScores(p.aiFeedback!);
    for (const [key, value] of Object.entries(scores)) {
      if (key !== "skin") totals[key]?.push(value);
    }
  }

  const avgs = Object.entries(totals)
    .filter(([, values]) => values.length > 0)
    .map(([key, values]) => ({
      key,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
    }))
    .sort((a, b) => b.avg - a.avg);

  return {
    best: avgs[0]?.key ?? "-",
    worst: avgs[avgs.length - 1]?.key ?? "-",
  };
}

function buildSummary(r: Omit<Report, "id" | "createdAt" | "summary">): string {
  const trend =
    r.avgScore > r.prevAvgScore
      ? `score improved from ${r.prevAvgScore.toFixed(1)} to ${r.avgScore.toFixed(1)}`
      : r.avgScore < r.prevAvgScore
        ? `score dropped from ${r.prevAvgScore.toFixed(1)} to ${r.avgScore.toFixed(1)}`
        : `score held steady at ${r.avgScore.toFixed(1)}`;

  return `This week ${trend}. Best area: ${formatCategoryLabel(r.bestCategory)}. Focus next week: ${formatCategoryLabel(r.suggestedFocus)}.`;
}

export async function generateWeeklyReport(): Promise<Report> {
  const allPosts = await db.posts.where("type").anyOf(["photo", undefined]).toArray();
  const photos = allPosts.filter((p) => !p.type || p.type === "photo");

  const thisWeekStart = daysAgo(7);
  const prevWeekStart = daysAgo(14);

  const thisWeek = photos.filter((p) => new Date(p.createdAt) >= thisWeekStart);
  const prevWeek = photos.filter(
    (p) =>
      new Date(p.createdAt) >= prevWeekStart &&
      new Date(p.createdAt) < thisWeekStart
  );

  const currentAvg = Math.round(avgScore(thisWeek) * 10) / 10;
  const prevAvg = Math.round(avgScore(prevWeek) * 10) / 10;
  const { best, worst } = bestAndWorstCategory(thisWeek);
  const suggestedFocus =
    thisWeek
      .map((p) => p.aiFeedback)
      .filter(Boolean)
      .flatMap((feedback) => getPriorityOrder(feedback!))[0] ?? worst;

  const data: Omit<Report, "id" | "createdAt" | "summary"> = {
    weekStart: dateStr(thisWeekStart),
    avgScore: currentAvg,
    prevAvgScore: prevAvg,
    postCount: thisWeek.length,
    bestCategory: best,
    weakestCategory: worst,
    suggestedFocus,
  };

  const report: Omit<Report, "id"> = {
    ...data,
    createdAt: new Date(),
    summary: buildSummary(data),
  };

  const id = await db.reports.add(report);

  await db.posts.add({
    type: "report",
    image: "",
    createdAt: new Date(),
    reportSummary: report.summary,
  });

  return { ...report, id: id as number };
}

export async function getLatestReport(): Promise<Report | undefined> {
  return db.reports.orderBy("createdAt").last();
}
