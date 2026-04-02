import { useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect, useCallback } from 'react';

export interface Protocol {
  id: number;
  name: string;
  compound: string;
  category: 'TRT' | 'Peptide' | 'Supplement';
  dosage: number;
  unit: string;
  frequency_type: 'daily' | 'weekly' | 'every_x_days';
  frequency_value: number;
  route: string;
  start_date: string;
  timing_slot: 'anytime' | 'morning' | 'lunch' | 'pre_workout' | 'post_workout' | 'night' | 'specific_time';
  specific_time: string | null;
  with_food: number;
  instructions: string | null;
  active: number;
  created_at: string;
}

export type NewProtocol = Omit<Protocol, 'id' | 'created_at'>;

let protocolCache: Protocol[] = [];
let protocolLoading = true;
let loadPromise: Promise<Protocol[]> | null = null;
const listeners = new Set<(state: { protocols: Protocol[]; loading: boolean }) => void>();

function sortProtocols(rows: Protocol[]) {
  return [...rows].sort((a, b) => {
    if (a.active !== b.active) return b.active - a.active;
    return b.created_at.localeCompare(a.created_at);
  });
}

function broadcast() {
  const snapshot = {
    protocols: protocolCache,
    loading: protocolLoading,
  };

  listeners.forEach((listener) => listener(snapshot));
}

export function useProtocols() {
  const db = useSQLiteContext();
  const [protocols, setProtocols] = useState<Protocol[]>(protocolCache);
  const [loading, setLoading] = useState(protocolLoading);

  const load = useCallback(async () => {
    if (loadPromise) {
      return loadPromise;
    }

    protocolLoading = true;
    broadcast();

    loadPromise = db
      .getAllAsync<Protocol>('SELECT * FROM protocols ORDER BY active DESC, created_at DESC')
      .then((rows) => {
        protocolCache = sortProtocols(rows);
        protocolLoading = false;
        broadcast();
        return protocolCache;
      })
      .catch((error) => {
        protocolLoading = false;
        broadcast();
        throw error;
      })
      .finally(() => {
        loadPromise = null;
      });

    return loadPromise;
  }, [db]);

  useEffect(() => {
    const listener = (state: { protocols: Protocol[]; loading: boolean }) => {
      setProtocols(state.protocols);
      setLoading(state.loading);
    };

    listeners.add(listener);
    listener({ protocols: protocolCache, loading: protocolLoading });
    load();

    return () => {
      listeners.delete(listener);
    };
  }, [load]);

  const addProtocol = async (p: NewProtocol): Promise<number> => {
    const result = await db.runAsync(
      `INSERT INTO protocols (name, compound, category, dosage, unit, frequency_type, frequency_value, route, start_date, timing_slot, specific_time, with_food, instructions, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.name,
        p.compound,
        p.category,
        p.dosage,
        p.unit,
        p.frequency_type,
        p.frequency_value,
        p.route,
        p.start_date,
        p.timing_slot,
        p.specific_time,
        p.with_food,
        p.instructions,
        p.active,
      ]
    );
    await load();
    return result.lastInsertRowId;
  };

  const updateProtocol = async (id: number, p: Partial<NewProtocol>): Promise<void> => {
    const entries = Object.entries(p);
    if (entries.length === 0) return;
    const fields = entries.map(([k]) => `${k} = ?`).join(', ');
    const values = entries.map(([, v]) => v);
    await db.runAsync(`UPDATE protocols SET ${fields} WHERE id = ?`, [...values, id]);
    protocolCache = sortProtocols(
      protocolCache.map((protocol) => (protocol.id === id ? { ...protocol, ...p } : protocol))
    );
    broadcast();
    await load();
  };

  const deleteProtocol = async (id: number): Promise<void> => {
    await db.runAsync('DELETE FROM protocols WHERE id = ?', [id]);
    protocolCache = protocolCache.filter((protocol) => protocol.id !== id);
    broadcast();
    await load();
  };

  const toggleActive = async (id: number, active: boolean): Promise<void> => {
    await db.runAsync('UPDATE protocols SET active = ? WHERE id = ?', [active ? 1 : 0, id]);
    protocolCache = sortProtocols(
      protocolCache.map((protocol) =>
        protocol.id === id ? { ...protocol, active: active ? 1 : 0 } : protocol
      )
    );
    broadcast();
    await load();
  };

  const replaceAllProtocols = async (items: NewProtocol[]): Promise<void> => {
    await db.execAsync('DELETE FROM protocols;');

    for (const item of items) {
      await db.runAsync(
        `INSERT INTO protocols (name, compound, category, dosage, unit, frequency_type, frequency_value, route, start_date, timing_slot, specific_time, with_food, instructions, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.name,
          item.compound,
          item.category,
          item.dosage,
          item.unit,
          item.frequency_type,
          item.frequency_value,
          item.route,
          item.start_date,
          item.timing_slot,
          item.specific_time,
          item.with_food,
          item.instructions,
          item.active,
        ]
      );
    }

    await load();
  };

  return {
    protocols,
    loading,
    addProtocol,
    updateProtocol,
    deleteProtocol,
    toggleActive,
    replaceAllProtocols,
    reload: load,
  };
}
