import { useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect, useCallback } from 'react';

export interface DailyMetric {
  id: number;
  date: string;
  mood: number | null;
  energy: number | null;
  libido: number | null;
  sleep: number | null;
  notes: string | null;
  created_at: string;
}

export function useMetrics(limit = 30) {
  const db = useSQLiteContext();
  const [metrics, setMetrics] = useState<DailyMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await db.getAllAsync<DailyMetric>(
      'SELECT * FROM daily_metrics ORDER BY date DESC LIMIT ?',
      [limit]
    );
    setMetrics(rows);
    setLoading(false);
  }, [db, limit]);

  useEffect(() => {
    load();
  }, [load]);

  const getMetricForDate = useCallback(async (date: string): Promise<DailyMetric | null> => {
    return db.getFirstAsync<DailyMetric>(
      'SELECT * FROM daily_metrics WHERE date = ?',
      [date]
    );
  }, [db]);

  const saveMetric = useCallback(async (
    date: string,
    data: { mood?: number; energy?: number; libido?: number; sleep?: number; notes?: string }
  ): Promise<void> => {
    const existing = await db.getFirstAsync<DailyMetric>(
      'SELECT * FROM daily_metrics WHERE date = ?',
      [date]
    );

    if (existing) {
      await db.runAsync(
        `UPDATE daily_metrics SET mood = ?, energy = ?, libido = ?, sleep = ?, notes = ?
         WHERE date = ?`,
        [data.mood ?? existing.mood, data.energy ?? existing.energy,
         data.libido ?? existing.libido, data.sleep ?? existing.sleep,
         data.notes ?? existing.notes, date]
      );
    } else {
      await db.runAsync(
        'INSERT INTO daily_metrics (date, mood, energy, libido, sleep, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [date, data.mood ?? null, data.energy ?? null, data.libido ?? null, data.sleep ?? null, data.notes ?? null]
      );
    }
    await load();
  }, [db, load]);

  const getWeeklyAverages = useCallback(async (): Promise<{
    mood: number | null;
    energy: number | null;
    libido: number | null;
    sleep: number | null;
  }> => {
    const row = await db.getFirstAsync<{
      avg_mood: number | null;
      avg_energy: number | null;
      avg_libido: number | null;
      avg_sleep: number | null;
    }>(
      `SELECT AVG(mood) as avg_mood, AVG(energy) as avg_energy,
              AVG(libido) as avg_libido, AVG(sleep) as avg_sleep
       FROM daily_metrics
       WHERE date >= date('now', '-7 days')`
    );

    return {
      mood: row?.avg_mood ?? null,
      energy: row?.avg_energy ?? null,
      libido: row?.avg_libido ?? null,
      sleep: row?.avg_sleep ?? null,
    };
  }, [db]);

  const getMetricsForRange = useCallback(async (startDate: string, endDate: string): Promise<DailyMetric[]> => {
    return db.getAllAsync<DailyMetric>(
      'SELECT * FROM daily_metrics WHERE date >= ? AND date <= ? ORDER BY date ASC',
      [startDate, endDate]
    );
  }, [db]);

  return { metrics, loading, saveMetric, getMetricForDate, getWeeklyAverages, getMetricsForRange, reload: load };
}
