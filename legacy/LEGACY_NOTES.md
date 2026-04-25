# Legacy: omnifocus-cli (v1, JXA-based)

Snapshot of the original `omnifocus-cli` (`of` command) — preserved for reference while porting features to the MCP-based foundation.

**Source:** `/Volumes/Xarismata/Projects/CLI_Tools/omnifocus-cli` (still intact at original location)
**Original remote:** https://github.com/2b3pro/omnifocus-mcp-cli

## What lives here

- `bin/of.js` — Commander entry point
- `src/commands/` — command handlers (one per command group)
- `src/jxa-runner.js` — osascript invocation + JSON parsing
- `src/output.js` — `--json` / `--pretty` / `--quiet` formatting
- `jxa/read/` + `jxa/write/` — raw JXA scripts
- `jxa/utils/helpers.js` — shared formatters, finders, date parser
- `of-cli-reference.md` + `cli-reference-llm.md` — docs (LLM-facing reference)
- `test/workflow.test.js` — E2E test suite (15 phases)

## What to port forward

High-value pieces from the legacy CLI that the MCP foundation doesn't have:

1. **CLI surface** — `bin/of.js` + Commander setup → new `src/cli/` layer wrapping `OmniFocusClient`
2. **Output modes** — `--json` / `--pretty` / `--quiet` from `src/output.js`
3. **Dry-run pattern** — preview-without-execute flag handling
4. **Outline parsing** — batch-add-from-stdin (markdown → task hierarchies); see `jxa/write/batch*.js`
5. **Natural date parsing** — "today", "tomorrow", "+3d", "+1w" from `jxa/utils/helpers.js` `parseDate()`
6. **Quick entry** command
7. **LLM-facing docs** — `of-cli-reference.md` formatting style

## What to leave behind

- All `jxa/` scripts — superseded by MCP's OmniJS executor pattern
- `src/jxa-runner.js` — replaced by `src/omnifocus/executor.ts`
- Manual entity finders (`findProject`, `findTag`, etc.) — MCP client handles these
- `test/workflow.test.js` — replace with vitest unit + integration tests (MCP already has scaffold)

## Status

Migration Complete (Apr 25, 2026). All high-value features (CLI surface, output modes, dry-run, outline parsing, natural dates, quick entry, and LLM docs) have been ported to the new TypeScript/MCP foundation. This directory remains for historical reference only.
