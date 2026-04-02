import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fontSize, spacing, fontWeight, radius, glow } from '../theme';
import { GlowButton } from './GlowButton';

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = 'inbox', title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  const isFeatherIcon = /^[a-z0-9-]+$/i.test(icon);

  return (
    <View style={styles.container}>
      <View style={styles.iconRing}>
        <View style={styles.iconGlow} />
        {isFeatherIcon ? (
          <Feather name={icon as React.ComponentProps<typeof Feather>['name']} size={32} color={colors.accentText} />
        ) : (
          <Text style={styles.emojiIcon}>{icon}</Text>
        )}
      </View>

      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

      {actionLabel && onAction && (
        <GlowButton label={actionLabel} onPress={onAction} style={styles.btn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['2xl'],
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...glow.accent,
  },
  iconGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 40,
    backgroundColor: colors.accentDim,
  },
  title: {
    fontSize: fontSize.lg,
    color: colors.text,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
  },
  emojiIcon: {
    fontSize: 30,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  btn: { marginTop: spacing.sm },
});
