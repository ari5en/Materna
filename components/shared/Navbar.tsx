'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  User,
  Home,
  HeartPulse,
  Smile,
  Sparkles,
  Moon,
  Droplets,
  Baby,
  Check,
} from 'lucide-react';
import { useMaterna } from '@/lib/context/MaternaContext';
import { calculatePostpartumAge, getMinutesSince, formatDuration } from '@/lib/utils';
import { LotusIcon } from './LotusIcon';

const FEED_INTERVAL_MINS = 180; // 3 hours standard newborn feed interval

export function Navbar() {
  const {
    profile,
    babyLogs,
    recoveryLog,
    updateWaterGlasses,
    moodLogs,
    lastWakeTimestamp,
    setIsAiChatOpen,
  } = useMaterna();
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const [clientNowMs, setClientNowMs] = useState<number | undefined>(undefined);
  const [notifPermission, setNotifPermission] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');
  const lastAlertedNapRef = useRef<string | null>(null);
  const notifPopoverRef = useRef<HTMLDivElement | null>(null);
  const notifButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!showNotifications) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        notifPopoverRef.current &&
        !notifPopoverRef.current.contains(target) &&
        notifButtonRef.current &&
        !notifButtonRef.current.contains(target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showNotifications]);

  useEffect(() => {
    const updateClock = () => setClientNowMs(Date.now());
    const timer = setTimeout(updateClock, 0);
    const interval = setInterval(updateClock, 30000);
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission);
    } else {
      setNotifPermission('unsupported');
    }
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const postData = calculatePostpartumAge(profile.baby_birth_date);
  const babyName = profile.baby_name || 'Baby';

  // Dynamic Notification Insights (synchronized with NextNapPredictor)
  const wakeWindowMins = postData.recommendedWakeWindowMins || 75;
  const napTarget = Number(profile.nap_target || 4);
  const awakeMins = Math.min(240, getMinutesSince(lastWakeTimestamp, clientNowMs));
  const remainingNapMins = Math.max(0, wakeWindowMins - awakeMins);

  const isHydrated = clientNowMs !== undefined;
  const effectiveMs = clientNowMs ?? new Date(lastWakeTimestamp).getTime() + 45 * 60000;
  const utcTodayStr = isHydrated ? new Date(effectiveMs).toISOString().split('T')[0] : '';
  const todaySleepCount = utcTodayStr
    ? babyLogs.filter((l) => l.log_type === 'sleep' && l.timestamp.startsWith(utcTodayStr)).length
    : babyLogs.filter((l) => l.log_type === 'sleep').length;
  const nextNapNumber = Math.min(napTarget, todaySleepCount + 1);

  const wakeTimeMs = new Date(lastWakeTimestamp).getTime() || effectiveMs - 45 * 60000;
  const predictedNapDate = new Date(wakeTimeMs + wakeWindowMins * 60000);
  const predictedClockStr = isHydrated
    ? predictedNapDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : '11:30 AM';

  const formatNapRemaining = (mins: number) => {
    if (mins <= 0) return 'Nap Due Now';
    return `In ${formatDuration(mins)}`;
  };

  const lastFeed = babyLogs.find((l) => l.log_type === 'feed');
  const minsSinceFeed = lastFeed ? getMinutesSince(lastFeed.timestamp, clientNowMs) : null;
  const remainingFeedMins =
    minsSinceFeed !== null ? Math.max(0, FEED_INTERVAL_MINS - minsSinceFeed) : 0;

  const todayStr = clientNowMs
    ? (() => {
        const d = new Date(clientNowMs);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate()
        ).padStart(2, '0')}`;
      })()
    : '';
  const hasLoggedMoodToday = todayStr ? moodLogs.some((m) => m.logged_date === todayStr) : false;

  const napDue = remainingNapMins <= 20;
  const feedDue = minsSinceFeed === null || remainingFeedMins <= 15;
  const hydrationPending = (recoveryLog.water_glasses ?? 0) < 8;
  const activeAlertsCount =
    (napDue ? 1 : 0) +
    (feedDue ? 1 : 0) +
    (hydrationPending ? 1 : 0) +
    (!hasLoggedMoodToday ? 1 : 0);

  // Trigger a gentle browser notification once per wake timestamp when nap window is approaching/due
  useEffect(() => {
    if (
      notifPermission === 'granted' &&
      napDue &&
      lastWakeTimestamp &&
      lastAlertedNapRef.current !== lastWakeTimestamp
    ) {
      lastAlertedNapRef.current = lastWakeTimestamp;
      try {
        new Notification(`Materna • ${babyName}'s Nap #${nextNapNumber} (${formatNapRemaining(remainingNapMins)})`, {
          body:
            remainingNapMins <= 0
              ? `${babyName} has reached the ${formatDuration(wakeWindowMins)} wake window (${formatDuration(awakeMins)} awake).`
              : `Approx. ${predictedClockStr} • ${formatDuration(awakeMins)} awake of ${formatDuration(wakeWindowMins)} target. Watch for sleepy cues.`,
        });
      } catch {
        // Ignore if blocked by browser
      }
    }
  }, [
    notifPermission,
    napDue,
    remainingNapMins,
    lastWakeTimestamp,
    babyName,
    wakeWindowMins,
    awakeMins,
    nextNapNumber,
    predictedClockStr,
  ]);

  const handleEnableBrowserAlerts = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
  };

  // Hide on auth/onboarding
  if (pathname.startsWith('/onboarding') || pathname.startsWith('/login')) {
    return null;
  }

  const isHome = pathname === '/' || pathname === '';
  const isRecovery = pathname.startsWith('/recovery');
  const isMood = pathname.startsWith('/mood');
  const isProfile = pathname.startsWith('/profile');

  const navLinks = [
    { href: '/', label: 'Journey', icon: Home, active: isHome },
    { href: '/recovery', label: 'Recovery & Nutrition', icon: HeartPulse, active: isRecovery },
    { href: '/mood', label: 'Mood Logs', icon: Smile, active: isMood },
    { href: '/profile', label: 'Profile', icon: User, active: isProfile },
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-[#F8F3F7]/95 backdrop-blur-md border-b border-[#EFE3EE] transition-all">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between relative">
        {/* Left: Brand Logo & Title */}
        <Link href="/" className="group flex items-center gap-2 sm:gap-2.5 transition-transform duration-200 active:scale-95">
          <div className="transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-6">
            <LotusIcon className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-base sm:text-lg tracking-tight text-[#3A223E] leading-none transition-colors duration-200 group-hover:text-[#9E4875]">
              Materna
            </span>
            <span className="text-[9px] sm:text-[10px] font-medium text-[#8F7292] leading-tight">
              Postpartum • Wk {postData.weeks}
            </span>
          </div>
        </Link>

        {/* Center: Desktop Navigation Bar with Berry Rose active pill */}
        <nav className="hidden md:flex items-center gap-1.5 bg-white/80 backdrop-blur-xs p-1.5 rounded-full border border-[#EBE0EC] shadow-2xs">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ease-out ${
                  item.active
                    ? 'bg-[#9E4875] text-white shadow-xs scale-[1.02]'
                    : 'text-[#7B637E] hover:text-[#2A162B] hover:bg-[#F7EEF6] hover:scale-[1.03] active:scale-95'
                }`}
              >
                <Icon className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Notifications */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            ref={notifButtonRef}
            type="button"
            onClick={() => setShowNotifications((v) => !v)}
            aria-label="Notifications"
            className="hover-bell w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white text-[#58395D] flex items-center justify-center hover:bg-[#FDF9FD] hover:border-[#DEC5DB] hover:shadow-xs transition-all duration-200 active:scale-95 relative shadow-2xs border border-[#EBE0EC] cursor-pointer"
          >
            <Bell className="w-4 h-4 transition-transform duration-200" />
            {isHydrated && activeAlertsCount > 0 && (
              <span
                suppressHydrationWarning
                className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#DE6082] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse"
              >
                {activeAlertsCount}
              </span>
            )}
          </button>
        </div>

        {/* Live Notifications Popover */}
        {showNotifications && (
          <div
            ref={notifPopoverRef}
            className="absolute right-3 sm:right-6 top-12 sm:top-13 w-[calc(100vw-1.5rem)] sm:w-80 max-w-sm bg-white/98 backdrop-blur-md rounded-2xl border border-[#ECE0EC] shadow-2xl p-3.5 sm:p-4 space-y-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-[#F2E8F1]">
              <span className="text-xs font-bold text-[#2A162B]">
                Notification ({activeAlertsCount})
              </span>
              <button
                type="button"
                onClick={() => setShowNotifications(false)}
                className="text-[10px] font-semibold text-[#9E4875] cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {/* 1. Nap Window Reminder -> directs to Journey (/) */}
              <Link
                href="/"
                onClick={() => setShowNotifications(false)}
                className={`p-2.5 rounded-xl border flex items-start gap-2 transition-colors ${
                  napDue
                    ? 'bg-[#FFF4F8] hover:bg-[#FCE8F0] border-[#F8D0DF]'
                    : 'bg-[#F9F6FA]/70 hover:bg-[#F3EDF5] border-[#EDE4EE]'
                }`}
              >
                <Moon
                  className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                    napDue ? 'text-[#9E4875]' : 'text-[#B29BB4]'
                  }`}
                />
                <div>
                  <div
                    className={
                      napDue ? 'font-bold text-[#2A162B]' : 'font-normal text-[#8E7690]'
                    }
                  >
                    {remainingNapMins > 0
                      ? `${babyName}'s Next Nap: ${formatNapRemaining(remainingNapMins)}`
                      : `${babyName}'s Nap Window: Nap Due Now`}
                  </div>
                  <div
                    className={`text-[10px] ${
                      napDue ? 'text-[#6E4D70]' : 'text-[#A892AA]'
                    }`}
                  >
                    Approx. {predictedClockStr} • Nap #{nextNapNumber} ({formatDuration(awakeMins)} awake / {formatDuration(wakeWindowMins)} target)
                  </div>
                </div>
              </Link>

              {/* 2. Feed Interval Reminder -> directs to Journey (/) */}
              <Link
                href="/"
                onClick={() => setShowNotifications(false)}
                className={`p-2.5 rounded-xl border flex items-start gap-2 transition-colors ${
                  feedDue
                    ? 'bg-[#FFF4F8] hover:bg-[#FCE8F0] border-[#F8D0DF]'
                    : 'bg-[#F9F6FA]/70 hover:bg-[#F3EDF5] border-[#EDE4EE]'
                }`}
              >
                <Baby
                  className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                    feedDue ? 'text-[#9E4875]' : 'text-[#B29BB4]'
                  }`}
                />
                <div>
                  <div
                    className={
                      feedDue ? 'font-bold text-[#2A162B]' : 'font-normal text-[#8E7690]'
                    }
                  >
                    {minsSinceFeed === null
                      ? `Log ${babyName}'s First Feed Today`
                      : remainingFeedMins > 0
                      ? `Next Feed Window in ~${formatDuration(remainingFeedMins)}`
                      : `${babyName}'s 3h Feed Window is Due`}
                  </div>
                  <div
                    className={`text-[10px] ${
                      feedDue ? 'text-[#6E4D70]' : 'text-[#A892AA]'
                    }`}
                  >
                    {minsSinceFeed !== null
                      ? `Last fed ${formatDuration(minsSinceFeed)} ago • 3h newborn rhythm`
                      : 'Tap Quick-Log on the Journey page'}
                  </div>
                </div>
              </Link>

              {/* 3. Hydration Reminder + Quick +1 Glass -> directs to Recovery (/recovery) */}
              <div
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                  hydrationPending
                    ? 'bg-[#FFF4F8] hover:bg-[#FCE8F0] border-[#F8D0DF]'
                    : 'bg-[#F9F6FA]/70 hover:bg-[#F3EDF5] border-[#EDE4EE]'
                }`}
              >
                <Link
                  href="/recovery"
                  onClick={() => setShowNotifications(false)}
                  className="flex items-start gap-2 flex-1"
                >
                  <Droplets
                    className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                      hydrationPending ? 'text-[#9E4875]' : 'text-[#B29BB4]'
                    }`}
                  />
                  <div>
                    <div
                      className={
                        hydrationPending
                          ? 'font-bold text-[#2A162B]'
                          : 'font-normal text-[#8E7690]'
                      }
                    >
                      Hydration: {recoveryLog.water_glasses} / 10 Glasses
                    </div>
                    <div
                      className={`text-[10px] ${
                        hydrationPending ? 'text-[#6E4D70]' : 'text-[#A892AA]'
                      }`}
                    >
                      {hydrationPending ? 'Stay hydrated for lactation' : 'Daily hydration goal met ✓'}
                    </div>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => updateWaterGlasses((recoveryLog.water_glasses || 0) + 1)}
                  className={`px-2.5 py-1 rounded-full text-[10px] shrink-0 cursor-pointer transition-colors ${
                    hydrationPending
                      ? 'bg-[#9E4875] hover:bg-[#8B3B64] text-white font-bold'
                      : 'bg-[#EBE0EC] hover:bg-[#E1D2E3] text-[#7D607E] font-medium'
                  }`}
                >
                  +1 Glass
                </button>
              </div>

              {/* 4. Daily Mood Check-in Reminder -> directs to Mood Logs (/mood) */}
              <Link
                href="/mood"
                onClick={() => setShowNotifications(false)}
                className={`p-2.5 rounded-xl border flex items-start gap-2 transition-colors ${
                  !hasLoggedMoodToday
                    ? 'bg-[#FFF4F8] hover:bg-[#FCE8F0] border-[#F8D0DF]'
                    : 'bg-[#F9F6FA]/70 hover:bg-[#F3EDF5] border-[#EDE4EE]'
                }`}
              >
                <Smile
                  className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                    !hasLoggedMoodToday ? 'text-[#9E4875]' : 'text-[#B29BB4]'
                  }`}
                />
                <div>
                  <div
                    className={
                      !hasLoggedMoodToday
                        ? 'font-bold text-[#2A162B]'
                        : 'font-normal text-[#8E7690]'
                    }
                  >
                    {hasLoggedMoodToday ? 'Today’s Mood Logged ✓' : 'Daily Mood Check-In Pending'}
                  </div>
                  <div
                    className={`text-[10px] ${
                      !hasLoggedMoodToday ? 'text-[#6E4D70]' : 'text-[#A892AA]'
                    }`}
                  >
                    {hasLoggedMoodToday ? 'View your 7-day trend' : 'Take 5 seconds to reflect'}
                  </div>
                </div>
              </Link>
            </div>

            {/* Browser Notification Opt-In */}
            {notifPermission !== 'unsupported' && (
              <div className="pt-2 border-t border-[#F2E8F1] flex items-center justify-between text-[10px]">
                <span className="text-[#7D607E] font-medium">
                  {notifPermission === 'granted'
                    ? 'Browser nap alerts enabled'
                    : 'Get browser alerts when nap is due'}
                </span>
                {notifPermission === 'granted' ? (
                  <span className="text-[#2E7D32] font-bold flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> Active
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleEnableBrowserAlerts}
                    className="font-bold text-[#9E4875] hover:underline cursor-pointer"
                  >
                    Enable
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}