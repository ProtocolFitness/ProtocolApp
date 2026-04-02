import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, radius, fontSize, fontWeight } from '../theme';

interface Segment<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (val: T) => void;
  scrollable?: boolean;
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  scrollable = false,
}: SegmentedControlProps<T>) {
  const inner = (
    <View style={scrollable ? styles.trackScrollable : styles.track}>
      {segments.map((seg) => {
        const active = seg.value === value;
        return (
          <TouchableOpacity
            key={seg.value}
            onPress={() => onChange(seg.value)}
            activeOpacity={0.75}
            style={[styles.segment, scrollable && styles.segmentScrollable, active && styles.segmentActive]}
          >
            {active && <View style={styles.activeBg} />}
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              style={[styles.label, active && styles.labelActive]}
            >
              {seg.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {inner}
      </ScrollView>
    );
  }

  return inner;
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
  },
  trackScrollable: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  scrollContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  segment: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  segmentScrollable: {
    flex: 0,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
  },
  segmentActive: {
    borderColor: 'rgba(124, 92, 255, 0.5)',
    backgroundColor: 'rgba(124, 92, 255, 0.12)',
  },
  activeBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.xs,
    backgroundColor: colors.accentDim,
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  labelActive: {
    color: colors.accentText,
    fontWeight: fontWeight.semibold,
  },
});
