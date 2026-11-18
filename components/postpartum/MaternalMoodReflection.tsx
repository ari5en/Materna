'use client';

import React, { useState } from 'react';
import { Check, TrendingUp, BookOpen, Trash2, Edit3, ChevronRight, X } from 'lucide-react';
import { useMaterna } from '@/lib/context/MaternaContext';
import { calculateWeeklyMoodMomentum } from '@/lib/utils';
import { LotusIcon } from '../shared/LotusIcon';
import type { MaternalMoodLog } from '@/types/database';

interface MoodOption {
  score: number;
  label: string;
  descriptor: string;
  colorBg: string;
  colorRing: string;
  colorText: string;
}

export function MaternalMoodReflection() {
  const { moodLogs, addMoodLog, updateMoodLog, deleteMoodLog } = useMaterna();
  const [selectedScore, setSelectedScore] = useState<number>(4); // Default: Grounded
  const [selectedTags, setSelectedTags] = useState<string[]>([
    "Baby's Feeding",
    'Sleep Deprivation',
  ]);
  const [noteText, setNoteText] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Pop-up Mood History Dialog & inline edit states
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingMoodId, setEditingMoodId] = useState<string | null>(null);
  const [editScore, setEditScore] = useState<number>(4);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editNote, setEditNote] = useState<string>('');

  const startEditMood = (item: MaternalMoodLog) => {
    setEditingMoodId(item.id);
    setEditScore(item.score);
    setEditTags(item.tags || []);
    setEditNote(item.notes || '');
  };

  const toggleEditTag = (tag: string) => {
    setEditTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSaveEditedMood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMoodId) return;
    await updateMoodLog(editingMoodId, {
      score: editScore,
      tags: editTags,
      notes: editNote.trim() || undefined,
    });
    setEditingMoodId(null);
  };

  const moodOptions: MoodOption[] = [
    {
      score: 1,
      label: 'Depleted',
      descriptor: 'Depleted & Heavy',
      colorBg: 'bg-[#985873]',
      colorRing: 'ring-[#985873]',
      colorText: 'text-white',
    },
    {
      score: 2,
      label: 'Fragile',
      descriptor: 'Fragile & Tender',
      colorBg: 'bg-[#E59A83]',
      colorRing: 'ring-[#E59A83]',
      colorText: 'text-white',
    },
    {
      score: 3,
      label: 'Balanced',
      descriptor: 'Balanced & Steady',
      colorBg: 'bg-[#B08CC7]',
      colorRing: 'ring-[#B08CC7]',
      colorText: 'text-white',
    },
    {
      score: 4,
      label: 'Grounded',
      descriptor: 'Grounded & Calm',
      colorBg: 'bg-[#7E5785]',
      colorRing: 'ring-[#7E5785]',
      colorText: 'text-white',
    },
    {
      score: 5,
      label: 'Joyful',
      descriptor: 'Joyful & Energized',
      colorBg: 'bg-[#A24874]',
      colorRing: 'ring-[#A24874]',
      colorText: 'text-white',
    },
  ];

  const availableTags = [
    "Baby's Feeding",
    'Sleep Deprivation',
    'Physical Healing',
    'Hormonal Shift',
    'Partner Support',
    'Grateful',
    'Overwhelmed',
    'Quiet Time',
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSaveReflection = async () => {
    await addMoodLog(selectedScore, selectedTags, noteText.trim() || undefined);
    setNoteText('');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const currentOption = moodOptions.find((m) => m.score === selectedScore) || moodOptions[3];

  // Recency-Weighted Weekly Momentum Index (resets Mondays at 12:00 AM, EMA alpha = 0.4)
  const {
    percentage: heartWellnessPct,
    emaScore,
    weeklyCheckIns,
    happyPct,
    calmPct,
    fragilePct,
    dominantLabel,
    hasLogsThisWeek,
  } = calculateWeeklyMoodMomentum(moodLogs, { alpha: 0.4 });

  // SVG Donut Circumference for r=38 is 2 * PI * 38 = 238.76
  const C = 238.76;
  const fragileDash = (fragilePct / 100) * C;
  const calmDash = (calmPct / 100) * C;
  const happyDash = (happyPct / 100) * C;

  const calmOffset = -fragileDash;
  const happyOffset = -(fragileDash + calmDash);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Glowing 3D Heart Card */}
      <section className="hover-lift bg-gradient-to-br from-[#FFEAE0] via-[#FCE4EF] to-[#EDE3F7] rounded-2xl sm:rounded-[32px] p-4 sm:p-6 text-center border border-[#EFE1ED] shadow-[0_8px_30px_rgba(150,90,130,0.06)] relative overflow-hidden">
        {/* Soft watermark text */}
        <div className="absolute top-2 left-0 right-0 font-serif text-3xl sm:text-5xl font-bold text-[#8C5D8B]/8 pointer-events-none tracking-widest uppercase">
          Mindfulness
        </div>

        {/* 3D Glowing Heart with Liquid Wave */}
        <div className="relative z-10 py-1 sm:py-2 flex flex-col items-center">
          <div className="relative w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center">
            {/* Ambient Heart Glow */}
            <div className="absolute inset-0 bg-[#E888B4]/40 rounded-full blur-xl animate-pulse"></div>

            {/* Glowing Heart SVG Shape with Gradient */}
            <svg className="w-18 h-18 sm:w-24 sm:h-24 drop-shadow-md" viewBox="0 0 100 90" fill="none">
              <defs>
                <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFA6C0" />
                  <stop offset="60%" stopColor="#D96E9E" />
                  <stop offset="100%" stopColor="#9E5699" />
                </linearGradient>
                <clipPath id="heartClip">
                  <path d="M50,85 C20,60 0,40 0,22 C0,9 10,0 24,0 C36,0 45,8 50,17 C55,8 64,0 76,0 C90,0 100,9 100,22 C100,40 80,60 50,85 Z" />
                </clipPath>
              </defs>

              <path
                d="M50,85 C20,60 0,40 0,22 C0,9 10,0 24,0 C36,0 45,8 50,17 C55,8 64,0 76,0 C90,0 100,9 100,22 C100,40 80,60 50,85 Z"
                fill="url(#heartGrad)"
                className="opacity-95"
              />

              {/* Liquid wave reflection scaled by wellness % */}
              <g clipPath="url(#heartClip)">
                <path
                  d={`M0,${95 - heartWellnessPct * 0.55} Q25,${85 - heartWellnessPct * 0.55} 50,${95 - heartWellnessPct * 0.55} T100,${95 - heartWellnessPct * 0.55} L100,100 L0,100 Z`}
                  fill="rgba(255,255,255,0.28)"
                />
              </g>
            </svg>

            {/* In-Heart Percentage */}
            <span className="absolute font-serif font-bold text-xl sm:text-2xl text-white tracking-tight drop-shadow-sm select-none">
              {heartWellnessPct}%
            </span>
          </div>

          <div className="mt-2 sm:mt-3 space-y-0.5">
            <h3 className="font-serif text-lg sm:text-xl font-bold text-[#2E182F]">
              {!hasLogsThisWeek
                ? 'Fresh Week Ahead'
                : heartWellnessPct >= 70
                ? 'Keep going!'
                : 'Be gentle with yourself'}
            </h3>
            <p className="text-[11px] sm:text-xs text-[#876587] flex items-center justify-center gap-1 font-semibold">
              <TrendingUp className="w-3.5 h-3.5 text-[#9E4875]" />
              <span>
                {hasLogsThisWeek
                  ? `Weekly Momentum ${emaScore.toFixed(1)}/5.0 across ${weeklyCheckIns} ${
                      weeklyCheckIns === 1 ? 'reflection' : 'reflections'
                    }`
                  : 'No reflections yet this week • Resets Mondays 12:00 AM'}
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* 2. Mood Statistic Donut Card */}
      <section className="hover-lift bg-white rounded-2xl sm:rounded-[32px] p-4 sm:p-6 border border-[#EFE3EE] shadow-[0_8px_30px_rgba(140,80,120,0.05)] space-y-4 sm:space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#2A162B]">Mood Statistic</h2>
            <p className="text-[11px] sm:text-xs text-[#8E738E]">Live breakdown from your mood logs</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#F7EFF6] text-[#7E5785] flex items-center justify-center">
            <LotusIcon className="w-4 h-4" />
          </div>
        </div>

        {/* Circular Segmented Donut Chart */}
        <div className="flex items-center justify-center gap-6 py-2">
          {/* Donut SVG */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-32 h-32 -rotate-90 transform" viewBox="0 0 100 100">
              {/* Background ring */}
              <circle cx="50" cy="50" r="38" stroke="#F4E8F2" strokeWidth="12" fill="none" />
              {/* Peach Arc: Fragile */}
              {fragilePct > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#F6B89E"
                  strokeWidth="12"
                  strokeDasharray={`${fragileDash} ${C}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  fill="none"
                />
              )}
              {/* Lilac Arc: Calm */}
              {calmPct > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#B48ECB"
                  strokeWidth="12"
                  strokeDasharray={`${calmDash} ${C}`}
                  strokeDashoffset={calmOffset}
                  strokeLinecap="round"
                  fill="none"
                />
              )}
              {/* Magenta Arc: Happy */}
              {happyPct > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#9E4875"
                  strokeWidth="12"
                  strokeDasharray={`${happyDash} ${C}`}
                  strokeDashoffset={happyOffset}
                  strokeLinecap="round"
                  fill="none"
                />
              )}
            </svg>

            {/* Center Label */}
            <div className="absolute text-center select-none">
              <div className="font-serif font-black text-2xl text-[#2B172C] leading-none">
                {weeklyCheckIns}
              </div>
              <div className="text-[10px] font-bold text-[#8E738E] mt-0.5">{dominantLabel}</div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 text-xs font-semibold text-[#573E58]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#9E4875]"></span>
              <span>Happy ({happyPct}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B48ECB]"></span>
              <span>Calm ({calmPct}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F6B89E]"></span>
              <span>Fragile ({fragilePct}%)</span>
            </div>
          </div>
        </div>

        {/* 5-Point Expressive Scale Check-In */}
        <div className="space-y-2.5 sm:space-y-3 pt-2 border-t border-[#F1E6F0]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-[#553C56]">Log today&apos;s emotional state:</span>
            <span className="text-[11px] sm:text-xs font-bold text-[#9E4875]">{currentOption.descriptor}</span>
          </div>

          <div className="flex items-center justify-between gap-1 sm:gap-1.5 bg-[#F9F4F9] p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-[#EDE0EC]">
            {moodOptions.map((option) => {
              const isSelected = selectedScore === option.score;
              return (
                <button
                  key={option.score}
                  type="button"
                  onClick={() => setSelectedScore(option.score)}
                  className={`flex-1 flex flex-col items-center py-2 sm:py-2.5 px-0.5 sm:px-1 rounded-lg sm:rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? `${option.colorBg} ${option.colorText} shadow-md scale-105 font-bold`
                      : 'hover:bg-white text-[#836985]'
                  }`}
                >
                  <span className="text-sm sm:text-base select-none">
                    {option.score === 1 && '🥀'}
                    {option.score === 2 && '🌸'}
                    {option.score === 3 && '🌊'}
                    {option.score === 4 && '🪷'}
                    {option.score === 5 && '✨'}
                  </span>
                  <span className="text-[9px] sm:text-[10px] mt-0.5 sm:mt-1 leading-tight">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contextual Tags */}
        <div className="space-y-1.5 sm:space-y-2 pt-0.5 sm:pt-1">
          <label className="text-[11px] sm:text-xs font-bold text-[#553C56]">
            Postpartum Context Tags:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {availableTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#9E4875] text-white shadow-xs'
                      : 'bg-[#F4E8F2] hover:bg-[#EBDDE9] text-[#69486F]'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Journal Note Textarea (Always visible) */}
        <div className="space-y-2 pt-0.5 sm:pt-1">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="How are your recovery, emotions, and rest feeling today?"
            rows={2}
            className="w-full p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-[#FAF5FA] border border-[#ECDDEC] text-xs text-[#2A162B] placeholder:text-[#A78FA8] focus:outline-hidden focus:ring-1 focus:ring-[#A24874]"
          />
        </div>

        {/* Save Action Button */}
        <button
          type="button"
          onClick={handleSaveReflection}
          disabled={isSaved}
          className="w-full py-2.5 sm:py-3 rounded-full bg-[#69486F] hover:bg-[#57395D] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-80"
        >
          {isSaved ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#FADCE8]" />
              <span>Reflection Logged &amp; Synced</span>
            </>
          ) : (
            <span>Save Mood Check-In</span>
          )}
        </button>

        {/* Trigger button for Pop-up Mood History Dialog */}
        <div className="pt-0.5 sm:pt-1">
          <button
            type="button"
            onClick={() => {
              setEditingMoodId(null);
              setShowHistoryModal(true);
            }}
            className="w-full flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-[#7B5D7E] hover:text-[#2A162B] px-1 py-1 cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#9E4875]" />
              <span>Recent Check-Ins &amp; Journal Notes ({moodLogs.length})</span>
            </span>
            <span className="flex items-center gap-1 text-[9px] sm:text-[10px] text-[#9E4875]">
              <span>View &amp; Edit</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </button>
        </div>

        {/* Pop-up Mood History Dialog Modal */}
        {showHistoryModal && (
          <div
            onClick={() => {
              setEditingMoodId(null);
              setShowHistoryModal(false);
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
                    EMOTIONAL WELLNESS LOGS
                  </div>
                  <h3 className="font-serif font-bold text-lg text-[#2A162B]">
                    Check-Ins &amp; Journal Notes
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingMoodId(null);
                    setShowHistoryModal(false);
                  }}
                  aria-label="Close mood history dialog"
                  className="w-8 h-8 rounded-full bg-[#FAF4F9] hover:bg-[#F3E7F2] text-[#6B466D] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {moodLogs.length === 0 ? (
                <p className="text-xs text-[#8C728C] text-center py-6">
                  No mood reflections logged yet. Choose your emotional state above and tap &ldquo;Save Mood Check-In&rdquo;.
                </p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {moodLogs.slice(0, 25).map((item) => {
                    const isEditingThis = editingMoodId === item.id;
                    const opt = moodOptions.find((m) => m.score === item.score) || moodOptions[3];
                    return (
                      <div
                        key={item.id}
                        className="bg-[#FAF5FA] p-3 rounded-2xl border border-[#EFE2EE] text-xs space-y-2.5"
                      >
                        {isEditingThis ? (
                          <form onSubmit={handleSaveEditedMood} className="space-y-2.5">
                            <div className="text-[10px] font-bold text-[#6B466D]">
                              Edit Reflection ({item.logged_date})
                            </div>
                            <div className="flex items-center justify-between gap-1 bg-white p-1.5 rounded-xl border border-[#EDE0EC]">
                              {moodOptions.map((option) => (
                                <button
                                  key={option.score}
                                  type="button"
                                  onClick={() => setEditScore(option.score)}
                                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                    editScore === option.score
                                      ? `${option.colorBg} text-white shadow-2xs`
                                      : 'text-[#836985] hover:bg-[#FAF4F9]'
                                  }`}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {availableTags.map((tag) => {
                                const active = editTags.includes(tag);
                                return (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleEditTag(tag)}
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold cursor-pointer ${
                                      active
                                        ? 'bg-[#9E4875] text-white'
                                        : 'bg-white border border-[#E5D5E4] text-[#69486F]'
                                    }`}
                                  >
                                    {tag}
                                  </button>
                                );
                              })}
                            </div>
                            <textarea
                              value={editNote}
                              onChange={(e) => setEditNote(e.target.value)}
                              placeholder="Optional journal note..."
                              rows={2}
                              className="w-full p-2.5 rounded-xl bg-white border border-[#E5D5E4] text-xs text-[#2A162B]"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingMoodId(null)}
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
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="font-bold text-[#2A162B]">
                                  {opt.label} ({item.score}/5) •{' '}
                                  <span className="text-[#8E738E] font-semibold">{item.logged_date}</span>
                                </div>
                                {item.tags?.length ? (
                                  <div className="text-[10px] text-[#8E738E] truncate">
                                    {item.tags.join(', ')}
                                  </div>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => startEditMood(item)}
                                  className="px-2.5 py-1 rounded-full bg-white hover:bg-[#F3E7F2] border border-[#E5D5E4] text-[10px] font-bold text-[#784776] flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteMoodLog(item.id)}
                                  aria-label="Delete reflection"
                                  className="p-1.5 rounded-full text-[#A888AA] hover:text-[#C93B63] hover:bg-[#FFF2F5] transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            {item.notes && (
                              <p className="text-[11px] text-[#4C3053] italic pt-0.5">
                                &ldquo;{item.notes}&rdquo;
                              </p>
                            )}
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
                  setEditingMoodId(null);
                  setShowHistoryModal(false);
                }}
                className="w-full py-2.5 rounded-full bg-[#F5EAF3] hover:bg-[#EBDCE9] text-[#5C3E60] font-bold text-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
