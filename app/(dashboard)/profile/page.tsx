'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Baby,
  Check,
  ShieldCheck,
  LogOut,
  Sparkles,
  Download,
} from 'lucide-react';
import { useMaterna } from '@/lib/context/MaternaContext';
import { calculatePostpartumAge } from '@/lib/utils';
import { LotusIcon } from '@/components/shared/LotusIcon';

export default function ProfilePage() {
  const router = useRouter();
  const { profile, updateProfile, userEmail, isAuthenticated, signOut } = useMaterna();
  const postData = calculatePostpartumAge(profile.baby_birth_date);

  const [fullNameDraft, setFullNameDraft] = useState<string | null>(null);
  const [babyNameDraft, setBabyNameDraft] = useState<string | null>(null);
  const [birthDateDraft, setBirthDateDraft] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const fullName = fullNameDraft ?? (profile.full_name || 'Mama');
  const babyName = babyNameDraft ?? (profile.baby_name || 'Baby');
  const babyBirthDate = birthDateDraft ?? (profile.baby_birth_date ? profile.baby_birth_date.split('T')[0] : '');

  // First letter of the mother's name, used for the avatar badge
  const motherInitial = (profile.full_name?.trim()?.[0] ?? 'M').toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleRerunOnboarding = async () => {
    await updateProfile({ onboarded: false });
    router.push('/onboarding');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      full_name: fullName,
      baby_name: babyName,
      baby_birth_date: babyBirthDate,
    });
    setFullNameDraft(null);
    setBabyNameDraft(null);
    setBirthDateDraft(null);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Responsive Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Left Column (5 cols): Header, Journey Status & Resources */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-6">
          {/* Profile Header Card */}
          <section className="bg-gradient-to-br from-[#FFE8DE] via-[#FCE4EF] to-white rounded-2xl sm:rounded-[32px] p-4 sm:p-6 border border-[#EFE3EE] shadow-[0_8px_30px_rgba(140,80,120,0.06)] flex items-center gap-3 sm:gap-4 relative overflow-hidden">
            <div
              aria-hidden="true"
              className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-[#9E4875] to-[#DF6385] text-white flex items-center justify-center font-serif text-xl sm:text-2xl font-bold shadow-md shrink-0 border-2 border-white select-none"
            >
              {motherInitial}
            </div>
            <div>
              <div className="text-[9px] sm:text-[10px] font-bold text-[#8F7292] uppercase tracking-wider flex items-center gap-1">
                <LotusIcon className="w-3.5 h-3.5 text-[#9E4875]" />
                <span>MOTHER SANCTUARY PROFILE</span>
              </div>
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#2A162B]">{profile.full_name || 'Mama'}</h1>
              <p className="text-[11px] sm:text-xs text-[#7A617D]">
                Mother of {profile.baby_name || 'Baby'} • Week {postData.weeks} Postpartum
              </p>
              {isAuthenticated && userEmail && (
                <p className="text-[9px] sm:text-[10px] font-semibold text-[#9E4875] mt-0.5">
                  Signed in as {userEmail}
                </p>
              )}
            </div>
          </section>

          {/* Postpartum Journey Summary */}
          <section className="bg-white rounded-2xl sm:rounded-[32px] p-4 sm:p-6 border border-[#EFE3EE] shadow-[0_8px_30px_rgba(140,80,120,0.05)] space-y-3 sm:space-y-4">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#2A162B] flex items-center gap-2">
              <Baby className="w-4 h-4 sm:w-5 sm:h-5 text-[#9E4875]" />
              <span>Fourth Trimester Journey Status</span>
            </h2>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="bg-[#FAF4F9] p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-[#EFE2EE]">
                <span className="text-[9px] sm:text-[10px] font-semibold text-[#8C728C]">Postpartum Age</span>
                <div className="font-serif text-sm sm:text-base font-black text-[#2A162B]">
                  {postData.weeks} Wks, {postData.days} Days
                </div>
                <div className="text-[9px] sm:text-[10px] text-[#9E4875] mt-0.5 font-bold">{postData.totalDays} Total Days</div>
              </div>

              <div className="bg-[#FAF4F9] p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-[#EFE2EE]">
                <span className="text-[9px] sm:text-[10px] font-semibold text-[#8C728C]">Recovery Stage</span>
                <div className="font-serif text-xs sm:text-sm font-bold text-[#2A162B] leading-tight">
                  {postData.recoveryStage}
                </div>
                <div className="text-[9px] sm:text-[10px] text-[#9E4875] mt-0.5 font-bold">{postData.pelvicFloorStage}</div>
              </div>
            </div>
          </section>

          {/* Account Navigation / Switch User */}
          <section className="bg-white rounded-xl sm:rounded-[28px] p-3 sm:p-4 border border-[#EFE3EE] shadow-xs flex items-center justify-between">
            <button
              type="button"
              onClick={handleRerunOnboarding}
              className="text-[11px] sm:text-xs font-semibold text-[#845E87] hover:text-[#543657] flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Re-run Onboarding Setup</span>
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-[11px] sm:text-xs font-semibold text-[#A8486E] hover:text-[#7A2C4D] flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isAuthenticated ? 'Sign Out' : 'Switch Account'}</span>
            </button>
          </section>
        </div>

        {/* Right Column (7 cols): Edit Profile Form & Data Export */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-6">
          <section className="bg-white rounded-2xl sm:rounded-[32px] p-4 sm:p-8 border border-[#EFE3EE] shadow-[0_8px_30px_rgba(140,80,120,0.05)] space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-base sm:text-lg font-bold text-[#2A162B] flex items-center gap-2">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#9E4875]" />
                <span>Profile &amp; Baby Information</span>
              </h2>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 sm:space-y-4">
              <div>
                <label className="text-[11px] sm:text-xs font-bold text-[#5D415F] block mb-1">
                  Mother&apos;s Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullNameDraft(e.target.value)}
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-[#FAF5FA] border border-[#ECE0EB] text-xs text-[#2A162B] font-medium focus:outline-hidden focus:ring-1 focus:ring-[#9E4875]"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs font-bold text-[#5D415F] block mb-1">
                  Baby&apos;s Name
                </label>
                <input
                  type="text"
                  value={babyName}
                  onChange={(e) => setBabyNameDraft(e.target.value)}
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-[#FAF5FA] border border-[#ECE0EB] text-xs text-[#2A162B] font-medium focus:outline-hidden focus:ring-1 focus:ring-[#9E4875]"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs font-bold text-[#5D415F] block mb-1">
                  Baby&apos;s Birth Date
                </label>
                <input
                  type="date"
                  value={babyBirthDate}
                  onChange={(e) => setBirthDateDraft(e.target.value)}
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-[#FAF5FA] border border-[#ECE0EB] text-xs text-[#2A162B] font-medium focus:outline-hidden focus:ring-1 focus:ring-[#9E4875]"
                  required
                />
                <p className="text-[9px] sm:text-[10px] text-[#8C728C] mt-1">
                  Used to calculate wake windows, growth percentiles, and pelvic floor checkpoints.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSaved}
                className="w-full py-3 sm:py-3.5 rounded-full bg-[#9E4875] hover:bg-[#893861] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-80 mt-1 sm:mt-2"
              >
                {isSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#FADCE8]" />
                    <span>Profile Saved</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </form>
          </section>

          {/* Data Privacy, Export & Account Controls */}
          <section className="bg-white rounded-2xl sm:rounded-[32px] p-4 sm:p-8 border border-[#EFE3EE] shadow-[0_8px_30px_rgba(140,80,120,0.05)] space-y-3.5 sm:space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-base sm:text-lg font-bold text-[#2A162B] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#9E4875]" />
                  <span>Data Export &amp; Privacy Controls</span>
                </h2>
                <p className="text-[11px] sm:text-xs text-[#7A617D] mt-0.5">
                  Download a full copy of your baby care logs, growth records, and maternal reflections for your pediatrician or OB/GYN.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-0.5 sm:pt-1">
              <a
                href="/api/user/export?format=csv"
                download
                className="py-2.5 sm:py-3 px-3.5 sm:px-4 rounded-xl sm:rounded-2xl bg-[#FAF4F9] hover:bg-[#F3E7F2] border border-[#EBDDE9] text-[#553658] font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#9E4875]" />
                <span>Export Logs (.CSV)</span>
              </a>
              <a
                href="/api/user/export?format=json"
                download
                className="py-2.5 sm:py-3 px-3.5 sm:px-4 rounded-xl sm:rounded-2xl bg-[#FAF4F9] hover:bg-[#F3E7F2] border border-[#EBDDE9] text-[#553658] font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#9E4875]" />
                <span>Export Full Backup (.JSON)</span>
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}