import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radius, fontSize, fontWeight } from '../theme';

interface MetricSliderProps {
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  value: number | null;
  onChange: (val: number) => void;
}

const STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function getBarColor(val: number): string {
  if (val <= 3) return colors.danger;
  if (val <= 5) return colors.warning;
  if (val <= 7) return colors.accentText;
  return colors.success;
}

export function MetricSlider({ label, icon, value, onChange }: MetricSliderProps) {
  const activeColor = value != null ? getBarColor(value) : colors.textMuted;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <Feather name={icon} size={14} color={value != null ? activeColor : colors.textMuted} />
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={[styles.value, value != null && { color: activeColor }]}>
          {value != null ? `${value} / 10` : '—'}
        </Text>
      </View>

      <View style={styles.track}>
        {STEPS.map((step) => {
          const filled = value != null && step <= value;
          const selected = value === step;
          return (
            <TouchableOpacity
              key={step}
              onPress={() => onChange(step)}
              activeOpacity={0.7}
              style={[
                styles.segment,
                filled
                  ? { backgroundColor: activeColor, opacity: selected ? 1 : 0.45 }
                  : styles.segmentEmpty,
                selected && styles.segmentSelected,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm - 2,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  track: {
    flexDirection: 'row',
    gap: 3,
    height: 28,
    alignItems: 'stretch',
  },
  segment: {
    flex: 1,
    borderRadius: 3,
  },
  segmentEmpty: {
    backgroundColor: colors.surface3,
  },
  segmentSelected: {
    transform: [{ scaleY: 1.12 }],
  },
});
