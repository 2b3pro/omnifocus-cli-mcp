import { describe, it, expect } from "vitest";
import { parseISODate, isValidISODate, toISOString, parseDateOrNull, validateDateArgs, parseDurationSeconds } from "../../../src/utils/dates.js";

describe("parseISODate", () => {
  it("should parse valid ISO date strings", () => {
    const date = parseISODate("2024-01-15T10:30:00.000Z");
    expect(date).toBeInstanceOf(Date);
    expect(date!.getUTCFullYear()).toBe(2024);
    expect(date!.getUTCMonth()).toBe(0);
    expect(date!.getUTCDate()).toBe(15);
  });

  it("should parse date-only strings", () => {
    const date = parseISODate("2024-06-01");
    expect(date).toBeInstanceOf(Date);
  });

  it("should return null for invalid date strings", () => {
    expect(parseISODate("not a date")).toBeNull();
    expect(parseISODate("")).toBeNull();
    expect(parseISODate("2024-13-45")).toBeNull();
  });

  it("should handle timezone offsets", () => {
    const date = parseISODate("2024-01-15T10:30:00+05:00");
    expect(date).toBeInstanceOf(Date);
  });
});

describe("isValidISODate", () => {
  it("should return true for valid dates", () => {
    expect(isValidISODate("2024-01-15T10:30:00.000Z")).toBe(true);
    expect(isValidISODate("2024-06-01")).toBe(true);
  });

  it("should return false for invalid dates", () => {
    expect(isValidISODate("not a date")).toBe(false);
    expect(isValidISODate("")).toBe(false);
  });
});

describe("toISOString", () => {
  it("should convert Date to ISO string", () => {
    const date = new Date("2024-01-15T10:30:00.000Z");
    expect(toISOString(date)).toBe("2024-01-15T10:30:00.000Z");
  });
});

describe("parseDateOrNull", () => {
  it("should return ISO string for valid dates", () => {
    const result = parseDateOrNull("2024-01-15T10:30:00.000Z");
    expect(result).toBe("2024-01-15T10:30:00.000Z");
  });

  it("should return null for undefined/null/empty", () => {
    expect(parseDateOrNull(undefined)).toBeNull();
    expect(parseDateOrNull(null)).toBeNull();
    expect(parseDateOrNull("")).toBeNull();
  });

  it("should return null for invalid dates", () => {
    expect(parseDateOrNull("not valid")).toBeNull();
  });
});

describe("validateDateArgs", () => {
  it("should pass for valid ISO dates", () => {
    expect(() =>
      validateDateArgs({ dueDate: "2024-01-15T10:30:00Z", deferDate: "2024-06-01" }, ["dueDate", "deferDate"]),
    ).not.toThrow();
  });

  it("should throw for invalid date strings", () => {
    expect(() =>
      validateDateArgs({ dueDate: "not-a-date" }, ["dueDate"]),
    ).toThrow("Invalid date for 'dueDate': not-a-date");
  });

  it("should skip undefined fields", () => {
    expect(() =>
      validateDateArgs({ dueDate: undefined }, ["dueDate"]),
    ).not.toThrow();
  });

  it("should skip null fields", () => {
    expect(() =>
      validateDateArgs({ dueDate: null }, ["dueDate"]),
    ).not.toThrow();
  });

  it("should skip missing fields", () => {
    expect(() =>
      validateDateArgs({}, ["dueDate", "deferDate"]),
    ).not.toThrow();
  });

  it("should skip non-string fields", () => {
    expect(() =>
      validateDateArgs({ dueDate: 12345 }, ["dueDate"]),
    ).not.toThrow();
  });

  it("should validate only specified fields", () => {
    expect(() =>
      validateDateArgs({ dueDate: "valid-date-no", otherField: "also-not-a-date" }, ["otherField"]),
    ).toThrow("Invalid date for 'otherField'");
  });
});

describe("parseDurationSeconds", () => {
  it("should parse single-unit durations", () => {
    expect(parseDurationSeconds("15m")).toBe(900);
    expect(parseDurationSeconds("1h")).toBe(3600);
    expect(parseDurationSeconds("2d")).toBe(172800);
    expect(parseDurationSeconds("1w")).toBe(604800);
    expect(parseDurationSeconds("45s")).toBe(45);
  });

  it("should parse compound and fractional durations", () => {
    expect(parseDurationSeconds("1h30m")).toBe(5400);
    expect(parseDurationSeconds("1.5h")).toBe(5400);
  });

  it("should reject input without a unit or with junk", () => {
    for (const bad of ["", "30", "soon", "1h x", "-1h", "h"]) {
      expect(() => parseDurationSeconds(bad), bad).toThrow("invalid duration");
    }
  });
});
