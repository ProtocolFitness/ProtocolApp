import 'react-native-gesture-handler';
import React, { Suspense, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initDatabase } from './src/database/db';
import { colors } from './src/theme';
import { useAppSettings } from './src/hooks/useAppSettings';
import { cancelAllNotifications, scheduleDailyLogReminder } from './src/utils/notifications';
import { parseTimeToMinutes } from './src/utils/protocolTiming';

function getWebBasePath() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return '/';
  }

  const segments = window.location.pathname.split('/').filter(Boolean);
  if (segments.length === 0) {
    return '/';
  }

  return `/${segments[0]}/`;
}

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <Text style={styles.loadingText}>Protocol</Text>
      <Text style={styles.loadingSubtext}>Initializing...</Text>
    </View>
  );
}

function ErrorScreen({ error }: { error: Error }) {
  return (
    <View style={styles.loading}>
      <Text style={styles.loadingText}>Database Error</Text>
      <Text style={styles.errorText}>{error.message}</Text>
    </View>
  );
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <ErrorScreen error={this.state.error} />;
    }

    return this.props.children;
  }
}

function AppContent() {
  const { settings } = useAppSettings();

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    const basePath = getWebBasePath();
    const iconUri = `${basePath}assets/icon.png`;
    const manifest = {
      name: 'Protocol',
      short_name: 'Protocol',
      description: 'Local-first protocol tracking, labs, calendar, and metrics.',
      start_url: basePath,
      scope: basePath,
      display: 'standalone',
      orientation: 'portrait',
      background_color: colors.bg,
      theme_color: colors.bg,
      icons: [
        {
          src: iconUri,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    };

    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = `data:application/manifest+json,${encodeURIComponent(JSON.stringify(manifest))}`;
    document.head.appendChild(manifestLink);

    const appleTouchIcon = document.createElement('link');
    appleTouchIcon.rel = 'apple-touch-icon';
    appleTouchIcon.href = iconUri;
    document.head.appendChild(appleTouchIcon);

    return () => {
      manifestLink.remove();
      appleTouchIcon.remove();
    };
  }, []);

  useEffect(() => {
    const minutes = parseTimeToMinutes(settings.dailyReminderTime);
    if (minutes == null) return;

    const syncNotifications = async () => {
      if (!settings.notificationsEnabled) {
        await cancelAllNotifications();
        return;
      }

      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      await scheduleDailyLogReminder(hour, minute);
    };

    void syncNotifications();
  }, [settings.dailyReminderTime, settings.notificationsEnabled]);

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppErrorBoundary>
          <Suspense fallback={<LoadingScreen />}>
            <SQLiteProvider databaseName="protocol.db" onInit={initDatabase} useSuspense>
              <AppContent />
            </SQLiteProvider>
          </Suspense>
        </AppErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  loadingSubtext: {
    fontSize: 14,
    color: colors.textMuted,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
