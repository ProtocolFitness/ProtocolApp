import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, fontWeight, radius } from '../theme';
import { Button } from '../components/Button';
import { useLabs } from '../hooks/useLabs';
import { today } from '../utils/dateUtils';

const COMMON_TESTS = [
  'Total Testosterone',
  'Free Testosterone',
  'Estradiol (E2)',
  'SHBG',
  'LH',
  'FSH',
  'Hematocrit',
  'Hemoglobin',
  'PSA',
  'IGF-1',
  'TSH',
  'Cortisol',
  'DHEA-S',
  'Prolactin',
];

const COMMON_UNITS: Record<string, string> = {
  'Total Testosterone': 'ng/dL',
  'Free Testosterone': 'pg/mL',
  'Estradiol (E2)': 'pg/mL',
  SHBG: 'nmol/L',
  LH: 'mIU/mL',
  FSH: 'mIU/mL',
  Hematocrit: '%',
  Hemoglobin: 'g/dL',
  PSA: 'ng/mL',
  'IGF-1': 'ng/mL',
  TSH: 'mIU/L',
  Cortisol: 'mcg/dL',
  'DHEA-S': 'mcg/dL',
  Prolactin: 'ng/mL',
};

export function AddLabScreen() {
  const navigation = useNavigation();
  const { addLab } = useLabs();

  const [testName, setTestName] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const selectTest = (test: string) => {
    setTestName(test);
    if (COMMON_UNITS[test]) {
      setUnit(COMMON_UNITS[test]);
    }
  };

  const handleSave = async () => {
    if (!testName.trim()) {
      Alert.alert('Error', 'Test name is required.');
      return;
    }

    const val = parseFloat(value);
    if (Number.isNaN(val)) {
      Alert.alert('Error', 'Value must be a number.');
      return;
    }

    if (!unit.trim()) {
      Alert.alert('Error', 'Unit is required.');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert('Error', 'Date must be YYYY-MM-DD.');
      return;
    }

    setSaving(true);
    try {
      await addLab({
        test_name: testName.trim(),
        value: val,
        unit: unit.trim(),
        date,
        notes: notes.trim() || null,
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Unable to save lab result.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.navBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
          >
            <Text style={styles.back}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>Add Lab Result</Text>
          <View style={styles.navSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionLabel}>Quick Select</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
            {COMMON_TESTS.map((test) => (
              <TouchableOpacity
                key={test}
                onPress={() => selectTest(test)}
                style={[styles.quickPill, testName === test && styles.quickActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.quickText, testName === test && styles.quickTextActive]}>
                  {test}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.field}>
            <Text style={styles.label}>Test Name</Text>
            <TextInput
              style={styles.input}
              value={testName}
              onChangeText={setTestName}
              placeholder="e.g. Total Testosterone"
              placeholderTextColor={colors.textSubtle}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowColumn}>
              <Text style={styles.label}>Value</Text>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={setValue}
                placeholder="750"
                placeholderTextColor={colors.textSubtle}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.rowColumn}>
              <Text style={styles.label}>Unit</Text>
              <TextInput
                style={styles.input}
                value={unit}
                onChangeText={setUnit}
                placeholder="ng/dL"
                placeholderTextColor={colors.textSubtle}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="2024-01-15"
              placeholderTextColor={colors.textSubtle}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Fasted, 8 weeks into TRT"
              placeholderTextColor={colors.textSubtle}
              multiline
              numberOfLines={3}
            />
          </View>

          <Button
            label="Add Lab Result"
            onPress={handleSave}
            loading={saving}
            fullWidth
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  keyboard: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { fontSize: fontSize.base, color: colors.accent },
  navTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  navSpacer: { width: 60 },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing['2xl'] },
  sectionLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  quickRow: { gap: spacing.sm, marginBottom: spacing.lg },
  quickPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActive: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  quickText: { fontSize: fontSize.sm, color: colors.textMuted },
  quickTextActive: { color: colors.accentBright, fontWeight: fontWeight.medium },
  field: { marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  rowColumn: { flex: 1 },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.text,
    fontSize: fontSize.base,
    minHeight: 48,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  saveButton: { marginTop: spacing.lg },
});
