import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors, spacing, fontSize, fontWeight, radius } from '../theme';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useProtocols, Protocol } from '../hooks/useProtocols';
import { useAppSettings } from '../hooks/useAppSettings';
import { useProtocolReferenceLibrary, ProtocolReferenceLibraryItem } from '../hooks/useProtocolReferenceLibrary';
import { today } from '../utils/dateUtils';
import { RootStackParamList } from '../navigation/AppNavigator';
import { formatTimeLabel } from '../utils/protocolTiming';

type RouteProps = RouteProp<RootStackParamList, 'AddEditProtocol'>;

const CATEGORIES = ['TRT', 'Peptide', 'Supplement'] as const;
const UNITS = ['mg', 'IU', 'mcg', 'ml', 'g'] as const;
const FREQ_TYPES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'every_x_days', label: 'Every X days' },
] as const;
const ROUTES = ['IM', 'SubQ', 'Oral', 'Topical', 'Nasal'] as const;
const TIMING_SLOTS = [
  { value: 'anytime', label: 'Anytime' },
  { value: 'morning', label: 'Morning' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'pre_workout', label: 'Pre Workout' },
  { value: 'post_workout', label: 'Post Workout' },
  { value: 'night', label: 'Night' },
  { value: 'specific_time', label: 'Specific Time' },
] as const;

