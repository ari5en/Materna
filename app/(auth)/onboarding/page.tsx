'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useMaterna } from '@/lib/context/MaternaContext';
import { LotusIcon } from '@/components/shared/LotusIcon';
import {
  type UnitSystem,
  weightFromLbs,
  lengthFromIn,
  weightToLbs,
  lengthToIn,
  weightUnitLabel,
  lengthUnitLabel,
  kgToLbs,
  lbsToKg,
  cmToIn,
  inToCm,
  round1,
} from '@/lib/units';

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, isInitialized, isAuthenticated } = useMaterna();

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) router.replace('/login');
    else if (profile.onboarded) router.replace('/');
  }, [isInitialized, isAuthenticated, profile.onboarded, router]);

  if (!isInitialized || !isAuthenticated || profile.onboarded) {
    return (
      <div className="min-h-screen bg-[#F8F3F7] flex items-center justify-center">
        <LotusIcon className="w-10 h-10 text-[#9E4875] animate-pulse" />
      </div>
    );
  }

  // Mounted only after the profile has loaded, so initial values come straight from the account
  return (
    <OnboardingForm
      initialFullName={profile.full_name && profile.full_name !== 'Mama' ? profile.full_name : ''}
      initialBabyName={profile.baby_name && profile.baby_name !== 'Baby' ? profile.baby_name : ''}
      initialBirthDate={profile.baby_birth_date ? profile.baby_birth_date.split('T')[0] : ''}
      initialWeightLbs={profile.baby_weight_lbs ?? null}
      initialLengthIn={profile.baby_length_in ?? null}
    />
  );
}

