import React from 'react';
import {
  TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, View,
} from 'react-native';
import { colors, radius, fontSize, fontWeight, spacing } from '../theme';

interface GlowButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function GlowButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  size = 'md',
  fullWidth = false,
  icon,
  style,
}: GlowButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.outer,
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {/* Glow layer */}
      <View style={styles.glow} />
      {/* Content */}
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            {icon && <View style={styles.iconWrap}>{icon}</View>}
            <Text style={[styles.label, styles[`labelSize_${size}`]]}>{label}</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: radius.md,
    overflow: 'visible',
    backgroundColor: colors.accent,
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.md,
    backgroundColor: 'rgba(124, 92, 255, 0.3)',
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  size_sm: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, minHeight: 36 },
  size_md: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 3, minHeight: 48 },
  size_lg: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, minHeight: 56 },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.4 },
  iconWrap: {},
  label: { color: '#fff', fontWeight: fontWeight.semibold, letterSpacing: 0.3 },
  labelSize_sm: { fontSize: fontSize.sm },
  labelSize_md: { fontSize: fontSize.base },
  labelSize_lg: { fontSize: fontSize.md },
});
