import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, View } from 'react-native';
import { colors, radius, fontSize, fontWeight, spacing } from '../theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  fullWidth = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? '#fff' : colors.accentText} />
      ) : (
        <View style={styles.inner}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text style={[styles.label, styles[`label_${variant}`], styles[`labelSize_${size}`]]}>
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  iconWrap: {},
  primary: {
    backgroundColor: colors.accent,
    borderColor: 'transparent',
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  secondary: {
    backgroundColor: colors.surface2,
    borderColor: colors.borderMid,
  },
  danger: {
    backgroundColor: colors.dangerDim,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  size_sm: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, minHeight: 36 },
  size_md: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 3, minHeight: 48 },
  size_lg: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, minHeight: 56 },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.4 },
  label: { fontWeight: fontWeight.semibold, letterSpacing: 0.2 },
  label_primary: { color: '#fff' },
  label_secondary: { color: colors.text },
  label_danger: { color: colors.danger },
  label_ghost: { color: colors.accentText },
  labelSize_sm: { fontSize: fontSize.sm },
  labelSize_md: { fontSize: fontSize.base },
  labelSize_lg: { fontSize: fontSize.md },
});