function OnboardingForm({
  initialFullName,
  initialBabyName,
  initialBirthDate,
  initialWeightLbs,
  initialLengthIn,
}: {
  initialFullName: string;
  initialBabyName: string;
  initialBirthDate: string;
  initialWeightLbs: number | null;
  initialLengthIn: number | null;
}) {
  const router = useRouter();
  const { updateProfile, addGrowthMeasurement } = useMaterna();

  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState(initialFullName);
  const [babyName, setBabyName] = useState(initialBabyName);
  const [birthDate, setBirthDate] = useState(initialBirthDate);
  const [todayStr, setTodayStr] = useState('');
  const [unit, setUnit] = useState<UnitSystem>('metric');
  const [babyWeight, setBabyWeight] = useState(() =>
    initialWeightLbs != null ? String(weightFromLbs(initialWeightLbs, 'metric')) : ''
  );
  const [babyLength, setBabyLength] = useState(() =>
    initialLengthIn != null ? String(lengthFromIn(initialLengthIn, 'metric')) : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const d = new Date();
    const t = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setTodayStr(t);
    // Preserve existing birth date if available; never overwrite with today's date
    if (initialBirthDate) {
      setBirthDate(initialBirthDate);
    }
  }, [initialBirthDate]);

  const handleUnitChange = (next: UnitSystem) => {
    if (next === unit) return;
    const convert = (value: string, fn: (n: number) => number) => {
      const n = parseFloat(value);
      return Number.isFinite(n) && n > 0 ? String(round1(fn(n))) : value;
    };
    if (next === 'metric') {
      setBabyWeight((prev) => convert(prev, lbsToKg));
      setBabyLength((prev) => convert(prev, inToCm));
    } else {
      setBabyWeight((prev) => convert(prev, kgToLbs));
      setBabyLength((prev) => convert(prev, cmToIn));
    }
    setUnit(next);
  };

  // Step 1: names & birth date
  const handleContinue = () => {
    if (!fullName.trim() || !babyName.trim()) {
      setErrorMsg('Please enter your name and your baby’s name.');
      return;
    }
    if (!birthDate || birthDate > todayStr) {
      setErrorMsg('Please choose your baby’s birth date (it can’t be in the future).');
      return;
    }
    setErrorMsg(null);
    setStep(2);
  };

  // Step 2: weight & length. Returns the values to save (lbs / in), or null if invalid.
  const validateMeasurements = (): { weightLbs: number; lengthIn: number } | null => {
    const parsedWeight = parseFloat(babyWeight);
    const parsedLength = parseFloat(babyLength);

    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0 || !Number.isFinite(parsedLength) || parsedLength <= 0) {
      setErrorMsg(
        `Please enter your baby’s weight (${weightUnitLabel(unit)}) and length (${lengthUnitLabel(unit)}).`
      );
      return null;
    }

    const weightLbs = weightToLbs(parsedWeight, unit);
    const lengthIn = lengthToIn(parsedLength, unit);

    if (weightLbs < 2 || weightLbs > 55) {
      setErrorMsg(
        unit === 'metric'
          ? 'Please enter a valid baby weight between 1.0 kg and 25.0 kg.'
          : 'Please enter a valid baby weight between 2.0 lbs and 55.0 lbs.'
      );
      return null;
    }

    if (lengthIn < 12 || lengthIn > 45) {
      setErrorMsg(
        unit === 'metric'
          ? 'Please enter a valid baby length between 30 cm and 115 cm.'
          : 'Please enter a valid baby length between 12 in and 45 in.'
      );
      return null;
    }

    return { weightLbs, lengthIn };
  };

  const handleFinish = async () => {
    const measurements = validateMeasurements();
    if (!measurements) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const ok = await updateProfile({
      full_name: fullName.trim(),
      baby_name: babyName.trim(),
      baby_birth_date: birthDate,
      baby_weight_lbs: measurements.weightLbs,
      baby_length_in: measurements.lengthIn,
      onboarded: true,
    });
    if (!ok) {
      setErrorMsg('We could not save your profile. Please try again.');
      setIsSubmitting(false);
      return;
    }

    // Seed the growth history so the WHO percentile tracker has a baseline
    await addGrowthMeasurement({
      weight_lbs: measurements.weightLbs,
      length_in: measurements.lengthIn,
    });

    router.replace('/');
  };

  const wLabel = weightUnitLabel(unit);
  const lLabel = lengthUnitLabel(unit);

  return (
    <div className="min-h-screen bg-[#F8F3F7] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md sm:max-w-lg bg-white rounded-[32px] p-6 sm:p-10 border border-[#EFE3EE] shadow-[0_10px_35px_rgba(140,80,120,0.06)] space-y-6 animate-in fade-in duration-200">
        {/* Progress indicator */}
        <div className="flex items-center justify-between text-xs font-bold text-[#8E738E]">
          <div className="flex items-center gap-1.5 text-[#9E4875]">
            <LotusIcon className="w-4 h-4" />
            <span>Postpartum Onboarding</span>
          </div>
          <span>Step {step} of 2</span>
        </div>

        <div className="w-full bg-[#F3E7F2] h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#9E4875] h-full transition-all duration-300"
            style={{ width: `${(step / 2) * 100}%` }}
          ></div>
        </div>

        {/* Step 1: Mother & Baby's Baseline Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2A162B]">
                Start Your Journey
              </h1>
              <p className="text-xs text-[#7A617D] leading-relaxed">
                Personalize your fourth-trimester sanctuary for you and your newborn.
              </p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#5B3F5D] block mb-1">
                  What should we call you? (Mother&apos;s Name)
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Sarah"
                  className="w-full px-4 py-3 rounded-2xl bg-[#FAF5FA] border border-[#ECE0EB] text-xs text-[#2A162B] font-medium focus:outline-hidden focus:ring-1 focus:ring-[#9E4875]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#5B3F5D] block mb-1">
                  Baby&apos;s Name or Nickname
                </label>
                <input
                  type="text"
                  value={babyName}
                  onChange={(e) => setBabyName(e.target.value)}
                  placeholder="Leo"
                  className="w-full px-4 py-3 rounded-2xl bg-[#FAF5FA] border border-[#ECE0EB] text-xs text-[#2A162B] font-medium focus:outline-hidden focus:ring-1 focus:ring-[#9E4875]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#5B3F5D] block mb-1">
                  Baby&apos;s Birth Date
                </label>
                <input
                  type="date"
                  value={birthDate}
                  max={todayStr}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#FAF5FA] border border-[#ECE0EB] text-xs text-[#2A162B] font-medium focus:outline-hidden focus:ring-1 focus:ring-[#9E4875]"
                />
                <p className="text-[10px] text-[#8C728C] mt-1">
                  Used to calibrate wake-window predictions and maternal healing milestones.
                </p>
              </div>
            </div>

            {errorMsg && (
              <p role="alert" className="text-xs text-[#9E2B4B] bg-[#FFF2F5] border border-[#FAD4DE] rounded-2xl p-3">
                {errorMsg}
              </p>
            )}

            <button
              type="button"
              onClick={handleContinue}
              className="w-full py-3.5 rounded-full bg-[#9E4875] hover:bg-[#8B3B64] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-4"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Step 2: Baby's Weight & Length */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2A162B]">
                {babyName.trim() || 'Baby'}&apos;s Measurements
              </h1>
              <p className="text-xs text-[#7A617D] leading-relaxed">
                Enter your baby&apos;s most recent weight and length to set a baseline on the WHO growth curve.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#5B3F5D]">Units</span>
                <div
                  role="group"
                  aria-label="Measurement unit system"
                  className="inline-flex rounded-full bg-[#F5EAF4] p-0.5 border border-[#E6D4E5]"
                >
                  <button
                    type="button"
                    onClick={() => handleUnitChange('metric')}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                      unit === 'metric'
                        ? 'bg-[#9E4875] text-white shadow-2xs'
                        : 'text-[#6E5070] hover:text-[#2A162B]'
                    }`}
                  >
                    kg / cm
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnitChange('imperial')}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                      unit === 'imperial'
                        ? 'bg-[#9E4875] text-white shadow-2xs'
                        : 'text-[#6E5070] hover:text-[#2A162B]'
                    }`}
                  >
                    lbs / in
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#5B3F5D] block mb-1">
                  Weight ({wLabel})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    inputMode="decimal"
                    value={babyWeight}
                    onChange={(e) => setBabyWeight(e.target.value)}
                    placeholder={unit === 'metric' ? '3.5' : '7.7'}
                    className="w-full px-4 py-3 pr-12 rounded-2xl bg-[#FAF5FA] border border-[#ECE0EB] text-xs text-[#2A162B] font-medium focus:outline-hidden focus:ring-1 focus:ring-[#9E4875]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#8E738E] pointer-events-none">
                    {wLabel}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#5B3F5D] block mb-1">
                  Length ({lLabel})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    inputMode="decimal"
                    value={babyLength}
                    onChange={(e) => setBabyLength(e.target.value)}
                    placeholder={unit === 'metric' ? '50.5' : '19.9'}
                    className="w-full px-4 py-3 pr-12 rounded-2xl bg-[#FAF5FA] border border-[#ECE0EB] text-xs text-[#2A162B] font-medium focus:outline-hidden focus:ring-1 focus:ring-[#9E4875]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#8E738E] pointer-events-none">
                    {lLabel}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-[#8C728C]">
                You can find these on your baby&apos;s hospital discharge papers or latest pediatrician visit. You can update them anytime from the dashboard.
              </p>
            </div>

            {errorMsg && (
              <p role="alert" className="text-xs text-[#9E2B4B] bg-[#FFF2F5] border border-[#FAD4DE] rounded-2xl p-3">
                {errorMsg}
              </p>
            )}

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-5 rounded-full border border-[#EBDDE9] text-xs font-bold text-[#7A617D] hover:bg-[#FAF4F9] cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={isSubmitting}
                className="flex-1 py-3.5 rounded-full bg-[#9E4875] hover:bg-[#8B3B64] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-80"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FADCE8]" />
                <span>Launch Postpartum Dashboard</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
