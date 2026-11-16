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
    <div className="fixed bottom-20 left-4 md:bottom-8 md:right-8 md:left-auto z-40">
      <button
        onClick={() => setIsAiChatOpen(true)}
        aria-label="Ask Materna AI Assistant"
        className="group flex items-center gap-2 bg-gradient-to-r from-[#785780] to-[#503156] hover:from-[#6B4B73] hover:to-[#432649] text-white px-4.5 py-2.5 rounded-full shadow-[0_8px_25px_rgba(80,49,86,0.35)] transition-all active:scale-95 text-xs font-semibold cursor-pointer border border-white/20"
      >
        <span className="w-5 h-5 rounded-full bg-white/95 flex items-center justify-center shrink-0">
          <LotusIcon className="w-3.5 h-3.5" />
        </span>
        <span>Ask Materna AI</span>
      </button>
    </div>
  );
}
