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
import { calculatePostpartumAge, getMinutesSince } from '@/lib/utils';
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
  // First letter of the mother's name, shown in the avatar badge
  const motherInitial = (profile.full_name?.trim()?.[0] ?? 'M').toUpperCase();

  // Dynamic Notification Insights
  const wakeWindowMins = postData.recommendedWakeWindowMins || 75;
  const awakeMins = getMinutesSince(lastWakeTimestamp, clientNowMs);
  const remainingNapMins = Math.max(0, wakeWindowMins - awakeMins);

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

  const napDue = remainingNapMins <= 15;
  const feedDue = minsSinceFeed === null || remainingFeedMins <= 15;
  const hydrationPending = (recoveryLog.water_glasses ?? 0) < 8;
  const activeAlertsCount =
    (napDue ? 1 : 0) +
    (feedDue ? 1 : 0) +
    (hydrationPending ? 1 : 0) +
    (!hasLoggedMoodToday ? 1 : 0);

  // Trigger a gentle browser notification once per wake timestamp when nap window is due
  useEffect(() => {
    if (
      notifPermission === 'granted' &&
      remainingNapMins === 0 &&
      lastWakeTimestamp &&
      lastAlertedNapRef.current !== lastWakeTimestamp
    ) {
      lastAlertedNapRef.current = lastWakeTimestamp;
      try {
        new Notification(`Materna • ${babyName}'s Nap Window`, {
          body: `${babyName} has reached the ${wakeWindowMins}-minute wake window. Watch for sleepy cues.`,
        });
      } catch {
        // Ignore if blocked by browser
      }
    }
  }, [notifPermission, remainingNapMins, lastWakeTimestamp, babyName, wakeWindowMins]);

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
    <header className="sticky top-0 z-30 w-full bg-[#F8F3F7]/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 border-b border-[#EFE3EE]/80 transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between relative">
        {/* Left: Mother Avatar (initial) & Brand */}
        <div className="flex items-center gap-3">
          <Link href="/profile" className="relative group shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#DE9FA8] to-[#FCD9CE] p-0.5 shadow-sm border border-white">
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#9E4875] to-[#DF6385] text-white flex items-center justify-center font-serif text-base font-bold select-none">
                {motherInitial}
              </div>
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#78A890] ring-2 ring-white"></span>
          </Link>

          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#F3E7F2] text-[#69486F] flex items-center justify-center shadow-2xs">
              <LotusIcon className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-lg tracking-tight text-[#3A223E] leading-none">
                Materna
              </span>
              <span className="text-[10px] font-medium text-[#8F7292] leading-tight">
                Postpartum • Wk {postData.weeks}
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Desktop Navigation Bar with Berry Rose active pill */}
        <nav className="hidden md:flex items-center gap-1.5 bg-white/80 p-1.5 rounded-full border border-[#EBE0EC] shadow-2xs">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  item.active
                    ? 'bg-[#9E4875] text-white shadow-xs'
                    : 'text-[#7B637E] hover:text-[#381F3C] hover:bg-[#F7EEF6]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Ask AI + Notifications */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAiChatOpen(true)}
            aria-label="Ask Materna AI"
            className="hidden sm:flex items-center gap-1.5 bg-[#69486F] hover:bg-[#57395D] text-white text-xs font-semibold px-4 py-2 rounded-full shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FADCE8]" />
            <span>Ask AI</span>
          </button>

          <button
            type="button"
            onClick={() => setShowNotifications((v) => !v)}
            aria-label="Notifications"
            className="w-9 h-9 rounded-full bg-white text-[#58395D] flex items-center justify-center hover:bg-[#FDF9FD] transition-colors relative shadow-2xs border border-[#EBE0EC] cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {activeAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#DE6082] text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                {activeAlertsCount}
              </span>
            )}
          </button>

        </div>

        {/* Live Sanctuary Reminders Popover */}
        {showNotifications && (
          <div className="absolute right-0 top-13 w-80 bg-white rounded-2xl border border-[#ECE0EC] shadow-xl p-4 space-y-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#F2E8F1]">
              <span className="text-xs font-bold text-[#2A162B]">
                Sanctuary Pulse ({activeAlertsCount} active)
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
              {/* 1. Nap Window Reminder */}
              <div
                className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                  napDue ? 'bg-[#FFF4F7] border-[#FAD9E2]' : 'bg-[#FAF4F9] border-[#EFE2EE]'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-[#9E4875] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#2A162B]">
                    {remainingNapMins > 0
                      ? `${babyName}'s Next Nap in ${remainingNapMins}m`
                      : `${babyName}'s Nap Window is Due`}
                  </div>
                  <div className="text-[10px] text-[#7D607E]">
                    Wake window target: {wakeWindowMins} mins (awake {awakeMins}m)
                  </div>
                </div>
              </div>

              {/* 2. Feed Interval Reminder */}
              <div
                className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                  feedDue ? 'bg-[#FFF4F7] border-[#FAD9E2]' : 'bg-[#FAF4F9] border-[#EFE2EE]'
                }`}
              >
                <Baby className="w-3.5 h-3.5 text-[#9E4875] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#2A162B]">
                    {minsSinceFeed === null
                      ? `Log ${babyName}'s First Feed Today`
                      : remainingFeedMins > 0
                      ? `Next Feed Window in ~${remainingFeedMins}m`
                      : `${babyName}'s 3h Feed Window is Due`}
                  </div>
                  <div className="text-[10px] text-[#7D607E]">
                    {minsSinceFeed !== null
                      ? `Last fed ${minsSinceFeed}m ago • 3h newborn rhythm`
                      : 'Tap Quick-Log on the Journey page'}
                  </div>
                </div>
              </div>

              {/* 3. Hydration Reminder + Quick +1 Glass */}
              <div className="p-2.5 rounded-xl bg-[#FAF4F9] border border-[#EFE2EE] flex items-center justify-between gap-2">
                <Link
                  href="/recovery"
                  onClick={() => setShowNotifications(false)}
                  className="flex items-start gap-2 flex-1"
                >
                  <Droplets className="w-3.5 h-3.5 text-[#9E4875] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-[#2A162B]">
                      Hydration: {recoveryLog.water_glasses} / 10 Glasses
                    </div>
                    <div className="text-[10px] text-[#7D607E]">
                      {hydrationPending ? 'Stay hydrated for lactation' : 'Daily hydration goal met ✓'}
                    </div>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => updateWaterGlasses((recoveryLog.water_glasses || 0) + 1)}
                  className="px-2.5 py-1 rounded-full bg-[#9E4875] hover:bg-[#8B3B64] text-white text-[10px] font-bold shrink-0 cursor-pointer"
                >
                  +1 Glass
                </button>
              </div>

              {/* 4. Daily Mood Check-in Reminder */}
              <Link
                href="/mood"
                onClick={() => setShowNotifications(false)}
                className="p-2.5 rounded-xl bg-[#FAF4F9] hover:bg-[#F4E9F3] border border-[#EFE2EE] flex items-start gap-2 transition-colors"
              >
                <Smile className="w-3.5 h-3.5 text-[#9E4875] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#2A162B]">
                    {hasLoggedMoodToday ? 'Today’s Mood Logged ✓' : 'Daily Mood Check-In Pending'}
                  </div>
                  <div className="text-[10px] text-[#7D607E]">
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