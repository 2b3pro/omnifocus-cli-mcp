import { emitCommands } from "./emit-commands.js";
import { emitReference } from "./emit-reference.js";

async function main() {
  const check = process.argv.includes("--check");
  console.log(check ? "Checking codegen drift..." : "Starting codegen...");

  try {
    emitCommands();
    emitReference();
    
    if (check) {
      console.log("Drift check not fully implemented, but files regenerated.");
      // In a real implementation, we'd use git diff here
    }
    
    console.log("Codegen complete.");
  } catch (error) {
    console.error("Codegen failed:", error);
    process.exit(1);
  }
}

main();
