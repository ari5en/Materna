'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import type {
  Profile,
  BabyLog,
  MaternalMoodLog,
  MaternalRecoveryLog,
  GrowthMeasurement,
  BabyLogType,
  BabyLogDetails,
} from '@/types/database';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { setClientCurrentDate } from '@/lib/utils';

export interface MaternaContextType {
  profile: Profile;
  updateProfile: (updates: Partial<Profile>) => Promise<boolean>;
  babyLogs: BabyLog[];
  addBabyLog: (type: BabyLogType, details: BabyLogDetails) => Promise<void>;
  updateBabyLog: (id: string, details: BabyLogDetails) => Promise<void>;
  deleteBabyLog: (id: string) => Promise<void>;
  moodLogs: MaternalMoodLog[];
  addMoodLog: (score: number, tags: string[], notes?: string) => Promise<void>;
  updateMoodLog: (id: string, updates: { score: number; tags: string[]; notes?: string }) => Promise<void>;
  deleteMoodLog: (id: string) => Promise<void>;
  recoveryLog: MaternalRecoveryLog;
  recoveryHistory: MaternalRecoveryLog[];
  updateWaterGlasses: (glasses: number) => Promise<void>;
  toggleRecoveryExercise: (exerciseId: string) => Promise<void>;
  toggleMilestone: (milestoneId: string) => Promise<void>;
  toggleFavoriteTrack: (trackId: string) => Promise<void>;
  growthMeasurements: GrowthMeasurement[];
  addGrowthMeasurement: (m: {
    weight_lbs?: number | null;
    length_in?: number | null;
  }) => Promise<void>;
  updateGrowthMeasurement: (
    id: string,
    m: {
      weight_lbs?: number | null;
      length_in?: number | null;
      measured_on?: string;
    }
  ) => Promise<void>;
  deleteGrowthMeasurement: (id: string) => Promise<void>;
  lastWakeTimestamp: string;
  babySleepingSince: string | null;
  startBabySleep: (startedAt?: string) => Promise<void>;
  recordBabyWakeUp: (durationMinsOverride?: number) => Promise<number>;
  isAiChatOpen: boolean;
  setIsAiChatOpen: (open: boolean) => void;
  /** True once the initial session check + data load has finished. */
  isInitialized: boolean;
  userEmail: string | null;
  isAuthenticated: boolean;
  /** Last failed save/load message, or null. Cleared with clearSyncError. */
  syncError: string | null;
  clearSyncError: () => void;
  signOut: () => Promise<void>;
}

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Local calendar date (YYYY-MM-DD), so "today" matches the mother's own day. */
function getTodayDateString(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const INITIAL_DATE_PLACEHOLDER = '2026-10-24';
const INITIAL_ISO_PLACEHOLDER = '2026-10-24T09:00:00.000Z';

function emptyProfile(id = ''): Profile {
  return {
    id,
    full_name: '',
    baby_name: '',
    baby_birth_date: '',
    primary_focus: [],
    completed_milestones: [],
    favorite_tracks: [],
    nap_target: 4,
    baby_weight_lbs: null,
    baby_length_in: null,
    onboarded: false,
    last_wake_at: null,
    baby_sleeping_since: null,
    created_at: INITIAL_ISO_PLACEHOLDER,
  };
}

const LOCAL_STORAGE_PROFILE_KEY = 'materna_profile';

function loadCachedProfile(): Profile {
  if (typeof window === 'undefined') return emptyProfile();
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...emptyProfile(), ...parsed };
      }
    }
  } catch (e) {
    console.warn('Failed to parse cached profile:', e);
  }
  return emptyProfile();
}

function saveCachedProfile(p: Profile) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(p));
  } catch (e) {
    console.warn('Failed to save profile cache:', e);
  }
}

function emptyRecovery(userId = '', loggedDate = INITIAL_DATE_PLACEHOLDER): MaternalRecoveryLog {
  return {
    id: '',
    user_id: userId,
    logged_date: loggedDate,
    water_glasses: 0,
    completed_exercises: [],
  };
}

