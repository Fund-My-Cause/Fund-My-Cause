/**
 * Centralized date/deadline formatting utilities.
 *
 * All formatting is timezone-aware and built on `Intl.DateTimeFormat` with an
 * explicit `timeZone` option. When no timezone is provided, the user's resolved
 * timezone is used (falling back to UTC when it cannot be determined).
 *
 * All helpers handle `null`, `undefined`, and invalid inputs gracefully by
 * returning an empty string (or a neutral fallback) rather than throwing.
 */

/** A value that can be coerced into a valid `Date`. */
export type DateInput = Date | string | number | null | undefined;

/** Options shared by the formatting helpers. */
export interface FormatOptions {
  /** IANA timezone name (e.g. `"America/New_York"`). Defaults to the resolved user timezone. */
  timezone?: string;
  /** BCP 47 locale tag (e.g. `"en-US"`). Defaults to the runtime locale. */
  locale?: string;
}

/** Options for {@link formatDeadline}. */
export interface DeadlineFormatOptions extends FormatOptions {
  /** Whether to include the time component in addition to the date. Defaults to `true`. */
  includeTime?: boolean;
}

const DEFAULT_TIMEZONE = 'UTC';

/**
 * Resolve the user's timezone from the runtime, falling back to UTC when it
 * cannot be determined (e.g. in non-browser environments).
 */
export function resolveTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

/**
 * Coerce an arbitrary input into a valid `Date`, or return `null` when the
 * input is missing or invalid.
 */
export function toValidDate(input: DateInput): Date | null {
  if (input === null || input === undefined) {
    return null;
  }
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

/**
 * Build an `Intl.DateTimeFormat`, guarding against invalid timezone/locale
 * values by falling back to the resolved timezone and default locale.
 */
function createFormatter(
  options: Intl.DateTimeFormatOptions,
  { timezone, locale }: FormatOptions = {},
): Intl.DateTimeFormat {
  const timeZone = timezone || resolveTimezone();
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone });
  } catch {
    // Invalid timezone or locale: retry with safe defaults.
    return new Intl.DateTimeFormat(locale, { ...options, timeZone: DEFAULT_TIMEZONE });
  }
}

/**
 * Format a date as a human-readable date string (e.g. `"Jan 5, 2025"`).
 * Returns an empty string for null/invalid input.
 */
export function formatDate(input: DateInput, options: FormatOptions = {}): string {
  const date = toValidDate(input);
  if (!date) {
    return '';
  }
  return createFormatter(
    { year: 'numeric', month: 'short', day: 'numeric' },
    options,
  ).format(date);
}

/**
 * Format a date as a human-readable time string (e.g. `"3:45 PM"`).
 * Returns an empty string for null/invalid input.
 */
export function formatTime(input: DateInput, options: FormatOptions = {}): string {
  const date = toValidDate(input);
  if (!date) {
    return '';
  }
  return createFormatter(
    { hour: 'numeric', minute: '2-digit' },
    options,
  ).format(date);
}

/**
 * Format a deadline as a human-readable string. By default includes both date
 * and time (e.g. `"Jan 5, 2025, 3:45 PM"`). Returns an empty string for
 * null/invalid input.
 */
export function formatDeadline(
  input: DateInput,
  options: DeadlineFormatOptions = {},
): string {
  const date = toValidDate(input);
  if (!date) {
    return '';
  }
  const { includeTime = true, ...formatOptions } = options;
  const intlOptions: Intl.DateTimeFormatOptions = includeTime
    ? {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }
    : { year: 'numeric', month: 'short', day: 'numeric' };
  return createFormatter(intlOptions, formatOptions).format(date);
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Format a deadline relative to now (e.g. `"in 2 days"`, `"3 hours ago"`).
 * Returns an empty string for null/invalid input.
 *
 * @param input The deadline.
 * @param now Reference point for the comparison. Defaults to `new Date()`.
 */
export function formatRelativeDeadline(
  input: DateInput,
  now: DateInput = new Date(),
): string {
  const date = toValidDate(input);
  const reference = toValidDate(now);
  if (!date || !reference) {
    return '';
  }

  const diff = date.getTime() - reference.getTime();
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  if (abs < MINUTE) {
    return rtf.format(Math.round(diff / 1000), 'second');
  }
  if (abs < HOUR) {
    return rtf.format(Math.round(diff / MINUTE), 'minute');
  }
  if (abs < DAY) {
    return rtf.format(Math.round(diff / HOUR), 'hour');
  }
  if (abs < 30 * DAY) {
    return rtf.format(Math.round(diff / DAY), 'day');
  }
  if (abs < 365 * DAY) {
    return rtf.format(Math.round(diff / (30 * DAY)), 'month');
  }
  return rtf.format(Math.round(diff / (365 * DAY)), 'year');
}

/**
 * Format the time remaining until a deadline as a compact countdown
 * (e.g. `"2d 3h"`, `"45m"`, `"Overdue"`). Returns an empty string for
 * null/invalid input.
 *
 * @param input The deadline.
 * @param now Reference point for the comparison. Defaults to `new Date()`.
 */
export function formatTimeLeft(
  input: DateInput,
  now: DateInput = new Date(),
): string {
  const date = toValidDate(input);
  const reference = toValidDate(now);
  if (!date || !reference) {
    return '';
  }

  const diff = date.getTime() - reference.getTime();
  if (diff <= 0) {
    return 'Overdue';
  }

  const days = Math.floor(diff / DAY);
  const hours = Math.floor((diff % DAY) / HOUR);
  const minutes = Math.floor((diff % HOUR) / MINUTE);

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return '<1m';
}
