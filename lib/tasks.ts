import { db } from "./db";
import { todayStr } from "./streak";
import {
  getPriorityTaskCategories,
  getProgramSeedTasks,
  getTaskCategoryScores,
  mapProgramTaskCategory,
} from "./feedback";
import type { Task, TaskCategory, AIFeedback } from "@/types";

const LIBRARY: Record<TaskCategory, string[]> = {
  skin: [
    "Wash your face (morning + evening)",
    "Apply moisturizer",
    "Use SPF before going outside",
    "Drink 8+ glasses of water",
    "Avoid touching your face today",
    "Exfoliate (2-3x per week)",
  ],
  grooming: [
    "Style your hair",
    "Trim / maintain facial hair",
    "Brush teeth twice",
    "Clip and clean nails",
    "Use deodorant",
    "Floss tonight",
  ],
  style: [
    "Plan tomorrow's outfit",
    "Wear a well-fitted outfit today",
    "Clean your shoes",
    "Iron or steam your clothes",
    "Wear a watch or accessory",
  ],
  fitness: [
    "Check and fix your posture (5 min)",
    "Exercise for 20+ minutes",
    "Take a 20-min walk",
    "Stretch for 10 minutes",
    "Get 7-9 hours of sleep tonight",
  ],
};

function pick<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < Math.min(n, copy.length); i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return out;
}

export function buildDefaultTasks(date: string): Omit<Task, "id">[] {
  const out: Omit<Task, "id">[] = [];
  const counts: Record<TaskCategory, number> = {
    skin: 2,
    grooming: 2,
    style: 2,
    fitness: 2,
  };
  for (const [cat, n] of Object.entries(counts) as [TaskCategory, number][]) {
    for (const title of pick(LIBRARY[cat], n)) {
      out.push({ title, category: cat, completed: false, date });
    }
  }
  return out;
}

export function buildAITasks(
  feedback: AIFeedback,
  date: string
): Omit<Task, "id">[] {
  const seeded = getProgramSeedTasks(feedback).slice(0, 8);
  if (seeded.length > 0) {
    return seeded.map((item) => ({
      title: item.task,
      category: mapProgramTaskCategory(item.category),
      completed: false,
      date,
    }));
  }

  const scores = getTaskCategoryScores(feedback);
  const priorities = getPriorityTaskCategories(feedback);

  const taskCounts: Record<TaskCategory, number> = {
    skin: scores.skin <= 4 ? 3 : 2,
    grooming: scores.grooming <= 4 ? 3 : 1,
    style: scores.style <= 4 ? 2 : 1,
    fitness: scores.fitness <= 4 ? 2 : 1,
  };

  for (const cat of priorities) {
    taskCounts[cat] = Math.min(taskCounts[cat] + 1, 3);
  }

  const out: Omit<Task, "id">[] = [];
  for (const [cat, n] of Object.entries(taskCounts) as [TaskCategory, number][]) {
    for (const title of pick(LIBRARY[cat], n)) {
      out.push({ title, category: cat, completed: false, date });
    }
  }
  return out;
}

export async function getTodayTasks(): Promise<Task[]> {
  return db.tasks.where("date").equals(todayStr()).toArray();
}

export async function initTodayTasks(latestFeedback?: AIFeedback | null): Promise<Task[]> {
  const today = todayStr();
  const existing = await db.tasks.where("date").equals(today).toArray();
  if (existing.length > 0) return existing;

  const seeds = latestFeedback
    ? buildAITasks(latestFeedback, today)
    : buildDefaultTasks(today);

  const ids = await db.tasks.bulkAdd(seeds, { allKeys: true });
  return seeds.map((s, i) => ({ ...s, id: ids[i] as number }));
}

export async function toggleTask(id: number, completed: boolean): Promise<void> {
  await db.tasks.update(id, { completed });
}
