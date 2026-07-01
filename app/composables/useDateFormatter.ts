export type DateFormatPreset = 'datetime' | 'date' | 'time' | 'relative';

export interface DateFormatOptions {
  locale?: string;
  timeZone?: string;
  preset?: DateFormatPreset;
  includeTime?: boolean;
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
  options: DateFormatOptions | DateFormatPreset | boolean = {}
): string {
  let opts: DateFormatOptions = {};
  if (typeof options === 'boolean') {
    opts = { includeTime: options, preset: options ? 'datetime' : 'date' };
  } else if (typeof options === 'string') {
    opts = { preset: options as DateFormatPreset };
  } else {
    opts = options;
  }

  const {
    locale = DEFAULT_LOCALE,
    timeZone = DEFAULT_TIMEZONE,
    customOptions,
  } = opts;

  if (!value || String(value).startsWith('0001-01-01')) {
    return '-';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  let preset = opts.preset;
  if (opts.includeTime !== undefined) {
    preset = opts.includeTime ? 'datetime' : 'date';
  } else if (!preset) {
    preset = 'datetime';
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

  // Get formatted parts
  const parts = formatter.formatToParts(date);
  const partValues: Record<string, string> = {};
  parts.forEach(part => {
    partValues[part.type] = part.value;
  });

  const day = partValues.day || '01';
  const month = partValues.month || '01';
  const year = partValues.year || '1970';

  if (preset === 'date' || opts.includeTime === false) {
    return `${day}/${month}/${year}`;
  }

  if (preset === 'time') {
    const hour = partValues.hour || '00';
    const minute = partValues.minute || '00';
    const second = partValues.second || '00';
    return `${hour}:${minute}:${second}`;
  }

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
