import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_PROTOCOL_TIMES, isValidTimeString } from '../utils/protocolTiming';

export interface AppSettings {
  notificationsEnabled: boolean;
  dailyReminderTime: string;
  morningTime: string;
  lunchTime: string;
  nightTime: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  notificationsEnabled: false,
  dailyReminderTime: '20:00',
  morningTime: DEFAULT_PROTOCOL_TIMES.morningTime,
  lunchTime: DEFAULT_PROTOCOL_TIMES.lunchTime,
  nightTime: DEFAULT_PROTOCOL_TIMES.nightTime,
};

type SettingsState = { settings: AppSettings; loading: boolean };

let settingsCache: AppSettings = DEFAULT_SETTINGS;
let settingsLoading = true;
let loadPromise: Promise<AppSettings> | null = null;
const listeners = new Set<(state: SettingsState) => void>();

function broadcast() {
  const snapshot = { settings: settingsCache, loading: settingsLoading };
  listeners.forEach((listener) => listener(snapshot));
}

function mapRowsToSettings(rows: Array<{ key: string; value: string | null }>): AppSettings {
  const raw = Object.fromEntries(rows.map((row) => [row.key, row.value ?? '']));

  return {
    notificationsEnabled: raw.notificationsEnabled === 'true',
    dailyReminderTime: isValidTimeString(raw.dailyReminderTime) ? raw.dailyReminderTime : DEFAULT_SETTINGS.dailyReminderTime,
    morningTime: isValidTimeString(raw.morningTime) ? raw.morningTime : DEFAULT_SETTINGS.morningTime,
    lunchTime: isValidTimeString(raw.lunchTime) ? raw.lunchTime : DEFAULT_SETTINGS.lunchTime,
    nightTime: isValidTimeString(raw.nightTime) ? raw.nightTime : DEFAULT_SETTINGS.nightTime,
  };
}

export function useAppSettings() {
  const db = useSQLiteContext();
  const [settings, setSettings] = useState(settingsCache);
  const [loading, setLoading] = useState(settingsLoading);

  const load = useCallback(async () => {
    if (loadPromise) return loadPromise;

    settingsLoading = true;
    broadcast();

    loadPromise = db
      .getAllAsync<{ key: string; value: string | null }>('SELECT key, value FROM app_settings')
      .then((rows) => {
        settingsCache = mapRowsToSettings(rows);
        settingsLoading = false;
        broadcast();
        return settingsCache;
      })
      .catch((error) => {
        settingsLoading = false;
        broadcast();
        throw error;
      })
      .finally(() => {
        loadPromise = null;
      });

    return loadPromise;
  }, [db]);

  useEffect(() => {
    const listener = (state: SettingsState) => {
      setSettings(state.settings);
      setLoading(state.loading);
    };

    listeners.add(listener);
    listener({ settings: settingsCache, loading: settingsLoading });
    load();

    return () => {
      listeners.delete(listener);
    };
  }, [load]);

  const setSetting = useCallback(
    async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      const stringValue = typeof value === 'boolean' ? String(value) : value;
      await db.runAsync(
        `INSERT INTO app_settings (key, value)
         VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        [key, stringValue]
      );
      settingsCache = { ...settingsCache, [key]: value };
      broadcast();
    },
    [db]
  );

  return {
    settings,
    loading,
    load,
    setNotificationsEnabled: (value: boolean) => setSetting('notificationsEnabled', value),
    setDailyReminderTime: (value: string) => setSetting('dailyReminderTime', value),
    setMorningTime: (value: string) => setSetting('morningTime', value),
    setLunchTime: (value: string) => setSetting('lunchTime', value),
    setNightTime: (value: string) => setSetting('nightTime', value),
  };
}
