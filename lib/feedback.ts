import type { AIFeedback, ProgramTask, TaskCategory } from "@/types";

type LegacyCategory = {
  rating?: string;
  tips?: string[];
};

type LegacyFeedback = {
  overall?: string;
  score?: number;
  categories?: Record<string, LegacyCategory>;
  topImprovements?: string[];
};

type CategorySummary = {
  key: string;
  label: string;
  score: number;
  notes: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  face: "Face",
  hair: "Hair",
  grooming: "Grooming",
  style: "Style",
  posture: "Posture",
  skin: "Skin",
  facialHair: "Facial Hair",
};

const LEGACY_RATING_SCORE: Record<string, number> = {
  Poor: 3,
  "Needs Work": 5,
  Good: 7,
  Excellent: 9,
};

function asLegacy(feedback: AIFeedback): LegacyFeedback {
  return feedback as unknown as LegacyFeedback;
}

function isNewFeedback(feedback: AIFeedback): boolean {
  return !!(feedback as Partial<AIFeedback>).face?.areas?.skin;
}

function legacyCategoryScore(category?: LegacyCategory): number {
  return clampScore(LEGACY_RATING_SCORE[category?.rating ?? ""] ?? 5);
}

function legacyCategoryNotes(category?: LegacyCategory, fallback = "General improvement advice."): string {
  const tips = category?.tips?.filter(Boolean) ?? [];
  if (tips.length > 0) return tips.join(" ");
  return fallback;
}

export function clampScore(score: number): number {
  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

export function scoreToRating(score: number): string {
  if (score >= 8) return "Excellent";
  if (score >= 6) return "Good";
  if (score >= 4) return "Needs Work";
  return "Poor";
}

export function getOverallScore(feedback: AIFeedback): number {
  if (isNewFeedback(feedback)) {
    return clampScore(feedback.overallScore);
  }
  return clampScore(asLegacy(feedback).score ?? 5);
}

export function getCategoryScores(feedback: AIFeedback): Record<string, number> {
  if (isNewFeedback(feedback)) {
    return {
      face: clampScore(feedback.face.score),
      hair: clampScore(feedback.hair.score),
      grooming: clampScore(feedback.grooming.score),
      style: clampScore(feedback.style.score),
      posture: clampScore(feedback.posture.score),
      skin: clampScore(feedback.face.areas.skin.score),
    };
  }

  const legacy = asLegacy(feedback);
  const categories = legacy.categories ?? {};
  return {
    face: clampScore(legacy.score ?? 5),
    hair: legacyCategoryScore(categories.hair),
    grooming: legacyCategoryScore(categories.grooming),
    style: legacyCategoryScore(categories.style),
    posture: 5,
    skin: legacyCategoryScore(categories.skin),
  };
}

export function getTaskCategoryScores(feedback: AIFeedback): Record<TaskCategory, number> {
  const scores = getCategoryScores(feedback);
  return {
    skin: scores.skin,
    grooming: clampScore((scores.hair + scores.grooming) / 2),
    style: scores.style,
    fitness: scores.posture,
  };
}

export function getPriorityOrder(feedback: AIFeedback): string[] {
  if (isNewFeedback(feedback) && feedback.priorityOrder.length > 0) {
    return feedback.priorityOrder;
  }

  return Object.entries(getCategoryScores(feedback))
    .filter(([key]) => key !== "skin")
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([key]) => key);
}

export function getPriorityTaskCategories(feedback: AIFeedback): TaskCategory[] {
  const mapped = getPriorityOrder(feedback)
    .map(mapToTaskCategory)
    .filter((value, index, arr): value is TaskCategory => !!value && arr.indexOf(value) === index);

  if (mapped.length > 0) return mapped;

  return Object.entries(getTaskCategoryScores(feedback))
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([key]) => key as TaskCategory);
}

export function mapToTaskCategory(category: string): TaskCategory | null {
  switch (category.toLowerCase()) {
    case "skin":
    case "face":
      return "skin";
    case "hair":
    case "grooming":
    case "facialhair":
    case "facial_hair":
      return "grooming";
    case "style":
      return "style";
    case "posture":
    case "fitness":
      return "fitness";
    default:
      return null;
  }
}

