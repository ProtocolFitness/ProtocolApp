import { Protocol } from '../hooks/useProtocols';

export interface ProtocolTimingSettings {
  morningTime: string;
  lunchTime: string;
  nightTime: string;
}

export const DEFAULT_PROTOCOL_TIMES: ProtocolTimingSettings = {
  morningTime: '06:30',
  lunchTime: '13:00',
  nightTime: '18:30',
};

const MINUTES_PER_DAY = 24 * 60;

export function isValidTimeString(value: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [hour, minute] = value.split(':').map((part) => parseInt(part, 10));
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

export function parseTimeToMinutes(value: string | null | undefined): number | null {
  if (!value || !isValidTimeString(value)) return null;
  const [hour, minute] = value.split(':').map((part) => parseInt(part, 10));
  return hour * 60 + minute;
}

export function formatTimeLabel(value: string | null | undefined): string {
  const minutes = parseTimeToMinutes(value);
  if (minutes == null) return '--:--';

  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
}

function getProtocolScheduledMinutes(
  protocol: Pick<Protocol, 'timing_slot' | 'specific_time'>,
  settings: ProtocolTimingSettings
): number | null {
  if (protocol.timing_slot === 'specific_time') {
    return parseTimeToMinutes(protocol.specific_time);
  }
  if (protocol.timing_slot === 'morning') return parseTimeToMinutes(settings.morningTime);
  if (protocol.timing_slot === 'lunch') return parseTimeToMinutes(settings.lunchTime);
  if (protocol.timing_slot === 'night') return parseTimeToMinutes(settings.nightTime);
  return null;
}

export function sortProtocolsByTiming<T extends Pick<Protocol, 'name' | 'timing_slot' | 'specific_time'>>(
  protocols: T[],
  settings: ProtocolTimingSettings
): T[] {
  return [...protocols].sort((a, b) => {
    const aMinutes = getProtocolScheduledMinutes(a, settings);
    const bMinutes = getProtocolScheduledMinutes(b, settings);

    const aBucket = a.timing_slot === 'anytime' ? 2 : aMinutes != null ? 0 : 1;
    const bBucket = b.timing_slot === 'anytime' ? 2 : bMinutes != null ? 0 : 1;

    if (aBucket !== bBucket) return aBucket - bBucket;

    if (aBucket === 0 && aMinutes != null && bMinutes != null && aMinutes !== bMinutes) {
      return aMinutes - bMinutes;
    }

    const fallbackOrder = (slot: Protocol['timing_slot']) => {
      if (slot === 'pre_workout') return MINUTES_PER_DAY + 1;
      if (slot === 'post_workout') return MINUTES_PER_DAY + 2;
      if (slot === 'anytime') return MINUTES_PER_DAY + 3;
      return MINUTES_PER_DAY;
    };

    const slotOrderDiff = fallbackOrder(a.timing_slot) - fallbackOrder(b.timing_slot);
    if (slotOrderDiff !== 0) return slotOrderDiff;

    return a.name.localeCompare(b.name);
  });
}

export function getProtocolTimingLabel(
  protocol: Pick<Protocol, 'timing_slot' | 'specific_time'>,
  settings: ProtocolTimingSettings
): string {
  if (protocol.timing_slot === 'specific_time' && protocol.specific_time) {
    return formatTimeLabel(protocol.specific_time);
  }
  if (protocol.timing_slot === 'morning') return `Morning ${formatTimeLabel(settings.morningTime)}`;
  if (protocol.timing_slot === 'lunch') return `Lunch ${formatTimeLabel(settings.lunchTime)}`;
  if (protocol.timing_slot === 'night') return `Night ${formatTimeLabel(settings.nightTime)}`;
  if (protocol.timing_slot === 'pre_workout') return 'Pre W/O';
  if (protocol.timing_slot === 'post_workout') return 'Post W/O';
  return 'Anytime';
}
