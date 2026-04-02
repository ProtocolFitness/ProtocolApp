import { SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';

interface ExportData {
  version: number;
  exportedAt: string;
  protocols: unknown[];
  logs: unknown[];
  daily_metrics: unknown[];
  labs: unknown[];
  ai_insights: unknown[];
  app_settings: unknown[];
}

function getNativeFileSystem() {
  return require('expo-file-system/legacy') as typeof import('expo-file-system/legacy');
}

function getNativeSharing() {
  return require('expo-sharing') as typeof import('expo-sharing');
}

function getNativeDocumentPicker() {
  return require('expo-document-picker') as typeof import('expo-document-picker');
}

export async function exportAllData(db: SQLiteDatabase): Promise<void> {
  const [protocols, logs, daily_metrics, labs, ai_insights, app_settings] = await Promise.all([
    db.getAllAsync('SELECT * FROM protocols'),
    db.getAllAsync('SELECT * FROM logs'),
    db.getAllAsync('SELECT * FROM daily_metrics'),
    db.getAllAsync('SELECT * FROM labs'),
    db.getAllAsync('SELECT * FROM ai_insights'),
    db.getAllAsync('SELECT * FROM app_settings'),
  ]);

  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    protocols,
    logs,
    daily_metrics,
    labs,
    ai_insights,
    app_settings,
  };

  const json = JSON.stringify(data, null, 2);
  const fileName = `protocol-export-${new Date().toISOString().split('T')[0]}.json`;

  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }

  const FileSystem = getNativeFileSystem();
  const Sharing = getNativeSharing();
  const fileUri = FileSystem.documentDirectory + fileName;

  await FileSystem.writeAsStringAsync(fileUri, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'Export Protocol Data',
    });
  }
}

export async function importData(db: SQLiteDatabase): Promise<{ success: boolean; message: string }> {
  let raw: string;

  if (Platform.OS === 'web') {
    raw = await new Promise<string>((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          resolve('');
          return;
        }

        try {
          resolve(await file.text());
        } catch (error) {
          reject(error);
        }
      };
      input.click();
    });
  } else {
    const DocumentPicker = getNativeDocumentPicker();
    const FileSystem = getNativeFileSystem();
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) {
      return { success: false, message: 'Import cancelled.' };
    }

    const fileUri = result.assets[0].uri;
    raw = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  }

  if (!raw) {
    return { success: false, message: 'Import cancelled.' };
  }

  let data: ExportData;
  try {
    data = JSON.parse(raw);
  } catch {
    return { success: false, message: 'Invalid file format.' };
  }

  if (!data.protocols || !data.logs || !data.daily_metrics || !data.labs) {
    return { success: false, message: 'File is missing required data.' };
  }

  await db.execAsync('DELETE FROM ai_insights; DELETE FROM logs; DELETE FROM daily_metrics; DELETE FROM labs; DELETE FROM protocols; DELETE FROM app_settings;');

  for (const p of data.protocols as any[]) {
    await db.runAsync(
      `INSERT OR IGNORE INTO protocols
       (id, name, compound, category, dosage, unit, frequency_type, frequency_value, route, start_date, timing_slot, specific_time, with_food, instructions, active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id,
        p.name,
        p.compound,
        p.category,
        p.dosage,
        p.unit,
        p.frequency_type,
        p.frequency_value,
        p.route,
        p.start_date,
        p.timing_slot ?? 'anytime',
        p.specific_time ?? null,
        p.with_food ?? 0,
        p.instructions ?? null,
        p.active,
        p.created_at,
      ]
    );
  }

  for (const l of data.logs as any[]) {
    await db.runAsync(
      'INSERT OR IGNORE INTO logs (id, date, protocol_id, taken, actual_dose, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [l.id, l.date, l.protocol_id, l.taken, l.actual_dose, l.notes, l.created_at]
    );
  }

  for (const m of data.daily_metrics as any[]) {
    await db.runAsync(
      'INSERT OR IGNORE INTO daily_metrics (id, date, mood, energy, libido, sleep, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [m.id, m.date, m.mood, m.energy, m.libido, m.sleep, m.notes, m.created_at]
    );
  }

  for (const lab of data.labs as any[]) {
    await db.runAsync(
      'INSERT OR IGNORE INTO labs (id, date, test_name, value, unit, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [lab.id, lab.date, lab.test_name, lab.value, lab.unit, lab.notes, lab.created_at]
    );
  }

  for (const setting of (data.app_settings ?? []) as any[]) {
    await db.runAsync(
      'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
      [setting.key, setting.value]
    );
  }

  return { success: true, message: `Imported successfully.` };
}
