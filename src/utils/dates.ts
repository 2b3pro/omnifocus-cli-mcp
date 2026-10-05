/**
 * Validates an ISO 8601 date string and returns a Date object, or null if invalid.
 */
export function parseISODate(value: string): Date | null {
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return date;
}

/**
 * Validates that a string is a valid ISO 8601 date.
 */
export function isValidISODate(value: string): boolean {
  return parseISODate(value) !== null;
}

/**
 * Converts a Date to an ISO 8601 string (YYYY-MM-DDTHH:mm:ss.sssZ).
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Parses a date string or returns null. Accepts ISO 8601 format.
 */
export function parseDateOrNull(value: string | undefined | null): string | null {
  if (!value) return null;
  const date = parseISODate(value);
  return date ? toISOString(date) : null;
}

/**
 * Validates all date-string fields in an args object.
 * Throws if any specified field contains an invalid date string.
 * Skips undefined/null values (those are valid — they mean "no date" or "clear date").
 */
export function validateDateArgs(args: Record<string, unknown>, fields: string[]): void {
  for (const field of fields) {
    const value = args[field];
    if (typeof value === "string" && !isValidISODate(value)) {
      throw new Error(`Invalid date for '${field}': ${value}`);
    }
  }
}

const DURATION_UNIT_SECONDS: Record<string, number> = { w: 604800, d: 86400, h: 3600, m: 60, s: 1 };

/**
 * Parses a duration like "15m", "1h30m", "2d" or "1w" into seconds.
 * Units: w, d, h, m (minutes), s. Throws a UsageError on anything else.
 */
export function parseDurationSeconds(input: string): number {
  const value = String(input).trim().toLowerCase();
  if (!/^(\d+(\.\d+)?[wdhms])+$/.test(value)) {
    const err = new Error(`invalid duration: ${input}; use e.g. 15m, 1h30m, 2d, 1w`);
    err.name = "UsageError";
    throw err;
  }
  let seconds = 0;
  for (const [, amount, unit] of value.matchAll(/(\d+(?:\.\d+)?)([wdhms])/g)) {
    seconds += parseFloat(amount) * DURATION_UNIT_SECONDS[unit];
  }
  return Math.round(seconds);
}
