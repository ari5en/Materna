'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShieldCheck, Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useMaterna } from '@/lib/context/MaternaContext';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { LotusIcon } from '@/components/shared/LotusIcon';

type AuthMode = 'signin' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const { updateProfile } = useMaterna();

  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isSupabaseConfigured) {
      setErrorMsg('Please connect your Supabase URL and Publishable Key in .env.local first.');
      return;
    }

    const supabase = createClient();
    if (!supabase) return;

    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setIsLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isSupabaseConfigured) {
      setErrorMsg(
        'Supabase environment variables are not detected yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local and restart the dev server.'
      );
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setErrorMsg('Unable to initialize Supabase client.');
      return;
    }

    setIsLoading(true);

    try {
      if (authMode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setErrorMsg(error.message);
          setIsLoading(false);
          return;
        }

        router.push('/');
        router.refresh();
      } else if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim() || 'Mama',
            },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
          },
        });

        if (error) {
          setErrorMsg(error.message);
          setIsLoading(false);
          return;
        }

        if (data.session) {
          // Email confirmation is disabled in Supabase -> user is immediately signed in
          await updateProfile({
            id: data.user?.id,
            full_name: fullName.trim() || 'Mama',
          });
          router.push('/onboarding');
          router.refresh();
        } else {
          // Email confirmation is enabled -> tell user to check their inbox
          setSuccessMsg(
            'Account created! Please check your email inbox to confirm your address, or disable "Confirm email" under Authentication → Providers → Email in Supabase for instant login.'
          );
          setIsLoading(false);
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'An unexpected authentication error occurred.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F3F7] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md sm:max-w-lg bg-white rounded-[32px] p-6 sm:p-10 border border-[#EFE3EE] shadow-[0_10px_35px_rgba(140,80,120,0.06)] space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-full bg-[#F5EAF4] text-[#7B4C7A] items-center justify-center shadow-xs mx-auto border border-[#EFE1ED]">
            <LotusIcon className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#2A162B] tracking-tight">Materna</h1>
          <p className="text-xs text-[#7A617D] max-w-xs mx-auto">
            Serene Fourth-Trimester Maternal Sanctuary & Newborn Tracking
          </p>
        </div>

        {/* Auth Mode Switcher Tabs */}
        <div className="flex items-center gap-1 bg-[#F5EAF3] p-1 rounded-2xl border border-[#EBE0EC]">
          <button
            type="button"
            onClick={() => {
              setAuthMode('signin');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              authMode === 'signin'
                ? 'bg-white text-[#9E4875] shadow-2xs'
                : 'text-[#785E7A] hover:text-[#2A162B]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              authMode === 'signup'
                ? 'bg-white text-[#9E4875] shadow-2xs'
                : 'text-[#785E7A] hover:text-[#2A162B]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error / Success Alerts */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-[#FFF2F5] border border-[#FAD4DE] text-xs text-[#9E2B4B] flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#C93B63]" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-[#F0F9F3] border border-[#CDEBD6] text-xs text-[#23633B] flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#2E7D32]" />
            <span className="leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* Supabase Auth Form */}
        <form onSubmit={handleAuthSubmit} className="space-y-3.5">
          {authMode === 'signup' && (
            <div>
              <label className="text-xs font-bold text-[#5B3F5D] block mb-1">
                Mother&apos;s First Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#A78FA8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Sarah"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FAF5FA] border border-[#ECE0EB] text-xs text-[#2A162B] placeholder:text-[#A78FA8] focus:outline-hidden focus:ring-1 focus:ring-[#9E4875]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-[#5B3F5D] block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#A78FA8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@example.com"
                required
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FAF5FA] border border-[#ECE0EB] text-xs text-[#2A162B] placeholder:text-[#A78FA8] focus:outline-hidden focus:ring-1 focus:ring-[#9E4875]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#5B3F5D] block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#A78FA8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FAF5FA] border border-[#ECE0EB] text-xs text-[#2A162B] placeholder:text-[#A78FA8] focus:outline-hidden focus:ring-1 focus:ring-[#9E4875]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-full bg-[#9E4875] hover:bg-[#8B3B64] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-75"
          >
            <span>
              {isLoading
                ? 'Connecting...'
                : authMode === 'signin'
                ? 'Sign In'
                : 'Create Account & Personalize'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="relative flex items-center justify-center py-1">
          <div className="border-t border-[#EFE1ED] w-full"></div>
          <span className="bg-white px-3 text-[10px] uppercase font-bold text-[#A088A1] absolute">
            or continue with
          </span>
        </div>

        {/* Google Sign-In & Quick Demo Access Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3 rounded-full bg-white hover:bg-[#FAF5FA] border border-[#E6D6E5] text-[#2A162B] font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

        </div>

        {/* Privacy Note */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#937895]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#9E4875]" />
          <span>Encrypted RLS-protected maternal health data</span>
        </div>
      </div>
    </div>
  );
}
