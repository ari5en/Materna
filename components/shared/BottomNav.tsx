'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, HeartPulse, Smile, User } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  // Hide on auth/onboarding
  if (pathname.startsWith('/onboarding') || pathname.startsWith('/login')) {
    return null;
  }

  const isHome = pathname === '/' || pathname === '';
  const isRecovery = pathname.startsWith('/recovery');
  const isMood = pathname.startsWith('/mood');
  const isProfile = pathname.startsWith('/profile');

  return (
    <nav
      aria-label="Bottom Navigation"
      className="md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-40 flex justify-center pointer-events-none pb-safe w-full max-w-md px-2.5 sm:px-3"
    >
      <div className="w-full bg-white/95 backdrop-blur-xl border border-[#EFE1ED] rounded-full shadow-[0_8px_30px_rgba(140,80,120,0.08)] px-2 sm:px-2.5 py-1 sm:py-1.5 flex items-center justify-around gap-1 pointer-events-auto">
        {/* Today / Home Tab */}
        <Link
          href="/"
          className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs font-bold transition-all duration-200 active:scale-90 min-h-[40px] sm:min-h-[44px] ${
            isHome
              ? 'bg-[#9E4875] text-white shadow-xs scale-105'
              : 'text-[#7B617D] hover:text-[#2A162B] hover:bg-[#F9EFF6]'
          }`}
        >
          <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200" />
          <span className="text-[10px] sm:text-[11px] font-semibold">Today</span>
        </Link>

        {/* Recovery & Nutrition Tab */}
        <Link
          href="/recovery"
          className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs font-bold transition-all duration-200 active:scale-90 min-h-[40px] sm:min-h-[44px] ${
            isRecovery
              ? 'bg-[#9E4875] text-white shadow-xs scale-105'
              : 'text-[#7B617D] hover:text-[#2A162B] hover:bg-[#F9EFF6]'
          }`}
        >
          <HeartPulse className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200" />
          <span className="text-[10px] sm:text-[11px] font-semibold">Recovery</span>
        </Link>

        {/* Mood Logs Tab */}
        <Link
          href="/mood"
          className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs font-bold transition-all duration-200 active:scale-90 min-h-[40px] sm:min-h-[44px] ${
            isMood
              ? 'bg-[#9E4875] text-white shadow-xs scale-105'
              : 'text-[#7B617D] hover:text-[#2A162B] hover:bg-[#F9EFF6]'
          }`}
        >
          <Smile className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200" />
          <span className="text-[10px] sm:text-[11px] font-semibold">Mood</span>
        </Link>

        {/* Profile Tab */}
        <Link
          href="/profile"
          className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs font-bold transition-all duration-200 active:scale-90 min-h-[40px] sm:min-h-[44px] ${
            isProfile
              ? 'bg-[#9E4875] text-white shadow-xs scale-105'
              : 'text-[#7B617D] hover:text-[#2A162B] hover:bg-[#F9EFF6]'
          }`}
        >
          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200" />
          <span className="text-[10px] sm:text-[11px] font-semibold">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
