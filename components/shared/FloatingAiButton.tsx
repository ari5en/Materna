'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { useMaterna } from '@/lib/context/MaternaContext';
import { LotusIcon } from './LotusIcon';

export function FloatingAiButton() {
  const pathname = usePathname();
  const { setIsAiChatOpen } = useMaterna();

  // Hide on onboarding/login
  if (pathname.startsWith('/onboarding') || pathname.startsWith('/login')) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-3 sm:right-4 md:bottom-8 md:right-8 z-40">
      <button
        onClick={() => setIsAiChatOpen(true)}
        aria-label="Ask Materna AI Assistant"
        className="group flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-[#785780] to-[#503156] hover:from-[#6B4B73] hover:to-[#432649] text-white px-3.5 sm:px-4.5 py-2 sm:py-2.5 rounded-full shadow-[0_8px_25px_rgba(80,49,86,0.35)] hover:shadow-[0_12px_32px_rgba(80,49,86,0.45)] hover:-translate-y-0.5 transition-all duration-300 active:scale-95 text-[11px] sm:text-xs font-semibold cursor-pointer border border-white/20 animate-gentle-float"
      >
        <span className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-white/95 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
          <LotusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </span>
        <span className="tracking-wide">Ask Materna AI</span>
      </button>
    </div>
  );
}
