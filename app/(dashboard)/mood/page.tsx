'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sparkles, TrendingUp, Wind, Calendar, Clock } from 'lucide-react';
import { useMaterna } from '@/lib/context/MaternaContext';
import { MaternalMoodReflection } from '@/components/postpartum/MaternalMoodReflection';
import { LotusIcon } from '@/components/shared/LotusIcon';

export default function MoodPage() {
  const { moodLogs } = useMaterna();
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [rootCauseFilter, setRootCauseFilter] = useState<'week' | 'all'>('week');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopBreathing = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setBreathingActive(false);
    setBreathPhase('Inhale');
  };

  const startBreathing = () => {
    stopBreathing();
    setBreathingActive(true);
    let phaseIdx = 0;
    const phases: Array<'Inhale' | 'Hold' | 'Exhale'> = ['Inhale', 'Hold', 'Exhale'];
    setBreathPhase('Inhale');

    intervalRef.current = setInterval(() => {
      phaseIdx = (phaseIdx + 1) % 3;
      setBreathPhase(phases[phaseIdx]);
    }, 4000);

    timeoutRef.current = setTimeout(() => {
      stopBreathing();
    }, 60000);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const [clientNowMs, setClientNowMs] = useState<number>(() => 1729760400000);

  useEffect(() => {
    setClientNowMs(Date.now());
  }, []);

  const scoreLabels: Record<number, string> = {
    1: 'Depleted',
    2: 'Fragile',
    3: 'Balanced',
    4: 'Grounded',
    5: 'Joyful',
  };

  // 1. Compute Monday 12:00:00 AM of the current week for weekly resets
  const now = useMemo(() => new Date(clientNowMs), [clientNowMs]);
  const mondayDateStr = useMemo(() => {
    const day = now.getDay();
    const daysSinceMonday = day === 0 ? 6 : day - 1;
    const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday);
    const mm = String(mon.getMonth() + 1).padStart(2, '0');
    const dd = String(mon.getDate()).padStart(2, '0');
    return `${mon.getFullYear()}-${mm}-${dd}`;
  }, [now]);

  // 2. Build distinct 7-day trend showing actual logged data vs unlogged days
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const daysAgo = 6 - i;
      const d = new Date(clientNowMs - daysAgo * 86400000);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${d.getFullYear()}-${mm}-${dd}`;
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      const matchingLogs = moodLogs.filter((m) => m.logged_date === dateStr);
      const hasEntry = matchingLogs.length > 0;
      const rawAvg = hasEntry
        ? matchingLogs.reduce((acc, c) => acc + c.score, 0) / matchingLogs.length
        : null;
      const roundedScore = rawAvg !== null ? Math.min(5, Math.max(1, Math.round(rawAvg))) : null;

      return {
        dateStr,
        day: dayName,
        score: roundedScore,
        rawAvg,
        label: roundedScore !== null ? scoreLabels[roundedScore] : 'No check-in',
        hasEntry,
        logCount: matchingLogs.length,
      };
    });
  }, [clientNowMs, moodLogs]);

  // Calculate stats strictly from days that actually have logged entries
  const loggedDays = last7Days.filter((d) => d.hasEntry && d.score !== null);
  const sevenDayAvg =
    loggedDays.length > 0
      ? loggedDays.reduce((acc, item) => acc + (item.rawAvg ?? item.score ?? 3), 0) / loggedDays.length
      : null;

  const trajectoryDescriptor =
    sevenDayAvg === null
      ? 'Awaiting Check-ins'
      : sevenDayAvg >= 4.2
      ? 'Joyful & Radiant'
      : sevenDayAvg >= 3.4
      ? 'Grounded & Steady'
      : sevenDayAvg >= 2.6
      ? 'Balanced Transition'
      : 'Needs Gentle Support';

  const badgeLabel =
    sevenDayAvg === null
      ? 'Track Today'
      : sevenDayAvg >= 3.5
      ? 'Healthy Equilibrium'
      : sevenDayAvg >= 2.5
      ? 'Mindful Pacing'
      : 'Extra Rest Recommended';

  // 3. Filter Root Causes by toggle: "This Week" (resets Monday) vs "All Time"
  const relevantMoodLogs = useMemo(() => {
    if (rootCauseFilter === 'week') {
      return moodLogs.filter((l) => l.logged_date >= mondayDateStr);
    }
    return moodLogs;
  }, [moodLogs, rootCauseFilter, mondayDateStr]);

  const tagCountsMap: Record<string, number> = {};
  relevantMoodLogs.forEach((log) => {
    (log.tags || []).forEach((t) => {
      tagCountsMap[t] = (tagCountsMap[t] || 0) + 1;
    });
  });

  const totalLogsCount = Math.max(1, relevantMoodLogs.length);
  const sortedTags = Object.entries(tagCountsMap)
    .map(([tag, count]) => ({
      tag,
      count,
      percent: Math.min(100, Math.round((count / totalLogsCount) * 100)),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const topTag = sortedTags[0]?.tag || "Baby's Feeding";
  const lowestLoggedDay = [...loggedDays].sort((a, b) => (a.score ?? 3) - (b.score ?? 3))[0];

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Header Banner (Hidden on mobile per user request) */}
      <section className="hidden sm:block bg-gradient-to-br from-[#FFE8DE] via-[#FCE4EF] to-white rounded-2xl sm:rounded-[32px] p-4 sm:p-8 border border-[#EFE3EE] shadow-[0_8px_30px_rgba(140,80,120,0.06)] space-y-1.5 sm:space-y-2">
        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold text-[#8F7292] uppercase tracking-wider">
          <LotusIcon className="w-4 h-4 text-[#9E4875]" />
          <span>MATERNAL MENTAL WELLNESS</span>
        </div>
        <h1 className="font-serif text-xl sm:text-3xl font-bold text-[#2A162B]">
          Mom&apos;s Emotional Reflections
        </h1>
        <p className="text-xs sm:text-sm text-[#7D607E] leading-relaxed max-w-xl">
          Tracking the fourth-trimester emotional landscape. Low-friction reflections designed for tired mothers, paired with gentle AI validation and serene breathing resets.
        </p>
      </section>

      {/* Responsive Grid for Mood Reflections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Left Column (7 cols): Main Check-in & 7-Day Trajectory */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-6">
          {/* Main Check-In Tracker Card */}
          <MaternalMoodReflection />

          {/* 7-Day Trend Visualizer */}
          <section className="bg-white rounded-2xl sm:rounded-[32px] p-4 sm:p-6 border border-[#EFE3EE] shadow-[0_8px_30px_rgba(140,80,120,0.05)] space-y-3.5 sm:space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h2 className="font-serif text-base sm:text-lg font-bold text-[#2A162B] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#9E4875]" />
                  <span>7-Day Mood Trajectory</span>
                </h2>
                <p className="text-[10px] sm:text-[11px] text-[#8C728C]">
                  {sevenDayAvg !== null
                    ? `Average: ${trajectoryDescriptor} (${sevenDayAvg.toFixed(1)} / 5.0 across ${loggedDays.length} active ${loggedDays.length === 1 ? 'day' : 'days'})`
                    : 'Log your mood below to begin plotting your 7-day pattern'}
                </p>
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold bg-[#F9EFF6] text-[#9E4875] border border-[#ECDDEC] px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-2xs">
                {badgeLabel}
              </span>
            </div>

            {/* Clear, Working 7-Day Bar Chart */}
            <div className="flex items-end justify-between gap-1.5 sm:gap-2.5 pt-3 sm:pt-4 h-36 sm:h-40 px-0.5 sm:px-1 border-b border-[#F5EAF4] pb-2">
              {last7Days.map((item, idx) => {
                const hasScore = item.hasEntry && item.score !== null;
                const scoreValue = item.score ?? 0;
                // Full score: (score/5)*100. Empty unlogged day: slight dashed placeholder bar so the axis remains clear
                const heightPercent = hasScore ? (scoreValue / 5) * 100 : 12;

                const barColors = [
                  '',
                  'bg-[#985873]', // 1: Depleted
                  'bg-[#E59A83]', // 2: Fragile
                  'bg-[#B08CC7]', // 3: Balanced
                  'bg-[#7E5785]', // 4: Grounded
                  'bg-[#A24874]', // 5: Joyful
                ];

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 sm:gap-1.5 h-full justify-end group">
                    <span
                      className={`text-[8px] sm:text-[9px] font-bold transition-opacity ${
                        hasScore ? 'text-[#8E738E]' : 'text-[#C9B8C9] opacity-60'
                      }`}
                    >
                      {hasScore ? `${scoreValue}/5` : '—'}
                    </span>
                    <div
                      title={
                        hasScore
                          ? `${item.dateStr}: ${item.label} (${scoreValue}/5 from ${item.logCount} check-in${item.logCount === 1 ? '' : 's'})`
                          : `${item.dateStr}: No reflections logged yet`
                      }
                      className={`w-full max-w-[34px] rounded-t-lg sm:rounded-t-xl transition-all duration-500 ${
                        hasScore
                          ? `${barColors[scoreValue]} shadow-xs hover:brightness-105`
                          : 'bg-[#F4EBF3] border border-dashed border-[#DFC8DE] opacity-50'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    ></div>
                    <span
                      className={`text-[9px] sm:text-[10px] font-semibold ${
                        hasScore ? 'text-[#5B395E] font-bold' : 'text-[#9F8A9F]'
                      }`}
                    >
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Insight Text */}
            <div className="text-[10px] sm:text-[11px] text-[#69486F] bg-[#FAF4F9] p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-[#EFE3EE] flex items-start gap-2 sm:gap-2.5">
              <Sparkles className="w-4 h-4 text-[#9E4875] shrink-0 mt-0.5" />
              <span>
                {loggedDays.length > 0 && lowestLoggedDay ? (
                  <>
                    Your most frequent emotional influence is <strong>{topTag}</strong>. Lowest reflection occurred on{' '}
                    <strong>{lowestLoggedDay.day}</strong> ({lowestLoggedDay.label}, {lowestLoggedDay.score}/5). Prioritizing a 20-minute afternoon rest block helps buffer evening fatigue.
                  </>
                ) : (
                  <>
                    Log your first mood reflection today using the buttons below to see your personalized 7-day emotional wave and root cause insights.
                  </>
                )}
              </span>
            </div>
          </section>
        </div>

        {/* Right Column (5 cols): Contextual Root Causes & Breathing Reset */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-6 sticky lg:top-20">
          {/* Contextual Root Causes Breakdown */}
          <section className="bg-white rounded-2xl sm:rounded-[32px] p-4 sm:p-6 border border-[#EFE3EE] shadow-[0_8px_30px_rgba(140,80,120,0.05)] space-y-3 sm:space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-serif text-base sm:text-lg font-bold text-[#2A162B] leading-tight">
                Root Cause &amp; Contextual Tagging
              </h2>
              {/* Filter Toggle: Compact, balanced pill */}
              <div
                role="group"
                aria-label="Root cause date range"
                className="inline-flex rounded-full bg-[#F5EAF4] p-0.5 border border-[#E6D4E5] shrink-0"
              >
                <button
                  type="button"
                  onClick={() => setRootCauseFilter('week')}
                  className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    rootCauseFilter === 'week'
                      ? 'bg-[#9E4875] text-white shadow-2xs'
                      : 'text-[#7D5E7F] hover:text-[#2A162B]'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>This Week</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRootCauseFilter('all')}
                  className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    rootCauseFilter === 'all'
                      ? 'bg-[#9E4875] text-white shadow-2xs'
                      : 'text-[#7D5E7F] hover:text-[#2A162B]'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  <span>All Time</span>
                </button>
              </div>
            </div>

            <p className="text-[10px] sm:text-[11px] text-[#866D87] leading-snug">
              {rootCauseFilter === 'week'
                ? `Influences recorded since Monday (${relevantMoodLogs.length} ${relevantMoodLogs.length === 1 ? 'check-in' : 'check-ins'} this week):`
                : `What influenced your emotional state most frequently across all ${relevantMoodLogs.length} check-ins:`}
            </p>

            {sortedTags.length > 0 ? (
              <div className="space-y-2 sm:space-y-2.5">
                {sortedTags.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#3C223E]">{item.tag}</span>
                      <span className="text-[10px] sm:text-[11px] text-[#8C728C]">
                        {item.count} {item.count === 1 ? 'check-in' : 'check-ins'} ({item.percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#F4E8F2] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#DF6385] to-[#7B4C7A] h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.percent}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5 sm:py-6 px-3 sm:px-4 bg-[#FAF4F9] rounded-xl sm:rounded-2xl border border-dashed border-[#EFE3EE] space-y-1">
                <p className="text-xs font-bold text-[#5B395E]">No tags logged this week yet</p>
                <p className="text-[10px] sm:text-[11px] text-[#8C728C]">
                  Select postpartum tags like <em>Baby&apos;s Feeding</em> or <em>Sleep Deprivation</em> in your daily check-in.
                </p>
              </div>
            )}
          </section>

          {/* Guided 1-Minute Reset Breathing */}
          <section className="bg-white rounded-2xl sm:rounded-[32px] p-4 sm:p-6 border border-[#EFE3EE] shadow-[0_8px_30px_rgba(140,80,120,0.05)] space-y-3 sm:space-y-4 text-center">
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold text-[#7E5785] uppercase tracking-wider">
              <Wind className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#9E4875]" />
              <span>NERVOUS SYSTEM REGULATION</span>
            </div>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#2A162B]">
              1-Minute Vagus Nerve Box Reset
            </h2>
            <p className="text-[11px] sm:text-xs text-[#7A617D] max-w-xs mx-auto">
              Calms the physiological startle response caused by infant crying or postpartum fatigue.
            </p>

            <div className="py-3 sm:py-4 flex flex-col items-center justify-center">
              <div
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all duration-1000 ${
                  breathingActive
                    ? breathPhase === 'Inhale'
                      ? 'scale-125 bg-[#F9E5EF] text-[#8C3A64] ring-8 ring-[#FADCE8]'
                      : breathPhase === 'Hold'
                      ? 'scale-110 bg-[#FAF1F7] text-[#7B4C7A] ring-4 ring-[#EFE0ED]'
                      : 'scale-95 bg-[#EBF5EF] text-[#366847] ring-8 ring-[#D8EEDF]'
                    : 'bg-[#F5EAF4] text-[#7A4B78]'
                }`}
              >
                <span className="font-bold text-xs uppercase tracking-wider">
                  {breathingActive ? breathPhase : 'Ready'}
                </span>
              </div>
            </div>

            <button
              onClick={breathingActive ? stopBreathing : startBreathing}
              className={`w-full py-2.5 sm:py-3 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer ${
                breathingActive
                  ? 'bg-[#F2DFE6] hover:bg-[#EACDD7] text-[#892B45]'
                  : 'plum-card text-white hover:opacity-95'
              }`}
            >
              {breathingActive ? 'Stop Breathing Exercise' : 'Start 1-Minute Breathing'}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
