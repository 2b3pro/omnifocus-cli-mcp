/**
 * - "today" / "tomorrow" / "+Nd|w|m|y" → LOCAL midnight
 *   (matches OmniFocus day boundaries)
 * - "next week" → next Monday LOCAL midnight (v1 parity)
 * - Explicit ISO with timezone ("...Z" or "...+00:00") → passed through
 * - Naked ISO ("2026-04-25" or "2026-04-25T00:00:00") → REJECTED
 *   with usage error: "ambiguous date; use today/+Nd or explicit TZ"
 */
export function parseCliDate(input: string): string {
  const now = new Date();
  
  if (input === "today") {
    now.setHours(23, 59, 59, 999);
    return now.toISOString();
  }
  
  if (input === "tomorrow") {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  }

  if (input === "next week") {
    // Next Monday
    const d = new Date(now);
    d.setDate(d.getDate() + (1 + 7 - d.getDay()) % 7 || 7);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }

  const relativeMatch = input.match(/^([+-])(\d+)([dwmy])$/);
  if (relativeMatch) {
    const [, sign, amount, unit] = relativeMatch;
    const val = parseInt(amount, 10) * (sign === "+" ? 1 : -1);
    const d = new Date(now);
    
    switch (unit) {
      case "d": d.setDate(d.getDate() + val); break;
      case "w": d.setDate(d.getDate() + val * 7); break;
      case "m": d.setMonth(d.getMonth() + val); break;
      case "y": d.setFullYear(d.getFullYear() + val); break;
    }
    return d.toISOString();
  }

  // Explicit ISO with timezone
  if (/Z$|[+-]\d{2}:\d{2}$/.test(input)) {
    return input;
  }

  // Naked ISO REJECTED
  if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?$/.test(input)) {
    const err = new Error(`ambiguous date: ${input}; use today/+Nd or explicit TZ`);
    err.name = "UsageError";
    throw err;
  }

  return input; // Fallback for OmniFocus's own natural language parsing
}

export function parseCsv(input: string): string[] {
  return input.split(",").map(s => s.trim()).filter(Boolean);
}
