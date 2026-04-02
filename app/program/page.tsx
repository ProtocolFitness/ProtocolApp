"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Playfair_Display } from "next/font/google";
import {
  Flame,
  Sparkles,
  CheckCircle2,
  Circle,
  RefreshCw,
  Droplets,
  Scissors,
  Shirt,
  Dumbbell,
} from "lucide-react";
import { db } from "@/lib/db";
import { buildAITasks, getTodayTasks, initTodayTasks, toggleTask } from "@/lib/tasks";
import { getStreak, recordCompletion } from "@/lib/streak";
import type { Task, TaskCategory } from "@/types";

const playfair = Playfair_Display({ subsets: ["latin"], style: "italic", weight: "700" });

// ── Category meta ─────────────────────────────────────────────────────────────

const CAT: Record<TaskCategory, { label: string; Icon: React.ElementType; color: string; bg: string }> = {
  skin:     { label: "Skin",     Icon: Droplets,  color: "text-sky-400",     bg: "bg-sky-400/10" },
  grooming: { label: "Grooming", Icon: Scissors,  color: "text-violet-400",  bg: "bg-violet-400/10" },
  style:    { label: "Style",    Icon: Shirt,     color: "text-amber-400",   bg: "bg-amber-400/10" },
  fitness:  { label: "Fitness",  Icon: Dumbbell,  color: "text-emerald-400", bg: "bg-emerald-400/10" },
};

const CATEGORY_ORDER: TaskCategory[] = ["skin", "grooming", "style", "fitness"];

// ── Data fetchers ─────────────────────────────────────────────────────────────

async function fetchPageData() {
  const [tasks, streak, latestPost] = await Promise.all([
    getTodayTasks(),
    getStreak(),
    db.posts.orderBy("createdAt").reverse().toArray().then(
      (posts) => posts.find((p) => !p.type || p.type === "photo")
    ),
  ]);

  // Initialise tasks for today if none exist yet
  const activeTasks =
    tasks.length > 0
      ? tasks
      : await initTodayTasks(latestPost?.aiFeedback ?? null);

  return { tasks: activeTasks, streak };
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProgramPage() {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["program"],
    queryFn: fetchPageData,
  });

  const tasks = data?.tasks ?? [];
  const streak = data?.streak;
  const completed = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Group by category
  const grouped = CATEGORY_ORDER.reduce<Record<TaskCategory, Task[]>>(
    (acc, cat) => {
      acc[cat] = tasks.filter((t) => t.category === cat);
      return acc;
    },
    { skin: [], grooming: [], style: [], fitness: [] }
  );

  // ── Toggle task ────────────────────────────────────────────────────────────

  const handleToggle = useCallback(
    async (task: Task) => {
      if (!task.id) return;
      const nowCompleted = !task.completed;
      await toggleTask(task.id, nowCompleted);

      if (nowCompleted) {
        // Update streak when first task completed
        await recordCompletion();

        // Add task-completion post to feed
        await db.posts.add({
          type: "task",
          image: "",
          createdAt: new Date(),
          taskTitle: task.title,
          taskCategory: task.category,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["program"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["streak"] });
    },
    [queryClient]
  );

  // ── Regenerate with AI ─────────────────────────────────────────────────────

  const handleRegenerate = async () => {
    setGenerating(true);
    try {
      const all = await db.posts.orderBy("createdAt").reverse().toArray();
      const latestPost = all.find((p) => !p.type || p.type === "photo");
      const feedback = latestPost?.aiFeedback;
      if (!feedback) return;

      // Replace today's tasks
      const today = new Date().toISOString().split("T")[0];
      const newTasks = buildAITasks(feedback, today);
      const existing = await db.tasks.where("date").equals(today).toArray();
      await db.tasks.bulkDelete(existing.map((t) => t.id!));
      await db.tasks.bulkAdd(newTasks);

      queryClient.invalidateQueries({ queryKey: ["program"] });
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-zinc-800/40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className={`${playfair.className} text-[22px] text-white`}>Program</h1>
          <button
            onClick={handleRegenerate}
            disabled={generating}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors disabled:opacity-40"
          >
            {generating ? (
              <span className="w-3.5 h-3.5 border border-zinc-500 border-t-white rounded-full animate-spin" />
            ) : (
              <Sparkles size={13} />
            )}
            AI refresh
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pb-28 space-y-5 pt-5">

        {/* ── Streak + progress ── */}
        <div className="flex items-center gap-3">
          {/* Streak badge */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800/60 rounded-xl px-3 py-2">
            <Flame size={16} className="text-orange-400" />
            <span className="text-sm font-bold text-white tabular-nums">
              {streak?.currentStreak ?? 0}
            </span>
            <span className="text-xs text-zinc-500">day streak</span>
          </div>

          {/* Progress bar */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-zinc-500">Today's progress</span>
              <span className="text-xs font-semibold text-zinc-300 tabular-nums">
                {completed}/{total}
              </span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── All done ── */}
        {completed === total && total > 0 && (
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
            <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
            <p className="text-sm text-emerald-300 font-medium">
              All done for today — great work! 🔥
            </p>
          </div>
        )}

        {/* ── Task groups ── */}
        {CATEGORY_ORDER.map((cat) => {
          const catTasks = grouped[cat];
          if (catTasks.length === 0) return null;
          const { label, Icon, color, bg } = CAT[cat];

          return (
            <section key={cat} className="space-y-2">
              {/* Category header */}
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon size={13} className={color} />
                </div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  {label}
                </span>
              </div>

              {/* Tasks */}
              {catTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleToggle(task)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all active:scale-[0.98] text-left ${
                    task.completed
                      ? "bg-zinc-900/40 border-zinc-800/30"
                      : "bg-zinc-900 border-zinc-800/60 hover:border-zinc-700"
                  }`}
                >
                  {task.completed ? (
                    <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Circle size={18} className="text-zinc-600 flex-shrink-0" />
                  )}
                  <span
                    className={`text-sm leading-snug ${
                      task.completed ? "text-zinc-500 line-through" : "text-zinc-200"
                    }`}
                  >
                    {task.title}
                  </span>
                </button>
              ))}
            </section>
          );
        })}

        {/* ── Empty state ── */}
        {total === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <RefreshCw size={28} className="text-zinc-700" />
            <p className="text-sm text-zinc-500">No tasks yet. Tap "AI refresh" to generate your program.</p>
          </div>
        )}
      </div>
    </main>
  );
}
