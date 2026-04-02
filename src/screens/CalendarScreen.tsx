import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, fontWeight, radius } from '../theme';
import { Card } from '../components/Card';
import { useProtocols } from '../hooks/useProtocols';
import { useLogs, LogWithProtocol } from '../hooks/useLogs';
import { useMetrics, DailyMetric } from '../hooks/useMetrics';
import {
  today,
  formatDate,
  formatDayName,
  formatMonthYear,
  getDaysInMonth,
  getFirstDayOfMonth,
  isProtocolDueOnDate,
} from '../utils/dateUtils';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface DayInfo {
  dateStr: string;
  hasDose: boolean;
  taken: boolean;
  missed: boolean;
  hasMetrics: boolean;
  hasTRT: boolean;
  hasPeptide: boolean;
  hasSupplement: boolean;
}

interface DayDetailData {
  logs: LogWithProtocol[];
  metric: DailyMetric | null;
}

function getMonthDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getMetricColor(value: number | null) {
  if (value == null) return colors.textMuted;
  if (value <= 4) return colors.danger;
  if (value <= 6) return colors.warning;
  return colors.success;
}

function DayLegend({ color, label }: { color: string; label: string }) {
  return (
    <View style={legendStyles.item}>
      <View style={[legendStyles.dot, { backgroundColor: color, shadowColor: color }]} />
      <Text style={legendStyles.label}>{label}</Text>
    </View>
  );
}

function MetricStat({ label, value }: { label: string; value: number | null }) {
  return (
    <View style={sheetStyles.metricStat}>
      <Text style={[sheetStyles.metricValue, { color: getMetricColor(value) }]}>
        {value != null ? value : '-'}
      </Text>
      <Text style={sheetStyles.metricLabel}>{label}</Text>
    </View>
  );
}

