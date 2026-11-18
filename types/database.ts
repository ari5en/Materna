export interface Profile {
  id: string;
  full_name: string;
  baby_birth_date: string;
  baby_name?: string;
  primary_focus?: string[];
  completed_milestones?: string[];
  favorite_tracks?: string[];
  nap_target?: number;
  baby_weight_lbs?: number | null;
  baby_length_in?: number | null;
  onboarded?: boolean;
  last_wake_at?: string | null;
  baby_sleeping_since?: string | null;
  created_at: string;
  updated_at?: string;
}

export type BabyLogType = 'feed' | 'diaper' | 'sleep';

export interface BabyLogDetails {
  side?: 'left' | 'right' | 'both';
  duration_mins?: number;
  amount_ml?: number;
  bottle_type?: 'formula' | 'breast_milk' | string;
  type?: 'wet' | 'dirty' | 'both' | 'mixed';
  notes?: string;
}

export interface BabyLog {
  id: string;
  user_id: string;
  log_type: BabyLogType;
  details: BabyLogDetails;
  timestamp: string;
}

export interface MaternalMoodLog {
  id: string;
  user_id: string;
  score: number; // 1: Depleted, 2: Fragile, 3: Balanced, 4: Grounded, 5: Joyful
  tags: string[];
  notes?: string;
  logged_date: string;
  created_at?: string;
}

export interface MaternalRecoveryLog {
  id: string;
  user_id: string;
  logged_date: string;
  water_glasses: number;
  completed_exercises: string[];
  updated_at?: string;
}

export interface GrowthMeasurement {
  id: string;
  user_id: string;
  measured_on: string;
  weight_lbs: number | null;
  length_in: number | null;
  created_at?: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'> & { created_at?: string };
        Update: Partial<Profile>;
      };
      baby_logs: {
        Row: BabyLog;
        Insert: Omit<BabyLog, 'id'> & { id?: string };
        Update: Partial<BabyLog>;
      };
      maternal_mood_logs: {
        Row: MaternalMoodLog;
        Insert: Omit<MaternalMoodLog, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<MaternalMoodLog>;
      };
      growth_measurements: {
        Row: GrowthMeasurement;
        Insert: Omit<GrowthMeasurement, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<GrowthMeasurement>;
      };
      maternal_recovery_logs: {
        Row: MaternalRecoveryLog;
        Insert: Omit<MaternalRecoveryLog, 'id' | 'updated_at'> & { id?: string; updated_at?: string };
        Update: Partial<MaternalRecoveryLog>;
      };
    };
  };
};
