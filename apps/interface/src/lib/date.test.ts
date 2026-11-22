import {
  formatDate,
  formatDeadline,
  formatRelativeDeadline,
  formatTime,
  formatTimeLeft,
  resolveTimezone,
  toValidDate,
} from './date';

describe('date utils', () => {
  describe('toValidDate', () => {
    it('returns null for null/undefined', () => {
      expect(toValidDate(null)).toBeNull();
      expect(toValidDate(undefined)).toBeNull();
    });

    it('returns null for invalid input', () => {
      expect(toValidDate('not-a-date')).toBeNull();
      expect(toValidDate(Number.NaN)).toBeNull();
    });

    it('parses valid inputs', () => {
      expect(toValidDate('2025-01-05T00:00:00Z')?.toISOString()).toBe(
        '2025-01-05T00:00:00.000Z',
      );
      const d = new Date('2025-01-05T00:00:00Z');
      expect(toValidDate(d)).toBe(d);
    });
  });

  describe('resolveTimezone', () => {
    it('returns a non-empty string', () => {
      expect(typeof resolveTimezone()).toBe('string');
      expect(resolveTimezone().length).toBeGreaterThan(0);
    });

    it('falls back to UTC when the runtime throws', () => {
      const original = Intl.DateTimeFormat;
      // Simulate a runtime without timezone support.
      (Intl as unknown as { DateTimeFormat: unknown }).DateTimeFormat = () => {
        throw new Error('unsupported');
      };
      try {
        expect(resolveTimezone()).toBe('UTC');
      } finally {
        (Intl as unknown as { DateTimeFormat: unknown }).DateTimeFormat = original;
      }
    });
  });

  describe('formatDate', () => {
    const date = '2025-01-05T12:00:00Z';

    it('formats in UTC', () => {
      expect(formatDate(date, { timezone: 'UTC', locale: 'en-US' })).toBe('Jan 5, 2025');
    });

    it('formats in a different timezone', () => {
      // 12:00 UTC is 07:00 in New York on Jan 5.
      expect(
        formatDate(date, { timezone: 'America/New_York', locale: 'en-US' }),
      ).toBe('Jan 5, 2025');
    });

    it('handles timezone day rollover', () => {
      // 23:30 UTC on Jan 5 is Jan 6 in Tokyo.
      expect(
        formatDate('2025-01-05T23:30:00Z', { timezone: 'Asia/Tokyo', locale: 'en-US' }),
      ).toBe('Jan 6, 2025');
    });

    it('returns empty string for null/invalid input', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate('invalid')).toBe('');
    });

    it('falls back gracefully for invalid timezone', () => {
      expect(formatDate(date, { timezone: 'Not/AZone', locale: 'en-US' })).toBe(
        'Jan 5, 2025',
      );
    });
  });

  describe('formatTime', () => {
    it('formats time in the given timezone', () => {
      const result = formatTime('2025-01-05T12:00:00Z', {
        timezone: 'UTC',
        locale: 'en-US',
      });
      expect(result).toMatch(/12:00/);
    });

    it('returns empty string for invalid input', () => {
      expect(formatTime(null)).toBe('');
    });
  });

  describe('formatDeadline', () => {
    const deadline = '2025-06-15T18:30:00Z';

    it('includes date and time by default', () => {
      const result = formatDeadline(deadline, { timezone: 'UTC', locale: 'en-US' });
      expect(result).toContain('Jun 15, 2025');
      expect(result).toMatch(/6:30/);
    });

    it('omits time when includeTime is false', () => {
      expect(
        formatDeadline(deadline, {
          timezone: 'UTC',
          locale: 'en-US',
          includeTime: false,
        }),
      ).toBe('Jun 15, 2025');
    });

    it('handles DST boundaries', () => {
      // US DST starts 2025-03-09. 07:00 UTC is 03:00 EDT (UTC-4).
      const result = formatDeadline('2025-03-09T07:00:00Z', {
        timezone: 'America/New_York',
        locale: 'en-US',
      });
      expect(result).toContain('Mar 9, 2025');
      expect(result).toMatch(/3:00/);
    });

    it('returns empty string for null/invalid input', () => {
      expect(formatDeadline(null)).toBe('');
      expect(formatDeadline('nope')).toBe('');
    });
  });

  describe('formatRelativeDeadline', () => {
    const now = new Date('2025-01-05T12:00:00Z');

    it('formats future deadlines', () => {
      expect(formatRelativeDeadline('2025-01-07T12:00:00Z', now)).toBe('in 2 days');
    });

    it('formats past deadlines', () => {
      expect(formatRelativeDeadline('2025-01-05T09:00:00Z', now)).toBe('3 hours ago');
    });

    it('formats near deadlines in minutes', () => {
      expect(formatRelativeDeadline('2025-01-05T12:30:00Z', now)).toBe('in 30 minutes');
    });

    it('formats near deadlines in seconds', () => {
      expect(formatRelativeDeadline('2025-01-05T12:00:30Z', now)).toBe(
        'in 30 seconds',
      );
    });

    it('formats distant deadlines in months', () => {
      expect(formatRelativeDeadline('2025-03-06T12:00:00Z', now)).toBe(
        'in 2 months',
      );
    });

    it('formats very distant deadlines in years', () => {
      expect(formatRelativeDeadline('2027-03-16T12:00:00Z', now)).toBe(
        'in 2 years',
      );
    });

    it('returns empty string for invalid input', () => {
      expect(formatRelativeDeadline(null, now)).toBe('');
      expect(formatRelativeDeadline('2025-01-07T12:00:00Z', null)).toBe('');
    });
  });

  describe('formatTimeLeft', () => {
    const now = new Date('2025-01-05T12:00:00Z');

    it('formats days and hours', () => {
      expect(formatTimeLeft('2025-01-07T15:00:00Z', now)).toBe('2d 3h');
    });

    it('formats hours and minutes', () => {
      expect(formatTimeLeft('2025-01-05T14:30:00Z', now)).toBe('2h 30m');
    });

    it('formats minutes only', () => {
      expect(formatTimeLeft('2025-01-05T12:45:00Z', now)).toBe('45m');
    });

    it('omits minutes when the remainder is zero', () => {
      expect(formatTimeLeft('2025-01-05T14:00:00Z', now)).toBe('2h');
      expect(formatTimeLeft('2025-01-07T12:00:00Z', now)).toBe('2d');
    });

    it('formats sub-minute', () => {
      expect(formatTimeLeft('2025-01-05T12:00:30Z', now)).toBe('<1m');
    });

    it('marks past deadlines as overdue', () => {
      expect(formatTimeLeft('2025-01-05T11:00:00Z', now)).toBe('Overdue');
    });

    it('returns empty string for invalid input', () => {
      expect(formatTimeLeft(null, now)).toBe('');
    });
  });
});