export function mapProgramTaskCategory(category: string): TaskCategory {
  return mapToTaskCategory(category) ?? "grooming";
}

export function getProgramSeedTasks(feedback: AIFeedback): ProgramTask[] {
  if (isNewFeedback(feedback)) {
    return feedback.program.daily.filter((item) => item.task.trim().length > 0);
  }
  return [];
}

export function getCategorySummaries(feedback: AIFeedback): CategorySummary[] {
  if (isNewFeedback(feedback)) {
    return [
      {
        key: "face",
        label: "Face",
        score: clampScore(feedback.face.score),
        notes: feedback.face.areas.skin.notes,
      },
      {
        key: "hair",
        label: "Hair",
        score: clampScore(feedback.hair.score),
        notes: feedback.hair.areas.suitability.notes,
      },
      {
        key: "grooming",
        label: "Grooming",
        score: clampScore(feedback.grooming.score),
        notes: feedback.grooming.areas.facialHair.notes,
      },
      {
        key: "style",
        label: "Style",
        score: clampScore(feedback.style.score),
        notes: feedback.style.areas.fit.notes,
      },
      {
        key: "posture",
        label: "Posture",
        score: clampScore(feedback.posture.score),
        notes: feedback.posture.notes,
      },
    ];
  }

  const legacy = asLegacy(feedback);
  const categories = legacy.categories ?? {};
  return [
    {
      key: "face",
      label: "Face",
      score: clampScore(legacy.score ?? 5),
      notes: legacy.overall ?? "General appearance assessment.",
    },
    {
      key: "hair",
      label: "Hair",
      score: legacyCategoryScore(categories.hair),
      notes: legacyCategoryNotes(categories.hair, "Hair guidance unavailable."),
    },
    {
      key: "grooming",
      label: "Grooming",
      score: legacyCategoryScore(categories.grooming),
      notes: legacyCategoryNotes(categories.grooming, "Grooming guidance unavailable."),
    },
    {
      key: "style",
      label: "Style",
      score: legacyCategoryScore(categories.style),
      notes: legacyCategoryNotes(categories.style, "Style guidance unavailable."),
    },
    {
      key: "posture",
      label: "Posture",
      score: 5,
      notes: "Posture was not scored in this older analysis. Use neutral posture checks and shoulder alignment work.",
    },
  ];
}

export function getComment(feedback: AIFeedback): { text: string; focus: string } {
  if (isNewFeedback(feedback)) {
    return feedback.comment;
  }

  const legacy = asLegacy(feedback);
  const focus = formatCategoryLabel(getPriorityOrder(feedback)[0] ?? "face");
  return {
    text: legacy.overall ?? "Older analysis loaded. Re-run analysis for the full structured model.",
    focus,
  };
}

export function getStructuralRead(feedback: AIFeedback): {
  faceShape: string;
  symmetryScore: number;
  widthToHeight: number;
  eyeSpacing: number;
} {
  if (isNewFeedback(feedback)) {
    return {
      faceShape: feedback.facialStructure.faceShape,
      symmetryScore: feedback.facialStructure.symmetryScore,
      widthToHeight: feedback.facialStructure.ratios.widthToHeight,
      eyeSpacing: feedback.facialStructure.ratios.eyeSpacing,
    };
  }

  return {
    faceShape: "Not available from older analysis",
    symmetryScore: 0.5,
    widthToHeight: 1,
    eyeSpacing: 1,
  };
}

export function getTopImprovements(feedback: AIFeedback): string[] {
  if (isNewFeedback(feedback)) {
    return feedback.topImprovements;
  }
  return asLegacy(feedback).topImprovements ?? [];
}

export function getWeeklyFocus(feedback: AIFeedback): string {
  if (isNewFeedback(feedback)) {
    return feedback.program.weeklyFocus;
  }
  return "Re-run analysis to generate a personalized weekly focus.";
}

export function getDailyProgram(feedback: AIFeedback): ProgramTask[] {
  if (isNewFeedback(feedback)) {
    return feedback.program.daily;
  }
  return [];
}

export function formatCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}
