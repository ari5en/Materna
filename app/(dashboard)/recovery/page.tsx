'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  HeartPulse, 
  Utensils, 
  Droplets, 
  Sparkles, 
  CheckCircle2, 
  Activity, 
  ShieldCheck, 
  History,
  ChevronRight,
  X,
  Compass,
} from 'lucide-react';
import { useMaterna } from '@/lib/context/MaternaContext';
import { calculatePostpartumAge } from '@/lib/utils';
import { LotusIcon } from '@/components/shared/LotusIcon';
import { getMaternalRecoveryPhase, MATERNAL_RECOVERY_PHASES } from '@/lib/data/maternalRecovery52';

export default function RecoveryPage() {
  const {
    profile,
    recoveryLog,
    recoveryHistory,
    updateWaterGlasses,
    toggleRecoveryExercise,
    setIsAiChatOpen,
  } = useMaterna();

  const postData = calculatePostpartumAge(profile.baby_birth_date);
  const [activeTab, setActiveTab] = useState<'physical' | 'nutrition'>('physical');
  const [showRecoveryHistory, setShowRecoveryHistory] = useState(false);
  const activeStageRef = useRef<HTMLDivElement | null>(null);

  const waterGlasses = recoveryLog.water_glasses ?? 0;
  const completedExercises = recoveryLog.completed_exercises ?? [];

  // Dynamic recovery phase calibrated across the 52-week continuum
  const currentPhase = getMaternalRecoveryPhase(postData.weeks);
  const recoveryMilestones = currentPhase.checkpoints;
  const exercises = currentPhase.exercises;
  const nutritionCategories = currentPhase.nutrition;

  // Auto-scroll to active stage on mobile when loaded
  useEffect(() => {
    if (activeStageRef.current) {
      activeStageRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentPhase.stageNumber]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Recovery Hub Header */}
      <section className="bg-gradient-to-br from-[#FFE8DE] via-[#FCE4EF] to-white rounded-2xl sm:rounded-[32px] p-4 sm:p-8 border border-[#EFE3EE] shadow-[0_8px_30px_rgba(140,80,120,0.06)] space-y-3.5 sm:space-y-4">
        <div className="flex items-start justify-between gap-3 sm:gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-[#8F7292] uppercase tracking-wider">
              <LotusIcon className="w-4 h-4 text-[#9E4875]" />
              <span>MATERNAL RECOVERY HUB</span>
            </div>
            <h1 className="font-serif text-xl sm:text-3xl font-bold text-[#2A162B]">
              Week {postData.weeks} Postpartum Healing
            </h1>
            <p className="text-xs sm:text-sm text-[#7D607E] max-w-xl">
              {currentPhase.tagline}
            </p>
          </div>
          <div className="flex flex-col sm:items-end gap-1 sm:gap-1.5 shrink-0">
            <span className="text-[9px] sm:text-[10px] font-bold bg-white text-[#9E4875] border border-[#EFE0ED] px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-2xs">
              {currentPhase.recoveryStageLabel}
            </span>
            <span className="text-[9px] sm:text-[10px] text-[#866D87] font-semibold">
              Stage {currentPhase.stageNumber} of 4 • {currentPhase.weekRangeLabel}
            </span>
          </div>
        </div>

        {/* 4-Stage Visual Timeline Stepper (Scrollable left-to-right on mobile) */}
        <div className="pt-1 sm:pt-2">
          <div className="flex sm:grid sm:grid-cols-4 gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-1.5 -mx-1 px-1 sm:mx-0 sm:px-0 snap-x">
            {MATERNAL_RECOVERY_PHASES.map((p) => {
              const isCurrent = p.stageNumber === currentPhase.stageNumber;
              const isPast = p.stageNumber < currentPhase.stageNumber;
              return (
                <div
                  key={p.stageNumber}
                  ref={isCurrent ? activeStageRef : undefined}
                  className={`min-w-[200px] sm:min-w-0 flex-1 sm:flex-initial p-2.5 rounded-xl sm:rounded-2xl border transition-all text-left shrink-0 sm:shrink snap-start ${
                    isCurrent
                      ? 'bg-white border-[#E5BED6] shadow-xs ring-1 ring-[#9E4875]/30'
                      : isPast
                      ? 'bg-white/60 border-[#EFE2EE] opacity-80'
                      : 'bg-[#F9EFF6]/40 border-dashed border-[#E8D4E5] opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between text-[9px] sm:text-[10px] mb-1">
                    <span className="font-bold text-[#8B6E8D]">Stage {p.stageNumber}</span>
                    <span
                      className={`text-[8px] sm:text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                        isCurrent
                          ? 'bg-[#9E4875] text-white'
                          : isPast
                          ? 'bg-[#E7F3EB] text-[#2F6B48]'
                          : 'bg-[#ECE0EB] text-[#7A617D]'
                      }`}
                    >
                      {isCurrent ? 'Current' : isPast ? 'Completed' : 'Upcoming'}
                    </span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-bold text-[#2A162B] truncate">{p.stageName}</div>
                  <div className="text-[9px] sm:text-[10px] text-[#8C728C] mt-0.5">{p.weekRangeLabel}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-[#F3E7F2] p-1 sm:p-1.5 rounded-xl sm:rounded-2xl max-w-md pt-1.5 sm:pt-2">
          <button
            onClick={() => setActiveTab('physical')}
            className={`flex-1 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'physical'
                ? 'bg-[#9E4875] text-white shadow-2xs'
                : 'text-[#7B617D] hover:text-[#2A162B]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Physical &amp; Pelvic Floor</span>
          </button>
          <button
            onClick={() => setActiveTab('nutrition')}
            className={`flex-1 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'nutrition'
                ? 'bg-[#9E4875] text-white shadow-2xs'
                : 'text-[#7B617D] hover:text-[#2A162B]'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Nutrition &amp; Lactation</span>
          </button>
        </div>
      </section>

      {/* Tab 1: Physical Recovery & Pelvic Floor */}
      {activeTab === 'physical' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
          {/* Recovery Checkpoints */}
          <section className="bg-white rounded-2xl sm:rounded-[32px] p-4 sm:p-6 border border-[#EFE3EE] shadow-[0_8px_30px_rgba(140,80,120,0.05)] space-y-3.5 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-base sm:text-lg font-bold text-[#2A162B] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#9E4875]" />
                <span>Bodily Recovery Status</span>
              </h2>
              <span className="text-[9px] sm:text-[10px] text-[#8E738E] font-semibold bg-[#FAF4F9] px-2 sm:px-2.5 py-0.5 rounded-full border border-[#EFE2EE]">
                Week {postData.weeks} Checkpoint
              </span>
            </div>

            <div className="space-y-3">
              {recoveryMilestones.map((item, idx) => (
                <div key={idx} className="bg-[#FAF4F9] p-4 rounded-2xl border border-[#EFE3EE] space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#2A162B]">{item.title}</span>
                    <span className="text-[10px] font-bold bg-white text-[#9E4875] px-2 py-0.5 rounded-full border border-[#EBD6E8] shrink-0">
                      {item.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#78617B] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="pt-1 flex items-center gap-2 text-[11px] text-[#8C728C] bg-[#FAF5F9] p-3 rounded-2xl border border-[#EFE3EE]">
              <Compass className="w-4 h-4 text-[#9E4875] shrink-0" />
              <span>
                Calibrated to <strong>{currentPhase.stageName}</strong> ({currentPhase.weekRangeLabel}). Checkpoints adapt automatically as your recovery weeks progress.
              </span>
            </div>
          </section>

          {/* Gentle Postpartum Exercises */}
          <section className="bg-white rounded-2xl sm:rounded-[32px] p-4 sm:p-6 border border-[#EFE3EE] shadow-[0_8px_30px_rgba(140,80,120,0.05)] space-y-3.5 sm:space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-base sm:text-lg font-bold text-[#2A162B] flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 sm:w-5 sm:h-5 text-[#9E4875]" />
                  <span>Gentle Daily Movement</span>
                </h2>
                <p className="text-[10px] sm:text-[11px] text-[#866D87]">{currentPhase.pelvicFloorStage} • Synced to daily log</p>
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold bg-[#FAF4F9] border border-[#EBD6E8] text-[#9E4875] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
                {completedExercises.length} of {exercises.length} Done
              </span>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {exercises.map((ex) => {
                const isDone = completedExercises.includes(ex.id);
                return (
                  <div
                    key={ex.id}
                    onClick={() => toggleRecoveryExercise(ex.id)}
                    className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 sm:gap-3.5 ${
                      isDone
                        ? 'bg-[#F9EFF6] border-[#EBD6E9]'
                        : 'bg-[#FAF4F9] border-[#EFE3EE] hover:bg-[#F6ECF5]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isDone ? 'bg-[#9E4875] text-white' : 'border-2 border-[#D8C2D8] text-transparent'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[11px] sm:text-xs font-bold ${isDone ? 'text-[#875578] line-through' : 'text-[#2A162B]'}`}>
                          {ex.name}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-semibold text-[#876888] bg-white px-2 py-0.5 rounded-full border border-[#EBE0EC] shrink-0">
                          {ex.duration}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-[#7E6580] mt-0.5 sm:mt-1 leading-snug">{ex.benefit}</p>
                      <div className="text-[9px] sm:text-[10px] text-[#9E4875] font-bold mt-1">{ex.reps}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* Tab 2: Nutrition & Lactation Support */}
      {activeTab === 'nutrition' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
          {/* Left: Hydration & AI Prompt */}
          <div className="space-y-4 sm:space-y-6">
            <section className="bg-white rounded-2xl sm:rounded-[32px] p-4 sm:p-6 border border-[#EFE3EE] shadow-[0_8px_30px_rgba(140,80,120,0.05)] space-y-3.5 sm:space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#F5EAF4] text-[#9E4875] flex items-center justify-center shadow-2xs">
                    <Droplets className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-base sm:text-lg font-bold text-[#2A162B]">Lactation Hydration Goal</h2>
                    <p className="text-[9px] sm:text-[10px] text-[#866D87]">
                      Target: 8-10 glasses ({(waterGlasses * 0.28).toFixed(1)}L logged today)
                    </p>
                  </div>
                </div>
                <span className="font-serif text-base sm:text-lg font-black text-[#9E4875]">{waterGlasses} / 10</span>
              </div>

              <div className="flex items-center justify-between gap-1 sm:gap-1.5 pt-0.5 sm:pt-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => updateWaterGlasses(waterGlasses === i + 1 ? i : i + 1)}
                    className={`flex-1 h-8 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      i < waterGlasses
                        ? 'bg-[#9E4875] text-white shadow-2xs'
                        : 'bg-[#F6ECF5] text-[#A68BA8] hover:bg-[#EBDDE9]'
                    }`}
                  >
                    <Droplets className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
                  </button>
                ))}
              </div>

              {recoveryHistory.length > 0 && (
                <div className="pt-2 border-t border-[#F1E6F0]">
                  <button
                    type="button"
                    onClick={() => setShowRecoveryHistory(true)}
                    className="w-full flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-[#7B5D7E] hover:text-[#2A162B] px-1 py-1 cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-[#9E4875]" />
                      <span>Recent Daily Recovery &amp; Hydration History ({recoveryHistory.length})</span>
                    </span>
                    <span className="flex items-center gap-1 text-[9px] sm:text-[10px] text-[#9E4875]">
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                </div>
              )}

              {showRecoveryHistory && (
                <div
                  onClick={() => setShowRecoveryHistory(false)}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 sm:p-4"
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl sm:rounded-[32px] max-w-md w-full p-4 sm:p-6 border border-[#ECE0EC] shadow-2xl space-y-3.5 sm:space-y-4 animate-in zoom-in-95 duration-150"
                  >
                    <div className="flex items-center justify-between pb-2.5 border-b border-[#F2E8F1]">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#9E4875]">
                          MATERNAL RECOVERY LOGS
                        </div>
                        <h3 className="font-serif font-bold text-lg text-[#2A162B]">
                          Recovery &amp; Hydration History
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowRecoveryHistory(false)}
                        aria-label="Close recovery history dialog"
                        className="w-8 h-8 rounded-full bg-[#FAF4F9] hover:bg-[#F3E7F2] text-[#6B466D] flex items-center justify-center cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {recoveryHistory.map((row) => (
                        <div
                          key={row.id || row.logged_date}
                          className="flex items-center justify-between px-3 py-2.5 rounded-2xl border border-[#EFE2EE] text-xs"
                        >
                          <span className="font-bold text-[#2A162B]">{row.logged_date}</span>
                          <span className="text-[#785E7B] font-semibold">
                            {row.water_glasses} / 10 glasses • {(row.completed_exercises || []).length} exercises
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowRecoveryHistory(false)}
                      className="w-full py-2.5 rounded-full bg-[#F5EAF3] hover:bg-[#EBDCE9] text-[#5C3E60] font-bold text-xs transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* AI Prompt Card */}
            <section className="plum-card rounded-2xl sm:rounded-[28px] p-4 sm:p-6 text-white flex items-center justify-between shadow-md relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 text-white/10 pointer-events-none">
                <LotusIcon className="w-36 h-36" />
              </div>

              <div className="space-y-1 relative z-10">
                <div className="text-[11px] sm:text-xs font-bold flex items-center gap-1.5 text-[#FADCE8]">
                  <Sparkles className="w-3.5 h-3.5 text-[#FFA6C0]" />
                  <span>Have a healing question?</span>
                </div>
                <p className="text-[11px] sm:text-xs text-[#EAD5EB] max-w-sm">
                  Ask Materna AI about lochia changes, pelvic pressure, or natural galactagogues.
                </p>
              </div>
              <button
                onClick={() => setIsAiChatOpen(true)}
                className="bg-white text-[#634469] text-[11px] sm:text-xs font-bold px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full hover:bg-[#FAF4F9] transition-colors shrink-0 cursor-pointer shadow-sm relative z-10 ml-2 sm:ml-3"
              >
                Ask AI
              </button>
            </section>
          </div>

          {/* Right: Curated Foods (Dynamic per recovery stage) */}
          <div className="space-y-4 sm:space-y-6">
            {nutritionCategories.map((group, idx) => (
              <section key={idx} className="bg-white rounded-2xl sm:rounded-[32px] p-4 sm:p-6 border border-[#EFE3EE] shadow-[0_8px_30px_rgba(140,80,120,0.05)] space-y-3.5 sm:space-y-4">
                <h2 className={`text-[11px] sm:text-xs font-bold px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full inline-block border ${group.accent}`}>
                  {group.category}
                </h2>
                <div className="space-y-2 sm:space-y-2.5">
                  {group.foods.map((food, fIdx) => (
                    <div key={fIdx} className="bg-[#FAF4F9] p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-[#EFE3EE] space-y-0.5">
                      <div className="text-[11px] sm:text-xs font-bold text-[#2A162B] flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-[#B87A4C]" />
                        <span>{food.name}</span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-[#7C637E] leading-relaxed pl-4 sm:pl-4.5">
                        {food.note}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
