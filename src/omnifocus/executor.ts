import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { config } from "../config.js";
import { parseExecutorError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

const execFileAsync = promisify(execFile);

/** OmniJS helper functions prepended to every script */
const OMNIJS_PRELUDE = `function byId(collection, id) {
  for (var i = 0; i < collection.length; i++) {
    if (collection[i].id && collection[i].id.primaryKey === id) return collection[i];
  }
  return null;
}`;

/** Promise-based mutex: serializes osascript calls to avoid Apple Events races */
let pending: Promise<unknown> = Promise.resolve();

/**
 * Runs a JXA script through osascript, queued behind the shared mutex.
 * `label` and `preview` are only used for diagnostics.
 */
function enqueueOsascript(jxaScript: string, label: string, preview: string): Promise<string> {
  const execute = async (): Promise<string> => {
    logger.debug(`Executing ${label} script`, { scriptLength: preview.length });

    try {
      const { stdout } = await execFileAsync("osascript", ["-l", "JavaScript", "-e", jxaScript], {
        timeout: config.executorTimeout,
        maxBuffer: config.maxBuffer,
      });

      return stdout.trim();
    } catch (error: unknown) {
      const execError = error as { stderr?: string; code?: number | null; killed?: boolean };
      const stderr = execError.stderr || "";
      const exitCode = execError.killed ? null : (execError.code ?? 1);

      logger.error(`${label} execution failed`, { stderr, exitCode });
      logger.debug("Failed script preview", { script: preview.substring(0, 500) });
      throw parseExecutorError(stderr, exitCode);
    }
  };

  pending = pending.then(execute, execute);
  return pending as Promise<string>;
}

/**
 * Executes an OmniJS script inside OmniFocus via osascript JXA bridge.
 * Returns the raw stdout string.
 * Calls are serialized via a mutex to prevent concurrent Apple Events races.
 */
export async function runOmniJS(omniScript: string): Promise<string> {
  const fullScript = OMNIJS_PRELUDE + '\n' + omniScript;
  const jxaScript = `(() => {
  const app = Application("OmniFocus");
  return app.evaluateJavascript(${JSON.stringify(fullScript)});
})()`;

  return enqueueOsascript(jxaScript, "OmniJS", omniScript);
}

/**
 * Executes a raw JXA script (Apple Events, not OmniJS) against osascript.
 *
 * Needed for the handful of application-level commands the OmniJS sandbox does
 * not expose — `Application("OmniFocus").synchronize()` being the notable one.
 * Shares the OmniJS mutex so JXA and OmniJS calls never race each other.
 */
export async function runJXA(jxaScript: string): Promise<string> {
  return enqueueOsascript(jxaScript, "JXA", jxaScript);
}

/**
 * Executes an OmniJS script and parses the result as JSON.
 */
export async function runOmniJSJson<T>(omniScript: string): Promise<T> {
  return parseJsonResult<T>(await runOmniJS(omniScript), "OmniJS");
}

/**
 * Executes a raw JXA script and parses the result as JSON.
 */
export async function runJXAJson<T>(jxaScript: string): Promise<T> {
  return parseJsonResult<T>(await runJXA(jxaScript), "JXA");
}

function parseJsonResult<T>(raw: string, label: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch (parseError) {
    const parseMessage = parseError instanceof Error ? parseError.message : String(parseError);
    logger.error(`Failed to parse ${label} JSON response`, { raw: raw.substring(0, 500), parseError: parseMessage });
    throw new Error(`Failed to parse OmniFocus response as JSON (${parseMessage}): ${raw.substring(0, 200)}`);
  }
}
