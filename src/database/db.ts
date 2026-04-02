import * as SQLite from 'expo-sqlite';
import { seedProtocolReferenceLibrary } from '../data/protocolReferenceLibrary';

async function ensureColumn(
  db: SQLite.SQLiteDatabase,
  tableName: string,
  columnName: string,
  definition: string
) {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${tableName})`);
  if (!columns.some((column) => column.name === columnName)) {
    await db.execAsync(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition};`);
  }
}

export async function initDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS protocols (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      compound TEXT NOT NULL,
      category TEXT NOT NULL,
      dosage REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT 'mg',
      frequency_type TEXT NOT NULL DEFAULT 'weekly',
      frequency_value INTEGER NOT NULL DEFAULT 1,
      route TEXT NOT NULL DEFAULT 'IM',
      start_date TEXT NOT NULL,
      timing_slot TEXT NOT NULL DEFAULT 'anytime',
      specific_time TEXT,
      with_food INTEGER NOT NULL DEFAULT 0,
      instructions TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      protocol_id INTEGER NOT NULL,
      taken INTEGER NOT NULL DEFAULT 0,
      actual_dose REAL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (protocol_id) REFERENCES protocols(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS daily_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      mood INTEGER,
      energy INTEGER,
      libido INTEGER,
      sleep INTEGER,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS labs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      test_name TEXT NOT NULL,
      value REAL NOT NULL,
      unit TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ai_insights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      data_preview TEXT NOT NULL,
      summary TEXT NOT NULL,
      raw_response TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS protocol_reference_library (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      compound TEXT NOT NULL,
      category TEXT NOT NULL,
      default_dosage REAL NOT NULL,
      unit TEXT NOT NULL,
      frequency_type TEXT NOT NULL,
      frequency_value INTEGER NOT NULL,
      route TEXT NOT NULL,
      description TEXT NOT NULL,
      dose_note TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
  `);

  await ensureColumn(db, 'protocols', 'timing_slot', `TEXT NOT NULL DEFAULT 'anytime'`);
  await ensureColumn(db, 'protocols', 'specific_time', 'TEXT');
  await ensureColumn(db, 'protocols', 'with_food', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumn(db, 'protocols', 'instructions', 'TEXT');

  await seedProtocolReferenceLibrary(db);
}
