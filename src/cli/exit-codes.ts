import { OmniFocusError } from "../utils/errors.js";

export const EXIT_CODES = {
  OK: 0,
  GENERIC: 1,
  NOT_RUNNING: 2,
  PERMISSION_DENIED: 3,
  NOT_FOUND: 4,
  TIMEOUT: 5,
  SCRIPT_ERROR: 6,
  PARTIAL_BATCH: 7,
  USAGE: 64,
} as const;

export type ExitCode = typeof EXIT_CODES[keyof typeof EXIT_CODES];

export function mapErrorToExitCode(error: unknown): ExitCode {
  if (error instanceof OmniFocusError) {
    switch (error.code) {
      case "NOT_RUNNING":
        return EXIT_CODES.NOT_RUNNING;
      case "PERMISSION_DENIED":
        return EXIT_CODES.PERMISSION_DENIED;
      case "NOT_FOUND":
        return EXIT_CODES.NOT_FOUND;
      case "TIMEOUT":
        return EXIT_CODES.TIMEOUT;
      case "SCRIPT_ERROR":
        return EXIT_CODES.SCRIPT_ERROR;
      default:
        return EXIT_CODES.GENERIC;
    }
  }

  // Commander usage errors or other validation errors
  if (error instanceof Error && (error.name === "UsageError" || error.name === "CommanderError")) {
    return EXIT_CODES.USAGE;
  }

  return EXIT_CODES.GENERIC;
}
