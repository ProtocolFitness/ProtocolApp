import { db } from "./db";
import type { Streak } from "@/types";

export function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

const SEED: Streak = {
  id: 1,
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
};

export async function getStreak(): Promise<Streak> {
  const s = await db.streak.get(1);
  if (!s) {
    await db.streak.add(SEED);
    return { ...SEED };
  }

  // Check for missed day — reset streak if last completion was before yesterday
  if (s.lastCompletedDate) {
    const yesterday = yesterdayStr();
    const today = todayStr();
    if (s.lastCompletedDate < yesterday && s.lastCompletedDate !== today) {
      const reset = { ...s, currentStreak: 0 };
      await db.streak.update(1, { currentStreak: 0 });
      return reset;
    }
  }

  return s;
}

/** Call when the user completes at least one task for the day. */
export async function recordCompletion(): Promise<Streak> {
  const today = todayStr();
  const s = await getStreak();

  // Already counted today — nothing to update
  if (s.lastCompletedDate === today) return s;

  const newStreak =
    s.lastCompletedDate === yesterdayStr() ? s.currentStreak + 1 : 1;
  const longestStreak = Math.max(newStreak, s.longestStreak);

  await db.streak.update(1, {
    currentStreak: newStreak,
    longestStreak,
    lastCompletedDate: today,
  });

  return { ...s, currentStreak: newStreak, longestStreak, lastCompletedDate: today };
}
