import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { formatDuration } from '@/lib/utils';

function csvEscape(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') === 'csv' ? 'csv' : 'json';

    const db = supabase as any;
    const [profileRes, babyRes, moodRes, recoveryRes, growthRes] = await Promise.all([
      db.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      db.from('baby_logs').select('*').eq('user_id', user.id).order('timestamp', { ascending: false }),
      db
        .from('maternal_mood_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_date', { ascending: false }),
      db
        .from('maternal_recovery_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_date', { ascending: false }),
      db
        .from('growth_measurements')
        .select('*')
        .eq('user_id', user.id)
        .order('measured_on', { ascending: false }),
    ]);

    const dateStamp = new Date().toISOString().split('T')[0];

    if (format === 'csv') {
      const rows: string[] = [
        ['category', 'date_or_timestamp', 'type_or_score', 'summary', 'details_json'].join(','),
      ];

      for (const b of babyRes.data ?? []) {
        rows.push(
          [
            'baby_log',
            csvEscape(b.timestamp),
            csvEscape(b.log_type),
            csvEscape(
              b.log_type === 'feed'
                ? b.details?.side
                  ? `Nursing ${b.details.side} (${formatDuration(b.details.duration_mins)})`
                  : `Bottle (${b.details?.amount_ml || 0}ml)`
                : b.log_type === 'diaper'
                ? `Diaper (${b.details?.type || 'wet'})`
                : `Sleep (${formatDuration(b.details?.duration_mins)})`
            ),
            csvEscape(b.details),
          ].join(',')
        );
      }

      for (const m of moodRes.data ?? []) {
        rows.push(
          [
            'mood_log',
            csvEscape(m.logged_date),
            csvEscape(m.score),
            csvEscape(m.notes || ''),
            csvEscape({ tags: m.tags }),
          ].join(',')
        );
      }

      for (const r of recoveryRes.data ?? []) {
        rows.push(
          [
            'recovery_log',
            csvEscape(r.logged_date),
            csvEscape(`${r.water_glasses} glasses`),
            csvEscape(`${(r.completed_exercises || []).length} exercises`),
            csvEscape({ completed_exercises: r.completed_exercises }),
          ].join(',')
        );
      }

      for (const g of growthRes.data ?? []) {
        rows.push(
          [
            'growth_measurement',
            csvEscape(g.measured_on),
            csvEscape(`${g.weight_lbs ?? ''} lbs`),
            csvEscape(`Length ${g.length_in ?? ''} in`),
            csvEscape({ weight_lbs: g.weight_lbs, length_in: g.length_in }),
          ].join(',')
        );
      }

      return new NextResponse(rows.join('\n'), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="materna-export-${dateStamp}.csv"`,
        },
      });
    }

    const payload = {
      exported_at: new Date().toISOString(),
      email: user.email,
      profile: profileRes.data ?? null,
      baby_logs: babyRes.data ?? [],
      maternal_mood_logs: moodRes.data ?? [],
      maternal_recovery_logs: recoveryRes.data ?? [],
      growth_measurements: growthRes.data ?? [],
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="materna-export-${dateStamp}.json"`,
      },
    });
  } catch (error) {
    console.error('Export route error:', error);
    return NextResponse.json({ error: 'Failed to export user data' }, { status: 500 });
  }
}