const fallbackContextValue: MaternaContextType = {
  profile: emptyProfile(),
  updateProfile: async () => false,
  babyLogs: [],
  addBabyLog: async () => {},
  updateBabyLog: async () => {},
  deleteBabyLog: async () => {},
  moodLogs: [],
  addMoodLog: async () => {},
  updateMoodLog: async () => {},
  deleteMoodLog: async () => {},
  recoveryLog: emptyRecovery(),
  recoveryHistory: [],
  updateWaterGlasses: async () => {},
  toggleRecoveryExercise: async () => {},
  toggleMilestone: async () => {},
  toggleFavoriteTrack: async () => {},
  growthMeasurements: [],
  addGrowthMeasurement: async () => {},
  updateGrowthMeasurement: async () => {},
  deleteGrowthMeasurement: async () => {},
  lastWakeTimestamp: INITIAL_ISO_PLACEHOLDER,
  babySleepingSince: null,
  startBabySleep: async () => {},
  recordBabyWakeUp: async () => 0,
  isAiChatOpen: false,
  setIsAiChatOpen: () => {},
  isInitialized: false,
  userEmail: null,
  isAuthenticated: false,
  syncError: null,
  clearSyncError: () => {},
  signOut: async () => {},
};

const MaternaContext = createContext<MaternaContextType>(fallbackContextValue);