function OptionPicker<T extends string>({
  label,
  options,
  value,
  onChange,
  renderLabel,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (val: T) => void;
  renderLabel?: (val: T) => string;
}) {
  return (
    <View style={formStyles.field}>
      <Text style={formStyles.label}>{label}</Text>
      <View style={formStyles.optionRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => onChange(opt)}
            style={[formStyles.optionPill, value === opt && formStyles.optionActive]}
            activeOpacity={0.7}
          >
            <Text style={[formStyles.optionText, value === opt && formStyles.optionTextActive]}>
              {renderLabel ? renderLabel(opt) : opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function FormField({
  label, value, onChangeText, placeholder, keyboardType = 'default', hint,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'decimal-pad' | 'numeric';
  hint?: string;
}) {
  return (
    <View style={formStyles.field}>
      <Text style={formStyles.label}>{label}</Text>
      {hint && <Text style={formStyles.hint}>{hint}</Text>}
      <TextInput
        style={formStyles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSubtle}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );
}

function getReferenceColor(category: Protocol['category']) {
  if (category === 'TRT') return colors.trt;
  if (category === 'Peptide') return colors.peptide;
  return colors.supplement;
}

export function AddEditProtocolScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const existing = route.params?.protocol as Protocol | undefined;
  const isEdit = !!existing;

  const { addProtocol, updateProtocol } = useProtocols();
  const { settings } = useAppSettings();

  const [name, setName] = useState(existing?.name ?? '');
  const [compound, setCompound] = useState(existing?.compound ?? '');
  const [category, setCategory] = useState<'TRT' | 'Peptide' | 'Supplement'>(existing?.category ?? 'TRT');
  const [dosage, setDosage] = useState(existing?.dosage.toString() ?? '');
  const [unit, setUnit] = useState(existing?.unit ?? 'mg');
  const [freqType, setFreqType] = useState<'daily' | 'weekly' | 'every_x_days'>(existing?.frequency_type ?? 'weekly');
  const [freqValue, setFreqValue] = useState(existing?.frequency_value.toString() ?? '7');
  const [route_, setRoute_] = useState(existing?.route ?? 'IM');
  const [startDate, setStartDate] = useState(existing?.start_date ?? today());
  const [timingSlot, setTimingSlot] = useState<Protocol['timing_slot']>(existing?.timing_slot ?? 'anytime');
  const [specificTime, setSpecificTime] = useState(existing?.specific_time ?? '');
  const [withFood, setWithFood] = useState(existing?.with_food === 1);
  const [instructions, setInstructions] = useState(existing?.instructions ?? '');
  const [saving, setSaving] = useState(false);
  const [libraryQuery, setLibraryQuery] = useState(existing?.compound ?? '');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [libraryExpanded, setLibraryExpanded] = useState(false);

  const { entries: libraryEntries } = useProtocolReferenceLibrary(category);

  const filteredEntries = useMemo(() => {
    const q = libraryQuery.trim().toLowerCase();
    if (!q) return libraryEntries;
    return libraryEntries.filter(
      (entry) =>
        entry.name.toLowerCase().includes(q) ||
        entry.compound.toLowerCase().includes(q) ||
        entry.description.toLowerCase().includes(q)
    );
  }, [libraryEntries, libraryQuery]);

  const selectedReference = useMemo(() => {
    if (selectedSlug) {
      return libraryEntries.find((entry) => entry.slug === selectedSlug) ?? null;
    }

    return libraryEntries.find(
      (entry) => entry.compound.toLowerCase() === compound.trim().toLowerCase()
    ) ?? null;
  }, [compound, libraryEntries, selectedSlug]);

  const applyReference = (entry: ProtocolReferenceLibraryItem) => {
    setSelectedSlug(entry.slug);
    setLibraryQuery(entry.name);
    setName(entry.name);
    setCompound(entry.compound);
    setDosage(entry.default_dosage.toString());
    setUnit(entry.unit);
    setFreqType(entry.frequency_type);
    setFreqValue(entry.frequency_value.toString());
    setRoute_(entry.route);
    setLibraryExpanded(false);
  };

  const validate = (): string | null => {
    if (!name.trim()) return 'Protocol name is required.';
    if (!compound.trim()) return 'Compound name is required.';
    const d = parseFloat(dosage);
    if (isNaN(d) || d <= 0) return 'Dosage must be a positive number.';
    if (freqType === 'every_x_days') {
      const fv = parseInt(freqValue, 10);
      if (isNaN(fv) || fv < 1) return 'Frequency value must be at least 1.';
    }
    if (timingSlot === 'specific_time' && !/^\d{2}:\d{2}$/.test(specificTime)) {
      return 'Specific time must use HH:MM format.';
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return 'Start date must be YYYY-MM-DD format.';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      Alert.alert('Validation Error', err);
      return;
    }

    setSaving(true);
    const data = {
      name: name.trim(),
      compound: compound.trim(),
      category,
      dosage: parseFloat(dosage),
      unit,
      frequency_type: freqType,
      frequency_value: freqType === 'every_x_days' ? parseInt(freqValue, 10) : freqType === 'weekly' ? 7 : 1,
      route: route_,
      start_date: startDate,
      timing_slot: timingSlot,
      specific_time: timingSlot === 'specific_time' ? specificTime : null,
      with_food: withFood ? 1 : 0,
      instructions: instructions.trim() || null,
      active: existing?.active ?? 1,
    };

    try {
      if (isEdit && existing) {
        await updateProtocol(existing.id, data);
      } else {
        await addProtocol(data);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to save protocol.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
            <Text style={styles.back}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>{isEdit ? 'Edit Protocol' : 'New Protocol'}</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <OptionPicker
            label="Category"
            options={CATEGORIES}
            value={category}
            onChange={(nextCategory) => {
              setCategory(nextCategory);
              setSelectedSlug(null);
              setLibraryQuery('');
              setLibraryExpanded(false);
            }}
          />

          <Card style={styles.libraryCard}>
            <TouchableOpacity
              style={styles.libraryHeader}
              onPress={() => setLibraryExpanded((prev) => !prev)}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.libraryTitle}>{category} Library</Text>
                <Text style={styles.librarySubtitle}>
                  {libraryExpanded
                    ? 'Search the built-in reference database and tap an entry to autofill a suggested default dose.'
                    : `${libraryEntries.length} templates available. Tap to browse.`}
                </Text>
              </View>
              <Text style={styles.libraryToggle}>{libraryExpanded ? 'Hide' : 'Browse'}</Text>
            </TouchableOpacity>

            {selectedReference && (
              <View style={styles.referenceNoteBox}>
                <Text style={styles.referenceNoteLabel}>Suggested Dose</Text>
                <Text style={styles.referenceNoteText}>{selectedReference.dose_note}</Text>
                <Text style={styles.referenceDisclaimer}>
                  Reference defaults only. Verify protocol details with your clinician before use.
                </Text>
              </View>
            )}

            {libraryExpanded && (
              <>
                <TextInput
                  style={formStyles.input}
                  value={libraryQuery}
                  onChangeText={setLibraryQuery}
                  placeholder={`Search ${category.toLowerCase()} library`}
                  placeholderTextColor={colors.textSubtle}
                />

                <Text style={styles.libraryCount}>
                  {filteredEntries.length} result{filteredEntries.length === 1 ? '' : 's'}
                </Text>

                <View style={styles.libraryResults}>
                  {filteredEntries.map((entry) => {
                    const active = selectedReference?.slug === entry.slug;
                    const color = getReferenceColor(entry.category);
                    return (
                      <TouchableOpacity
                        key={entry.slug}
                        onPress={() => applyReference(entry)}
                        style={[
                          styles.referenceRow,
                          active && { borderColor: color, backgroundColor: `${color}16` },
                        ]}
                        activeOpacity={0.75}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.referenceName}>{entry.name}</Text>
                          <Text style={styles.referenceMeta}>
                            {entry.default_dosage} {entry.unit} · {entry.route} · {entry.frequency_type === 'every_x_days'
                              ? `every ${entry.frequency_value} days`
                              : entry.frequency_type}
                          </Text>
                          <Text style={styles.referenceDescription}>{entry.description}</Text>
                        </View>
                        <Text style={[styles.referenceAction, { color }]}>Use</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </Card>

          <FormField label="Protocol Name" value={name} onChangeText={setName} placeholder="e.g. Test Cyp 120mg Weekly" />
          <FormField label="Compound" value={compound} onChangeText={setCompound} placeholder="e.g. Testosterone Cypionate" />

          <View style={formStyles.row}>
            <View style={{ flex: 1 }}>
              <FormField label="Dosage" value={dosage} onChangeText={setDosage} placeholder="200" keyboardType="decimal-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <OptionPicker label="Unit" options={UNITS} value={unit as any} onChange={setUnit as any} />
            </View>
          </View>

          <OptionPicker
            label="Frequency"
            options={FREQ_TYPES.map((f) => f.value) as any}
            value={freqType}
            onChange={setFreqType}
            renderLabel={(val) => FREQ_TYPES.find((f) => f.value === val)?.label ?? val}
          />

          {freqType === 'every_x_days' && (
            <FormField
              label="Every how many days?"
              value={freqValue}
              onChangeText={setFreqValue}
              placeholder="7"
              keyboardType="numeric"
              hint="e.g. 3 = every 3 days"
            />
          )}

          <OptionPicker label="Route" options={ROUTES} value={route_ as any} onChange={setRoute_ as any} />

          <OptionPicker
            label="Timing"
            options={TIMING_SLOTS.map((slot) => slot.value) as any}
            value={timingSlot}
            onChange={setTimingSlot}
            renderLabel={(val) => {
              if (val === 'morning') return `Morning ${formatTimeLabel(settings.morningTime)}`;
              if (val === 'lunch') return `Lunch ${formatTimeLabel(settings.lunchTime)}`;
              if (val === 'night') return `Night ${formatTimeLabel(settings.nightTime)}`;
              return TIMING_SLOTS.find((slot) => slot.value === val)?.label ?? val;
            }}
          />

          {timingSlot === 'specific_time' && (
            <FormField
              label="Specific Time"
              value={specificTime}
              onChangeText={setSpecificTime}
              placeholder="08:30"
              hint="Use 24-hour time in HH:MM format"
            />
          )}

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={formStyles.label}>Food</Text>
              <Text style={styles.switchHint}>Mark this if you want the protocol taken with food.</Text>
            </View>
            <Switch
              value={withFood}
              onValueChange={setWithFood}
              trackColor={{ false: colors.surface3, true: colors.accentDim }}
              thumbColor={withFood ? colors.accent : colors.textMuted}
            />
          </View>

          <View style={formStyles.field}>
            <Text style={formStyles.label}>Instructions</Text>
            <Text style={formStyles.hint}>Optional note like with food, before cardio, or split dose.</Text>
            <TextInput
              style={[formStyles.input, styles.textArea]}
              value={instructions}
              onChangeText={setInstructions}
              placeholder="e.g. Morning with breakfast"
              placeholderTextColor={colors.textSubtle}
              multiline
            />
          </View>

          <FormField
            label="Start Date"
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
            hint="Format: YYYY-MM-DD"
          />

          <Button
            label={saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Protocol'}
            onPress={handleSave}
            loading={saving}
            fullWidth
            style={{ marginTop: spacing.lg }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const formStyles = StyleSheet.create({
  field: { marginBottom: spacing.md },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hint: { fontSize: fontSize.xs, color: colors.textSubtle, marginBottom: spacing.xs },
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
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  optionPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionActive: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accent,
  },
  optionText: { fontSize: fontSize.sm, color: colors.textMuted },
  optionTextActive: { color: colors.accentBright, fontWeight: fontWeight.medium },
  row: { flexDirection: 'row', gap: spacing.md },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
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
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing['2xl'] },
  libraryCard: { marginBottom: spacing.md },
  libraryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  libraryTitle: { fontSize: fontSize.md, color: colors.text, fontWeight: fontWeight.semibold, marginBottom: 4 },
  librarySubtitle: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 20 },
  libraryToggle: { fontSize: fontSize.sm, color: colors.accentText, fontWeight: fontWeight.semibold },
  libraryCount: { fontSize: fontSize.xs, color: colors.textSubtle, marginTop: spacing.sm },
  libraryResults: { marginTop: spacing.md, gap: spacing.sm },
  referenceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  referenceName: { fontSize: fontSize.base, color: colors.text, fontWeight: fontWeight.semibold },
  referenceMeta: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  referenceDescription: { fontSize: fontSize.xs, color: colors.textSubtle, marginTop: 6, lineHeight: 16 },
  referenceAction: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  referenceNoteBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  referenceNoteLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  referenceNoteText: { fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },
  referenceDisclaimer: { fontSize: fontSize.xs, color: colors.warning, marginTop: spacing.sm, lineHeight: 18 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  switchHint: {
    fontSize: fontSize.xs,
    color: colors.textSubtle,
    lineHeight: 18,
  },
  textArea: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
});
