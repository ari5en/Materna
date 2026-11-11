'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Baby,
  Ruler,
  Scale,
  Sparkles,
  Heart,
  ChevronRight,
  Check,
  CheckCircle2,
  Calendar,
  Volume2,
  Info,
  Grid,
  Layers,
  ArrowRight,
  PartyPopper,
} from 'lucide-react';
import { useMaterna } from '@/lib/context/MaternaContext';
import { calculatePostpartumAge } from '@/lib/utils';
import { LotusIcon } from './LotusIcon';
import { BABY_52_WEEKS, BabyMilestoneWeek } from '@/lib/data/babyMilestones52';

export function HeroGreeting() {
  const { profile } = useMaterna();
  const postData = calculatePostpartumAge(profile.baby_birth_date);
  const babyName = profile.baby_name || 'Baby';
  const currentWeek = Math.min(Math.max(postData.weeks || 6, 1), 52);

  // States
  const [selectedWeek, setSelectedWeek] = useState<number>(currentWeek);
  const [activeMonth, setActiveMonth] = useState<number>(2); // Default Month 2 (covers Week 6)
  const [unitSystem, setUnitSystem] = useState<'imperial' | 'metric'>('metric'); // cm / kg by default
  const [viewMode, setViewMode] = useState<'month' | 'all'>('month');
  const [celebrated, setCelebrated] = useState(false);
  const [todayFormatted, setTodayFormatted] = useState('Today, Sun, Nov 1, 2026');

  // Hydration-safe date
  useEffect(() => {
    try {
      const formatted = new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date());
      setTodayFormatted(`Today, ${formatted}`);
    } catch {
      // fallback
    }
  }, []);

  // Update active month when current week changes
  useEffect(() => {
    const found = BABY_52_WEEKS.find((w) => w.week === currentWeek);
    if (found) {
      setActiveMonth(found.month);
      setSelectedWeek(found.week);
    }
  }, [currentWeek]);

  // Selected milestone object
  const activeMilestone =
    BABY_52_WEEKS.find((w) => w.week === selectedWeek) ||
    BABY_52_WEEKS.find((w) => w.week === 6) ||
    BABY_52_WEEKS[0];

  // Confetti effect
  const handleCelebrate = async () => {
    setCelebrated(true);
    try {
      const confetti = (await import('canvas-confetti')).default;
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#9E4875', '#E8B4CB', '#69486F', '#FFD8E2', '#FFE5CC'],
      });
    } catch {
      // ignore
    }
    setTimeout(() => setCelebrated(false), 3000);
  };

  // Month navigation
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const filteredWeeks =
    viewMode === 'all'
      ? BABY_52_WEEKS
      : BABY_52_WEEKS.filter((w) => w.month === activeMonth);

  return (
    <section className="bg-gradient-to-b from-[#FFE7DE] via-[#FCE4EF] to-white rounded-[32px] p-5 sm:p-8 border border-[#EFE3EE] shadow-[0_12px_40px_rgba(140,80,120,0.06)] relative overflow-hidden space-y-7">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full bg-[#FFDCCE]/45 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-72 h-72 rounded-full bg-[#EAD7F6]/45 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-64 h-64 rounded-full bg-[#FFF0E8]/50 blur-3xl pointer-events-none" />

      {/* Header Emblem & Date Badge */}
      <div className="flex flex-col items-center text-center space-y-2.5 relative z-10">
        <div className="w-12 h-12 rounded-full bg-white/90 border border-[#F0DFEC] shadow-2xs text-[#7B4C7A] flex items-center justify-center hover:scale-105 transition-transform">
          <LotusIcon className="w-7 h-7" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/85 border border-[#EFE1ED] text-[11px] font-semibold text-[#8B658A] shadow-2xs">
          <span>{todayFormatted}</span>
        </div>
      </div>

      {/* Editorial Title & Subtitle Matching Reference Poster */}
      <div className="text-center space-y-2 relative z-10 max-w-2xl mx-auto">
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-normal tracking-tight text-[#2A162B] leading-tight">
          From Newborn to One
        </h1>
        <p className="text-sm sm:text-base text-[#7D607E] font-medium flex items-center justify-center gap-1.5">
          <span>52 weeks of growing, learning, and becoming you</span>
          <span className="text-[#9E4875] animate-pulse">♡</span>
        </p>
        <p className="text-xs text-[#8B668C] pt-0.5">
          Welcome back, {profile.full_name || 'Mama'} · Baby {babyName} is {currentWeek} weeks old (Month {activeMilestone.month})
        </p>
      </div>

      {/* SECTION 1: Baby Size Tracker & Current Spotlight Card */}
      <div className="relative z-10 bg-white/85 backdrop-blur-md rounded-[28px] border border-[#EFE2EE] p-5 sm:p-7 shadow-[0_8px_30px_rgba(140,80,120,0.04)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column (5 cols): Week 6 Baby Illustration & Quick Size Badge */}
          <div className="lg:col-span-5 flex flex-col items-center text-center space-y-3.5">
            <div className="relative group">
              <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-[26px] overflow-hidden border-3 border-[#F7E6F3] shadow-lg relative bg-gradient-to-b from-[#FFF2EA] to-[#FDE7F2]">
                <Image
                  src="/images/baby_cooing_week6.jpg"
                  alt={`Baby ${babyName} at Week ${activeMilestone.week} - ${activeMilestone.title}`}
                  fill
                  sizes="(max-width: 640px) 192px, 224px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority
                />
              </div>

              {/* Week Badge overlay */}
              <div className="absolute -top-2.5 -right-2.5 bg-[#9E4875] text-white px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                <Sparkles className="w-3 h-3 fill-current" />
                <span>Week {activeMilestone.week}</span>
              </div>

              {/* Status Indicator */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white/95 text-[#6B466D] px-3 py-0.5 rounded-full text-[10px] font-bold border border-[#EFE0EC] shadow-2xs whitespace-nowrap">
                {activeMilestone.week === currentWeek ? '🌟 Current Milestone' : `Week ${activeMilestone.week} Guide`}
              </div>
            </div>

            {/* Size Comparison Fruit / Object Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-[#FFF0E8] to-[#FFE7F0] border border-[#F3DFEB] text-[#69486F] text-xs sm:text-sm font-semibold shadow-2xs">
              <span className="text-base">🍈</span>
              <span>
                About the size of a <strong className="text-[#9E4875]">{activeMilestone.sizeObject}</strong>
              </span>
            </div>
          </div>

          {/* Right Column (7 cols): Physical Metrics & Developmental Stage */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F2E5F1] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E4875]">
                  MONTH {activeMilestone.month} · {activeMilestone.category} DEVELOPMENT
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#2A162B] leading-tight">
                  {activeMilestone.title}
                </h2>
              </div>

              {/* Unit Toggle: Metric (default) first, then Imperial */}
              <div className="flex items-center bg-[#F7EDF5] p-0.5 rounded-full border border-[#EBE0EC] text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setUnitSystem('metric')}
                  className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                    unitSystem === 'metric'
                      ? 'bg-white text-[#9E4875] shadow-2xs'
                      : 'text-[#876888] hover:text-[#2A162B]'
                  }`}
                >
                  cm / kg
                </button>
                <button
                  type="button"
                  onClick={() => setUnitSystem('imperial')}
                  className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                    unitSystem === 'imperial'
                      ? 'bg-white text-[#9E4875] shadow-2xs'
                      : 'text-[#876888] hover:text-[#2A162B]'
                  }`}
                >
                  in / lbs
                </button>
              </div>
            </div>

            {/* Baby Size Measurements Cards */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {/* Stat 1: Length */}
              <div className="bg-[#FAF4F9] rounded-2xl p-3 border border-[#EFE1ED] text-center space-y-1">
                <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-[#8A6A8A]">
                  <Ruler className="w-3.5 h-3.5 text-[#9E4875]" />
                  <span>Length</span>
                </div>
                <div className="font-serif text-lg sm:text-xl font-bold text-[#2A162B]">
                  {unitSystem === 'imperial'
                    ? `${activeMilestone.lengthInches} in`
                    : `${activeMilestone.lengthCm} cm`}
                </div>
                <div className="text-[10px] font-bold text-[#9E4875]">72nd %ile</div>
              </div>

              {/* Stat 2: Weight */}
              <div className="bg-[#FAF4F9] rounded-2xl p-3 border border-[#EFE1ED] text-center space-y-1">
                <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-[#8A6A8A]">
                  <Scale className="w-3.5 h-3.5 text-[#9E4875]" />
                  <span>Weight</span>
                </div>
                <div className="font-serif text-lg sm:text-xl font-bold text-[#2A162B]">
                  {unitSystem === 'imperial'
                    ? `${activeMilestone.weightLbs} lbs`
                    : `${activeMilestone.weightKg} kg`}
                </div>
                <div className="text-[10px] font-bold text-[#9E4875]">65th %ile</div>
              </div>

              {/* Stat 3: Head Circumference */}
              <div className="bg-[#FAF4F9] rounded-2xl p-3 border border-[#EFE1ED] text-center space-y-1">
                <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-[#8A6A8A]">
                  <Baby className="w-3.5 h-3.5 text-[#9E4875]" />
                  <span>Head Circ.</span>
                </div>
                <div className="font-serif text-lg sm:text-xl font-bold text-[#2A162B]">
                  {unitSystem === 'imperial'
                    ? `${activeMilestone.headCircInches} in`
                    : `${activeMilestone.headCircCm} cm`}
                </div>
                <div className="text-[10px] font-bold text-[#9E4875]">58th %ile</div>
              </div>
            </div>

            {/* Milestone Summary & Parent Insight */}
            <div className="space-y-2 text-xs sm:text-sm text-[#5D4260] leading-relaxed">
              <p>{activeMilestone.summary}</p>
              <div className="p-3 rounded-2xl bg-[#FFF6EE] border border-[#FBE3D4] flex items-start gap-2.5 text-xs text-[#7A4B29]">
                <Heart className="w-4 h-4 text-[#D96B27] shrink-0 mt-0.5 fill-current" />
                <p>
                  <strong className="text-[#8F3E15]">Parent tip:</strong> {activeMilestone.parentTip}
                </p>
              </div>
            </div>

            {/* Action Bar: Celebrate & Month Progress */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="space-y-1 flex-1 min-w-[180px]">
                <div className="flex justify-between text-[11px] font-semibold text-[#7E6181]">
                  <span>1st Year Journey</span>
                  <span>{currentWeek} / 52 Weeks ({Math.round((currentWeek / 52) * 100)}%)</span>
                </div>
                <div className="w-full bg-[#EFE2EE] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#C26296] to-[#9E4875] h-full rounded-full transition-all duration-700"
                    style={{ width: `${(currentWeek / 52) * 100}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleCelebrate}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#9E4875] hover:bg-[#8B3B66] text-white text-xs font-semibold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <PartyPopper className="w-3.5 h-3.5" />
                <span>{celebrated ? 'Milestone Celebrated! 🎉' : `Celebrate Week ${activeMilestone.week} ♡`}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: 52-Week Progress & Milestone Explorer (Reference Chart from Image 2) */}
      <div className="relative z-10 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8F6890]">
              52 WEEKS PROGRESS TIMELINE
            </span>
            <span className="text-[10px] font-semibold bg-[#F7EDF5] text-[#9E4875] px-2.5 py-0.5 rounded-full border border-[#EDE0EC]">
              Reference Guide
            </span>
          </div>

          {/* View Mode Toggle: Single Month vs Full 52 Weeks */}
          <div className="flex items-center gap-1 bg-white/80 p-1 rounded-full border border-[#EAE0EB] text-[11px] font-semibold text-[#7E6181]">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'month'
                  ? 'bg-[#9E4875] text-white shadow-2xs'
                  : 'hover:text-[#2A162B]'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Month View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'all'
                  ? 'bg-[#9E4875] text-white shadow-2xs'
                  : 'hover:text-[#2A162B]'
              }`}
            >
              <Grid className="w-3 h-3" />
              <span>All 52 Weeks</span>
            </button>
          </div>
        </div>

        {/* Month Pills Strip (Only in Month view) */}
        {viewMode === 'month' && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {months.map((m) => {
              const isSelected = activeMonth === m;
              const hasCurrentWeek =
                BABY_52_WEEKS.some((w) => w.month === m && w.week === currentWeek);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setActiveMonth(m);
                    // Select first week of this month
                    const firstWeekOfMonth = BABY_52_WEEKS.find((w) => w.month === m);
                    if (firstWeekOfMonth) setSelectedWeek(firstWeekOfMonth.week);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-[#69486F] text-white shadow-sm scale-105'
                      : 'bg-white/80 hover:bg-white text-[#785E7B] border border-[#ECE0EC]'
                  }`}
                >
                  <span>Month {m}</span>
                  {hasCurrentWeek && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E57697] inline-block ml-1 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Milestone Cards Track (Matching the 4-cards-per-month style from Image 2) */}
        <div
          className={`grid gap-3.5 ${
            viewMode === 'month'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
          }`}
        >
          {filteredWeeks.map((item) => {
            const isSelected = selectedWeek === item.week;
            const isPast = item.week < currentWeek;
            const isCurrent = item.week === currentWeek;

            return (
              <div
                key={item.week}
                onClick={() => setSelectedWeek(item.week)}
                className={`rounded-[22px] p-4 border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative group ${
                  isSelected
                    ? 'bg-white border-[#C26296] ring-2 ring-[#C26296]/30 shadow-md scale-[1.02]'
                    : isCurrent
                    ? 'bg-gradient-to-b from-[#FFF5F8] to-white border-[#E8B4CB] shadow-sm'
                    : 'bg-white/90 border-[#ECE0EC] hover:border-[#D5BCD3] hover:shadow-2xs'
                }`}
              >
                {/* Top Row: Week Label & Status Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#4B304D]">Week {item.week}</span>
                  {isPast ? (
                    <span className="w-5 h-5 rounded-full bg-[#E9F5EB] text-[#2E7D32] flex items-center justify-center text-[10px]">
                      <Check className="w-3 h-3" />
                    </span>
                  ) : isCurrent ? (
                    <span className="px-2 py-0.5 rounded-full bg-[#9E4875] text-white text-[9px] font-bold shadow-2xs animate-pulse">
                      Now
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#A68BA7] font-medium">M{item.month}</span>
                  )}
                </div>

                {/* Milestone Title matching Image 2 */}
                <div className="space-y-1">
                  <h4 className="font-serif text-sm font-semibold text-[#2A162B] line-clamp-2 leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-[#8C6D8E] flex items-center gap-1">
                    <span>{item.sizeObject}</span>
                  </p>
                </div>

                {/* Bottom Metric Snippet */}
                <div className="pt-2 border-t border-[#F5EAF4] flex items-center justify-between text-[10px] text-[#876587]">
                  <span>
                    {unitSystem === 'imperial'
                      ? `${item.lengthInches}" · ${item.weightLbs} lbs`
                      : `${item.lengthCm} cm · ${item.weightKg} kg`}
                  </span>
                  <ChevronRight className="w-3 h-3 text-[#A888AA] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note directly from Image 2 */}
        <div className="pt-2 text-center">
          <p className="text-xs text-[#8A6A8C] italic flex items-center justify-center gap-1.5 font-serif">
            <span className="text-[#9E4875] not-italic">♡</span>
            <span>Every baby develops at their own pace. Milestones are a general guide.</span>
            <span className="text-[#9E4875] not-italic">♡</span>
          </p>
        </div>
      </div>
    </section>
  );
}