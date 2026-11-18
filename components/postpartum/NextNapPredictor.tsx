'use client';

import React, { useState, useEffect } from 'react';
import { Moon, Lightbulb, Clock, Sun, Check } from 'lucide-react';
import { useMaterna } from '@/lib/context/MaternaContext';
import { calculatePostpartumAge, getMinutesSince, formatDuration } from '@/lib/utils';

export function NextNapPredictor() {
  const {
    profile,
    updateProfile,
    babyLogs,
    lastWakeTimestamp,
    babySleepingSince,
    startBabySleep,
    recordBabyWakeUp,
  } = useMaterna();
  const [nowMs, setNowMs] = useState<number | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoggingWake, setIsLoggingWake] = useState(false);

  useEffect(() => {
    setNowMs(Date.now());
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 15000); // 15-second tick for live sleep timer
    return () => clearInterval(timer);
  }, []);

  const postData = calculatePostpartumAge(profile.baby_birth_date);
  const wakeWindowMins = postData.recommendedWakeWindowMins || 75;
  const napTarget = String(profile.nap_target || 4) as '3' | '4';

  const isSleeping = Boolean(babySleepingSince);
  const asleepMins = isSleeping && babySleepingSince ? Math.max(0, getMinutesSince(babySleepingSince, nowMs)) : 0;

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

  const sleepingSinceClockStr = isSleeping && babySleepingSince && isHydrated
    ? new Date(babySleepingSince).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : '';

  const formatRemaining = (mins: number) => {
    if (mins <= 0) return 'Nap Due Now';
    return `In ${formatDuration(mins)}`;
  };

  const handleSelectNapTarget = (target: 3 | 4) => {
    updateProfile({ nap_target: target });
  };

  const handleStartSleep = async () => {
    await startBabySleep();
    setToastMessage('Sleep timer started! Tracking exact duration until baby wakes up.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleWakeUp = async (durationOverride?: number) => {
    if (isLoggingWake) return;
    setIsLoggingWake(true);
    const recordedDuration = await recordBabyWakeUp(durationOverride);
    setIsLoggingWake(false);
    setToastMessage(`Baby woke up! Nap logged (+${formatDuration(recordedDuration)}) · Wake timer reset`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <section className="hover-lift bg-gradient-to-br from-[#FFE8DE] via-[#FCE4EF] to-white rounded-2xl sm:rounded-[32px] p-4 sm:p-6 border border-[#EFE3EE] shadow-[0_8px_30px_rgba(140,80,120,0.05)] space-y-3.5 sm:space-y-4">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#4C3053] text-white text-xs px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-3.5 h-3.5 text-[#FFA6C0]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white text-[#7B4C7A] flex items-center justify-center shadow-2xs border border-[#EFE1ED]">
            <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-current" />
          </div>
          <div>
            <div className="text-[9px] sm:text-[10px] font-bold tracking-wider text-[#8F7292] uppercase">
              SMART SCHEDULE • WK {postData.weeks}
            </div>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#2A162B] leading-tight">
              Next Nap Predictor
            </h2>
          </div>
        </div>

        <span className="text-[9px] sm:text-[10px] font-semibold bg-white text-[#784776] border border-[#EFE0ED] px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-2xs">
          Wake window: {formatDuration(wakeWindowMins)}
        </span>
      </div>

      {/* Recommended window / Live Sleep card */}
      <div
        className={`rounded-xl sm:rounded-[24px] p-3.5 sm:p-5 border shadow-2xs space-y-2.5 sm:space-y-3 transition-colors duration-300 ${
          isSleeping
            ? 'bg-gradient-to-br from-[#FAF3FB] via-[#F6ECF7] to-white border-[#DEC7DF]'
            : 'bg-white border-[#ECE0EC]'
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          {isSleeping ? (
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9E4875] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#9E4875]"></span>
              </span>
              <span className="text-[11px] sm:text-xs font-bold text-[#6D4270]">
                Currently Asleep (Live Nap Tracker)
              </span>
            </div>
          ) : (
            <span className="text-[11px] sm:text-xs font-bold text-[#6D5270]">
              Recommended sleep window
            </span>
          )}

          <div className="flex items-center gap-1.5 flex-wrap">
            {isSleeping ? (
              <button
                type="button"
                disabled={isLoggingWake}
                onClick={() => handleWakeUp()}
                className="text-[10px] sm:text-xs font-bold bg-[#9E4875] hover:bg-[#863B62] active:scale-95 text-white px-3 sm:px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Sun className="w-3.5 h-3.5 text-[#FFD6E3]" />
                <span>{isLoggingWake ? 'Logging...' : 'Baby Just Woke Up'}</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleStartSleep}
                  className="text-[10px] sm:text-xs font-bold bg-[#7B4C7A] hover:bg-[#683C67] active:scale-95 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <Moon className="w-3.5 h-3.5 fill-current" />
                  <span>Baby Went to Sleep</span>
                </button>
                <button
                  type="button"
                  disabled={isLoggingWake}
                  onClick={() => handleWakeUp(45)}
                  className="text-[9px] sm:text-[10px] font-semibold bg-[#F7EFF6] hover:bg-[#EFE0ED] active:scale-95 text-[#9E4875] px-2.5 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                  title="Quick log wake-up (defaults to 45m)"
                >
                  <Sun className="w-3 h-3" />
                  <span>{isLoggingWake ? 'Logging...' : 'Quick Wake'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {isSleeping ? (
          <div className="flex items-center gap-3 sm:gap-3.5 pt-0.5">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-[#69486F] to-[#9E4875] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Moon className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </div>
            <div>
              <div className="font-serif text-xl sm:text-2xl font-black text-[#2A162B] leading-none">
                Sleeping for {formatDuration(asleepMins)}
              </div>
              <div className="text-[11px] sm:text-xs text-[#826684] mt-1 font-medium">
                Asleep since {sleepingSinceClockStr || 'just now'} • Tracking exact duration
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 sm:gap-3.5 pt-0.5">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-[#9E4875] to-[#DF6385] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="font-serif text-xl sm:text-2xl font-black text-[#2A162B] leading-none">
                {formatRemaining(remainingMins)}
              </div>
              <div className="text-[11px] sm:text-xs text-[#826684] mt-1 font-medium">
                Approx. {predictedClockStr} • Nap #{nextNapNumber} ({formatDuration(minutesSinceWake)} awake)
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Progress Bar */}
        {isSleeping ? (
          <div className="space-y-1.5 pt-0.5 sm:pt-1">
            <div className="w-full bg-[#E8D7E8] h-2 sm:h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#7B4C7A] via-[#9E4875] to-[#DF6385] h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(8, Math.round((asleepMins / 60) * 100)))}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[9px] sm:text-[10px] text-[#8E738E] font-medium px-0.5">
              <span>Fell asleep at {sleepingSinceClockStr || 'now'}</span>
              <span>Tap &ldquo;Baby Just Woke Up&rdquo; when finished</span>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 pt-0.5 sm:pt-1">
            <div className="w-full bg-[#F4E8F2] h-2 sm:h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#DF6385] to-[#7B4C7A] h-full rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[9px] sm:text-[10px] text-[#8E738E] font-medium px-0.5">
              <span>Woke {formatDuration(minutesSinceWake)} ago</span>
              <span>Target: {formatDuration(wakeWindowMins)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tip Callout Box */}
      <div
        className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 border flex items-start gap-2 sm:gap-2.5 transition-colors duration-300 ${
          isSleeping
            ? 'bg-[#F7EFF8] border-[#E8D4EB]'
            : 'bg-[#FFF4EE] border-[#FBE0D4]'
        }`}
      >
        <Lightbulb
          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 mt-0.5 ${
            isSleeping ? 'text-[#8E498E]' : 'text-[#C2623C]'
          }`}
        />
        <p
          className={`text-[11px] sm:text-xs leading-relaxed ${
            isSleeping ? 'text-[#5B3760]' : 'text-[#7A442E]'
          }`}
        >
          {isSleeping ? (
            <>
              <strong className="font-bold text-[#421D47]">Baby is resting:</strong>{' '}
              Keep the room quiet and dimly lit. The live sleep timer is active and will calculate the exact minutes automatically when you tap &ldquo;Baby Just Woke Up&rdquo;.
            </>
          ) : (
            <>
              <strong className="font-bold text-[#5C2B18]">Actionable sleepy cues:</strong>{' '}
              {remainingMins <= 20
                ? `Nap window is approaching within ${formatDuration(remainingMins)}! Dim the lights, swaddle, and start white noise now before overtiredness begins.`
                : 'Watch for subtle cues like gaze aversion, turning head away from lights, red eyebrows, or gentle eye rubbing before fussiness sets in.'}
            </>
          )}
        </p>
      </div>

      {/* Nap Count Selectors */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between pt-0.5 sm:pt-1">
        <div className="text-[11px] sm:text-xs font-bold text-[#634466]">
          Nap target today ({todaySleepCount} of {napTarget} completed)
        </div>
        <div className="flex items-center gap-1.5 bg-[#F2E5F0] p-1 rounded-full self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleSelectNapTarget(3)}
            className={`px-3 sm:px-3.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
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
            className={`px-3 sm:px-3.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
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
