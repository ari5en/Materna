'use client';

import React from 'react';
import { HeroGreeting } from '@/components/shared/HeroGreeting';
import { BabyQuickLogSummary } from '@/components/postpartum/BabyQuickLogSummary';
import { NextNapPredictor } from '@/components/postpartum/NextNapPredictor';
import { MaternalMoodReflection } from '@/components/postpartum/MaternalMoodReflection';
import { NewbornGrowthMilestones } from '@/components/postpartum/NewbornGrowthMilestones';
import { SerenityAudioPlayer } from '@/components/postpartum/SerenityAudioPlayer';

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Serene Hero Greeting with Lotus Header, Date Pill & Featured Cards */}
      <HeroGreeting />

      {/* 2. Responsive Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column (7 cols): unchanged. Its height sets the height of the whole row. */}
        <div className="lg:col-span-7 space-y-6">
          <BabyQuickLogSummary />
          <NextNapPredictor />
          <NewbornGrowthMilestones />
        </div>

        {/* Right Column (5 cols): on wide screens (xl+) it is exactly as tall as the left column,
            and the music player (player + track list side by side) fills the space under the mood card. */}
        <div className="lg:col-span-5 relative">
          <div className="flex flex-col gap-6 xl:absolute xl:inset-0">
            <MaternalMoodReflection />
            <div className="flex-1 min-h-0 flex flex-col [&>*]:flex-1 [&>*]:min-h-0">
              <SerenityAudioPlayer />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}