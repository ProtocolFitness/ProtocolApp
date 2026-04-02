import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, RefreshControl, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, fontSize, fontWeight, radius } from '../theme';
import { ProtocolCard } from '../components/ProtocolCard';
import { EmptyState } from '../components/EmptyState';
import { SegmentedControl } from '../components/SegmentedControl';
import { useProtocols } from '../hooks/useProtocols';
import { useLogs } from '../hooks/useLogs';
import { useAppSettings } from '../hooks/useAppSettings';
import { today } from '../utils/dateUtils';
import { sortProtocolsByTiming } from '../utils/protocolTiming';
import { RootStackParamList } from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type FilterValue = 'all' | 'TRT' | 'Peptide' | 'Supplement';

const SEGMENTS = [
  { value: 'all' as FilterValue, label: 'All' },
  { value: 'TRT' as FilterValue, label: 'TRT' },
  { value: 'Peptide' as FilterValue, label: 'Peptides' },
  { value: 'Supplement' as FilterValue, label: 'Supplements' },
];

export function ProtocolsScreen() {
  const navigation = useNavigation<Nav>();
  const { protocols, loading, deleteProtocol, toggleActive, reload } = useProtocols();
  const { settings } = useAppSettings();
  const { logs } = useLogs(today());
  const [filter, setFilter] = useState<FilterValue>('all');
  const [refreshing, setRefreshing] = useState(false);

  const takenMap: Record<number, boolean> = {};
  logs.forEach((l) => { takenMap[l.protocol_id] = l.taken === 1; });

  const active = protocols.filter((p) => p.active === 1);
  const paused = protocols.filter((p) => p.active !== 1);

  const filtered = (list: typeof protocols) =>
    filter === 'all' ? list : list.filter((p) => p.category === filter);

  const filteredActive = sortProtocolsByTiming(filtered(active), settings);
  const filteredPaused = sortProtocolsByTiming(filtered(paused), settings);

  const handleDelete = (id: number, name: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm(
        `Remove "${name}"?\n\nAll associated logs will also be deleted.`
      );

      if (confirmed) {
        void deleteProtocol(id);
      }
      return;
    }

    Alert.alert('Delete Protocol', `Remove "${name}"?\n\nAll associated logs will also be deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { void deleteProtocol(id); } },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Protocols</Text>
          {protocols.length > 0 && (
            <Text style={styles.subtitle}>
              {active.length} active{paused.length > 0 ? ` · ${paused.length} paused` : ''}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddEditProtocol', {})}
          style={styles.addButton}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Filter */}
      {protocols.length > 0 && (
        <View style={styles.filterWrap}>
          <SegmentedControl
            segments={SEGMENTS}
            value={filter}
            onChange={setFilter}
          />
        </View>
      )}

      {/* List */}
      {protocols.length === 0 && !loading ? (
        <EmptyState
          icon="activity"
          title="No protocols yet"
          subtitle="Track your TRT, peptides, and supplements in one place."
          actionLabel="Add Protocol"
          onAction={() => navigation.navigate('AddEditProtocol', {})}
        />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
        >
          {/* Active protocols */}
          {filteredActive.length > 0 && (
            <>
              <SectionLabel
                label="Active"
                count={filteredActive.length}
                dotColor={colors.success}
              />
              {filteredActive.map((p) => (
                <ProtocolCard
                  key={p.id}
                  protocol={p}
                  takenToday={takenMap[p.id]}
                  onEdit={() => navigation.navigate('AddEditProtocol', { protocol: p })}
                  onDelete={() => handleDelete(p.id, p.name)}
                  onToggle={() => toggleActive(p.id, false)}
                />
              ))}
            </>
          )}

          {/* Paused protocols */}
          {filteredPaused.length > 0 && (
            <>
              <SectionLabel
                label="Paused"
                count={filteredPaused.length}
                dotColor={colors.textMuted}
                style={{ marginTop: filteredActive.length > 0 ? spacing.md : 0 }}
              />
              {filteredPaused.map((p) => (
                <ProtocolCard
                  key={p.id}
                  protocol={p}
                  onEdit={() => navigation.navigate('AddEditProtocol', { protocol: p })}
                  onDelete={() => handleDelete(p.id, p.name)}
                  onToggle={() => toggleActive(p.id, true)}
                />
              ))}
            </>
          )}

          {/* No results after filter */}
          {filteredActive.length === 0 && filteredPaused.length === 0 && (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>
                No {filter === 'all' ? '' : filter + ' '}protocols found.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SectionLabel({
  label, count, dotColor, style,
}: { label: string; count: number; dotColor: string; style?: object }) {
  return (
    <View style={[sectionStyles.row, style]}>
      <View style={[sectionStyles.dot, { backgroundColor: dotColor }]} />
      <Text style={sectionStyles.label}>{label}</Text>
      <View style={sectionStyles.countBadge}>
        <Text style={sectionStyles.count}>{count}</Text>
      </View>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    flex: 1,
  },
  countBadge: {
    backgroundColor: colors.surface3,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  count: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.sm,
  },

  filterWrap: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },

  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing['2xl'],
  },

  noResults: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: fontSize.base,
    color: colors.textMuted,
  },
});