export function CalendarScreen() {
  const todayStr = today();
  const todayDate = new Date(`${todayStr}T00:00:00`);

  const [year, setYear] = useState(todayDate.getFullYear());
  const [month, setMonth] = useState(todayDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr);
  const [dayInfoMap, setDayInfoMap] = useState<Record<string, DayInfo>>({});
  const [detailData, setDetailData] = useState<DayDetailData | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetMounted, setSheetMounted] = useState(false);

  const { protocols } = useProtocols();
  const { getLogsForDateRange } = useLogs();
  const { getMetricForDate, getMetricsForRange } = useMetrics();

  const monthAnim = useRef(new Animated.Value(1)).current;
  const selectedGlow = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(56)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;
  const sheetDragY = useRef(new Animated.Value(0)).current;

  const animateSheetIn = useCallback(() => {
    sheetTranslateY.setValue(56);
    sheetOpacity.setValue(0);
    sheetDragY.setValue(0);
    Animated.parallel([
      Animated.spring(sheetTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 185,
        mass: 0.95,
      }),
      Animated.timing(sheetOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [sheetDragY, sheetOpacity, sheetTranslateY]);

  const animateSheetOut = useCallback((onFinished?: () => void) => {
    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: 42,
        duration: 170,
        useNativeDriver: true,
      }),
      Animated.timing(sheetOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(sheetDragY, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinished?.();
    });
  }, [sheetDragY, sheetOpacity, sheetTranslateY]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(selectedGlow, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(selectedGlow, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [selectedGlow]);

  useEffect(() => {
    if (sheetVisible) {
      setSheetMounted(true);
      animateSheetIn();
      return;
    }

    if (!sheetMounted) return;

    animateSheetOut(() => {
      setSheetMounted(false);
    });
  }, [animateSheetIn, animateSheetOut, sheetMounted, sheetVisible]);

  const animateMonthTransition = useCallback(
    (direction: 1 | -1, callback: () => void) => {
      monthAnim.setValue(0);
      callback();
      Animated.spring(monthAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 9,
        tension: 70,
        velocity: direction,
      }).start();
    },
    [monthAnim]
  );

  const prevMonth = useCallback(() => {
    animateMonthTransition(-1, () => {
      if (month === 0) {
        setYear((value) => value - 1);
        setMonth(11);
      } else {
        setMonth((value) => value - 1);
      }
    });
  }, [animateMonthTransition, month]);

  const nextMonth = useCallback(() => {
    animateMonthTransition(1, () => {
      if (month === 11) {
        setYear((value) => value + 1);
        setMonth(0);
      } else {
        setMonth((value) => value + 1);
      }
    });
  }, [animateMonthTransition, month]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 20 && Math.abs(gesture.dy) < 18,
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx > 48) prevMonth();
          if (gesture.dx < -48) nextMonth();
        },
      }),
    [nextMonth, prevMonth]
  );

  const sheetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dy) > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_, gesture) => {
          sheetDragY.setValue(Math.max(0, gesture.dy));
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 90 || gesture.vy > 0.85) {
            setSheetVisible(false);
            return;
          }

          Animated.spring(sheetDragY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 190,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(sheetDragY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 190,
          }).start();
        },
      }),
    [sheetDragY]
  );

  const loadMonth = useCallback(async () => {
    const monthDays = getDaysInMonth(year, month);
    const startStr = getMonthDate(year, month, 1);
    const endStr = getMonthDate(year, month, monthDays);

    const logs = await getLogsForDateRange(startStr, endStr);
    const metrics = await getMetricsForRange(startStr, endStr);

    const logsByDate: Record<string, LogWithProtocol[]> = {};
    logs.forEach((log) => {
      if (!logsByDate[log.date]) logsByDate[log.date] = [];
      logsByDate[log.date].push(log);
    });

    const metricDates = new Set(metrics.map((metric) => metric.date));

    const map: Record<string, DayInfo> = {};
    for (let day = 1; day <= monthDays; day += 1) {
      const dateStr = getMonthDate(year, month, day);
      const dueProtocols = protocols.filter(
        (protocol) => protocol.active === 1 && isProtocolDueOnDate(protocol, dateStr)
      );
      const hasDose = dueProtocols.length > 0;
      const dayLogs = logsByDate[dateStr] ?? [];
      const takenCount = dayLogs.filter((log) => log.taken === 1).length;
      const isPast = dateStr < todayStr;

      map[dateStr] = {
        dateStr,
        hasDose,
        taken: hasDose && takenCount > 0,
        missed: hasDose && isPast && takenCount === 0,
        hasMetrics: metricDates.has(dateStr),
        hasTRT: dueProtocols.some((protocol) => protocol.category === 'TRT'),
        hasPeptide: dueProtocols.some((protocol) => protocol.category === 'Peptide'),
        hasSupplement: dueProtocols.some((protocol) => protocol.category === 'Supplement'),
      };
    }

    setDayInfoMap(map);
  }, [getLogsForDateRange, getMetricsForRange, month, protocols, todayStr, year]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  const closeSheet = useCallback(() => {
    setSheetVisible(false);
  }, []);

  const openDay = useCallback(
    async (dateStr: string) => {
      setSelectedDate(dateStr);
      const logs = await getLogsForDateRange(dateStr, dateStr);
      const metric = await getMetricForDate(dateStr);
      setDetailData({ logs, metric });
      setSheetVisible(true);
    },
    [getLogsForDateRange, getMetricForDate]
  );

  const selectedDueProtocols = useMemo(() => {
    if (!selectedDate) return [];
    return protocols.filter(
      (protocol) => protocol.active === 1 && isProtocolDueOnDate(protocol, selectedDate)
    );
  }, [protocols, selectedDate]);

  const takenLogs = useMemo(
    () => (detailData?.logs ?? []).filter((log) => log.taken === 1),
    [detailData]
  );

  const missedLogs = useMemo(
    () => (detailData?.logs ?? []).filter((log) => log.taken !== 1),
    [detailData]
  );

  const scheduledWithoutLog = useMemo(() => {
    const loggedIds = new Set((detailData?.logs ?? []).map((log) => log.protocol_id));
    return selectedDueProtocols.filter((protocol) => !loggedIds.has(protocol.id));
  }, [detailData?.logs, selectedDueProtocols]);

  const firstDay = getFirstDayOfMonth(year, month);
  const monthDays = getDaysInMonth(year, month);
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: monthDays }, (_, index) => index + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthAnimatedStyle = {
    opacity: monthAnim,
    transform: [
      {
        translateX: monthAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [24, 0],
        }),
      },
      {
        translateY: monthAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [8, 0],
        }),
      },
    ],
  };

  const glowAnimatedStyle = {
    opacity: selectedGlow.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.78],
    }),
    transform: [
      {
        scale: selectedGlow.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.07],
        }),
      },
    ],
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient
        colors={['#07070C', '#0D0D16', '#10101C']}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.bgGlow} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Calendar</Text>
          <Text style={styles.subtitle}>Timeline of protocols, misses, and metrics</Text>
        </View>

        <View style={styles.monthSwitcherWrap}>
          <View style={styles.monthSwitcher}>
            <TouchableOpacity onPress={prevMonth} style={styles.switcherArrow} activeOpacity={0.8}>
              <Feather name="chevron-left" size={16} color={colors.accentText} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{formatMonthYear(year, month)}</Text>
            <TouchableOpacity onPress={nextMonth} style={styles.switcherArrow} activeOpacity={0.8}>
              <Feather name="chevron-right" size={16} color={colors.accentText} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.legendRow}>
          <DayLegend color={colors.trt} label="TRT" />
          <DayLegend color={colors.peptide} label="Peptides" />
          <DayLegend color={colors.supplement} label="Supplements" />
          <DayLegend color={colors.cyan} label="Metrics" />
        </View>

        <Card variant="glow" style={styles.calendarCard} padding="none">
          <LinearGradient
            colors={[
              'rgba(124, 92, 255, 0.08)',
              'rgba(124, 92, 255, 0.025)',
              'rgba(255, 255, 255, 0.01)',
            ]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.calendarInnerGradient}
            pointerEvents="none"
          />

          <Animated.View style={monthAnimatedStyle} {...panResponder.panHandlers}>
            <View style={styles.weekRow}>
              {WEEKDAYS.map((day) => (
                <Text key={day} style={styles.weekDay}>
                  {day[0]}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {cells.map((day, index) => {
                if (!day) {
                  return <View key={`empty-${index}`} style={styles.emptyCell} />;
                }

                const dateStr = getMonthDate(year, month, day);
                const info = dayInfoMap[dateStr];
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === todayStr;
                const isFuture = dateStr > todayStr;

                return (
                  <Pressable
                    key={dateStr}
                    onPress={() => openDay(dateStr)}
                    style={({ pressed }) => [styles.dayCell, pressed && styles.dayCellPressed]}
                  >
                    <View style={[styles.daySurface, isSelected && styles.daySurfaceSelected]}>
                      {isSelected && (
                        <>
                          <Animated.View style={[styles.selectedGlowRing, glowAnimatedStyle]} />
                          <View style={styles.selectedInnerFill} />
                        </>
                      )}

                      <View style={styles.dayTopRow}>
                        <Text
                          style={[
                            styles.dayNum,
                            isToday && styles.dayNumToday,
                            isFuture && !info?.hasDose && !info?.hasMetrics && styles.dayNumMuted,
                          ]}
                        >
                          {day}
                        </Text>
                        {isToday && <View style={styles.todayBadge} />}
                      </View>

                      <View style={styles.indicatorRow}>
                        {info?.hasTRT && (
                          <View
                            style={[
                              styles.indicator,
                              styles.indicatorTRT,
                              info?.missed && styles.indicatorDimmed,
                              info?.taken && styles.indicatorTakenBoost,
                            ]}
                          />
                        )}
                        {info?.hasPeptide && (
                          <View
                            style={[
                              styles.indicator,
                              styles.indicatorPeptide,
                              info?.missed && styles.indicatorDimmed,
                              info?.taken && styles.indicatorTakenBoost,
                            ]}
                          />
                        )}
                        {info?.hasSupplement && (
                          <View
                            style={[
                              styles.indicator,
                              styles.indicatorSupplement,
                              info?.missed && styles.indicatorDimmed,
                              info?.taken && styles.indicatorTakenBoost,
                            ]}
                          />
                        )}
                        {info?.hasMetrics && (
                          <View style={[styles.indicator, styles.indicatorMetrics]} />
                        )}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        </Card>
      </ScrollView>

      <Modal visible={sheetMounted} transparent animationType="none" onRequestClose={closeSheet}>
        <Pressable style={styles.sheetBackdrop} onPress={closeSheet}>
          <Animated.View
            style={[
              styles.sheetWrap,
              {
                opacity: sheetOpacity,
                transform: [{ translateY: Animated.add(sheetTranslateY, sheetDragY) }],
              },
            ]}
          >
            <Pressable onPress={(event) => event.stopPropagation()}>
              <LinearGradient
                colors={['rgba(18,18,28,0.98)', 'rgba(10,10,18,0.98)']}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
                style={styles.sheetGradient}
              >
                <View {...sheetPanResponder.panHandlers} style={styles.sheetHandleTouch}>
                  <View style={styles.sheetHandle} />
                </View>

                {selectedDate && (
                  <View style={styles.sheetHeader}>
                    <View>
                      <Text style={styles.sheetTitle}>{formatDate(selectedDate)}</Text>
                      <Text style={styles.sheetSubtitle}>{formatDayName(selectedDate)}</Text>
                    </View>
                    <TouchableOpacity onPress={closeSheet} style={styles.sheetDone}>
                      <Text style={styles.sheetDoneText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <ScrollView
                  style={styles.sheetScroll}
                  contentContainerStyle={styles.sheetContent}
                  showsVerticalScrollIndicator={false}
                  bounces
                  nestedScrollEnabled
                >
                  <View style={styles.sheetSection}>
                    <Text style={styles.sheetSectionTitle}>Protocols Taken</Text>
                    {takenLogs.length === 0 ? (
                      <Text style={styles.sheetEmpty}>No completed protocol logs for this day.</Text>
                    ) : (
                      takenLogs.map((log) => (
                        <View key={`taken-${log.id}`} style={sheetStyles.logRow}>
                          <View
                            style={[
                              sheetStyles.logGlow,
                              { backgroundColor: 'rgba(34, 197, 94, 0.14)' },
                            ]}
                          />
                          <View
                            style={[sheetStyles.logDot, { backgroundColor: colors.success }]}
                          />
                          <View style={sheetStyles.logText}>
                            <Text style={sheetStyles.logName}>{log.protocol_name}</Text>
                            <Text style={sheetStyles.logDetail}>
                              {log.actual_dose
                                ? `${log.actual_dose} ${log.protocol_unit}`
                                : `${log.protocol_dosage} ${log.protocol_unit}`}{' '}
                              completed
                            </Text>
                          </View>
                        </View>
                      ))
                    )}
                  </View>

                  <View style={styles.sheetSection}>
                    <Text style={styles.sheetSectionTitle}>Missed Items</Text>
                    {missedLogs.length === 0 && scheduledWithoutLog.length === 0 ? (
                      <Text style={styles.sheetEmpty}>No missed items for this day.</Text>
                    ) : (
                      <>
                        {missedLogs.map((log) => (
                          <View key={`missed-${log.id}`} style={sheetStyles.logRow}>
                            <View
                              style={[
                                sheetStyles.logGlow,
                                { backgroundColor: 'rgba(239, 68, 68, 0.14)' },
                              ]}
                            />
                            <View
                              style={[sheetStyles.logDot, { backgroundColor: colors.danger }]}
                            />
                            <View style={sheetStyles.logText}>
                              <Text style={sheetStyles.logName}>{log.protocol_name}</Text>
                              <Text style={sheetStyles.logDetail}>Logged as missed</Text>
                            </View>
                          </View>
                        ))}
                        {scheduledWithoutLog.map((protocol) => (
                          <View key={`scheduled-${protocol.id}`} style={sheetStyles.logRow}>
                            <View
                              style={[
                                sheetStyles.logGlow,
                                { backgroundColor: 'rgba(124, 92, 255, 0.12)' },
                              ]}
                            />
                            <View
                              style={[sheetStyles.logDot, { backgroundColor: colors.accent }]}
                            />
                            <View style={sheetStyles.logText}>
                              <Text style={sheetStyles.logName}>{protocol.name}</Text>
                              <Text style={sheetStyles.logDetail}>
                                Scheduled with no completion log yet
                              </Text>
                            </View>
                          </View>
                        ))}
                      </>
                    )}
                  </View>

                  <View style={styles.sheetSection}>
                    <Text style={styles.sheetSectionTitle}>Metrics Summary</Text>
                    {detailData?.metric ? (
                      <>
                        <View style={sheetStyles.metricsRow}>
                          <MetricStat label="Mood" value={detailData.metric.mood} />
                          <MetricStat label="Energy" value={detailData.metric.energy} />
                          <MetricStat label="Libido" value={detailData.metric.libido} />
                          <MetricStat label="Sleep" value={detailData.metric.sleep} />
                        </View>
                        {detailData.metric.notes ? (
                          <View style={sheetStyles.noteCard}>
                            <Text style={sheetStyles.noteLabel}>Notes</Text>
                            <Text style={sheetStyles.noteText}>{detailData.metric.notes}</Text>
                          </View>
                        ) : null}
                      </>
                    ) : (
                      <Text style={styles.sheetEmpty}>No metrics logged for this day.</Text>
                    )}
                  </View>
                </ScrollView>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const legendStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    opacity: 0.62,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
});

const sheetStyles = StyleSheet.create({
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    position: 'relative',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.02)',
    overflow: 'hidden',
  },
  logGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.md,
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  logText: {
    flex: 1,
  },
  logName: {
    fontSize: fontSize.base,
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
  logDetail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricStat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  metricLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 4,
  },
  noteCard: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  noteLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  noteText: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing['2xl'],
  },
  bgGlow: {
    position: 'absolute',
    top: 96,
    alignSelf: 'center',
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: 'rgba(124, 92, 255, 0.12)',
    opacity: 0.35,
  },
  headerRow: {
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  monthSwitcherWrap: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  monthSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.white6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switcherArrow: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentDim,
  },
  monthTitle: {
    minWidth: 118,
    textAlign: 'center',
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: 2,
  },
  calendarCard: {
    overflow: 'hidden',
    padding: spacing.md + 2,
    backgroundColor: '#10101A',
  },
  calendarInnerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm + 2,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
  },
  emptyCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  dayCellPressed: {
    transform: [{ scale: 0.97 }],
  },
  daySurface: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 255, 0.04)',
    overflow: 'hidden',
  },
  daySurfaceSelected: {
    transform: [{ scale: 1.05 }],
    borderColor: 'rgba(164, 139, 255, 0.28)',
    backgroundColor: 'rgba(124, 92, 255, 0.06)',
  },
  dayTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 'auto',
  },
  dayNum: {
    zIndex: 2,
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  dayNumToday: {
    color: colors.accentText,
    fontWeight: fontWeight.bold,
  },
  dayNumMuted: {
    color: colors.textMuted,
  },
  todayBadge: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.accentText,
  },
  indicatorRow: {
    flexDirection: 'row',
    gap: 4,
    zIndex: 2,
    marginTop: spacing.sm,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  indicatorTRT: {
    backgroundColor: colors.trt,
    shadowColor: colors.trt,
    shadowOpacity: 0.42,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 0 },
  },
  indicatorPeptide: {
    backgroundColor: colors.peptide,
    shadowColor: colors.peptide,
    shadowOpacity: 0.36,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 0 },
  },
  indicatorSupplement: {
    backgroundColor: colors.supplement,
    shadowColor: colors.supplement,
    shadowOpacity: 0.34,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 0 },
  },
  indicatorTakenBoost: {
    opacity: 1,
    transform: [{ scale: 1.05 }],
  },
  indicatorDimmed: {
    opacity: 0.45,
    shadowOpacity: 0.12,
  },
  indicatorMetrics: {
    backgroundColor: colors.cyan,
    shadowColor: colors.cyan,
    shadowOpacity: 0.32,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 0 },
  },
  selectedGlowRing: {
    position: 'absolute',
    inset: 2,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.accentText,
  },
  selectedInnerFill: {
    position: 'absolute',
    inset: 5,
    borderRadius: radius.md,
    backgroundColor: 'rgba(124, 92, 255, 0.08)',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 3, 10, 0.58)',
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
    maxHeight: '84%',
  },
  sheetGradient: {
    maxHeight: '100%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  sheetHandleTouch: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.white16,
    marginBottom: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: fontSize.xl,
    color: colors.text,
    fontWeight: fontWeight.bold,
  },
  sheetSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  sheetDone: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.white6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetDoneText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },
  sheetScroll: {
    maxHeight: '100%',
  },
  sheetContent: {
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
  sheetSection: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.025)',
    gap: spacing.sm,
  },
  sheetSectionTitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: fontWeight.semibold,
  },
  sheetEmpty: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
});
