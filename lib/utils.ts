import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Stable reference anchor for SSR prerender consistency; updated to real clock on client mount
const STATIC_STABLE_ANCHOR = new Date('2026-10-24T09:00:00Z');
let clientCurrentDate: Date | null = null;

export function setClientCurrentDate(d: Date) {
  clientCurrentDate = d;
}

export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return "";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatTimeAgo(isoTimestamp: string | null | undefined, nowMs?: number): string {
  if (!isoTimestamp) return "No logs yet";
  const timeMs = new Date(isoTimestamp).getTime();
  if (Number.isNaN(timeMs)) return "Just now";

  const currentMs = nowMs ?? STATIC_STABLE_ANCHOR.getTime();
  const diffMins = Math.max(0, Math.floor((currentMs - timeMs) / 60000));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  if (hours < 24) {
    return mins > 0 ? `${hours}h ${mins}m ago` : `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

export function getMinutesSince(isoTimestamp: string | null | undefined, nowMs?: number): number {
  if (!isoTimestamp) return 45;
  const timeMs = new Date(isoTimestamp).getTime();
  if (Number.isNaN(timeMs)) return 45;
  const currentMs = nowMs ?? STATIC_STABLE_ANCHOR.getTime();
  return Math.max(0, Math.floor((currentMs - timeMs) / 60000));
}

/**
 * Formats a duration in minutes into the compact "1h 30m", "2h", or "45m" format.
 */
export function formatDuration(totalMins: number | null | undefined): string {
  const mins = Math.max(0, Math.round(totalMins || 0));
  if (mins === 0) return "0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function calculatePostpartumAge(
  birthDateString: string | null | undefined,
  refDate?: Date | null
): {
  weeks: number;
  days: number;
  totalDays: number;
  recoveryStage: string;
  pelvicFloorStage: string;
  recommendedWakeWindowMins: number;
} {
  if (!birthDateString) {
    return {
      weeks: 1,
      days: 0,
      totalDays: 0,
      recoveryStage: "Early Fourth Trimester",
      pelvicFloorStage: "Pelvic Floor Stage 1",
      recommendedWakeWindowMins: 55,
    };
  }

  const birthDate = new Date(birthDateString);
  const anchor = refDate || clientCurrentDate || STATIC_STABLE_ANCHOR;
  const diffTime = Math.max(0, anchor.getTime() - birthDate.getTime());
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weeks = Math.max(1, Math.floor(totalDays / 7));
  const days = totalDays % 7;

  let recoveryStage = "Early Fourth Trimester";
  let pelvicFloorStage = "Pelvic Floor Stage 1";

  if (weeks >= 6 && weeks < 12) {
    recoveryStage = "Mid-Recovery Checkpoint";
    pelvicFloorStage = "Pelvic Floor Stage 1";
  } else if (weeks >= 12 && weeks < 24) {
    recoveryStage = "Strength & Mobility Phase";
    pelvicFloorStage = "Pelvic Floor Stage 2";
  } else if (weeks >= 24) {
    recoveryStage = "Graduation & Ongoing Vitality";
    pelvicFloorStage = "Core & Functional Stamina";
  }

  // Age-appropriate wake window prediction in minutes
  let recommendedWakeWindowMins = 75;
  if (weeks < 4) {
    recommendedWakeWindowMins = 55;
  } else if (weeks < 8) {
    recommendedWakeWindowMins = 75;
  } else if (weeks < 12) {
    recommendedWakeWindowMins = 90;
  } else if (weeks < 16) {
    recommendedWakeWindowMins = 105;
  } else {
    recommendedWakeWindowMins = 120;
  }

  return {
    weeks,
    days,
    totalDays,
    recoveryStage,
    pelvicFloorStage,
    recommendedWakeWindowMins,
  };
}

export interface MoodLogEntry {
  id?: string;
  score: number;
  logged_date: string;
  created_at?: string;
}

export interface WeeklyMoodMomentumResult {
  /** Final 0-100% Recency-Weighted Weekly Momentum score */
  percentage: number;
  /** Raw Exponential Moving Average score on the 1.0 - 5.0 scale (0 if no logs this week) */
  emaScore: number;
  /** Number of mood check-ins recorded since Monday 12:00:00 AM of the current week */
  weeklyCheckIns: number;
  /** YYYY-MM-DD local date string of the current week's Monday 12:00 AM boundary */
  weekStartDateStr: string;
  /** Percentage of this week's check-ins with score >= 4 (Grounded / Joyful) */
  happyPct: number;
  /** Percentage of this week's check-ins with score === 3 (Balanced) */
  calmPct: number;
  /** Percentage of this week's check-ins with score <= 2 (Depleted / Fragile) */
  fragilePct: number;
  /** Dominant state label for the donut chart center */
  dominantLabel: 'Grounded' | 'Balanced' | 'Tender' | 'Fresh Week';
  /** True when at least one mood log exists in the current week window */
  hasLogsThisWeek: boolean;
}

function toLocalDateStr(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Computes the Recency-Weighted Weekly Momentum Index using an Exponential Moving Average (EMA).
 * - Resets every Monday at 12:00:00 AM local time.
 * - Uses alpha = 0.4 by default so recent check-ins carry greater weight than earlier ones.
 * - Maps the 1-5 mood scale (Depleted=1 .. Joyful=5) to 0-100%.
 */
export function calculateWeeklyMoodMomentum(
  moodLogs: MoodLogEntry[],
  options?: { alpha?: number; refDate?: Date | null }
): WeeklyMoodMomentumResult {
  const alpha = options?.alpha ?? 0.4;
  const anchor = options?.refDate || clientCurrentDate || STATIC_STABLE_ANCHOR;

  // 1. Compute Monday 12:00:00.000 AM of the current week in local time
  const dayOfWeek = anchor.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const mondayStart = new Date(
    anchor.getFullYear(),
    anchor.getMonth(),
    anchor.getDate() - daysSinceMonday,
    0,
    0,
    0,
    0
  );
  const weekStartDateStr = toLocalDateStr(mondayStart);
  const todayDateStr = toLocalDateStr(anchor);

  // 2. Filter logs to only entries from the current week (Monday 12:00 AM -> now)
  const weeklyLogs = (moodLogs || []).filter((log) => {
    if (!log || typeof log.logged_date !== 'string') return false;
    return log.logged_date >= weekStartDateStr && log.logged_date <= todayDateStr;
  });

  // 3. Edge case: Zero logs for the current week
  if (weeklyLogs.length === 0) {
    return {
      percentage: 0,
      emaScore: 0,
      weeklyCheckIns: 0,
      weekStartDateStr,
      happyPct: 0,
      calmPct: 0,
      fragilePct: 0,
      dominantLabel: 'Fresh Week',
      hasLogsThisWeek: false,
    };
  }

  // 4. Sort chronologically from oldest -> newest so EMA weights the latest check-ins highest.
  // Since moodLogs is stored newest-first in state, reversing preserves insertion order for ties.
  const chronological = [...weeklyLogs].reverse().sort((a, b) => {
    const dateCmp = a.logged_date.localeCompare(b.logged_date);
    if (dateCmp !== 0) return dateCmp;
    if (a.created_at && b.created_at) {
      return a.created_at.localeCompare(b.created_at);
    }
    return 0;
  });

  // 5. Exponential Moving Average (EMA): EMA_t = alpha * S_t + (1 - alpha) * EMA_{t-1}
  const clampScore = (s: number) => Math.min(5, Math.max(1, Number.isFinite(s) ? s : 3));
  let ema = clampScore(chronological[0].score);
  for (let i = 1; i < chronological.length; i++) {
    const score = clampScore(chronological[i].score);
    ema = alpha * score + (1 - alpha) * ema;
  }

  // 6. Scale conversion: map 1-5 EMA score to 0-100%
  const percentage = Math.min(100, Math.max(0, Math.round((ema / 5) * 100)));

  // 7. Weekly distribution breakdown for the donut chart
  const weeklyCheckIns = weeklyLogs.length;
  const happyCount = weeklyLogs.filter((m) => m.score >= 4).length;
  const calmCount = weeklyLogs.filter((m) => m.score === 3).length;

  const happyPct = Math.round((happyCount / weeklyCheckIns) * 100);
  const calmPct = Math.round((calmCount / weeklyCheckIns) * 100);
  const fragilePct = Math.max(0, 100 - happyPct - calmPct);

  const dominantLabel =
    happyPct >= calmPct && happyPct >= fragilePct
      ? 'Grounded'
      : calmPct >= fragilePct
      ? 'Balanced'
      : 'Tender';

  return {
    percentage,
    emaScore: Number(ema.toFixed(2)),
    weeklyCheckIns,
    weekStartDateStr,
    happyPct,
    calmPct,
    fragilePct,
    dominantLabel,
    hasLogsThisWeek: true,
  };
}
