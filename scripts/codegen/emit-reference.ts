import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { CLI_METADATA } from "./cli-metadata.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, "../../");

/**
 * Pure generator: { relativePath -> fileContent } for the reference docs.
 * Used by both emitReference (writes) and the drift check.
 */
export function generateReferenceFiles(): Record<string, string> {
  return {
    "cli-reference.md": generateHumanReference(),
    "cli-reference-llm.md": generateLLMReference(),
  };
}

export function emitReference() {
  const outputDir = PROJECT_ROOT;

  const humanRef = generateHumanReference();
  const llmRef = generateLLMReference();

  const humanPath = path.join(outputDir, "cli-reference.md");
  const llmPath = path.join(outputDir, "cli-reference-llm.md");

  // Write files, being careful not to let writing one overwrite the other if they are aliased
  // We use realpath to check if they point to the same location
  let humanRealPath = "";
  let llmRealPath = "";
  try { humanRealPath = fs.realpathSync(humanPath); } catch (e) {}
  try { llmRealPath = fs.realpathSync(llmPath); } catch (e) {}

  if (humanRealPath && humanRealPath === llmRealPath) {
    console.warn("Note: cli-reference.md and cli-reference-llm.md are aliases. Writing human reference to both.");
    fs.writeFileSync(humanRealPath, humanRef);
  } else {
    fs.writeFileSync(humanPath, humanRef);
    fs.writeFileSync(llmPath, llmRef);
  }
  
  console.log(`Reference docs emitted to ${outputDir}`);
}

function generateHumanReference(): string {
  let content = "---\ntitle: OmniFocus CLI-MCP Reference\n---\n\n# OmniFocus CLI-MCP Reference\n\n";
  content += "Auto-generated from CLI metadata.\n\n";

  for (const [methodName, meta] of Object.entries(CLI_METADATA)) {
    if (meta.skip || !meta.commands) continue;

    for (const cmd of meta.commands) {
      content += `### \`of ${cmd.name}\`\n\n`;
      content += `${cmd.description}\n\n`;

      if (cmd.aliases) {
        content += `**Aliases:** ${cmd.aliases.map(a => `\`${a}\``).join(", ")}\n\n`;
      }

      if (cmd.positional) {
        content += "**Arguments:**\n\n";
        for (const pos of cmd.positional) {
          content += `- \`${pos.name}\` (${pos.type}): ${pos.description}\n`;
        }
        content += "\n";
      }

      if (cmd.flags) {
        content += "**Options:**\n\n";
        for (const flag of cmd.flags) {
          content += `- \`--${flag.long}\`${flag.short ? `, \`-${flag.short}\`` : ""} (${flag.type}): ${flag.description}\n`;
        }
        content += "\n";
      }

      if (cmd.examples) {
        content += "**Examples:**\n\n";
        for (const ex of cmd.examples) {
          content += "```bash\n" + ex + "\n```\n\n";
        }
      }
    }
  }

  content += SUPPORT_FOOTER;
  return content;
}

const SUPPORT_FOOTER = `---

## Support

If this project helps you manage OmniFocus from your terminal or build cool agents, consider buying me a coffee! It helps keep the updates coming.

<a href="https://paypal.me/2b3/5">
  <img src="https://img.shields.io/badge/Donate-PayPal-blue.svg" alt="Donate with PayPal" />
</a>

**[https://paypal.me/2b3/5](https://paypal.me/2b3/5)**

---

## License

MIT License - Created by [Ian Shen](https://github.com/2b3pro).
`;

function generateLLMReference(): string {
  // LLM variant is token-optimized
  let content = "---\ntitle: OmniFocus CLI-MCP LLM Reference\nformat: compact\n---\n\n# of CLI-MCP (OmniFocus 4 macOS)\n\n";
  content += "## Global Opts\n`--json` `--pretty` `-q/--quiet` `--dry-run` `-l/--limit N`\n\n";
  content += "## Dates\n`today` `tomorrow` `+3d` `+1w` `next week` `YYYY-MM-DD`\n\n---\n\n";

  for (const [methodName, meta] of Object.entries(CLI_METADATA)) {
    if (meta.skip || !meta.commands) continue;

    for (const cmd of meta.commands) {
      content += `### \`of ${cmd.name}\`\n`;
      if (cmd.aliases) content += `ALIAS: ${cmd.aliases.map(a => `\`${a}\``).join(", ")}\n`;
      if (cmd.positional) {
        content += `ARGS: ${cmd.positional.map(p => `${p.name}${p.required ? "!" : ""}`).join(", ")}\n`;
      }
      if (cmd.flags) {
        content += `FLAGS: ${cmd.flags.map(f => `--${f.long}${f.short ? `|-${f.short}` : ""}`).join(", ")}\n`;
      }
      content += "\n";
    }
  }

  return content;
}
