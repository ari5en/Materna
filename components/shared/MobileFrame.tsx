'use client';

import React from 'react';

export function MobileFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-screen bg-[#F8F3F7] text-[#2C1D30] flex flex-col">
      <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col relative min-h-screen">
        {children}
      </div>
    </div>
  );
}
