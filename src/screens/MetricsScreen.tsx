import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, radius } from '../theme';
import { Card } from '../components/Card';
import { LineChart } from '../components/LineChart';
import { EmptyState } from '../components/EmptyState';
import { useMetrics, DailyMetric } from '../hooks/useMetrics';
import { formatDateShort, getLast30Days } from '../utils/dateUtils';

const METRICS: {
  key: keyof DailyMetric;
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  color: string;
}[] = [
  { key: 'mood', label: 'Mood', icon: 'smile', color: colors.accent },
  { key: 'energy', label: 'Energy', icon: 'zap', color: colors.cyan },
  { key: 'libido', label: 'Libido', icon: 'heart', color: '#F472B6' },
  { key: 'sleep', label: 'Sleep', icon: 'moon', color: colors.success },
];

export function MetricsScreen() {
  const { metrics, loading, getMetricsForRange } = useMetrics(60);
  const { width } = useWindowDimensions();
  const chartWidth = width - spacing.md * 2 - spacing.md * 2;

  const [chartData, setChartData] = useState<DailyMetric[]>([]);

  useEffect(() => {
    const load = async () => {
      const days = getLast30Days();
      const start = days[0];
      const end = days[days.length - 1];
      const data = await getMetricsForRange(start, end);
      setChartData(data);
    };
    load();
  }, [metrics]);

  const getChartPoints = (key: keyof DailyMetric) =>
    chartData
      .filter((m) => m[key] != null)
      .map((m) => ({
        label: formatDateShort(m.date),
        value: m[key] as number,
      }));

  if (metrics.length === 0 && !loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Metrics</Text>
        </View>
        <EmptyState
          icon="📊"
          title="No metrics logged"
          subtitle="Log your daily mood, energy, libido, and sleep from the Dashboard."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Metrics</Text>
        <Text style={styles.subtitle}>Last 30 days</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Charts */}
        {METRICS.map(({ key, label, icon, color }) => {
          const points = getChartPoints(key);
          const values = points.map((p) => p.value);
          const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
          const trend = values.length >= 2
            ? values[values.length - 1] - values[0] > 0 ? '↑' : values[values.length - 1] - values[0] < 0 ? '↓' : '→'
            : null;

          return (
            <Card key={key} style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <View style={styles.metricLabel}>
                  <Feather name={icon} size={16} color={color} />
                  <Text style={styles.metricName}>{label}</Text>
                  {trend && (
                    <Text style={[styles.trend, {
                      color: trend === '↑' ? colors.success : trend === '↓' ? colors.danger : colors.textMuted
                    }]}>{trend}</Text>
                  )}
                </View>
                {avg != null && (
                  <View style={styles.avgBadge}>
                    <Text style={[styles.avgValue, { color }]}>{avg.toFixed(1)}</Text>
                    <Text style={styles.avgLabel}>avg</Text>
                  </View>
                )}
              </View>

              {points.length >= 2 ? (
                <LineChart data={points} width={chartWidth} color={color} height={140} yMin={1} yMax={10} />
              ) : (
                <Text style={styles.notEnough}>Not enough data to show trend</Text>
              )}
            </Card>
          );
        })}

        {/* History table */}
        <Text style={styles.sectionTitle}>Log History</Text>
        <Card style={styles.tableCard} padding="none">
          {/* Table header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.dateCell, styles.headerCell]}>Date</Text>
            <Text style={[styles.tableCell, styles.headerCell]}>😊</Text>
            <Text style={[styles.tableCell, styles.headerCell]}>⚡</Text>
            <Text style={[styles.tableCell, styles.headerCell]}>🔥</Text>
            <Text style={[styles.tableCell, styles.headerCell]}>😴</Text>
          </View>

          {metrics.map((m, i) => {
            const isLast = i === metrics.length - 1;
            return (
              <View key={m.id} style={[styles.tableRow, !isLast && styles.tableRowBorder]}>
                <Text style={[styles.tableCell, styles.dateCell]}>{formatDateShort(m.date)}</Text>
                <MetricCell value={m.mood} />
                <MetricCell value={m.energy} />
                <MetricCell value={m.libido} />
                <MetricCell value={m.sleep} />
              </View>
            );
          })}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCell({ value }: { value: number | null }) {
  const color = value == null ? colors.textSubtle
    : value <= 4 ? colors.danger
    : value <= 6 ? colors.warning
    : colors.success;

  return (
    <Text style={[styles.tableCell, { color, fontWeight: fontWeight.semibold }]}>
      {value ?? '—'}
    </Text>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing['2xl'] },

  chartCard: { marginBottom: spacing.md },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  metricLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },

  metricName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  trend: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  avgBadge: { alignItems: 'center' },
  avgValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  avgLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  notEnough: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },

  sectionTitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  tableCard: { borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.md },
  tableRow: { flexDirection: 'row', paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  tableRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  tableHeader: { backgroundColor: colors.surface },
  headerCell: { color: colors.textMuted, fontSize: fontSize.xs, textTransform: 'uppercase' },
  tableCell: { flex: 1, fontSize: fontSize.sm, color: colors.text, textAlign: 'center' },
  dateCell: { flex: 2, textAlign: 'left' },
});
