#!/usr/bin/env node
import { program } from "../cli/index.js";
import { formatError } from "../cli/output.js";
import { mapErrorToExitCode, EXIT_CODES } from "../cli/exit-codes.js";

// Handle broken pipe (e.g., of list | head -n 1)
process.stdout.on("error", (err: any) => {
  if (err.code === "EPIPE") {
    process.exit(EXIT_CODES.OK);
  }
});

async function main() {
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    const opts = program.opts();
    formatError(error, opts);
    process.exit(mapErrorToExitCode(error));
  }
}

main();
