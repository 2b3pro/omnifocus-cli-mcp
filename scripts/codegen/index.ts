import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { emitCommands, generateCommandFiles } from "./emit-commands.js";
import { emitReference, generateReferenceFiles } from "./emit-reference.js";

const PROJECT_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../");

/** Compare freshly-generated content against what's on disk. Returns drifted paths. */
function findDrift(): string[] {
  const expected = { ...generateCommandFiles(), ...generateReferenceFiles() };
  const drifted: string[] = [];
  for (const [rel, content] of Object.entries(expected)) {
    const abs = path.join(PROJECT_ROOT, rel);
    const onDisk = fs.existsSync(abs) ? fs.readFileSync(abs, "utf-8") : null;
    if (onDisk !== content) drifted.push(rel);
  }
  return drifted;
}

async function main() {
  const check = process.argv.includes("--check");

  try {
    if (check) {
      console.log("Checking codegen drift...");
      const drifted = findDrift();
      if (drifted.length > 0) {
        console.error("Codegen drift detected in:\n" + drifted.map((d) => `  - ${d}`).join("\n"));
        console.error("Run `npm run codegen` and commit the result.");
        process.exit(1);
      }
      console.log("No codegen drift. ✓");
      return;
    }

    console.log("Starting codegen...");
    emitCommands();
    emitReference();
    console.log("Codegen complete.");
  } catch (error) {
    console.error("Codegen failed:", error);
    process.exit(1);
  }
}

main();
