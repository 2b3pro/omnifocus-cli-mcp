/**
 * Standalone orphan sweep. Deletes every OmniFocus item whose name starts with
 * a known test prefix (see TEST_PREFIXES) — safe to run anytime, e.g. after a
 * crashed test run or an aborted live check.
 *
 *   npm run test:integration:cleanup
 */
import { findItemsByPrefix, safeDeleteById, TEST_PREFIXES, type ItemType } from "./helpers.js";

async function main() {
  console.log(`Sweeping OmniFocus for test items (prefixes: ${TEST_PREFIXES.join(", ")})...`);
  const types: ItemType[] = ["task", "project", "tag", "folder"];
  let deleted = 0;
  for (const type of types) {
    const seen = new Map<string, string>();
    for (const prefix of TEST_PREFIXES) {
      for (const item of await findItemsByPrefix(prefix, type)) seen.set(item.id, item.name);
    }
    if (seen.size === 0) { console.log(`  ${type}s: none`); continue; }
    console.log(`  ${type}s: found ${seen.size}`);
    for (const [id, name] of seen) {
      try {
        if (await safeDeleteById(id, type)) { console.log(`    deleted: ${name}`); deleted++; }
      } catch (error: any) {
        console.warn(`    FAILED to delete ${name}: ${error.message}`);
      }
    }
  }
  console.log(`Cleanup complete. Deleted ${deleted} item(s).`);
}

main().catch((error) => {
  console.error("Cleanup failed:", error);
  process.exit(1);
});
