import { useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect, useCallback } from 'react';

export interface Log {
  id: number;
  date: string;
  protocol_id: number;
  taken: number;
  actual_dose: number | null;
  notes: string | null;
  created_at: string;
}

export interface LogWithProtocol extends Log {
  protocol_name: string;
  protocol_compound: string;
  protocol_dosage: number;
  protocol_unit: string;
  protocol_category: string;
}

export function useLogs(date?: string) {
  const db = useSQLiteContext();
  const [logs, setLogs] = useState<LogWithProtocol[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let query = `
      SELECT l.*, p.name as protocol_name, p.compound as protocol_compound,
             p.dosage as protocol_dosage, p.unit as protocol_unit, p.category as protocol_category
      FROM logs l
      JOIN protocols p ON l.protocol_id = p.id
    `;
    const params: string[] = [];
    if (date) {
      query += ' WHERE l.date = ?';
      params.push(date);
    }
    query += ' ORDER BY l.created_at DESC';

    const rows = await db.getAllAsync<LogWithProtocol>(query, params);
    setLogs(rows);
    setLoading(false);
  }, [db, date]);

  useEffect(() => {
    load();
  }, [load]);

  const logDose = useCallback(async (
    protocolId: number,
    logDate: string,
    taken: boolean,
    actualDose?: number,
    notes?: string
  ): Promise<void> => {
    const existing = await db.getFirstAsync<Log>(
      'SELECT * FROM logs WHERE protocol_id = ? AND date = ?',
      [protocolId, logDate]
    );

    if (existing) {
      await db.runAsync(
        'UPDATE logs SET taken = ?, actual_dose = ?, notes = ? WHERE id = ?',
        [taken ? 1 : 0, actualDose ?? null, notes ?? null, existing.id]
      );
    } else {
      await db.runAsync(
        'INSERT INTO logs (date, protocol_id, taken, actual_dose, notes) VALUES (?, ?, ?, ?, ?)',
        [logDate, protocolId, taken ? 1 : 0, actualDose ?? null, notes ?? null]
      );
    }
    await load();
  }, [db, load]);

  const getLogForProtocolDate = useCallback(async (
    protocolId: number,
    logDate: string
  ): Promise<Log | null> => {
    return db.getFirstAsync<Log>(
      'SELECT * FROM logs WHERE protocol_id = ? AND date = ?',
      [protocolId, logDate]
    );
  }, [db]);

  const getLogsForDateRange = useCallback(async (
    startDate: string,
    endDate: string
  ): Promise<LogWithProtocol[]> => {
    return db.getAllAsync<LogWithProtocol>(
      `SELECT l.*, p.name as protocol_name, p.compound as protocol_compound,
              p.dosage as protocol_dosage, p.unit as protocol_unit, p.category as protocol_category
       FROM logs l
       JOIN protocols p ON l.protocol_id = p.id
       WHERE l.date >= ? AND l.date <= ?
       ORDER BY l.date DESC`,
      [startDate, endDate]
    );
  }, [db]);

  return { logs, loading, logDose, getLogForProtocolDate, getLogsForDateRange, reload: load };
}
