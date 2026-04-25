import { Command } from "commander";
import { OmniFocusClient } from "../omnifocus/client.js";
import { formatError } from "./output.js";
import { mapErrorToExitCode } from "./exit-codes.js";
import { registerAllCommands } from "./commands/index.js";
import { dryRunClient } from "./dry-run.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "../../package.json"), "utf8"));

const realClient = new OmniFocusClient();
export const program = new Command();

const client = new Proxy(realClient, {
  get(target, prop, receiver) {
    const opts = program.opts();
    const effectiveClient = opts.dryRun ? dryRunClient(realClient) : realClient;
    return Reflect.get(effectiveClient, prop, receiver);
  }
});

program
  .name("of")
  .description("OmniFocus CLI-MCP")
  .version(pkg.version)
  .option("--json", "Emit JSON to stdout")
  .option("--pretty", "Pretty-print JSON output")
  .option("--quiet, -q", "Emit only IDs on success")
  .option("--dry-run", "Show what would happen without making changes")
  .option("--no-preflight", "Skip OmniFocus connection check")
  .option("--schema <version>", "Specify JSON schema version", "1.0");

// Preflight hook
const PREFLIGHT_BYPASS = new Set(["completion", "help"]);

program.hook("preAction", async (thisCommand) => {
  const opts = thisCommand.opts();
  
  if (opts.noPreflight) return;
  if (PREFLIGHT_BYPASS.has(thisCommand.name())) return;

  try {
    // client.ping() will be implemented in Phase 3
    // For now, we'll just check if it exists or stub it
    if ((client as any).ping) {
      await (client as any).ping();
    }
  } catch (err) {
    formatError(err, opts);
    process.exit(mapErrorToExitCode(err));
  }
});

// Register all generated commands
registerAllCommands(program, client);
