import { useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect, useCallback } from 'react';

export interface Lab {
  id: number;
  date: string;
  test_name: string;
  value: number;
  unit: string;
  notes: string | null;
  created_at: string;
}

export type NewLab = Omit<Lab, 'id' | 'created_at'>;

export function useLabs() {
  const db = useSQLiteContext();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [markers, setMarkers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await db.getAllAsync<Lab>(
      'SELECT * FROM labs ORDER BY date DESC'
    );
    setLabs(rows);

    const markerRows = await db.getAllAsync<{ test_name: string }>(
      'SELECT DISTINCT test_name FROM labs ORDER BY test_name ASC'
    );
    setMarkers(markerRows.map((r) => r.test_name));
    setLoading(false);
  }, [db]);

  useEffect(() => {
    load();
  }, [load]);

  const addLab = async (lab: NewLab): Promise<void> => {
    await db.runAsync(
      'INSERT INTO labs (date, test_name, value, unit, notes) VALUES (?, ?, ?, ?, ?)',
      [lab.date, lab.test_name, lab.value, lab.unit, lab.notes ?? null]
    );
    await load();
  };

  const addLabsBulk = async (items: NewLab[]): Promise<void> => {
    if (items.length === 0) return;

    await db.withTransactionAsync(async () => {
      for (const lab of items) {
        await db.runAsync(
          'INSERT INTO labs (date, test_name, value, unit, notes) VALUES (?, ?, ?, ?, ?)',
          [lab.date, lab.test_name, lab.value, lab.unit, lab.notes ?? null]
        );
      }
    });

    await load();
  };

  const deleteLab = async (id: number): Promise<void> => {
    await db.runAsync('DELETE FROM labs WHERE id = ?', [id]);
    await load();
  };

  const getLabsByMarker = (testName: string): Lab[] => {
    return labs
      .filter((l) => l.test_name === testName)
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const getLabsForRange = async (startDate: string, endDate: string): Promise<Lab[]> => {
    return db.getAllAsync<Lab>(
      'SELECT * FROM labs WHERE date >= ? AND date <= ? ORDER BY date ASC',
      [startDate, endDate]
    );
  };

  return { labs, markers, loading, addLab, addLabsBulk, deleteLab, getLabsByMarker, getLabsForRange, reload: load };
}
