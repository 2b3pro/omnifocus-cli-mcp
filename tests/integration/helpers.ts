/**
 * Integration-test helpers that talk to OmniFocus via AppleScript (osascript),
 * deliberately INDEPENDENT of the project's own OmniJS client — so cleanup
 * still works even when the client/CLI is broken. Every destructive op is
 * guarded by a test-name-prefix check so it can never touch real data.
 */
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const execAsync = promisify(exec);

/** Prefix applied to all NEW test items. */
export const TEST_PREFIX = "TEST:";

/**
 * All name prefixes considered "test items" for safe deletion / orphan sweeps.
 * Includes historical prefixes used by ad-hoc live checks so the standalone
 * cleanup can reclaim orphans left by earlier sessions.
 */
export const TEST_PREFIXES = ["TEST:", "[TEST-", "__LIVECHECK__", "__LIVE__", "__LC", "__SRCH"];

export type ItemType = "task" | "project" | "tag" | "folder";

const SINGULAR: Record<ItemType, string> = {
  task: "flattened task",
  project: "flattened project",
  tag: "flattened tag",
  folder: "flattened folder",
};
const PLURAL: Record<ItemType, string> = {
  task: "flattened tasks",
  project: "flattened projects",
  tag: "flattened tags",
  folder: "flattened folders",
};

export async function execAppleScript(script: string): Promise<string> {
  const tempFile = join(tmpdir(), `of_inttest_${crypto.randomUUID()}.applescript`);
  try {
    writeFileSync(tempFile, script);
    const { stdout } = await execAsync(`osascript "${tempFile}"`);
    return stdout.trim();
  } finally {
    try { unlinkSync(tempFile); } catch { /* ignore */ }
  }
}

export function isTestName(name: string): boolean {
  return TEST_PREFIXES.some((p) => name.startsWith(p));
}

export function assertTestPrefix(name: string): void {
  if (!isTestName(name)) {
    throw new Error(`Safety check failed: "${name}" is not a recognized test item (prefixes: ${TEST_PREFIXES.join(", ")})`);
  }
}

export async function assertOmniFocusRunning(): Promise<void> {
  try {
    const result = await execAppleScript('tell application "OmniFocus" to return "ok"');
    if (!result.includes("ok")) throw new Error("Unexpected response");
  } catch (error: any) {
    throw new Error(`OmniFocus is not running or not accessible. Integration tests require OmniFocus.\n${error.message}`);
  }
}

export async function createFolder(name: string): Promise<string> {
  assertTestPrefix(name);
  const escaped = name.replace(/["\\]/g, "\\$&");
  return execAppleScript(`
    tell application "OmniFocus"
      tell front document
        set newFolder to make new folder with properties {name:"${escaped}"}
        return id of newFolder as string
      end tell
    end tell
  `);
}

export async function resolveItemName(id: string, type: ItemType): Promise<string | null> {
  const escapedId = id.replace(/["\\]/g, "\\$&");
  try {
    const result = await execAppleScript(`
      tell application "OmniFocus"
        tell front document
          set foundItem to first ${SINGULAR[type]} whose id is "${escapedId}"
          return name of foundItem
        end tell
      end tell
    `);
    return result || null;
  } catch {
    return null;
  }
}

/** Deletes an item by ID only if its name matches a known test prefix. Returns false if not found. */
export async function safeDeleteById(id: string, type: ItemType): Promise<boolean> {
  const name = await resolveItemName(id, type);
  if (name === null) return false;
  assertTestPrefix(name);
  const escapedId = id.replace(/["\\]/g, "\\$&");
  await execAppleScript(`
    tell application "OmniFocus"
      tell front document
        delete (first ${SINGULAR[type]} whose id is "${escapedId}")
      end tell
    end tell
  `);
  return true;
}

export async function findItemsByPrefix(prefix: string, type: ItemType): Promise<Array<{ id: string; name: string }>> {
  const escaped = prefix.replace(/["\\]/g, "\\$&");
  const result = await execAppleScript(`
    tell application "OmniFocus"
      tell front document
        set matches to {}
        repeat with anItem in ${PLURAL[type]}
          if name of anItem starts with "${escaped}" then
            set end of matches to (id of anItem as string) & "|||" & name of anItem
          end if
        end repeat
        set AppleScript's text item delimiters to linefeed
        return matches as text
      end tell
    end tell
  `);
  if (!result) return [];
  return result.split("\n").filter(Boolean).map((line) => {
    const [id, name] = line.split("|||");
    return { id, name };
  });
}
