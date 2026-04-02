import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing, glow } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'glow' | 'inset' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, style, variant = 'default', padding = 'md' }: CardProps) {
  return (
    <View style={[styles.base, styles[variant], styles[`pad_${padding}`], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  default: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    ...glow.subtle,
  },
  glow: {
    backgroundColor: colors.surface,
    borderColor: colors.borderGlow,
    ...glow.accent,
  },
  inset: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
  },
  flat: {
    backgroundColor: colors.surface2,
    borderColor: 'transparent',
    borderWidth: 0,
  },
  pad_none: { padding: 0 },
  pad_sm: { padding: spacing.sm },
  pad_md: { padding: spacing.md },
  pad_lg: { padding: spacing.lg },
});
