import { db } from "./db";
import type { UserProfile } from "@/types";

const SEED: UserProfile = {
  id: 1,
  isPro: false,
  analysisCount: 0,
  createdAt: new Date(),
};

export async function getUser(): Promise<UserProfile> {
  const u = await db.user.get(1);
  if (!u) {
    await db.user.add(SEED);
    return { ...SEED };
  }
  return u;
}

export async function incrementAnalysis(): Promise<void> {
  const u = await getUser();
  await db.user.update(1, { analysisCount: u.analysisCount + 1 });
}

export async function setPro(isPro: boolean): Promise<void> {
  await getUser(); // ensure exists
  await db.user.update(1, { isPro });
}

export const FREE_ANALYSIS_LIMIT = 3;
