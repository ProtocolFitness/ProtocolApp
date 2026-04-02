import type { AIFeedback, AIComment, ProgramTask } from "@/types";

type CategoryScore = {
  key: "face" | "hair" | "grooming" | "style" | "posture" | "skin";
  score: number;
};

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function seededUnit(seed: number, offset: number): number {
  const mixed = hashString(`${seed}:${offset}`);
  return (mixed % 10000) / 10000;
}

function toScore(seed: number, offset: number, min = 3.6, max = 8.4): number {
  const value = min + seededUnit(seed, offset) * (max - min);
  return Math.round(value * 10) / 10;
}

function pickFrom<T>(seed: number, offset: number, values: T[]): T {
  const idx = Math.floor(seededUnit(seed, offset) * values.length) % values.length;
  return values[idx];
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function buildCategoryScores(seed: number): CategoryScore[] {
  const face = toScore(seed, 1);
  const hair = toScore(seed, 2);
  const grooming = toScore(seed, 3);
  const style = toScore(seed, 4);
  const posture = toScore(seed, 5);
  const skin = Math.round(((face * 0.7 + toScore(seed, 6) * 0.3) * 10)) / 10;

  return [
    { key: "face", score: face },
    { key: "hair", score: hair },
    { key: "grooming", score: grooming },
    { key: "style", score: style },
    { key: "posture", score: posture },
    { key: "skin", score: skin },
  ];
}

function priorityFromScores(scores: CategoryScore[]): string[] {
  return [...scores]
    .filter((item) => item.key !== "skin")
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((item) => item.key);
}

function focusLabel(category: string): string {
  switch (category) {
    case "face":
      return "Skin and facial detail";
    case "hair":
      return "Hair structure";
    case "grooming":
      return "Grooming consistency";
    case "style":
      return "Fit and silhouette";
    case "posture":
      return "Posture and presence";
    default:
      return "Daily execution";
  }
}

function improvementsFor(category: string): string[] {
  switch (category) {
    case "face":
      return [
        "Use brighter front lighting and keep your face fully visible in every tracking photo.",
        "Run a strict skincare baseline daily: cleanse, moisturize, and SPF before leaving home.",
        "Improve sleep consistency to reduce eye-area fatigue and skin dullness.",
      ];
    case "hair":
      return [
        "Lock a consistent haircut schedule and keep side/neck cleanup tight.",
        "Style with intentional volume direction instead of flat or random texture.",
        "Use one reliable product routine and stop changing products every day.",
      ];
    case "grooming":
      return [
        "Keep facial hair either clean-shaven or sharply maintained with defined edges.",
        "Clean up eyebrows lightly to reduce visual noise around the eyes.",
        "Tighten hygiene cadence so grooming quality is stable every day.",
      ];
    case "style":
      return [
        "Prioritize fit first: shoulders, sleeves, and pants length before new purchases.",
        "Use simple color combinations with clear contrast near the face.",
        "Prepare outfits the night before to remove rushed decisions.",
      ];
    case "posture":
      return [
        "Do a short daily posture reset: shoulders down/back, neutral neck, stable stance.",
        "Add 20 minutes of walking or light training to improve overall presence.",
        "Keep sleep and hydration consistent to reduce slouched fatigue posture.",
      ];
    default:
      return [
        "Take consistent progress photos with the same framing and lighting.",
        "Keep daily habits simple and repeatable.",
        "Focus effort on your weakest category first.",
      ];
  }
}

function buildProgram(priorities: string[]): { daily: ProgramTask[]; weeklyFocus: string } {
  const primary = priorities[0] ?? "grooming";
  const secondary = priorities[1] ?? "style";

  const poolByCategory: Record<string, string[]> = {
    face: [
      "AM/PM cleanse + moisturizer",
      "Apply SPF before outdoor light exposure",
      "Track sleep to hit 7-9 hours tonight",
    ],
    hair: [
      "Style hair with fixed volume direction",
      "Clean neckline/sideburns for sharper outline",
      "Use one product routine and keep it consistent",
    ],
    grooming: [
      "Trim or clean-shave facial hair edges",
      "Light eyebrow cleanup",
      "Full hygiene reset before evening",
    ],
    style: [
      "Wear your best-fitting outfit today",
      "Set tomorrow outfit before bed",
      "Keep colors minimal and intentional",
    ],
    posture: [
      "5-minute posture correction drill",
      "20-minute walk with upright posture",
      "10-minute mobility session for chest/hips",
    ],
    fitness: [
      "20-minute bodyweight workout",
      "10-minute stretch session",
      "Keep sleep window consistent",
    ],
  };

  const first = poolByCategory[primary] ?? poolByCategory.grooming;
  const second = poolByCategory[secondary] ?? poolByCategory.style;
  const selected = [
    first[0],
    first[1],
    second[0],
    second[1],
    poolByCategory.posture[0],
    poolByCategory.fitness[0],
  ];

  const toTaskCategory = (raw: string): string => {
    if (raw === "face") return "skin";
    if (raw === "hair") return "grooming";
    if (raw === "grooming") return "grooming";
    if (raw === "style") return "style";
    if (raw === "posture" || raw === "fitness") return "fitness";
    return "grooming";
  };

  const daily: ProgramTask[] = selected.map((task, index) => ({
    task,
    category: index < 2 ? toTaskCategory(primary) : index < 4 ? toTaskCategory(secondary) : "fitness",
    priority: index < 2 ? "high" : index < 4 ? "medium" : "low",
  }));

  return {
    daily,
    weeklyFocus: `Raise ${focusLabel(primary).toLowerCase()} first, then tighten ${focusLabel(secondary).toLowerCase()} for compounding gains.`,
  };
}

export function generateLocalFeedback(image: string, createdAt?: Date): AIFeedback {
  const seed = hashString(`${image.length}:${image.slice(0, 96)}:${createdAt?.toISOString() ?? ""}`);
  const scores = buildCategoryScores(seed);
  const byKey = Object.fromEntries(scores.map((item) => [item.key, item.score])) as Record<string, number>;
  const priorityOrder = priorityFromScores(scores);
  const primary = priorityOrder[0] ?? "grooming";
  const program = buildProgram(priorityOrder);
  const faceShape = pickFrom(seed, 7, ["Oval", "Round", "Square", "Rectangular", "Heart", "Diamond"]);

  const overallScore = Math.round(
    ((byKey.face + byKey.hair + byKey.grooming + byKey.style + byKey.posture) / 5) * 10
  ) / 10;

  return {
    overallScore,
    facialStructure: {
      faceShape,
      symmetryScore: Math.round(clamp01(0.42 + seededUnit(seed, 8) * 0.44) * 100) / 100,
      ratios: {
        widthToHeight: Math.round((0.95 + seededUnit(seed, 9) * 0.5) * 100) / 100,
        eyeSpacing: Math.round((0.85 + seededUnit(seed, 10) * 0.35) * 100) / 100,
        jawBalance: Math.round((0.8 + seededUnit(seed, 11) * 0.45) * 100) / 100,
        foreheadRatio: Math.round((0.85 + seededUnit(seed, 12) * 0.35) * 100) / 100,
      },
    },
    face: {
      score: byKey.face,
      areas: {
        skin: {
          score: byKey.skin,
          issues: [
            "Inconsistent lighting reduces reliable skin read",
            "Photo cadence is not yet standardized",
          ],
          notes: "Use consistent front lighting and basic daily skincare so trend scoring becomes cleaner over time.",
        },
        jawline: {
          score: Math.max(0, byKey.face - 0.3),
          notes: "Neutral neck alignment and lower photo angle distortion will improve facial definition read.",
        },
        eyes: {
          score: Math.min(10, byKey.face + 0.2),
          notes: "Sleep consistency and expression control have the highest immediate impact here.",
        },
        symmetry: {
          score: Math.round((byKey.face * 0.85 + 0.7) * 10) / 10,
          notes: "Keep framing centered and distance consistent to reduce false asymmetry noise.",
        },
      },
    },
    hair: {
      score: byKey.hair,
      areas: {
        style: {
          score: Math.round((byKey.hair + 0.1) * 10) / 10,
          notes: "Use an intentional shape rather than reactive styling.",
        },
        volume: {
          score: Math.round((byKey.hair - 0.2) * 10) / 10,
          notes: "Direction and hold matter more than product quantity.",
        },
        suitability: {
          score: Math.round((byKey.hair + 0.05) * 10) / 10,
          notes: "Keep cut structure aligned with your face shape and growth pattern.",
        },
      },
    },
    grooming: {
      score: byKey.grooming,
      areas: {
        facialHair: {
          score: Math.round((byKey.grooming - 0.1) * 10) / 10,
          notes: "Keep edge lines clean and avoid in-between stubble phases unless intentional.",
        },
        eyebrows: {
          score: Math.round((byKey.grooming + 0.1) * 10) / 10,
          notes: "Light cleanup improves eye-area clarity without over-shaping.",
        },
      },
    },
    style: {
      score: byKey.style,
      areas: {
        fit: {
          score: Math.round((byKey.style - 0.1) * 10) / 10,
          notes: "Fit drives visual quality more than brand or trend pieces.",
        },
        color: {
          score: Math.round((byKey.style + 0.1) * 10) / 10,
          notes: "Use simpler palettes with contrast near the face.",
        },
      },
    },
    posture: {
      score: byKey.posture,
      notes: "Daily posture drills and regular movement improve how every other category presents.",
    },
    priorityOrder,
    topImprovements: improvementsFor(primary),
    program,
    comment: {
      text: `Current bottleneck is ${focusLabel(primary).toLowerCase()}; improve that first for the fastest visible gain.`,
      focus: focusLabel(primary),
    },
  };
}

export function generateLocalComments(feedback: AIFeedback): AIComment[] {
  const focus = feedback.priorityOrder[0] ?? "grooming";
  const second = feedback.priorityOrder[1] ?? "style";
  return [
    {
      text: `Your next gain comes from tightening ${focusLabel(focus).toLowerCase()} on a daily schedule.`,
      focus: focusLabel(focus),
    },
    {
      text: "Keep photo framing and lighting consistent so score changes reflect real progress, not camera variance.",
      focus: "Photo consistency",
    },
    {
      text: `After that, push ${focusLabel(second).toLowerCase()} to convert small upgrades into a stronger overall read.`,
      focus: focusLabel(second),
    },
  ];
}
