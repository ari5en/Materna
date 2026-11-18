'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AlertCircle, X } from 'lucide-react';
import { MobileFrame } from '@/components/shared/MobileFrame';
import { Navbar } from '@/components/shared/Navbar';
import { BottomNav } from '@/components/shared/BottomNav';
import { FloatingAiButton } from '@/components/shared/FloatingAiButton';
import { AiAssistantModal } from '@/components/shared/AiAssistantModal';
import { useMaterna } from '@/lib/context/MaternaContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isInitialized, isAuthenticated, profile, syncError, clearSyncError } = useMaterna();

  const needsLogin = isInitialized && !isAuthenticated;
  const needsOnboarding = isInitialized && isAuthenticated && !profile.onboarded;

  useEffect(() => {
    if (needsLogin) router.replace('/login');
    else if (needsOnboarding) router.replace('/onboarding');
  }, [needsLogin, needsOnboarding, router]);

  // Auto-dismiss save errors
  useEffect(() => {
    if (!syncError) return;
    const t = setTimeout(clearSyncError, 6000);
    return () => clearTimeout(t);
  }, [syncError, clearSyncError]);

  return (
    <div className="w-full min-h-screen bg-[#F8F3F7] text-[#2C1D30] flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-6xl mx-auto pb-28 md:pb-12 pt-3 sm:pt-4 px-3 sm:px-6 lg:px-8">
        <div key={pathname} className="page-enter">
          {children}
        </div>
      </main>
      <FloatingAiButton />
      <BottomNav />
      <AiAssistantModal />

      {syncError && (
        <div
          role="alert"
          className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] max-w-sm w-[92%] p-3.5 rounded-2xl bg-[#FFF2F5] border border-[#FAD4DE] text-xs text-[#9E2B4B] shadow-lg flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#C93B63]" />
          <span className="flex-1 leading-relaxed">{syncError}</span>
          <button type="button" onClick={clearSyncError} aria-label="Dismiss" className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
