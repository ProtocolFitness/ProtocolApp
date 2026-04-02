import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Alert, Switch, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { colors, spacing, fontSize, fontWeight, radius } from '../theme';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAppSettings } from '../hooks/useAppSettings';
import { exportAllData, importData } from '../utils/export';
import {
  notificationsSupported,
  requestNotificationPermissions,
  scheduleDailyLogReminder,
  cancelAllNotifications,
} from '../utils/notifications';
import { useWebInstallPrompt } from '../hooks/useWebInstallPrompt';
import { formatTimeLabel, isValidTimeString } from '../utils/protocolTiming';

function SettingRow({
  label, subtitle, children,
}: { label: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <View style={settingStyles.row}>
      <View style={styles.rowContent}>
        <Text style={settingStyles.label}>{label}</Text>
        {subtitle && <Text style={settingStyles.subtitle}>{subtitle}</Text>}
      </View>
      {children}
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

const settingStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 52,
    gap: spacing.sm,
  },
  label: { fontSize: fontSize.base, color: colors.text },
  subtitle: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
});

export function SettingsScreen() {
  const db = useSQLiteContext();
  const webInstall = useWebInstallPrompt();
  const {
    settings,
    load,
    setNotificationsEnabled,
    setDailyReminderTime,
    setMorningTime,
    setLunchTime,
    setNightTime,
  } = useAppSettings();

  const [exporting, setExporting] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [dailyReminderDraft, setDailyReminderDraft] = React.useState(settings.dailyReminderTime);
  const [morningDraft, setMorningDraft] = React.useState(settings.morningTime);
  const [lunchDraft, setLunchDraft] = React.useState(settings.lunchTime);
  const [nightDraft, setNightDraft] = React.useState(settings.nightTime);

  React.useEffect(() => {
    setDailyReminderDraft(settings.dailyReminderTime);
    setMorningDraft(settings.morningTime);
    setLunchDraft(settings.lunchTime);
    setNightDraft(settings.nightTime);
  }, [settings.dailyReminderTime, settings.lunchTime, settings.morningTime, settings.nightTime]);

  const handleToggleNotifications = async (val: boolean) => {
    if (val) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert('Permission Required', 'Please enable notifications in your device settings.');
        return;
      }

      const [hour, minute] = settings.dailyReminderTime.split(':').map((part) => parseInt(part, 10));
      await scheduleDailyLogReminder(hour, minute);
    } else {
      await cancelAllNotifications();
    }

    await setNotificationsEnabled(val);
  };

  const saveTimeSetting = async (
    label: string,
    value: string,
    fallbackValue: string,
    setter: (next: string) => Promise<void> | void,
    reset: (next: string) => void,
    shouldRescheduleReminder = false
  ) => {
    if (!isValidTimeString(value)) {
      Alert.alert('Invalid Time', `${label} must use HH:MM in 24-hour time.`);
      reset(fallbackValue);
      return;
    }

    await setter(value);

    if (shouldRescheduleReminder && settings.notificationsEnabled) {
      const [hour, minute] = value.split(':').map((part) => parseInt(part, 10));
      await scheduleDailyLogReminder(hour, minute);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportAllData(db);
    } catch (e: any) {
      Alert.alert('Export Failed', e.message);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    Alert.alert(
      'Import Data',
      'This will overwrite all existing data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          onPress: async () => {
            setImporting(true);
            try {
              const result = await importData(db);
              await load();
              Alert.alert(result.success ? 'Success' : 'Error', result.message);
            } catch (e: any) {
              Alert.alert('Import Failed', e.message);
            } finally {
              setImporting(false);
            }
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all protocols, logs, labs, metrics, and saved insights. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            await db.execAsync(
              'DELETE FROM ai_insights; DELETE FROM logs; DELETE FROM daily_metrics; DELETE FROM labs; DELETE FROM protocols; DELETE FROM app_settings;'
            );
            await load();
            Alert.alert('Done', 'All data has been cleared.');
          },
        },
      ]
    );
  };

  const handleInstallWebApp = async () => {
    try {
      await webInstall.install();
    } catch (error: any) {
      Alert.alert('Install Not Ready', error?.message ?? 'This browser has not exposed an install prompt yet.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title="Notifications" />
        <Card style={styles.card} padding="md">
          {notificationsSupported ? (
            <>
              <SettingRow label="Daily Log Reminder" subtitle="Remind you to log your daily metrics">
                <Switch
                  value={settings.notificationsEnabled}
                  onValueChange={(value) => {
                    void handleToggleNotifications(value);
                  }}
                  trackColor={{ false: colors.surface3, true: colors.accentDim }}
                  thumbColor={settings.notificationsEnabled ? colors.accent : colors.textMuted}
                />
              </SettingRow>
              <SettingRow
                label="Reminder Time"
                subtitle={`Current: ${formatTimeLabel(dailyReminderDraft)}`}
              >
                <TextInput
                  style={styles.timeInput}
                  value={dailyReminderDraft}
                  onChangeText={setDailyReminderDraft}
                  onBlur={() => {
                    void saveTimeSetting(
                      'Reminder Time',
                      dailyReminderDraft,
                      settings.dailyReminderTime,
                      setDailyReminderTime,
                      setDailyReminderDraft,
                      true
                    );
                  }}
                  placeholder="20:00"
                  placeholderTextColor={colors.textSubtle}
                />
              </SettingRow>
            </>
          ) : (
            <View>
              <Text style={settingStyles.label}>Notifications not available</Text>
              <Text style={styles.infoText}>
                This browser does not expose the Notification API, so reminders cannot be shown here.
              </Text>
            </View>
          )}

          {notificationsSupported && (
            <View style={[settingStyles.row, { borderBottomWidth: 0 }]}>
              <View style={styles.rowContent}>
                <Text style={settingStyles.label}>Web Behavior</Text>
                <Text style={styles.infoText}>
                  On web, reminders run in the browser while the app is open or installed and active on this device.
                </Text>
              </View>
            </View>
          )}
        </Card>

        <SectionHeader title="Protocol Times" />
        <Card style={styles.card} padding="md">
          <SettingRow label="Morning Time" subtitle={`Current: ${formatTimeLabel(morningDraft)}`}>
            <TextInput
              style={styles.timeInput}
              value={morningDraft}
              onChangeText={setMorningDraft}
              onBlur={() => {
                void saveTimeSetting('Morning Time', morningDraft, settings.morningTime, setMorningTime, setMorningDraft);
              }}
              placeholder="06:30"
              placeholderTextColor={colors.textSubtle}
            />
          </SettingRow>
          <SettingRow label="Lunch Time" subtitle={`Current: ${formatTimeLabel(lunchDraft)}`}>
            <TextInput
              style={styles.timeInput}
              value={lunchDraft}
              onChangeText={setLunchDraft}
              onBlur={() => {
                void saveTimeSetting('Lunch Time', lunchDraft, settings.lunchTime, setLunchTime, setLunchDraft);
              }}
              placeholder="13:00"
              placeholderTextColor={colors.textSubtle}
            />
          </SettingRow>
          <SettingRow label="Night Time" subtitle={`Current: ${formatTimeLabel(nightDraft)}`}>
            <TextInput
              style={styles.timeInput}
              value={nightDraft}
              onChangeText={setNightDraft}
              onBlur={() => {
                void saveTimeSetting('Night Time', nightDraft, settings.nightTime, setNightTime, setNightDraft);
              }}
              placeholder="18:30"
              placeholderTextColor={colors.textSubtle}
            />
          </SettingRow>
          <View style={[settingStyles.row, { borderBottomWidth: 0 }]}>
            <View style={styles.rowContent}>
              <Text style={settingStyles.label}>Sort Order</Text>
              <Text style={styles.infoText}>
                Protocols sort by scheduled time. Custom-time entries slot between morning, lunch, and night, and anytime stays last.
              </Text>
            </View>
          </View>
        </Card>

        {webInstall.isWeb && (
          <>
            <SectionHeader title="Web App" />
            <Card style={styles.card} variant="glow">
              <SettingRow
                label="Install Protocol"
                subtitle="Add it to your home screen or desktop so it opens like an app"
              >
                <Button
                  label={
                    webInstall.installed
                      ? 'Installed'
                      : webInstall.canInstall
                        ? 'Install'
                        : 'Use Browser Menu'
                  }
                  onPress={handleInstallWebApp}
                  size="sm"
                  disabled={!webInstall.canInstall || webInstall.installed}
                />
              </SettingRow>
              <View style={[settingStyles.row, { borderBottomWidth: 0 }]}>
                <View style={styles.rowContent}>
                  <Text style={settingStyles.label}>Install steps</Text>
                  <Text style={styles.infoText}>
                    {webInstall.installed
                      ? 'Protocol is already running in installed app mode on this device.'
                      : 'If the button is unavailable, open your browser menu and choose Install App or Add to Home Screen.'}
                  </Text>
                </View>
              </View>
            </Card>
          </>
        )}

        <SectionHeader title="Data" />
        <Card style={styles.card}>
          <SettingRow label="Export Data" subtitle="Download all your data as JSON">
            <Button label={exporting ? '...' : 'Export'} onPress={handleExport} size="sm" variant="secondary" />
          </SettingRow>
          <SettingRow label="Import Data" subtitle="Restore from a JSON backup">
            <Button label={importing ? '...' : 'Import'} onPress={handleImport} size="sm" variant="secondary" />
          </SettingRow>
          <SettingRow label="Clear All Data" subtitle="Permanently delete everything">
            <Button label="Clear" onPress={handleClearData} size="sm" variant="danger" />
          </SettingRow>
        </Card>

        <SectionHeader title="About" />
        <Card style={styles.card}>
          <SettingRow label="App Version" subtitle="Protocol MVP">
            <Text style={styles.infoValue}>1.0.0</Text>
          </SettingRow>
          <SettingRow label="Storage" subtitle="100% local on this device">
            <Text style={styles.infoValue}>Local-first</Text>
          </SettingRow>
          <View style={[settingStyles.row, { borderBottomWidth: 0 }]}>
            <View style={styles.rowContent}>
              <Text style={settingStyles.label}>Tracking Data</Text>
              <Text style={styles.infoText}>
                Protocols, labs, metrics, and local history are stored on your device using SQLite.
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing['2xl'] },
  rowContent: { flex: 1 },
  sectionHeader: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  card: { marginBottom: spacing.sm },
  infoValue: { fontSize: fontSize.sm, color: colors.textMuted },
  timeInput: {
    width: 86,
    height: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: fontSize.sm,
    paddingHorizontal: spacing.sm,
    textAlign: 'center',
  },
  infoText: {
    fontSize: fontSize.xs,
    color: colors.textSubtle,
    lineHeight: 18,
    marginTop: 4,
  },
});
