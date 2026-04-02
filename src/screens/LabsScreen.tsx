import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, fontSize, fontWeight, radius } from '../theme';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { LineChart } from '../components/LineChart';
import { useLabs } from '../hooks/useLabs';
import { formatDateShort } from '../utils/dateUtils';
import { RootStackParamList } from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const COMMON_MARKERS = [
  'Total Testosterone',
  'Free Testosterone',
  'Estradiol (E2)',
  'SHBG',
  'LH',
  'FSH',
  'Hematocrit',
  'Hemoglobin',
  'PSA',
  'IGF-1',
  'TSH',
  'Cortisol',
];

function getMarkerColor(marker: string): string {
  const idx = COMMON_MARKERS.indexOf(marker);
  const palette = [
    colors.accent,
    colors.cyan,
    colors.success,
    colors.warning,
    '#F472B6',
    '#A78BFA',
    '#34D399',
    '#FB923C',
    '#60A5FA',
    '#E879F9',
    '#2DD4BF',
    '#FACC15',
  ];
  return palette[idx % palette.length] ?? colors.accent;
}

export function LabsScreen() {
  const navigation = useNavigation<Nav>();
  const { labs, markers, deleteLab, getLabsByMarker } = useLabs();
  const { width } = useWindowDimensions();
  const chartWidth = width - spacing.md * 2 - spacing.md * 2; // account for screen + card padding

  const [selectedMarker, setSelectedMarker] = useState<string | null>(
    markers.length > 0 ? markers[0] : null
  );

  const markerData = selectedMarker ? getLabsByMarker(selectedMarker) : [];
  const chartData = markerData.map((l) => ({
    label: formatDateShort(l.date),
    value: l.value,
  }));

  const latestByMarker: Record<string, { value: number; unit: string; date: string }> = {};
  markers.forEach((m) => {
    const data = getLabsByMarker(m);
    if (data.length > 0) {
      const latest = data[data.length - 1];
      latestByMarker[m] = { value: latest.value, unit: latest.unit, date: latest.date };
    }
  });

  const handleDelete = (id: number, testName: string, value: number) => {
    Alert.alert('Delete Entry', `Remove ${testName} = ${value}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteLab(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Labs</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddLab', {})}
          style={styles.addBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {labs.length === 0 ? (
        <EmptyState
          icon="🧪"
          title="No lab results yet"
          subtitle="Add your bloodwork results to track trends over time."
          actionLabel="Add Lab Result"
          onAction={() => navigation.navigate('AddLab', {})}
        />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Marker selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.markerRow}
          >
            {markers.map((m) => {
              const color = getMarkerColor(m);
              const active = selectedMarker === m;
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => setSelectedMarker(m)}
                  style={[
                    styles.markerPill,
                    active && { backgroundColor: `${color}20`, borderColor: `${color}60` },
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.markerDot, { backgroundColor: color }]} />
                  <Text style={[styles.markerText, active && { color }]}>{m}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Chart for selected marker */}
          {selectedMarker && (
            <Card style={styles.chartCard} padding="md">
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>{selectedMarker}</Text>
                {latestByMarker[selectedMarker] && (
                  <View>
                    <Text style={[styles.latestValue, { color: getMarkerColor(selectedMarker) }]}>
                      {latestByMarker[selectedMarker].value} {latestByMarker[selectedMarker].unit}
                    </Text>
                    <Text style={styles.latestDate}>{formatDateShort(latestByMarker[selectedMarker].date)}</Text>
                  </View>
                )}
              </View>

              {chartData.length >= 2 ? (
                <LineChart
                  data={chartData}
                  width={chartWidth}
                  color={getMarkerColor(selectedMarker)}
                  height={200}
                />
              ) : (
                <Text style={styles.notEnoughData}>Add more entries to see a trend</Text>
              )}
            </Card>
          )}

          {/* All entries for selected marker */}
          {selectedMarker && (
            <>
              <Text style={styles.sectionLabel}>All Entries — {selectedMarker}</Text>
              {getLabsByMarker(selectedMarker)
                .slice()
                .reverse()
                .map((lab) => (
                  <View key={lab.id} style={styles.labRow}>
                    <View style={[styles.labDot, { backgroundColor: getMarkerColor(selectedMarker) }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.labValue}>{lab.value} <Text style={styles.labUnit}>{lab.unit}</Text></Text>
                      {lab.notes ? <Text style={styles.labNotes}>{lab.notes}</Text> : null}
                    </View>
                    <Text style={styles.labDate}>{formatDateShort(lab.date)}</Text>
                    <TouchableOpacity
                      onPress={() => handleDelete(lab.id, lab.test_name, lab.value)}
                      hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                      style={{ paddingLeft: spacing.sm }}
                    >
                      <Text style={styles.deleteBtn}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
            </>
          )}

          {/* Quick summary cards */}
          <Text style={styles.sectionLabel}>All Markers Summary</Text>
          <View style={styles.summaryGrid}>
            {markers.map((m) => {
              const latest = latestByMarker[m];
              const color = getMarkerColor(m);
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => setSelectedMarker(m)}
                  style={styles.summaryCard}
                  activeOpacity={0.75}
                >
                  <View style={[styles.summaryDot, { backgroundColor: color }]} />
                  <Text style={styles.summaryMarker} numberOfLines={2}>{m}</Text>
                  {latest && (
                    <Text style={[styles.summaryValue, { color }]}>
                      {latest.value} {latest.unit}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  addBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  addBtnText: { color: '#fff', fontWeight: fontWeight.semibold, fontSize: fontSize.base },

  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing['2xl'] },

  markerRow: { gap: spacing.sm, marginBottom: spacing.md },
  markerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  markerDot: { width: 8, height: 8, borderRadius: 4 },
  markerText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: fontWeight.medium },

  chartCard: { marginBottom: spacing.md },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  chartTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  latestValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, textAlign: 'right' },
  latestDate: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'right' },
  notEnoughData: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },

  sectionLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },

  labRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  labDot: { width: 10, height: 10, borderRadius: 5 },
  labValue: { fontSize: fontSize.base, color: colors.text, fontWeight: fontWeight.medium },
  labUnit: { color: colors.textMuted, fontWeight: fontWeight.regular },
  labNotes: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  labDate: { fontSize: fontSize.sm, color: colors.textMuted },
  deleteBtn: { fontSize: fontSize.sm, color: colors.danger },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  summaryCard: {
    width: '47%',
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  summaryDot: { width: 8, height: 8, borderRadius: 4 },
  summaryMarker: { fontSize: fontSize.sm, color: colors.textMuted },
  summaryValue: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginTop: 2 },
});