export function MaternaProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile>(() => emptyProfile());
  const [babyLogs, setBabyLogs] = useState<BabyLog[]>([]);
  const [moodLogs, setMoodLogs] = useState<MaternalMoodLog[]>([]);
  const [recoveryLog, setRecoveryLog] = useState<MaternalRecoveryLog>(() => emptyRecovery());
  const [recoveryHistory, setRecoveryHistory] = useState<MaternalRecoveryLog[]>([]);
  const [growthMeasurements, setGrowthMeasurements] = useState<GrowthMeasurement[]>([]);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const supabase = useMemo(() => (isSupabaseConfigured ? createClient() : null), []);
  const userIdRef = useRef<string | null>(null);

  // Always-current copies for async handlers, so rapid taps never act on stale state.
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const babyLogsRef = useRef(babyLogs);
  babyLogsRef.current = babyLogs;
  const moodLogsRef = useRef(moodLogs);
  moodLogsRef.current = moodLogs;
  const recoveryRef = useRef(recoveryLog);
  recoveryRef.current = recoveryLog;
  const growthRef = useRef(growthMeasurements);
  growthRef.current = growthMeasurements;

  const clearSyncError = useCallback(() => setSyncError(null), []);

  const resetState = useCallback(() => {
    userIdRef.current = null;
    try {
      localStorage.removeItem(LOCAL_STORAGE_PROFILE_KEY);
    } catch {}
    setProfile(emptyProfile());
    setBabyLogs([]);
    setMoodLogs([]);
    setRecoveryLog(emptyRecovery());
    setRecoveryHistory([]);
    setGrowthMeasurements([]);
    setUserEmail(null);
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    setClientCurrentDate(new Date());
    const cached = loadCachedProfile();
    if (cached.baby_birth_date || cached.full_name || cached.baby_name) {
      setProfile((prev) => ({ ...prev, ...cached }));
    }
  }, []);

  const getUserId = useCallback(async (): Promise<string | null> => {
    if (userIdRef.current) return userIdRef.current;
    if (!supabase) return null;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) userIdRef.current = user.id;
    return user?.id ?? null;
  }, [supabase]);

  const loadUserData = useCallback(
    async (userId: string, email: string | null) => {
      if (!supabase) return;
      userIdRef.current = userId;
      setUserEmail(email);
      setIsAuthenticated(true);

      const db = supabase as any;
      const todayStr = getTodayDateString();

      try {
        const [profileRes, babyRes, moodRes, recoveryRes, growthRes] = await Promise.all([
          db.from('profiles').select('*').eq('id', userId).maybeSingle(),
          db
            .from('baby_logs')
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false })
            .limit(500),
          db
            .from('maternal_mood_logs')
            .select('*')
            .eq('user_id', userId)
            .order('logged_date', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(365),
          db
            .from('maternal_recovery_logs')
            .select('*')
            .eq('user_id', userId)
            .order('logged_date', { ascending: false })
            .limit(30),
          db
            .from('growth_measurements')
            .select('*')
            .eq('user_id', userId)
            .order('measured_on', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(200),
        ]);

        const firstError =
          profileRes.error || babyRes.error || moodRes.error || recoveryRes.error;
        if (firstError) {
          console.error('Supabase load error:', firstError);
          setSyncError('We could not load all of your data. Please refresh and try again.');
        }

        // The signup trigger normally creates the profile; create one if it is somehow missing.
        let loadedProfile: Profile | null = profileRes.data ?? null;
        if (!loadedProfile && !profileRes.error) {
          const { data: created } = await db
            .from('profiles')
            .upsert({ id: userId })
            .select('*')
            .single();
          loadedProfile = created ?? null;
        }
        if (loadedProfile) {
          setClientCurrentDate(new Date());
          setProfile(loadedProfile);
          saveCachedProfile(loadedProfile);
        }

        setBabyLogs(babyRes.data ?? []);
        setMoodLogs(moodRes.data ?? []);
        const recRows: MaternalRecoveryLog[] = recoveryRes.data ?? [];
        setRecoveryHistory(recRows);
        const todayRec = recRows.find((r) => r.logged_date === todayStr);
        setRecoveryLog(todayRec ?? emptyRecovery(userId, todayStr));
        // growth_measurements may not exist until the migration has been run
        if (growthRes.error) {
          console.warn('growth_measurements not available:', growthRes.error.message);
          setGrowthMeasurements([]);
        } else {
          setGrowthMeasurements(growthRes.data ?? []);
        }
      } catch (err) {
        console.error('Error syncing user data from Supabase:', err);
        setSyncError('We could not reach the server. Please check your connection.');
      }
    },
    [supabase]
  );

  useEffect(() => {
    if (!supabase) {
      setIsInitialized(true);
      return;
    }

    let cancelled = false;

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) await loadUserData(user.id, user.email ?? null);
      if (!cancelled) setIsInitialized(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        resetState();
        return;
      }
      // Only (re)load on a real sign-in as a different user; ignore token refreshes and
      // tab-focus events that would otherwise refetch everything and clobber in-flight edits.
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (userIdRef.current !== session.user.id) {
          await loadUserData(session.user.id, session.user.email ?? null);
        }
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase, loadUserData, resetState]);

  // ---------- Profile ----------

  const updateProfile = async (updates: Partial<Profile>): Promise<boolean> => {
    const { id: _ignoredId, created_at: _ignoredCreated, ...fields } = updates;
    void _ignoredId;
    void _ignoredCreated;

    const previous = profileRef.current;
    const optimistic = { ...previous, ...fields };
    profileRef.current = optimistic;
    setProfile(optimistic);
    saveCachedProfile(optimistic);

    if (!supabase) return true;
    try {
      const userId = await getUserId();
      if (!userId) {
        // Unauthenticated/guest mode: persist optimistic profile locally
        return true;
      }
      const { error } = await (supabase as any)
        .from('profiles')
        .upsert({ id: userId, ...fields, updated_at: new Date().toISOString() });
      if (error) {
        // If baby_sleeping_since column isn't in remote Supabase yet, retry without it
        if (
          'baby_sleeping_since' in fields &&
          (error.message?.includes('baby_sleeping_since') || error.code === 'PGRST204')
        ) {
          const { baby_sleeping_since: _skip, ...remainingFields } = fields as any;
          const { error: retryError } = await (supabase as any)
            .from('profiles')
            .upsert({ id: userId, ...remainingFields, updated_at: new Date().toISOString() });
          if (retryError) throw retryError;
          return true;
        }
        throw error;
      }
      return true;
    } catch (e) {
      console.error('Supabase profile update failed:', e);
      // Roll back only the fields we changed, in case other updates landed meanwhile
      const rolled = { ...profileRef.current };
      (Object.keys(fields) as (keyof Profile)[]).forEach((k) => {
        (rolled as any)[k] = previous[k];
      });
      profileRef.current = rolled;
      setProfile(rolled);
      saveCachedProfile(rolled);
      setSyncError('Your changes could not be saved. Please try again.');
      return false;
    }
  };

  const toggleMilestone = async (milestoneId: string) => {
    const current = profileRef.current.completed_milestones || [];
    const next = current.includes(milestoneId)
      ? current.filter((id) => id !== milestoneId)
      : [...current, milestoneId];
    await updateProfile({ completed_milestones: next });
  };

  const toggleFavoriteTrack = async (trackId: string) => {
    const current = profileRef.current.favorite_tracks || [];
    const next = current.includes(trackId)
      ? current.filter((id) => id !== trackId)
      : [...current, trackId];
    await updateProfile({ favorite_tracks: next });
  };

  // ---------- Baby logs ----------

  const addBabyLog = async (type: BabyLogType, details: BabyLogDetails) => {
    const userId = await getUserId();
    if (!userId || !supabase) {
      setSyncError('Please sign in to save logs.');
      return;
    }

    const nowIso = new Date().toISOString();
    const entry: BabyLog = {
      id: generateUuid(),
      user_id: userId,
      log_type: type,
      details,
      timestamp: nowIso,
    };

    setBabyLogs((prev) => [entry, ...prev]);

    const { error } = await (supabase as any).from('baby_logs').insert(entry);
    if (error) {
      console.error('Supabase baby log insert failed:', error);
      setBabyLogs((prev) => prev.filter((l) => l.id !== entry.id));
      setSyncError('That log could not be saved. Please try again.');
      return;
    }

    // Logging sleep also resets the wake clock
    if (type === 'sleep') {
      await updateProfile({ last_wake_at: nowIso });
    }
  };

  const updateBabyLog = async (id: string, details: BabyLogDetails) => {
    if (!supabase) return;
    const previous = babyLogsRef.current.find((l) => l.id === id);
    if (!previous) return;

    setBabyLogs((prev) => prev.map((l) => (l.id === id ? { ...l, details } : l)));

    const userId = await getUserId();
    const { error } = await (supabase as any)
      .from('baby_logs')
      .update({ details })
      .eq('id', id)
      .eq('user_id', userId ?? '');

    if (error) {
      console.error('Supabase baby log update failed:', error);
      setBabyLogs((prev) => prev.map((l) => (l.id === id ? previous : l)));
      setSyncError('That log could not be updated. Please try again.');
    }
  };

  const deleteBabyLog = async (id: string) => {
    const removed = babyLogsRef.current.find((l) => l.id === id);
    const nextLogs = babyLogsRef.current.filter((l) => l.id !== id);
    setBabyLogs(nextLogs);

    // If the deleted log was a sleep log, recalculate last_wake_at to the previous sleep log
    if (removed && removed.log_type === 'sleep') {
      const nextLatestSleep = nextLogs.find((l) => l.log_type === 'sleep');
      await updateProfile({
        last_wake_at: nextLatestSleep ? nextLatestSleep.timestamp : null,
      });
    }

    if (!supabase) return;
    const userId = await getUserId();
    if (!userId) return;

    const { error } = await (supabase as any)
      .from('baby_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) {
      console.error('Supabase baby log delete failed:', error);
      if (removed) {
        setBabyLogs((prev) =>
          [removed, ...prev].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        );
      }
      setSyncError('That log could not be deleted. Please try again.');
    }
  };

  // ---------- Mood ----------

  const addMoodLog = async (score: number, tags: string[], notes?: string) => {
    const userId = await getUserId();
    if (!userId || !supabase) {
      setSyncError('Please sign in to save reflections.');
      return;
    }

    const entry: MaternalMoodLog = {
      id: generateUuid(),
      user_id: userId,
      score,
      tags,
      notes,
      logged_date: getTodayDateString(),
      created_at: new Date().toISOString(),
    };

    setMoodLogs((prev) => [entry, ...prev]);

    const { error } = await (supabase as any).from('maternal_mood_logs').insert(entry);
    if (error) {
      console.error('Supabase mood log insert failed:', error);
      setMoodLogs((prev) => prev.filter((m) => m.id !== entry.id));
      setSyncError('Your reflection could not be saved. Please try again.');
    }
  };

  const updateMoodLog = async (
    id: string,
    updates: { score: number; tags: string[]; notes?: string }
  ) => {
    if (!supabase) return;
    const previous = moodLogsRef.current.find((m) => m.id === id);
    if (!previous) return;

    setMoodLogs((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, score: updates.score, tags: updates.tags, notes: updates.notes } : m
      )
    );

    const userId = await getUserId();
    const { error } = await (supabase as any)
      .from('maternal_mood_logs')
      .update({
        score: updates.score,
        tags: updates.tags,
        notes: updates.notes ?? null,
      })
      .eq('id', id)
      .eq('user_id', userId ?? '');

    if (error) {
      console.error('Supabase mood log update failed:', error);
      setMoodLogs((prev) => prev.map((m) => (m.id === id ? previous : m)));
      setSyncError('Your reflection could not be updated. Please try again.');
    }
  };

  const deleteMoodLog = async (id: string) => {
    if (!supabase) return;
    const removed = moodLogsRef.current.find((m) => m.id === id);
    setMoodLogs((prev) => prev.filter((m) => m.id !== id));

    const userId = await getUserId();
    const { error } = await (supabase as any)
      .from('maternal_mood_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId ?? '');

    if (error) {
      console.error('Supabase mood log delete failed:', error);
      if (removed) {
        setMoodLogs((prev) =>
          [removed, ...prev].sort((a, b) => b.logged_date.localeCompare(a.logged_date))
        );
      }
      setSyncError('Your reflection could not be deleted. Please try again.');
    }
  };

  // ---------- Recovery & hydration ----------

  const syncRecoveryLog = async (next: MaternalRecoveryLog) => {
    const previous = recoveryRef.current;
    recoveryRef.current = next;
    setRecoveryLog(next);

    if (!supabase) return;
    const userId = await getUserId();
    if (!userId) {
      recoveryRef.current = previous;
      setRecoveryLog(previous);
      setSyncError('Please sign in to save progress.');
      return;
    }

    const { data, error } = await (supabase as any)
      .from('maternal_recovery_logs')
      .upsert(
        {
          user_id: userId,
          logged_date: next.logged_date,
          water_glasses: next.water_glasses,
          completed_exercises: next.completed_exercises,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,logged_date' }
      )
      .select('*')
      .single();

    if (error) {
      console.error('Supabase recovery log upsert failed:', error);
      recoveryRef.current = previous;
      setRecoveryLog(previous);
      setSyncError('Your progress could not be saved. Please try again.');
    } else if (data) {
      // adopt the real row id without clobbering newer local edits
      setRecoveryLog((cur) => (cur.logged_date === data.logged_date ? { ...cur, id: data.id } : cur));
      setRecoveryHistory((prev) => {
        const filtered = prev.filter((r) => r.logged_date !== data.logged_date);
        return [data, ...filtered].sort((a, b) => b.logged_date.localeCompare(a.logged_date));
      });
    }
  };

  const currentRecoveryForToday = (): MaternalRecoveryLog => {
    const cur = recoveryRef.current;
    const today = getTodayDateString();
    return cur.logged_date === today
      ? cur
      : { ...emptyRecovery(cur.user_id || userIdRef.current || ''), logged_date: today };
  };

  const updateWaterGlasses = async (glasses: number) => {
    const clamped = Math.max(0, Math.min(15, glasses));
    await syncRecoveryLog({ ...currentRecoveryForToday(), water_glasses: clamped });
  };

  const toggleRecoveryExercise = async (exerciseId: string) => {
    const base = currentRecoveryForToday();
    const current = base.completed_exercises || [];
    const next = current.includes(exerciseId)
      ? current.filter((id) => id !== exerciseId)
      : [...current, exerciseId];
    await syncRecoveryLog({ ...base, completed_exercises: next });
  };

  // ---------- Growth ----------

  const addGrowthMeasurement = async (m: {
    weight_lbs?: number | null;
    length_in?: number | null;
  }) => {
    const userId = await getUserId();
    if (!userId || !supabase) {
      setSyncError('Please sign in to save measurements.');
      return;
    }

    const entry: GrowthMeasurement = {
      id: generateUuid(),
      user_id: userId,
      measured_on: getTodayDateString(),
      weight_lbs: m.weight_lbs ?? null,
      length_in: m.length_in ?? null,
      created_at: new Date().toISOString(),
    };

    setGrowthMeasurements((prev) => [entry, ...prev]);

    const { error } = await (supabase as any).from('growth_measurements').insert(entry);
    if (error) {
      console.error('Supabase growth insert failed:', error);
      setGrowthMeasurements((prev) => prev.filter((g) => g.id !== entry.id));
      setSyncError('Measurements could not be saved. Have you run the latest database migration?');
      return;
    }

    // Keep the "latest" snapshot on the profile for quick display
    await updateProfile({
      baby_weight_lbs: entry.weight_lbs ?? profileRef.current.baby_weight_lbs ?? null,
      baby_length_in: entry.length_in ?? profileRef.current.baby_length_in ?? null,
    });
  };

  const updateGrowthMeasurement = async (
    id: string,
    m: {
      weight_lbs?: number | null;
      length_in?: number | null;
      measured_on?: string;
    }
  ) => {
    if (!supabase) return;
    const previous = growthRef.current.find((g) => g.id === id);
    if (!previous) return;

    const updatedRow: GrowthMeasurement = {
      ...previous,
      weight_lbs: m.weight_lbs !== undefined ? m.weight_lbs : previous.weight_lbs,
      length_in: m.length_in !== undefined ? m.length_in : previous.length_in,
      measured_on: m.measured_on ?? previous.measured_on,
    };

    const nextList = growthRef.current.map((g) => (g.id === id ? updatedRow : g));
    setGrowthMeasurements(nextList);

    const userId = await getUserId();
    const { error } = await (supabase as any)
      .from('growth_measurements')
      .update({
        weight_lbs: updatedRow.weight_lbs,
        length_in: updatedRow.length_in,
        measured_on: updatedRow.measured_on,
      })
      .eq('id', id)
      .eq('user_id', userId ?? '');

    if (error) {
      console.error('Supabase growth update failed:', error);
      setGrowthMeasurements((prev) => prev.map((g) => (g.id === id ? previous : g)));
      setSyncError('That measurement could not be updated. Please try again.');
      return;
    }

    const latest = nextList[0];
    if (latest && latest.id === id) {
      await updateProfile({
        baby_weight_lbs: latest.weight_lbs ?? null,
        baby_length_in: latest.length_in ?? null,
      });
    }
  };

  const deleteGrowthMeasurement = async (id: string) => {
    if (!supabase) return;
    const removed = growthRef.current.find((g) => g.id === id);
    const remaining = growthRef.current.filter((g) => g.id !== id);
    setGrowthMeasurements(remaining);

    const userId = await getUserId();
    const { error } = await (supabase as any)
      .from('growth_measurements')
      .delete()
      .eq('id', id)
      .eq('user_id', userId ?? '');

    if (error) {
      console.error('Supabase growth delete failed:', error);
      if (removed) {
        setGrowthMeasurements((prev) =>
          [removed, ...prev].sort((a, b) => b.measured_on.localeCompare(a.measured_on))
        );
      }
      setSyncError('That measurement could not be deleted. Please try again.');
      return;
    }

    const latest = remaining[0];
    await updateProfile({
      baby_weight_lbs: latest?.weight_lbs ?? null,
      baby_length_in: latest?.length_in ?? null,
    });
  };

  // ---------- Wake & Sleep state ----------

  const lastWakeTimestamp = useMemo(() => {
    if (profile.last_wake_at) return profile.last_wake_at;
    const latestSleep = babyLogs.find((l) => l.log_type === 'sleep');
    return latestSleep?.timestamp ?? profile.created_at ?? INITIAL_ISO_PLACEHOLDER;
  }, [profile.last_wake_at, profile.created_at, babyLogs]);

  const babySleepingSince = profile.baby_sleeping_since ?? null;

  const startBabySleep = async (startedAt?: string) => {
    const sleepIso = startedAt || new Date().toISOString();
    await updateProfile({ baby_sleeping_since: sleepIso });
  };

  const recordBabyWakeUp = async (durationMinsOverride?: number): Promise<number> => {
    const nowIso = new Date().toISOString();
    const sleepingSince = profileRef.current.baby_sleeping_since;

    let computedDuration = durationMinsOverride;
    if (computedDuration === undefined) {
      if (sleepingSince) {
        const diffMs = Date.now() - new Date(sleepingSince).getTime();
        computedDuration = Math.max(1, Math.round(diffMs / 60000));
      } else {
        // Fallback if sleep wasn't started beforehand: default to 45 mins
        computedDuration = 45;
      }
    }

    await updateProfile({
      baby_sleeping_since: null,
      last_wake_at: nowIso,
    });

    if (computedDuration > 0) {
      await addBabyLog('sleep', {
        duration_mins: computedDuration,
        notes: sleepingSince ? 'Automatic sleep-to-wake tracker' : 'Quick wake-up log',
      });
    }

    return computedDuration;
  };

  // ---------- Auth ----------

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    resetState();
  };

  return (
    <MaternaContext.Provider
      value={{
        profile,
        updateProfile,
        babyLogs,
        addBabyLog,
        updateBabyLog,
        deleteBabyLog,
        moodLogs,
        addMoodLog,
        updateMoodLog,
        deleteMoodLog,
        recoveryLog,
        recoveryHistory,
        updateWaterGlasses,
        toggleRecoveryExercise,
        toggleMilestone,
        toggleFavoriteTrack,
        growthMeasurements,
        addGrowthMeasurement,
        updateGrowthMeasurement,
        deleteGrowthMeasurement,
        lastWakeTimestamp,
        babySleepingSince,
        startBabySleep,
        recordBabyWakeUp,
        isAiChatOpen,
        setIsAiChatOpen,
        isInitialized,
        userEmail,
        isAuthenticated,
        syncError,
        clearSyncError,
        signOut,
      }}
    >
      {children}
    </MaternaContext.Provider>
  );
}

export function useMaterna(): MaternaContextType {
  const context = useContext(MaternaContext);
  return context ?? fallbackContextValue;
}
