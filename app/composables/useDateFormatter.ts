export type DateFormatPreset = 'datetime' | 'date' | 'time' | 'relative';

export interface DateFormatOptions {
  locale?: string;
  timeZone?: string;
  preset?: DateFormatPreset;
  customOptions?: Intl.DateTimeFormatOptions;
}

const DEFAULT_LOCALE = 'id-ID';
const DEFAULT_TIMEZONE = 'Asia/Makassar';

const PRESETS: Record<DateFormatPreset, Intl.DateTimeFormatOptions> = {
  datetime: {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  },
  date: {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  },
  time: {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  },
  relative: {
    // Will be handled separately
  },
};

/**
 * Format date using Intl API
 * @param value - Date string, timestamp, or Date object
 * @param options - Formatting options
 * @returns Formatted date string in dd/mm/yyyy hh:ii:ss
 */
export function formatDate(
  value: string | number | Date,
  options: DateFormatOptions = {}
): string {
  const {
    locale = DEFAULT_LOCALE,
    timeZone = DEFAULT_TIMEZONE,
    preset = 'datetime',
    customOptions,
  } = options;

  const date = value instanceof Date ? value : new Date(value);

  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  // Handle relative time
  if (preset === 'relative') {
    return formatRelative(date, locale);
  }

  // Use custom options if provided, otherwise use preset
  const formatOptions = customOptions || PRESETS[preset];

  // Format using Intl.DateTimeFormat
  const formatter = new Intl.DateTimeFormat(locale, {
    ...formatOptions,
    timeZone,
  });

  // Get formatted parts and manually format to dd/mm/yyyy hh:ii:ss
  const parts = formatter.formatToParts(date);
  const partValues: Record<string, string> = {};
  parts.forEach(part => {
    partValues[part.type] = part.value;
  });

  // Build dd/mm/yyyy hh:ii:ss format
  const day = partValues.day || '01';
  const month = partValues.month || '01';
  const year = partValues.year || '1970';
  const hour = partValues.hour || '00';
  const minute = partValues.minute || '00';
  const second = partValues.second || '00';

  return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
}

/**
 * Format relative time (e.g., "2 jam yang lalu", "3 hari yang lalu")
 */
function formatRelative(date: Date, locale: string): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(diffSec) < 60) {
    return rtf.format(diffSec, 'second');
  } else if (Math.abs(diffMin) < 60) {
    return rtf.format(diffMin, 'minute');
  } else if (Math.abs(diffHour) < 24) {
    return rtf.format(diffHour, 'hour');
  } else {
    return rtf.format(diffDay, 'day');
  }
}

/**
 * Composable for date formatting (optional wrapper for convenience)
 */
export function useDateFormatter() {
  return { formatDate };
}
