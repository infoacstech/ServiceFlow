/**
 * India Standard Time (IST) Date & Time Utilities
 * Primary timezone: Asia/Kolkata (UTC+05:30)
 * Ensures 100% consistent date and time calculations regardless of user device or server timezone.
 */

export const TIMEZONE_INDIA = 'Asia/Kolkata';

/**
 * Returns today's date in India as YYYY-MM-DD
 */
export function getIndiaTodayDateString(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE_INDIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

/**
 * Returns current time in India as HH:mm (24-hour)
 */
export function getIndiaTimeString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE_INDIA,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(date);
}

/**
 * Calculates a future (or past) date relative to today (or a given base date) in India Standard Time.
 * Uses midday UTC arithmetic to prevent midnight timezone boundary slips.
 * E.g., getIndiaDatePlusDays(7) returns current India date + 7 days.
 */
export function getIndiaDatePlusDays(days: number, fromDateStr?: string): string {
  const baseStr = fromDateStr || getIndiaTodayDateString();
  const parts = baseStr.split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);

  // Set midday UTC so offset changes (+05:30) never jump a day backward or forward
  const date = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0));
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE_INDIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

/**
 * Checks if a given YYYY-MM-DD date string is strictly in the past according to India Standard Time.
 */
export function isPastIndiaDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const todayIndia = getIndiaTodayDateString();
  return dateStr < todayIndia;
}

/**
 * Formats a date string or Date object for UI display in India Standard Time.
 * Example output: "03 Sep 2026"
 */
export function formatIndiaDate(
  dateInput?: string | Date | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return '-';
  try {
    let dateObj: Date;
    if (typeof dateInput === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        // Safe parse for YYYY-MM-DD
        const [y, m, d] = dateInput.split('-').map(Number);
        dateObj = new Date(Date.UTC(y, m - 1, d, 6, 0, 0));
      } else {
        dateObj = new Date(dateInput);
      }
    } else {
      dateObj = dateInput;
    }

    if (isNaN(dateObj.getTime())) return String(dateInput);

    return new Intl.DateTimeFormat('en-IN', {
      timeZone: TIMEZONE_INDIA,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...options,
    }).format(dateObj);
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats a timestamp into full India Standard Time with date & time.
 * Example output: "03 Sep 2026, 05:30 PM IST"
 */
export function formatIndiaDateTime(dateInput?: string | Date | null): string {
  if (!dateInput) return '-';
  try {
    const dateObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(dateObj.getTime())) return String(dateInput);

    const formatted = new Intl.DateTimeFormat('en-IN', {
      timeZone: TIMEZONE_INDIA,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(dateObj);

    return `${formatted} IST`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats a date into standard India format: DD/MM/YYYY in India Standard Time.
 * Example: "03/09/2026"
 */
export function formatIndiaDateDDMMYYYY(dateInput?: string | Date | null): string {
  if (!dateInput) return '-';
  try {
    let dateObj: Date;
    if (typeof dateInput === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        const [y, m, d] = dateInput.split('-').map(Number);
        dateObj = new Date(Date.UTC(y, m - 1, d, 6, 0, 0));
      } else {
        dateObj = new Date(dateInput);
      }
    } else {
      dateObj = dateInput;
    }

    if (isNaN(dateObj.getTime())) return String(dateInput);

    return new Intl.DateTimeFormat('en-IN', {
      timeZone: TIMEZONE_INDIA,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(dateObj);
  } catch {
    return String(dateInput);
  }
}
