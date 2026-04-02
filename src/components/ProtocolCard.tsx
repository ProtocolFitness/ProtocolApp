import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize, fontWeight, categoryColor } from '../theme';
import { Protocol } from '../hooks/useProtocols';
import { useAppSettings } from '../hooks/useAppSettings';
import { addDays, formatRelativeDate, getNextDoseDateFrom, today } from '../utils/dateUtils';
import { getProtocolTimingLabel } from '../utils/protocolTiming';

interface ProtocolCardProps {
  protocol: Protocol;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  takenToday?: boolean;
}

function getRouteIcon(route: string): React.ComponentProps<typeof Feather>['name'] {
  if (route === 'IM' || route === 'SubQ') return 'activity';
  if (route === 'Topical') return 'droplet';
  return 'package';
}

function getFrequencyLabel(protocol: Protocol): string {
  if (protocol.frequency_type === 'daily') return 'Daily';
  if (protocol.frequency_type === 'weekly') return `Weekly`;
  if (protocol.frequency_type === 'every_x_days') return `E${protocol.frequency_value}D`;
  return '';
}

function StatusDot({ taken, due }: { taken?: boolean; due: boolean }) {
  if (!due) return <View style={[statusStyles.dot, statusStyles.inactive]} />;
  if (taken) return <View style={[statusStyles.dot, statusStyles.taken]} />;
  return <View style={[statusStyles.dot, statusStyles.due]} />;
}

const statusStyles = StyleSheet.create({
  dot: { width: 8, height: 8, borderRadius: 4 },
  taken: { backgroundColor: colors.success, shadowColor: colors.success, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6, elevation: 4 },
  due: { backgroundColor: colors.warning, shadowColor: colors.warning, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6, elevation: 4 },
  inactive: { backgroundColor: colors.textSubtle },
});

export function ProtocolCard({ protocol, onEdit, onDelete, onToggle, takenToday }: ProtocolCardProps) {
  const { settings } = useAppSettings();
  const scale = useRef(new Animated.Value(1)).current;
  const catColor = categoryColor(protocol.category);
  const nextDose = getNextDoseDateFrom(protocol, takenToday ? addDays(today(), 1) : today());
  const nextLabel = formatRelativeDate(nextDose);
  const isInactive = protocol.active !== 1;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.975, useNativeDriver: true, speed: 50 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }], marginBottom: spacing.sm }}>
      <TouchableOpacity
        onPress={onEdit}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={[styles.card, isInactive && styles.cardInactive]}
      >
        {/* Category accent bar */}
        <View style={[styles.accentBar, { backgroundColor: catColor }]} />

        {/* Status dot (top-right) */}
        <View style={styles.statusDotWrap}>
          <StatusDot taken={takenToday} due={!isInactive} />
        </View>

        {/* Main content */}
        <View style={styles.body}>
          {/* Top row */}
          <View style={styles.topRow}>
            {/* Icon + compound */}
            <View style={[styles.iconCircle, { backgroundColor: `${catColor}18`, borderColor: `${catColor}30` }]}>
              <Feather name={getRouteIcon(protocol.route)} size={14} color={catColor} />
            </View>
            <View style={styles.nameBlock}>
              <Text style={styles.name} numberOfLines={1}>{protocol.name}</Text>
              <Text style={styles.compound} numberOfLines={1}>{protocol.compound}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Meta row */}
          <View style={styles.metaRow}>
            <MetaPill value={`${protocol.dosage} ${protocol.unit}`} color={catColor} />
            <MetaPill value={protocol.route} />
            <MetaPill value={getFrequencyLabel(protocol)} />
            <MetaPill value={getProtocolTimingLabel(protocol, settings)} />
            {protocol.with_food === 1 && <MetaPill value="With Food" />}

            <View style={styles.nextDoseWrap}>
              <Feather name="clock" size={10} color={colors.textMuted} />
              <Text style={[styles.nextDose,
                nextLabel === 'Today' && styles.nextDoseToday,
                nextLabel === 'Tomorrow' && styles.nextDoseSoon,
              ]}>
                {nextLabel}
              </Text>
            </View>
          </View>

          {protocol.instructions ? (
            <Text style={styles.instructions} numberOfLines={2}>
              {protocol.instructions}
            </Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onToggle}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            style={styles.iconButton}
          >
            <Feather
              name={isInactive ? 'play' : 'pause'}
              size={15}
              color={isInactive ? colors.success : colors.warning}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            style={styles.iconButton}
          >
            <Feather name="trash-2" size={15} color={colors.danger} />
          </TouchableOpacity>
          <View style={styles.chevron}>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function MetaPill({ value, color }: { value: string; color?: string }) {
  return (
    <View style={[pillStyles.pill, color && { borderColor: `${color}30`, backgroundColor: `${color}0D` }]}>
      <Text style={[pillStyles.text, color && { color }]}>{value}</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.surface3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  cardInactive: {
    opacity: 0.45,
  },
  accentBar: {
    width: 3,
    alignSelf: 'stretch',
    opacity: 0.9,
  },
  statusDotWrap: {
    position: 'absolute',
    top: 14,
    right: 36,
  },
  body: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  nameBlock: { flex: 1 },
  name: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    letterSpacing: -0.2,
  },
  compound: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  nextDoseWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
  },
  nextDose: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  nextDoseToday: { color: colors.success },
  nextDoseSoon: { color: colors.warning },
  instructions: {
    marginTop: spacing.xs,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingRight: spacing.sm,
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chevron: {
    paddingLeft: 2,
  },
});
