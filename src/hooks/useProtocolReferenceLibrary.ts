import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { ProtocolReferenceCategory } from '../data/protocolReferenceLibrary';

export interface ProtocolReferenceLibraryItem {
  id: number;
  slug: string;
  name: string;
  compound: string;
  category: ProtocolReferenceCategory;
  default_dosage: number;
  unit: string;
  frequency_type: 'daily' | 'weekly' | 'every_x_days';
  frequency_value: number;
  route: string;
  description: string;
  dose_note: string;
  sort_order: number;
}

export function useProtocolReferenceLibrary(category?: ProtocolReferenceCategory) {
  const db = useSQLiteContext();
  const [entries, setEntries] = useState<ProtocolReferenceLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const query = category
      ? `SELECT * FROM protocol_reference_library WHERE category = ? ORDER BY sort_order ASC, name ASC`
      : `SELECT * FROM protocol_reference_library ORDER BY category ASC, sort_order ASC, name ASC`;
    const rows = category
      ? await db.getAllAsync<ProtocolReferenceLibraryItem>(query, [category])
      : await db.getAllAsync<ProtocolReferenceLibraryItem>(query);
    setEntries(rows);
    setLoading(false);
  }, [category, db]);

  useEffect(() => {
    load();
  }, [load]);

  return { entries, loading, reload: load };
}
