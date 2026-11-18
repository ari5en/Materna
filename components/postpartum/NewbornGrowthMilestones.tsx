'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Baby, CheckCircle2, Edit3, Check, History, Trash2, ChevronRight, X } from 'lucide-react';
import { useMaterna } from '@/lib/context/MaternaContext';
import { calculatePostpartumAge } from '@/lib/utils';
import { BABY_52_WEEKS } from '@/lib/data/babyMilestones52';
import type { GrowthMeasurement } from '@/types/database';
import {
  type UnitSystem,
  weightFromLbs,
  lengthFromIn,
  weightToLbs,
  lengthToIn,
  weightUnitLabel,
  lengthUnitLabel,
  kgToLbs,
  lbsToKg,
  cmToIn,
  inToCm,
  round1,
} from '@/lib/units';

/**
 * Estimates an infant growth percentile (5th–99th) from the ratio between the
 * logged value and the WHO median for the baby's current week.
 * (Always computed with lbs / inches, so it does not depend on the unit shown.)
 */
function estimatePercentile(value: number | null | undefined, median: number, cv = 0.12): number | null {
  if (value === null || value === undefined || !Number.isFinite(value) || median <= 0) {
    return null;
  }
  const z = (value - median) / (median * cv);
  // Logistic approximation of standard normal CDF
  const cdf = 1 / (1 + Math.exp(-1.702 * z));
  return Math.min(99, Math.max(1, Math.round(cdf * 100)));
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

export function NewbornGrowthMilestones() {
  const {
    profile,
    isInitialized,
    growthMeasurements,
    addGrowthMeasurement,
    updateGrowthMeasurement,
    deleteGrowthMeasurement,
    toggleMilestone,
  } = useMaterna();
  const postData = calculatePostpartumAge(profile.baby_birth_date);
  const babyName = profile.baby_name || 'Baby';
  const currentWeek = Math.min(Math.max(postData.weeks || 6, 1), 52);

  const weekReference =
    BABY_52_WEEKS.find((w) => w.week === currentWeek) || BABY_52_WEEKS[5];

  // Unit toggle: cm / kg is the default
  const [unit, setUnit] = useState<UnitSystem>('metric');
  const isMetric = unit === 'metric';
  const wUnit = weightUnitLabel(unit);
  const lUnit = lengthUnitLabel(unit);

  // Stored values are always lbs / inches
  const latestLogged = growthMeasurements[0];
  const rawWeight = profile.baby_weight_lbs ?? latestLogged?.weight_lbs ?? null;
  const rawLength = profile.baby_length_in ?? latestLogged?.length_in ?? null;

  // What we show: converted logged value, or the reference value for this week
  const displayWeight =
    rawWeight !== null
      ? weightFromLbs(rawWeight, unit)
      : isMetric
      ? weekReference.weightKg
      : weekReference.weightLbs;
  const displayLength =
    rawLength !== null
      ? lengthFromIn(rawLength, unit)
      : isMetric
      ? weekReference.lengthCm
      : weekReference.lengthInches;

  const weightPct = estimatePercentile(rawWeight, weekReference.weightLbs, 0.13);
  const lengthPct = estimatePercentile(rawLength, weekReference.lengthInches, 0.04);

  const [isEditingStats, setIsEditingStats] = useState(false);
  const [isWeeklyFridayPrompt, setIsWeeklyFridayPrompt] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [weightInput, setWeightInput] = useState(String(displayWeight));
  const [lengthInput, setLengthInput] = useState(String(displayLength));

  // Weekly Friday 8:00 AM automatic pop-up check
  useEffect(() => {
    if (!isInitialized) return;

    const checkFridayGrowthPrompt = () => {
      const now = new Date();
      // Day 5 = Friday, hour >= 8 (8:00 AM local time onwards on Friday)
      if (now.getDay() !== 5 || now.getHours() < 8) return;

      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate()
      ).padStart(2, '0')}`;

      const alreadyLoggedToday = growthMeasurements.some((g) => g.measured_on === todayStr);
      const dismissedDate =
        typeof window !== 'undefined'
          ? localStorage.getItem('materna_friday_growth_prompt_date')
          : null;

      if (!alreadyLoggedToday && dismissedDate !== todayStr) {
        setWeightInput(String(displayWeight));
        setLengthInput(String(displayLength));
        setIsWeeklyFridayPrompt(true);
        setIsEditingStats(true);
      }
    };

    const initialTimer = setTimeout(checkFridayGrowthPrompt, 0);
    const interval = setInterval(checkFridayGrowthPrompt, 30000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [isInitialized, growthMeasurements, displayWeight, displayLength]);

  const closeUpdateModal = () => {
    if (isWeeklyFridayPrompt && typeof window !== 'undefined') {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate()
      ).padStart(2, '0')}`;
      localStorage.setItem('materna_friday_growth_prompt_date', todayStr);
    }
    setIsWeeklyFridayPrompt(false);
    setIsEditingStats(false);
  };

  // State for editing an individual history row inside the Growth Log History dialog
  const [editingGrowthId, setEditingGrowthId] = useState<string | null>(null);
  const [editDateInput, setEditDateInput] = useState('');
  const [editWeightInput, setEditWeightInput] = useState('');
  const [editLengthInput, setEditLengthInput] = useState('');

  const startEditHistoryRow = (g: GrowthMeasurement) => {
    setEditingGrowthId(g.id);
    setEditDateInput(g.measured_on);
    setEditWeightInput(
      g.weight_lbs != null ? String(weightFromLbs(g.weight_lbs, unit)) : String(displayWeight)
    );
    setEditLengthInput(
      g.length_in != null ? String(lengthFromIn(g.length_in, unit)) : String(displayLength)
    );
  };

  const handleSaveHistoryRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGrowthId) return;
    const w = parseFloat(editWeightInput);
    const l = parseFloat(editLengthInput);
    await updateGrowthMeasurement(editingGrowthId, {
      measured_on: editDateInput || undefined,
      weight_lbs: Number.isFinite(w) && w > 0 ? weightToLbs(w, unit) : undefined,
      length_in: Number.isFinite(l) && l > 0 ? lengthToIn(l, unit) : undefined,
    });
    setEditingGrowthId(null);
  };

  const completedMilestones = profile.completed_milestones || [];

  // Dynamically show the weekly milestones for the baby's current month
  const currentMonth = weekReference.month;
  const monthWeeks = BABY_52_WEEKS.filter((w) => w.month === currentMonth);
  const milestones = monthWeeks.map((w) => ({
    id: `w-${w.week}`,
    title: w.title,
    timing: `Week ${w.week} • ${w.category}`,
    desc: w.summary,
  }));

  const handleToggleMilestone = async (id: string, currentlyDone: boolean) => {
    await toggleMilestone(id);
    if (!currentlyDone && typeof window !== 'undefined') {
      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // Ignore confetti errors in non-canvas environments
      }
    }
  };

  // Switch units. If the form is open, convert what was already typed.
  const handleUnitChange = (next: UnitSystem) => {
    if (next === unit) return;
    if (isEditingStats) {
      const convert = (value: string, fn: (n: number) => number) => {
        const n = parseFloat(value);
        return Number.isFinite(n) ? String(round1(fn(n))) : value;
      };
      if (next === 'metric') {
        setWeightInput(convert(weightInput, lbsToKg));
        setLengthInput(convert(lengthInput, inToCm));
      } else {
        setWeightInput(convert(weightInput, kgToLbs));
        setLengthInput(convert(lengthInput, cmToIn));
      }
    }
    setUnit(next);
  };

  // Convert what the mother typed (kg / cm or lbs / in) back to lbs / in for the database
  const handleSaveStats = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weightInput);
    const l = parseFloat(lengthInput);
    await addGrowthMeasurement({
      weight_lbs: w ? weightToLbs(w, unit) : weekReference.weightLbs,
      length_in: l ? lengthToIn(l, unit) : weekReference.lengthInches,
    });
    closeUpdateModal();
  };

  return (
    <section className="hover-lift bg-white rounded-2xl sm:rounded-[32px] p-4 sm:p-6 border border-[#EFE3EE] shadow-[0_8px_30px_rgba(140,80,120,0.05)] space-y-3.5 sm:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#F5EAF4] text-[#7B4C7A] flex items-center justify-center shadow-2xs">
            <Baby className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
          <div>
            <div className="text-[9px] sm:text-[10px] font-bold tracking-wider text-[#8F7292] uppercase">
              MONTH {currentMonth} • WEEK {currentWeek} DEVELOPMENT
            </div>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#2A162B] leading-tight">
              {babyName}&apos;s Milestones
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Unit toggle: cm / kg first (default), in / lbs second */}
          <div className="flex items-center bg-[#F7EDF5] p-0.5 rounded-full border border-[#EBE0EC] text-[9px] sm:text-[10px] font-semibold">
            <button
              type="button"
              onClick={() => handleUnitChange('metric')}
              className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full transition-all cursor-pointer ${
                isMetric ? 'bg-white text-[#9E4875] shadow-2xs' : 'text-[#876888] hover:text-[#2A162B]'
              }`}
            >
              cm / kg
            </button>
            <button
              type="button"
              onClick={() => handleUnitChange('imperial')}
              className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full transition-all cursor-pointer ${
                !isMetric ? 'bg-white text-[#9E4875] shadow-2xs' : 'text-[#876888] hover:text-[#2A162B]'
              }`}
            >
              in / lbs
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setWeightInput(String(displayWeight));
              setLengthInput(String(displayLength));
              setIsEditingStats(true);
            }}
            className="text-[9px] sm:text-[10px] font-semibold bg-[#F5EAF3] hover:bg-[#EBDCE9] text-[#784776] px-2.5 sm:px-3 py-1 rounded-full shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Edit3 className="w-3 h-3" />
            <span>Update Growth</span>
          </button>
        </div>
      </div>

      {/* Weight & Length Stats Banner (Always visible) */}
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5 bg-[#FAF4F9] p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-[#EFE2EE]">
        <div className="text-center">
          <div className="text-[9px] sm:text-[10px] font-semibold text-[#8C728C]">Weight</div>
          <div className="font-serif text-sm sm:text-base font-bold text-[#2A162B]">
            {displayWeight} {wUnit}
          </div>
          <div className="text-[9px] text-[#9E4875] font-bold">
            {ordinal(weightPct ?? 50)} %ile
          </div>
        </div>
        <div className="text-center border-l border-[#E8D7E7]">
          <div className="text-[9px] sm:text-[10px] font-semibold text-[#8C728C]">Length</div>
          <div className="font-serif text-sm sm:text-base font-bold text-[#2A162B]">
            {displayLength} {lUnit}
          </div>
          <div className="text-[9px] text-[#9E4875] font-bold">
            {ordinal(lengthPct ?? 50)} %ile
          </div>
        </div>
      </div>

      {/* Pop-up Update Growth Dialog Modal */}
      {isEditingStats && (
        <div
          onClick={closeUpdateModal}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 sm:p-4"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSaveStats}
            className="bg-white rounded-2xl sm:rounded-[32px] max-w-sm w-full p-4 sm:p-6 border border-[#ECE0EC] shadow-2xl space-y-3.5 sm:space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-[#F2E8F1]">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#9E4875]">
                  {isWeeklyFridayPrompt
                    ? 'WEEKLY FRIDAY 8:00 AM CHECK-IN'
                    : `${babyName}'S GROWTH (${lUnit} / ${wUnit})`}
                </div>
                <h3 className="font-serif font-bold text-lg text-[#2A162B]">
                  {isWeeklyFridayPrompt ? `Update ${babyName}'s Weekly Growth` : 'Update Growth'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeUpdateModal}
                aria-label="Close update growth dialog"
                className="w-8 h-8 rounded-full bg-[#FAF4F9] hover:bg-[#F3E7F2] text-[#6B466D] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isWeeklyFridayPrompt && (
              <p className="text-xs text-[#7A617D] bg-[#FAF4F9] p-3 rounded-2xl border border-[#EFE2EE] leading-relaxed">
                Happy Friday! Log {babyName}&apos;s latest weight and length for Week {currentWeek} to keep growth percentiles up to date.
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#664969] block mb-1.5">
                  Weight ({wUnit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF5FA] border border-[#E5D5E4] text-sm font-bold text-[#2A162B] focus:outline-hidden focus:ring-1 focus:ring-[#9E4875]"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#664969] block mb-1.5">
                  Length ({lUnit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={lengthInput}
                  onChange={(e) => setLengthInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#FAF5FA] border border-[#E5D5E4] text-sm font-bold text-[#2A162B] focus:outline-hidden focus:ring-1 focus:ring-[#9E4875]"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={closeUpdateModal}
                className="flex-1 py-2.5 rounded-full bg-[#F5EAF3] hover:bg-[#EBDCE9] text-[#5C3E60] font-bold text-xs transition-colors cursor-pointer"
              >
                {isWeeklyFridayPrompt ? 'Remind Later' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-full bg-[#9E4875] hover:bg-[#8B3B64] text-white text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Growth</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Trigger button for Pop-up Growth History Dialog */}
      <div>
        <button
          type="button"
          onClick={() => {
            setEditingGrowthId(null);
            setShowHistory(true);
          }}
          className="w-full flex items-center justify-between text-[11px] font-bold text-[#7B5D7E] hover:text-[#2A162B] px-1 py-1 cursor-pointer transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-[#9E4875]" />
            <span>Growth Log History ({growthMeasurements.length})</span>
          </span>
          <span className="flex items-center gap-1 text-[10px] text-[#9E4875]">
            <span>View &amp; Edit</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </button>
      </div>

      {/* Pop-up Growth History Dialog Modal */}
      {showHistory && (
        <div
          onClick={() => {
            setEditingGrowthId(null);
            setShowHistory(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-[32px] max-w-md w-full p-4 sm:p-6 border border-[#ECE0EC] shadow-2xl space-y-3.5 sm:space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-[#F2E8F1]">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#9E4875]">
                  {babyName}&apos;S PEDIATRIC RECORDS ({lUnit} / {wUnit})
                </div>
                <h3 className="font-serif font-bold text-lg text-[#2A162B]">
                  Growth Log History
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingGrowthId(null);
                  setShowHistory(false);
                }}
                aria-label="Close growth history dialog"
                className="w-8 h-8 rounded-full bg-[#FAF4F9] hover:bg-[#F3E7F2] text-[#6B466D] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {growthMeasurements.length === 0 ? (
              <p className="text-xs text-[#8C728C] text-center py-6">
                No growth measurements logged yet. Tap &ldquo;Update Growth&rdquo; to log {babyName}&apos;s weight and length.
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {growthMeasurements.slice(0, 25).map((g) => {
                  const isEditingThis = editingGrowthId === g.id;
                  return (
                    <div
                      key={g.id}
                      className="bg-[#FAF5FA] p-3 rounded-2xl border border-[#EFE2EE] text-xs space-y-2.5"
                    >
                      {isEditingThis ? (
                        <form onSubmit={handleSaveHistoryRow} className="space-y-2.5">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] font-semibold text-[#8C728C] block mb-1">
                                Date
                              </label>
                              <input
                                type="date"
                                value={editDateInput}
                                onChange={(e) => setEditDateInput(e.target.value)}
                                className="w-full px-2 py-1.5 rounded-xl bg-white border border-[#E5D5E4] text-[11px] font-semibold text-[#2A162B]"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-[#8C728C] block mb-1">
                                Weight ({wUnit})
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                value={editWeightInput}
                                onChange={(e) => setEditWeightInput(e.target.value)}
                                className="w-full px-2 py-1.5 rounded-xl bg-white border border-[#E5D5E4] text-[11px] font-bold text-[#2A162B]"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-[#8C728C] block mb-1">
                                Length ({lUnit})
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                value={editLengthInput}
                                onChange={(e) => setEditLengthInput(e.target.value)}
                                className="w-full px-2 py-1.5 rounded-xl bg-white border border-[#E5D5E4] text-[11px] font-bold text-[#2A162B]"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingGrowthId(null)}
                              className="px-3 py-1 rounded-full border border-[#E5D5E4] bg-white text-[10px] font-semibold text-[#6B466D] cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-3.5 py-1 rounded-full bg-[#9E4875] hover:bg-[#8B3B64] text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              <span>Save</span>
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[#2A162B] font-bold">
                              {g.weight_lbs != null ? weightFromLbs(g.weight_lbs, unit) : '—'} {wUnit} •{' '}
                              {g.length_in != null ? lengthFromIn(g.length_in, unit) : '—'} {lUnit}
                            </div>
                            <div className="text-[10px] text-[#8C728C] font-medium">
                              Measured on {g.measured_on}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => startEditHistoryRow(g)}
                              className="px-2.5 py-1 rounded-full bg-white hover:bg-[#F3E7F2] border border-[#E5D5E4] text-[10px] font-bold text-[#784776] flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteGrowthMeasurement(g.id)}
                              aria-label="Delete measurement"
                              className="p-1.5 rounded-full text-[#A888AA] hover:text-[#C93B63] hover:bg-[#FFF2F5] transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setEditingGrowthId(null);
                setShowHistory(false);
              }}
              className="w-full py-2.5 rounded-full bg-[#F5EAF3] hover:bg-[#EBDCE9] text-[#5C3E60] font-bold text-xs transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Checklist items */}
      <div className="space-y-2">
        {milestones.map((item) => {
          const isDone = completedMilestones.includes(item.id);
          return (
            <div
              key={item.id}
              onClick={() => handleToggleMilestone(item.id, isDone)}
              className={`p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 sm:gap-3 ${
                isDone
                  ? 'bg-[#F9EFF6] border-[#EBD6E9]'
                  : 'bg-white border-[#EDE0EC] hover:bg-[#FAF4F9]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  isDone
                    ? 'bg-[#9E4875] text-white'
                    : 'border-2 border-[#D8C2D8] text-transparent'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`text-[11px] sm:text-xs font-bold ${
                      isDone ? 'text-[#875578] line-through opacity-85' : 'text-[#2A162B]'
                    }`}
                  >
                    {item.title}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-semibold text-[#876888] bg-white px-2 py-0.5 rounded-full border border-[#EBE0EC] shrink-0">
                    {item.timing}
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-[#7E6580] mt-0.5 leading-snug">
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
