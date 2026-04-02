import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, fontWeight, radius } from '../theme';
import { Card } from '../components/Card';
import { MetricSlider } from '../components/MetricSlider';
import { Button } from '../components/Button';
import { useProtocols } from '../hooks/useProtocols';
import { useMetrics } from '../hooks/useMetrics';
import { useLogs } from '../hooks/useLogs';
import { useAppSettings } from '../hooks/useAppSettings';
import { addDays, today, formatDate, formatRelativeDate, getNextDoseDateFrom, isProtocolDueOnDate } from '../utils/dateUtils';
import { getProtocolTimingLabel, sortProtocolsByTiming } from '../utils/protocolTiming';

function getTimingLine(
  protocol: { timing_slot: string; specific_time: string | null; with_food: number },
  settings: { morningTime: string; lunchTime: string; nightTime: string }
) {
  const timing = getProtocolTimingLabel(protocol as any, settings);
  return protocol.with_food === 1 ? `${timing} · With food` : timing;
}

export function DashboardScreen() {
  const todayStr = today();
  const { protocols } = useProtocols();
  const { settings } = useAppSettings();
  const { saveMetric, getMetricForDate, getWeeklyAverages } = useMetrics();
  const { logDose, getLogForProtocolDate } = useLogs();

  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [libido, setLibido] = useState<number | null>(null);
  const [sleep, setSleep] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [weeklyAvg, setWeeklyAvg] = useState<{ mood: number | null; energy: number | null; libido: number | null; sleep: number | null }>({ mood: null, energy: null, libido: null, sleep: null });
  const [protocolStatus, setProtocolStatus] = useState<Record<number, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);

  const activeProtocols = useMemo(
    () => protocols.filter((p) => p.active === 1),
    [protocols]
  );

  const dueToday = useMemo(
    () => sortProtocolsByTiming(activeProtocols.filter((p) => isProtocolDueOnDate(p, todayStr)), settings),
    [activeProtocols, settings, todayStr]
  );

  const nextProtocol = useMemo(
    () =>
      activeProtocols
        .map((p) => ({
          protocol: p,
          date: getNextDoseDateFrom(
            p,
            protocolStatus[p.id] && isProtocolDueOnDate(p, todayStr) ? addDays(todayStr, 1) : todayStr
          ),
        }))
        .sort((a, b) => {
          const dateDiff = a.date.localeCompare(b.date);
          if (dateDiff !== 0) return dateDiff;

          const ordered = sortProtocolsByTiming([a.protocol, b.protocol], settings);
          return ordered[0].id === a.protocol.id ? -1 : 1;
        })[0],
    [activeProtocols, protocolStatus, settings, todayStr]
  );

  const loadData = useCallback(async () => {
    const metric = await getMetricForDate(todayStr);
    if (metric) {
      setMood(metric.mood);
      setEnergy(metric.energy);
      setLibido(metric.libido);
      setSleep(metric.sleep);
      setSaved(true);
    } else {
      setMood(null);
      setEnergy(null);
      setLibido(null);
      setSleep(null);
      setSaved(false);
    }

    const avgs = await getWeeklyAverages();
    setWeeklyAvg(avgs);

    const statusMap: Record<number, boolean> = {};
    for (const p of dueToday) {
      const log = await getLogForProtocolDate(p.id, todayStr);
      statusMap[p.id] = log?.taken === 1;
    }
    setProtocolStatus(statusMap);
  }, [dueToday, getLogForProtocolDate, getMetricForDate, getWeeklyAverages, todayStr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSaveMetrics = async () => {
    if (mood == null && energy == null && libido == null && sleep == null) {
      Alert.alert('Nothing to save', 'Please rate at least one metric.');
      return;
    }
    setSaving(true);
    await saveMetric(todayStr, {
      mood: mood ?? undefined,
      energy: energy ?? undefined,
      libido: libido ?? undefined,
      sleep: sleep ?? undefined,
    });
    setSaving(false);
    setSaved(true);
  };

  const handleMetricChange = (
    setter: React.Dispatch<React.SetStateAction<number | null>>,
    value: number | null
  ) => {
    setter(value);
    setSaved(false);
  };

  const handleMarkAllTaken = async () => {
    for (const p of dueToday) {
      await logDose(p.id, todayStr, true, p.dosage);
    }
    const statusMap: Record<number, boolean> = {};
    dueToday.forEach((p) => {
      statusMap[p.id] = true;
    });
    setProtocolStatus(statusMap);
  };

  const toggleProtocol = async (protocolId: number) => {
    const current = protocolStatus[protocolId] ?? false;
    const protocol = dueToday.find((p) => p.id === protocolId);
    await logDose(protocolId, todayStr, !current, protocol?.dosage);
    setProtocolStatus((prev) => ({ ...prev, [protocolId]: !current }));
  };

  const allTaken = dueToday.length > 0 && dueToday.every((p) => protocolStatus[p.id]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Protocol</Text>
            <Text style={styles.date}>{formatDate(todayStr)}</Text>
          </View>
          <View style={[styles.streakBadge, allTaken && styles.streakActive]}>
            <Text style={styles.streakEmoji}>OK</Text>
            <Text style={[styles.streakText, allTaken && { color: colors.success }]}>
              {allTaken ? 'Done' : `${dueToday.filter((p) => protocolStatus[p.id]).length}/${dueToday.length}`}
            </Text>
          </View>
        </View>

        {dueToday.length > 0 && (
          <Card style={styles.sectionCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Today's Protocols</Text>
              {!allTaken && (
                <TouchableOpacity onPress={handleMarkAllTaken} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <Text style={styles.markAll}>Mark all taken</Text>
                </TouchableOpacity>
              )}
            </View>

            {dueToday.map((p) => {
              const taken = protocolStatus[p.id] ?? false;
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => toggleProtocol(p.id)}
                  activeOpacity={0.7}
                  style={[styles.protocolRow, taken && styles.protocolTaken]}
                >
                  <View style={[styles.checkCircle, taken && styles.checkCircleActive]}>
                    {taken && <Text style={styles.checkMark}>+</Text>}
                  </View>
                  <View style={styles.protocolInfo}>
                    <Text style={[styles.protocolName, taken && styles.protocolNameTaken]}>
                      {p.name}
                    </Text>
                    <Text style={styles.protocolDose}>
                      {p.dosage} {p.unit} · {p.route} · {getTimingLine(p, settings)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.categoryDot,
                      {
                        backgroundColor:
                          p.category === 'TRT' ? colors.trt : p.category === 'Peptide' ? colors.peptide : colors.supplement,
                      },
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </Card>
        )}

        {dueToday.length === 0 && (
          <Card style={styles.sectionCard}>
            <Text style={styles.noDoseText}>No protocols scheduled for today</Text>
          </Card>
        )}

        {nextProtocol && (
          <Card variant="glow" style={styles.sectionCard}>
            <Text style={styles.cardTitle}>Next Dose</Text>
            <View style={styles.nextDose}>
              <View>
                <Text style={styles.nextProtocolName}>{nextProtocol.protocol.name}</Text>
                <Text style={styles.nextDoseDetail}>
                  {nextProtocol.protocol.dosage} {nextProtocol.protocol.unit} · {nextProtocol.protocol.route}
                </Text>
              </View>
              <View style={styles.nextDateBadge}>
                <Text style={styles.nextDateText}>{formatRelativeDate(nextProtocol.date)}</Text>
              </View>
            </View>
          </Card>
        )}

        <Card style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Daily Check-in</Text>
            {saved && <Text style={styles.savedText}>Saved</Text>}
          </View>

          <MetricSlider label="Mood" icon="smile" value={mood} onChange={(value) => handleMetricChange(setMood, value)} />
          <MetricSlider label="Energy" icon="zap" value={energy} onChange={(value) => handleMetricChange(setEnergy, value)} />
          <MetricSlider label="Libido" icon="activity" value={libido} onChange={(value) => handleMetricChange(setLibido, value)} />
          <MetricSlider label="Sleep" icon="moon" value={sleep} onChange={(value) => handleMetricChange(setSleep, value)} />

          <Button
            label={saved ? 'Update Log' : "Save Today's Log"}
            onPress={handleSaveMetrics}
            loading={saving}
            fullWidth
            style={styles.saveBtn}
          />
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.cardTitle}>7-Day Averages</Text>
          <View style={styles.avgGrid}>
            <AvgItem label="Mood" value={weeklyAvg.mood} />
            <AvgItem label="Energy" value={weeklyAvg.energy} />
            <AvgItem label="Libido" value={weeklyAvg.libido} />
            <AvgItem label="Sleep" value={weeklyAvg.sleep} />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function AvgItem({ label, value }: { label: string; value: number | null }) {
  const color = value == null ? colors.textMuted : value <= 4 ? colors.danger : value <= 6 ? colors.warning : colors.success;

  return (
    <View style={avgStyles.container}>
      <Text style={[avgStyles.value, { color }]}>
        {value != null ? value.toFixed(1) : '-'}
      </Text>
      <Text style={avgStyles.label}>{label}</Text>
    </View>
  );
}

const avgStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', gap: 4 },
  value: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  label: { fontSize: fontSize.xs, color: colors.textMuted },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing['2xl'] },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.text },
  date: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface2,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakActive: {
    borderColor: `${colors.success}50`,
    backgroundColor: colors.successDim,
  },
  streakEmoji: { fontSize: 12, fontWeight: fontWeight.bold, color: colors.textMuted },
  streakText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textMuted },
  sectionCard: { marginBottom: spacing.md },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  markAll: { fontSize: fontSize.sm, color: colors.accent },
  savedText: { fontSize: fontSize.sm, color: colors.success },
  protocolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  protocolTaken: { opacity: 0.6 },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: fontWeight.bold },
  protocolInfo: { flex: 1 },
  protocolName: { fontSize: fontSize.base, color: colors.text, fontWeight: fontWeight.medium },
  protocolNameTaken: { textDecorationLine: 'line-through', color: colors.textMuted },
  protocolDose: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 1 },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  noDoseText: { fontSize: fontSize.base, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.sm },
  nextDose: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nextProtocolName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  nextDoseDetail: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  nextDateBadge: {
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  nextDateText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: '#fff' },
  saveBtn: { marginTop: spacing.md },
  avgGrid: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: spacing.sm },
});
