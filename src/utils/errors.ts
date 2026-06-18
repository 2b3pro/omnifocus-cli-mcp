export class OmniFocusError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "OmniFocusError";
  }
}

export class NotRunningError extends OmniFocusError {
  constructor(message = "OmniFocus is not running") {
    super(message, "NOT_RUNNING");
    this.name = "NotRunningError";
  }
}

export class PermissionError extends OmniFocusError {
  constructor(message = "Permission denied for OmniFocus automation") {
    super(message, "PERMISSION_DENIED");
    this.name = "PermissionError";
  }
}

export class NotFoundError extends OmniFocusError {
  constructor(message = "Resource not found") {
    super(message, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class TimeoutError extends OmniFocusError {
  constructor(message = "OmniFocus script execution timed out") {
    super(message, "TIMEOUT");
    this.name = "TimeoutError";
  }
}

export class ScriptError extends OmniFocusError {
  constructor(message: string) {
    super(message, "SCRIPT_ERROR");
    this.name = "ScriptError";
  }
}

export function parseExecutorError(stderr: string, exitCode: number | null): OmniFocusError {
  const lower = stderr.toLowerCase();

  if (lower.includes("not running") || lower.includes("isn't running") || lower.includes("connection is invalid") || lower.includes("-600")) {
    return new NotRunningError();
  }

  if (lower.includes("not permitted") || lower.includes("not authorized") || lower.includes("not authorised") || lower.includes("apple events") || lower.includes("-1743")) {
    return new PermissionError();
  }

  if (lower.includes("timed out") || lower.includes("timeout") || exitCode === null) {
    return new TimeoutError();
  }

  const cleaned = cleanScriptMessage(stderr);

  // OmniJS "<thing> not found: <id>" — surface it cleanly and distinctly.
  if (/\bnot found\b/i.test(cleaned)) {
    return new NotFoundError(cleaned);
  }

  return new ScriptError(cleaned || `Script failed with exit code ${exitCode}`);
}

/**
 * Strip osascript/OmniJS wrapping noise so the meaningful message surfaces.
 * "execution error: Error: Error: Error: Task not found: X undefined:11:29 (3)"
 *   → "Task not found: X"
 */
export function cleanScriptMessage(stderr: string): string {
  let m = stderr.trim();
  m = m.replace(/^execution error:\s*/i, "");                  // osascript prefix
  m = m.replace(/^(?:Error:\s*)+/i, "");                        // repeated "Error: " wrapping
  m = m.replace(/\s+[^\s:]+:\d+:\d+(?:\s*\(\d+\))?\s*$/, "");   // trailing " undefined:11:29 (3)"
  return m.trim();
}

export function formatMcpError(error: unknown): { message: string; isRetryable: boolean } {
  if (error instanceof NotRunningError) {
    return { message: `OmniFocus error: ${error.message}. Please ensure OmniFocus is running.`, isRetryable: true };
  }

  if (error instanceof PermissionError) {
    return {
      message: `OmniFocus error: ${error.message}. Please grant automation permission in System Settings > Privacy & Security > Automation.`,
      isRetryable: false,
    };
  }

  if (error instanceof TimeoutError) {
    return { message: `OmniFocus error: ${error.message}. The operation took too long.`, isRetryable: true };
  }

  if (error instanceof NotFoundError) {
    return { message: `OmniFocus error: ${error.message}`, isRetryable: false };
  }

  if (error instanceof ScriptError) {
    return { message: `OmniFocus script error: ${error.message}`, isRetryable: false };
  }

  if (error instanceof Error) {
    return { message: `Unexpected error: ${error.message}`, isRetryable: false };
  }

  return { message: `Unknown error: ${String(error)}`, isRetryable: false };
}
