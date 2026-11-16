import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function DELETE() {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Backend not configured' }, { status: 503 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = supabase as any;
    await Promise.all([
      db.from('baby_logs').delete().eq('user_id', user.id),
      db.from('maternal_mood_logs').delete().eq('user_id', user.id),
      db.from('maternal_recovery_logs').delete().eq('user_id', user.id),
      db.from('growth_measurements').delete().eq('user_id', user.id),
    ]);

    await db
      .from('profiles')
      .update({
        completed_milestones: [],
        favorite_tracks: [],
        primary_focus: [],
        baby_weight_lbs: null,
        baby_length_in: null,
        last_wake_at: null,
        onboarded: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user data error:', error);
    return NextResponse.json({ error: 'Failed to delete user data' }, { status: 500 });
  }
}

