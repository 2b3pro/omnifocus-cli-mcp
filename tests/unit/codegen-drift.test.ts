import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateCommandFiles } from "../../scripts/codegen/emit-commands.js";
import { generateReferenceFiles } from "../../scripts/codegen/emit-reference.js";

// Project root is two levels up from tests/unit/.
const PROJECT_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../");

// Guards the codegen pipeline: every generated file on disk must match what
// the metadata produces right now. If this fails, run `npm run codegen` and
// commit the result — stale generated files must never be committed.
describe("codegen drift", () => {
  const expected = { ...generateCommandFiles(), ...generateReferenceFiles() };

  for (const [rel, content] of Object.entries(expected)) {
    it(`${rel} is in sync with cli-metadata.ts`, () => {
      const abs = path.join(PROJECT_ROOT, rel);
      expect(fs.existsSync(abs), `${rel} missing — run npm run codegen`).toBe(true);
      const onDisk = fs.readFileSync(abs, "utf-8");
      expect(onDisk, `${rel} is stale — run npm run codegen`).toBe(content);
    });
  }
});
