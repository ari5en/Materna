'use client';

import React, { useState, useEffect } from 'react';
import { Moon, Lightbulb, Clock, Sun } from 'lucide-react';
import { useMaterna } from '@/lib/context/MaternaContext';
import { calculatePostpartumAge, getMinutesSince, formatDuration } from '@/lib/utils';

export function NextNapPredictor() {
  const { profile, updateProfile, babyLogs, lastWakeTimestamp, recordBabyWakeUp } = useMaterna();
  const [nowMs, setNowMs] = useState<number | undefined>(undefined);

  useEffect(() => {
    setNowMs(Date.now());
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const postData = calculatePostpartumAge(profile.baby_birth_date);
  const wakeWindowMins = postData.recommendedWakeWindowMins || 75;
  const napTarget = String(profile.nap_target || 4) as '3' | '4';

  const minutesSinceWake = Math.min(240, getMinutesSince(lastWakeTimestamp, nowMs));
  const remainingMins = Math.max(0, wakeWindowMins - minutesSinceWake);
  const progressPercent = Math.min(100, Math.round((minutesSinceWake / wakeWindowMins) * 100));

  // Count how many naps logged today
  const isHydrated = nowMs !== undefined;
  const effectiveMs = nowMs ?? new Date(lastWakeTimestamp).getTime() + 45 * 60000;
  const todayStr = isHydrated ? new Date(effectiveMs).toISOString().split('T')[0] : '';
  const todaySleepCount = todayStr
    ? babyLogs.filter((l) => l.log_type === 'sleep' && l.timestamp.startsWith(todayStr)).length
    : babyLogs.filter((l) => l.log_type === 'sleep').length;
  const nextNapNumber = Math.min(Number(napTarget), todaySleepCount + 1);

  // Predicted clock time for next nap
  const wakeTimeMs = new Date(lastWakeTimestamp).getTime() || effectiveMs - 45 * 60000;
  const predictedNapDate = new Date(wakeTimeMs + wakeWindowMins * 60000);
  const predictedClockStr = isHydrated
    ? predictedNapDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : '11:30 AM';

  const formatRemaining = (mins: number) => {
    if (mins <= 0) return 'Nap Due Now';
    return `In ${formatDuration(mins)}`;
  };

  const handleSelectNapTarget = (target: 3 | 4) => {
    updateProfile({ nap_target: target });
  };

  return (
    <section className="bg-gradient-to-br from-[#FFE8DE] via-[#FCE4EF] to-white rounded-[32px] p-6 border border-[#EFE3EE] shadow-[0_8px_30px_rgba(140,80,120,0.05)] space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-white text-[#7B4C7A] flex items-center justify-center shadow-2xs border border-[#EFE1ED]">
            <Moon className="w-4.5 h-4.5 fill-current" />
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-wider text-[#8F7292] uppercase">
              SMART SCHEDULE • WK {postData.weeks}
            </div>
            <h2 className="font-serif text-xl font-bold text-[#2A162B] leading-tight">
              Next Nap Predictor
            </h2>
          </div>
        </div>

        <span className="text-[10px] font-semibold bg-white text-[#784776] border border-[#EFE0ED] px-3 py-1 rounded-full shadow-2xs">
          Wake window: {formatDuration(wakeWindowMins)}
        </span>
      </div>

      {/* Recommended window card */}
      <div className="bg-white rounded-[24px] p-5 border border-[#ECE0EC] shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#6D5270]">Recommended sleep window</span>
          <button
            type="button"
            onClick={recordBabyWakeUp}
            className="text-[10px] font-bold bg-[#F7EFF6] hover:bg-[#EFE0ED] text-[#9E4875] px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Sun className="w-3 h-3" />
            <span>Baby Just Woke Up</span>
          </button>
        </div>

        <div className="flex items-center gap-3.5 pt-0.5">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#9E4875] to-[#DF6385] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="font-serif text-2xl font-black text-[#2A162B] leading-none">
              {formatRemaining(remainingMins)}
            </div>
            <div className="text-xs text-[#826684] mt-1 font-medium">
              Approx. {predictedClockStr} • Nap #{nextNapNumber} ({formatDuration(minutesSinceWake)} awake)
            </div>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="w-full bg-[#F4E8F2] h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#DF6385] to-[#7B4C7A] h-full rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-[#8E738E] font-medium px-0.5">
            <span>Woke {formatDuration(minutesSinceWake)} ago</span>
            <span>Target: {formatDuration(wakeWindowMins)}</span>
          </div>
        </div>
      </div>

      {/* Tip Callout Box */}
      <div className="bg-[#FFF4EE] rounded-2xl p-4 border border-[#FBE0D4] flex items-start gap-2.5">
        <Lightbulb className="w-4 h-4 text-[#C2623C] shrink-0 mt-0.5" />
        <p className="text-xs text-[#7A442E] leading-relaxed">
          <strong className="font-bold text-[#5C2B18]">Actionable sleepy cues:</strong>{' '}
          {remainingMins <= 20
            ? `Nap window is approaching within ${formatDuration(remainingMins)}! Dim the lights, swaddle, and start white noise now before overtiredness begins.`
            : 'Watch for subtle cues like gaze aversion, turning head away from lights, red eyebrows, or gentle eye rubbing before fussiness sets in.'}
        </p>
      </div>

      {/* Nap Count Selectors */}
      <div className="flex items-center justify-between pt-1">
        <div className="text-xs font-bold text-[#634466]">
          Nap target today ({todaySleepCount} of {napTarget} completed)
        </div>
        <div className="flex items-center gap-1.5 bg-[#F2E5F0] p-1 rounded-full">
          <button
            type="button"
            onClick={() => handleSelectNapTarget(3)}
            className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              napTarget === '3'
                ? 'bg-[#9E4875] text-white shadow-2xs'
                : 'text-[#7B617D] hover:text-[#381F3B]'
            }`}
          >
            3 Naps
          </button>
          <button
            type="button"
            onClick={() => handleSelectNapTarget(4)}
            className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              napTarget === '4'
                ? 'bg-[#9E4875] text-white shadow-2xs'
                : 'text-[#7B617D] hover:text-[#381F3B]'
            }`}
          >
            4 Naps
          </button>
        </div>
      </div>
    </section>
  );
}
