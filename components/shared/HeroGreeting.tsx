'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Ruler,
  Scale,
  Sparkles,
  Heart,
} from 'lucide-react';
import { useMaterna } from '@/lib/context/MaternaContext';
import { calculatePostpartumAge } from '@/lib/utils';
import { BABY_52_WEEKS } from '@/lib/data/babyMilestones52';

export function HeroGreeting() {
  const { profile, growthMeasurements } = useMaterna();
  const postData = calculatePostpartumAge(profile.baby_birth_date);
  const babyName = profile.baby_name || 'Baby';
  const currentWeek = Math.min(Math.max(postData.weeks || 1, 1), 52);

  const [unitSystem, setUnitSystem] = useState<'imperial' | 'metric'>('metric');

  const activeMilestone =
    BABY_52_WEEKS.find((w) => w.week === currentWeek) ||
    BABY_52_WEEKS[0];

  const latestLogged = growthMeasurements[0];
  const rawLengthIn = profile.baby_length_in ?? latestLogged?.length_in ?? null;
  const rawWeightLbs = profile.baby_weight_lbs ?? latestLogged?.weight_lbs ?? null;

  const displayLength =
    unitSystem === 'imperial'
      ? `${rawLengthIn !== null ? Number(rawLengthIn.toFixed(1)) : activeMilestone.lengthInches} in`
      : `${rawLengthIn !== null ? Number((rawLengthIn * 2.54).toFixed(1)) : activeMilestone.lengthCm} cm`;

  const displayWeight =
    unitSystem === 'imperial'
      ? `${rawWeightLbs !== null ? Number(rawWeightLbs.toFixed(1)) : activeMilestone.weightLbs} lbs`
      : `${rawWeightLbs !== null ? Number((rawWeightLbs * 0.45359237).toFixed(1)) : activeMilestone.weightKg} kg`;

  return (
    <section className="bg-gradient-to-br from-[#F5EEFA] via-white to-[#FFF2E8] rounded-[32px] border border-[#EFE3EE] p-5 sm:p-7 shadow-[0_8px_30px_rgba(140,80,120,0.05)]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column (5 cols): Baby Illustration */}
        <div className="lg:col-span-5 flex flex-col items-center text-center">
          <div className="relative group flex items-center justify-center">
            {/* Deep purple ambient glow behind the baby */}
            <div className="B-glow absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-[#5B2A6E]/35 blur-2xl pointer-events-none" />

            <div className="w-72 h-64 sm:w-[336px] sm:h-72 relative z-10">
              <Image
                src="/images/baby-illustration.png"
                alt={`Baby ${babyName} at Week ${activeMilestone.week} - ${activeMilestone.title}`}
                fill
                sizes="(max-width: 640px) 288px, 336px"
                className="object-contain transition-transform duration-500 group-hover:scale-105"
                priority
                unoptimized
              />
            </div>

            {/* Week Badge overlay */}
            <div className="absolute top-0 right-2 z-20 bg-[#9E4875] text-white px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
              <Sparkles className="w-3 h-3 fill-current" />
              <span>Week {activeMilestone.week}</span>
            </div>
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

          {/* Baby Size Measurements Cards (Length & Weight) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Stat 1: Length */}
            <div className="bg-white/75 backdrop-blur-xs rounded-2xl p-3.5 border border-white/80 text-center space-y-1 shadow-2xs">
              <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-[#8A6A8A]">
                <Ruler className="w-3.5 h-3.5 text-[#9E4875]" />
                <span>Length</span>
              </div>
              <div className="font-serif text-lg sm:text-xl font-bold text-[#2A162B]">
                {displayLength}
              </div>
              <div className="text-[10px] font-bold text-[#9E4875]">
                {rawLengthIn !== null ? 'Logged' : `Wk ${activeMilestone.week} Avg`}
              </div>
            </div>

            {/* Stat 2: Weight */}
            <div className="bg-white/75 backdrop-blur-xs rounded-2xl p-3.5 border border-white/80 text-center space-y-1 shadow-2xs">
              <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-[#8A6A8A]">
                <Scale className="w-3.5 h-3.5 text-[#9E4875]" />
                <span>Weight</span>
              </div>
              <div className="font-serif text-lg sm:text-xl font-bold text-[#2A162B]">
                {displayWeight}
              </div>
              <div className="text-[10px] font-bold text-[#9E4875]">
                {rawWeightLbs !== null ? 'Logged' : `Wk ${activeMilestone.week} Avg`}
              </div>
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

          {/* Dynamic 1st Year Journey Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] font-semibold text-[#7E6181]">
              <span>1st Year Journey ({babyName})</span>
              <span>
                Week {currentWeek} of 52 · {postData.totalDays} Days ({Math.round((currentWeek / 52) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-[#EFE2EE] h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#C26296] to-[#9E4875] h-full rounded-full transition-all duration-700"
                style={{ width: `${(currentWeek / 52) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
