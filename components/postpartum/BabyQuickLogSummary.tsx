'use client';

import React, { useState, useEffect } from 'react';
import { Droplets, Baby, Moon, Plus, Check, Clock, Trash2, Edit3, ChevronRight, X } from 'lucide-react';
import { useMaterna } from '@/lib/context/MaternaContext';
import { formatTimeAgo, formatDuration } from '@/lib/utils';
import type { BabyLog, BabyLogDetails } from '@/types/database';

export function BabyQuickLogSummary() {
  const { profile, babyLogs, addBabyLog, updateBabyLog, deleteBabyLog } = useMaterna();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<'feed' | 'diaper' | 'sleep' | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState<boolean>(false);
  const [nowMs, setNowMs] = useState<number | undefined>(undefined);

  // Modal custom states
  const [feedType, setFeedType] = useState<'left' | 'right' | 'bottle'>('left');
  const [feedDuration, setFeedDuration] = useState<number>(20);
  const [bottleAmount, setBottleAmount] = useState<number>(120);
  const [diaperType, setDiaperType] = useState<'wet' | 'dirty' | 'mixed'>('wet');
  const [sleepDuration, setSleepDuration] = useState<number>(90);

  const babyName = profile.baby_name || 'Baby';
  const [todayString, setTodayString] = useState<string>('');

  useEffect(() => {
    setNowMs(Date.now());
    setTodayString(new Date().toISOString().split('T')[0]);
    const interval = setInterval(() => {
      setNowMs(Date.now());
      setTodayString(new Date().toISOString().split('T')[0]);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const todayLogs = todayString
    ? babyLogs.filter((log) => log.timestamp.startsWith(todayString))
    : babyLogs;

  const feedsCount = todayLogs.filter((l) => l.log_type === 'feed').length;
  const diapersCount = todayLogs.filter((l) => l.log_type === 'diaper').length;
  const sleepMinsToday = todayLogs
    .filter((l) => l.log_type === 'sleep')
    .reduce((acc, curr) => acc + (curr.details.duration_mins || 0), 0);

  // Most recent logs overall
  const lastFeed = babyLogs.find((l) => l.log_type === 'feed');
  const lastDiaper = babyLogs.find((l) => l.log_type === 'diaper');
  const lastSleep = babyLogs.find((l) => l.log_type === 'sleep');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleQuickLog = (type: 'feed' | 'diaper' | 'sleep', details: BabyLogDetails, label: string) => {
    addBabyLog(type, details);
    triggerToast(label);
  };

  const openEditLog = (log: BabyLog) => {
    setEditingLogId(log.id);
    setActiveModal(log.log_type);
    if (log.log_type === 'feed') {
      if (log.details.side === 'left' || log.details.side === 'right') {
        setFeedType(log.details.side);
        setFeedDuration(log.details.duration_mins || 20);
      } else {
        setFeedType('bottle');
        setBottleAmount(log.details.amount_ml || 120);
      }
    } else if (log.log_type === 'diaper') {
      const t = log.details.type;
      setDiaperType(t === 'dirty' || t === 'mixed' ? t : 'wet');
    } else if (log.log_type === 'sleep') {
      setSleepDuration(log.details.duration_mins || 90);
    }
  };

  const handleSaveModal = () => {
    if (activeModal === 'feed') {
      const details: BabyLogDetails =
        feedType === 'bottle'
          ? { bottle_type: 'formula', amount_ml: bottleAmount, duration_mins: 15 }
          : { side: feedType, duration_mins: feedDuration };
      if (editingLogId) {
        updateBabyLog(editingLogId, details);
        triggerToast('Updated feed log');
      } else {
        addBabyLog('feed', details);
        triggerToast(
          feedType === 'bottle'
            ? `Logged bottle feed (${bottleAmount}ml)`
            : `Logged nursing (${feedType} breast, ${formatDuration(feedDuration)})`
        );
      }
    } else if (activeModal === 'diaper') {
      const details: BabyLogDetails = { type: diaperType };
      if (editingLogId) {
        updateBabyLog(editingLogId, details);
        triggerToast('Updated diaper log');
      } else {
        addBabyLog('diaper', details);
        triggerToast(`Logged ${diaperType} diaper`);
      }
    } else if (activeModal === 'sleep') {
      const details: BabyLogDetails = { duration_mins: sleepDuration, notes: 'Crib nap' };
      if (editingLogId) {
        updateBabyLog(editingLogId, details);
        triggerToast('Updated sleep log');
      } else {
        addBabyLog('sleep', details);
        triggerToast(`Logged nap (${formatDuration(sleepDuration)})`);
      }
    }
    setEditingLogId(null);
    setActiveModal(null);
  };

  const formatLogDescription = (log: typeof babyLogs[0]) => {
    if (log.log_type === 'feed') {
      if (log.details.side) {
        return `Nursed ${log.details.side} breast (${formatDuration(log.details.duration_mins || 20)})`;
      }
      return `Bottle feed (${log.details.amount_ml || 120}ml)`;
    }
    if (log.log_type === 'diaper') {
      return `${(log.details.type || 'wet').toUpperCase()} diaper`;
    }
    return `Slept ${formatDuration(log.details.duration_mins || 60)}`;
  };

  return (
    <section className="hover-lift bg-white rounded-2xl sm:rounded-[32px] p-4 sm:p-6 border border-[#EFE3EE] shadow-[0_8px_30px_rgba(140,80,120,0.05)] space-y-3.5 sm:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#F5EAF4] text-[#7B4C7A] flex items-center justify-center shadow-2xs">
            <Baby className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
          <div>
            <div className="text-[9px] sm:text-[10px] font-bold tracking-wider text-[#8F7292] uppercase">
              BABY STATUS • {babyName}
            </div>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#2A162B] leading-tight">
              Quick-Log Summary
            </h2>
          </div>
        </div>

        <span className="text-[9px] sm:text-[10px] font-semibold bg-[#F5EAF3] text-[#784776] px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#9E4875] animate-pulse"></span>
          Live Sync
        </span>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
        {/* Feeds Card */}
        <div
          onClick={() => setActiveModal('feed')}
          className="bg-[#F4EDF7] hover:bg-[#EDE1F2] rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-[#E6D6E9] flex flex-col justify-between text-left transition-all active:scale-95 group cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-[#5B3961]">
              <Droplets className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#88528E]" />
              <span>Feeds</span>
            </div>
            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/90 group-hover:bg-white text-[#633B69] flex items-center justify-center shadow-2xs">
              <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </span>
          </div>

          <div className="my-1.5 sm:my-2">
            <div className="font-serif text-xl sm:text-2xl font-black text-[#2A162B] tracking-tight">{feedsCount}</div>
            <div className="text-[9px] sm:text-[10px] font-medium text-[#7A5B80] truncate">
              {lastFeed
                ? lastFeed.details.side
                  ? `${lastFeed.details.side === 'left' ? 'Left' : 'Right'} • ${formatDuration(lastFeed.details.duration_mins || 20)}`
                  : `${lastFeed.details.amount_ml || 120}ml`
                : 'Tap to log'}
            </div>
          </div>

          <div className="text-[9px] sm:text-[10px] text-[#704875] border-t border-[#E6D6E9]/90 pt-1 font-medium truncate">
            {formatTimeAgo(lastFeed?.timestamp, nowMs)}
          </div>
        </div>

        {/* Diapers Card */}
        <div
          onClick={() => setActiveModal('diaper')}
          className="bg-[#FDF1EB] hover:bg-[#FBE5DC] rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-[#F6DACF] flex flex-col justify-between text-left transition-all active:scale-95 group cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-[#7D4934]">
              <Baby className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#B86E53]" />
              <span>Diapers</span>
            </div>
            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/90 group-hover:bg-white text-[#7D4934] flex items-center justify-center shadow-2xs">
              <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </span>
          </div>

          <div className="my-1.5 sm:my-2">
            <div className="font-serif text-xl sm:text-2xl font-black text-[#2A162B] tracking-tight">{diapersCount}</div>
            <div className="text-[9px] sm:text-[10px] font-medium text-[#8F5943] capitalize truncate">
              {lastDiaper ? `${lastDiaper.details.type || 'Wet'} diaper` : 'Tap to log'}
            </div>
          </div>

          <div className="text-[9px] sm:text-[10px] text-[#8F5943] border-t border-[#F6DACF]/90 pt-1 font-medium truncate">
            {formatTimeAgo(lastDiaper?.timestamp, nowMs)}
          </div>
        </div>

        {/* Sleep Card */}
        <div
          onClick={() => setActiveModal('sleep')}
          className="bg-[#F0EBF4] hover:bg-[#E7DFEC] rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-[#E0D2E5] flex flex-col justify-between text-left transition-all active:scale-95 group cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-[#513657]">
              <Moon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#73507B]" />
              <span>Sleep</span>
            </div>
            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/90 group-hover:bg-white text-[#513657] flex items-center justify-center shadow-2xs">
              <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </span>
          </div>

          <div className="my-1.5 sm:my-2">
            <div className="font-serif text-xl sm:text-2xl font-black text-[#2A162B] tracking-tight">
              {formatDuration(sleepMinsToday)}
            </div>
            <div className="text-[9px] sm:text-[10px] font-medium text-[#74557A] truncate">
              {lastSleep?.details.duration_mins
                ? `${formatDuration(lastSleep.details.duration_mins)} last nap`
                : 'Tap to log'}
            </div>
          </div>

          <div className="text-[9px] sm:text-[10px] text-[#69486F] border-t border-[#E0D2E5]/90 pt-1 font-medium truncate">
            {formatTimeAgo(lastSleep?.timestamp, nowMs)}
          </div>
        </div>
      </div>

      {/* Quick 1-Tap Action Row */}
      <div className="bg-[#FAF4F9] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-[#EFE3EE] flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 text-xs">
        <span className="text-[10px] sm:text-[11px] font-semibold text-[#785E7B]">Quick 1-Tap:</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => handleQuickLog('feed', { side: 'left', duration_mins: 20 }, 'Logged left breast nursing (20m)')}
            className="px-2.5 sm:px-3 py-1 rounded-lg bg-white border border-[#E8DAE7] hover:bg-[#F6ECF5] text-[10px] sm:text-[11px] font-semibold text-[#56385B] transition-colors cursor-pointer"
          >
            + Nurse L
          </button>
          <button
            onClick={() => handleQuickLog('feed', { side: 'right', duration_mins: 20 }, 'Logged right breast nursing (20m)')}
            className="px-2.5 sm:px-3 py-1 rounded-lg bg-white border border-[#E8DAE7] hover:bg-[#F6ECF5] text-[10px] sm:text-[11px] font-semibold text-[#56385B] transition-colors cursor-pointer"
          >
            + Nurse R
          </button>
          <button
            onClick={() => handleQuickLog('diaper', { type: 'wet' }, 'Logged wet diaper')}
            className="px-2.5 sm:px-3 py-1 rounded-lg bg-white border border-[#E8DAE7] hover:bg-[#FAF0E9] text-[10px] sm:text-[11px] font-semibold text-[#56385B] transition-colors cursor-pointer"
          >
            + Wet Diaper
          </button>
        </div>
      </div>

      {/* Trigger button for Pop-up Activity History Dialog */}
      <div className="pt-0.5">
        <button
          type="button"
          onClick={() => setShowTimeline(true)}
          className="w-full flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-[#7B5D7E] hover:text-[#2A162B] px-1 py-1 cursor-pointer transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#9E4875]" />
            <span>Recent Activity History ({todayLogs.length} today)</span>
          </span>
          <span className="flex items-center gap-1 text-[9px] sm:text-[10px] text-[#9E4875]">
            <span>View &amp; Edit</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </button>
      </div>

      {/* Pop-up Activity History Dialog Modal */}
      {showTimeline && !activeModal && (
        <div
          onClick={() => setShowTimeline(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-[32px] max-w-md w-full max-h-[85vh] flex flex-col p-4 sm:p-6 border border-[#ECE0EC] shadow-2xl animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#F2E8F1] shrink-0">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#9E4875]">
                  {babyName}&apos;S CARE TIMELINE
                </div>
                <h3 className="font-serif font-bold text-lg text-[#2A162B]">
                  Recent Activity History
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTimeline(false)}
                aria-label="Close history dialog"
                className="w-8 h-8 rounded-full bg-[#FAF4F9] hover:bg-[#F3E7F2] text-[#6B466D] flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Activity List */}
            {babyLogs.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <Clock className="w-8 h-8 text-[#CBB4CF] mx-auto" />
                <p className="text-xs text-[#8C728C]">
                  No activity logs recorded yet. Tap a quick-log card to record {babyName}&apos;s care.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 py-3 min-h-0">
                {babyLogs.slice(0, 30).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between bg-[#FAF5FA] hover:bg-[#F6EEF6] px-3.5 py-2.5 rounded-2xl border border-[#EFE2EE] text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#9E4875] shrink-0" />
                      <div className="truncate">
                        <div className="font-semibold text-[#2A162B] truncate">
                          {formatLogDescription(log)}
                        </div>
                        <div className="text-[10px] text-[#8C728C]">
                          {formatTimeAgo(log.timestamp, nowMs)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={() => openEditLog(log)}
                        className="px-2.5 py-1 rounded-full bg-white hover:bg-[#F3E7F2] border border-[#E5D5E4] text-[10px] font-bold text-[#784776] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deleteBabyLog(log.id);
                          triggerToast('Log entry removed');
                        }}
                        aria-label="Delete log"
                        className="p-1.5 rounded-full text-[#A888AA] hover:text-[#C93B63] hover:bg-[#FFF2F5] transition-colors cursor-pointer"
                        title="Delete log entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pinned Modal Footer */}
            <div className="pt-3 border-t border-[#F2E8F1] shrink-0">
              <button
                type="button"
                onClick={() => setShowTimeline(false)}
                className="w-full py-2.5 rounded-full bg-[#F5EAF3] hover:bg-[#EBDCE9] text-[#5C3E60] font-bold text-xs transition-colors cursor-pointer shadow-2xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#4C3053] text-white text-xs px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-3.5 h-3.5 text-[#FFA6C0]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Quick Log Details Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-[32px] max-w-sm w-full p-4 sm:p-6 border border-[#ECE0EC] shadow-2xl space-y-3.5 sm:space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[#F2E8F1]">
              <h3 className="font-serif font-bold text-base text-[#2A162B] capitalize">
                {editingLogId ? `Edit Baby ${activeModal}` : `Log Baby ${activeModal}`}
              </h3>
              <button
                onClick={() => {
                  setEditingLogId(null);
                  setActiveModal(null);
                }}
                className="text-xs text-[#8A6F8B] hover:text-[#2A162B] cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {/* Feed Options */}
            {activeModal === 'feed' && (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 bg-[#F8F1F7] p-1 rounded-xl">
                  <button
                    onClick={() => setFeedType('left')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      feedType === 'left' ? 'bg-white shadow-2xs text-[#9E4875]' : 'text-[#7B617E]'
                    }`}
                  >
                    Left Breast
                  </button>
                  <button
                    onClick={() => setFeedType('right')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      feedType === 'right' ? 'bg-white shadow-2xs text-[#9E4875]' : 'text-[#7B617E]'
                    }`}
                  >
                    Right Breast
                  </button>
                  <button
                    onClick={() => setFeedType('bottle')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      feedType === 'bottle' ? 'bg-white shadow-2xs text-[#9E4875]' : 'text-[#7B617E]'
                    }`}
                  >
                    Bottle
                  </button>
                </div>

                {feedType === 'bottle' ? (
                  <div className="space-y-2 bg-[#FAF5FA] p-3.5 rounded-2xl border border-[#EFE2EE]">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#664969]">Bottle Amount</label>
                      <span className="font-serif text-sm font-bold text-[#9E4875] bg-white px-2.5 py-0.5 rounded-full border border-[#E8D9E8]">
                        {bottleAmount} ml
                      </span>
                    </div>
                    <input
                      type="range"
                      min={30}
                      max={240}
                      step={10}
                      value={bottleAmount}
                      onChange={(e) => setBottleAmount(Number(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none bg-[#E8D9E8] accent-[#9E4875] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#8C728C] font-medium">
                      <span>30ml</span>
                      <span>120ml</span>
                      <span>240ml</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 bg-[#FAF5FA] p-3.5 rounded-2xl border border-[#EFE2EE]">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#664969]">Nursing Duration</label>
                      <span className="font-serif text-sm font-bold text-[#9E4875] bg-white px-2.5 py-0.5 rounded-full border border-[#E8D9E8]">
                        {formatDuration(feedDuration)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={60}
                      step={5}
                      value={feedDuration}
                      onChange={(e) => setFeedDuration(Number(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none bg-[#E8D9E8] accent-[#9E4875] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#8C728C] font-medium">
                      <span>5m</span>
                      <span>30m</span>
                      <span>1h</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Diaper Options */}
            {activeModal === 'diaper' && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-[#664969]">Diaper Condition</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['wet', 'dirty', 'mixed'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setDiaperType(type)}
                      className={`py-3 text-xs font-bold rounded-xl border capitalize transition-all ${
                        diaperType === type
                          ? 'bg-[#69486F] text-white border-[#69486F]'
                          : 'bg-[#FAF5FA] border-[#EBDDE9] text-[#5C3E60]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sleep Options */}
            {activeModal === 'sleep' && (
              <div className="space-y-2 bg-[#FAF5FA] p-3.5 rounded-2xl border border-[#EFE2EE]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#664969]">Nap Duration</label>
                  <span className="font-serif text-sm font-bold text-[#9E4875] bg-white px-2.5 py-0.5 rounded-full border border-[#E8D9E8]">
                    {formatDuration(sleepDuration)}
                  </span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={180}
                  step={5}
                  value={sleepDuration}
                  onChange={(e) => setSleepDuration(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none bg-[#E8D9E8] accent-[#9E4875] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#8C728C] font-medium">
                  <span>15m</span>
                  <span>1h 30m</span>
                  <span>3h</span>
                </div>
              </div>
            )}

            <button
              onClick={handleSaveModal}
              className="w-full py-3 rounded-full bg-[#9E4875] hover:bg-[#8B3B64] text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
            >
              Save Entry
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
