import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { OmniFocusClient } from "./omnifocus/client.js";
import { registerAllTools } from "./tools/index.js";
import { registerResources } from "./resources.js";
import { registerPrompts } from "./prompts.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

export function createServer(): { server: McpServer; client: OmniFocusClient } {
  const server = new McpServer(
    {
      name: "omnifocus-mcp-server",
      version,
    },
    {
      instructions: `OmniFocus MCP server (macOS) — read/write access to tasks, projects, folders, tags, and perspectives.

TOOL GUIDANCE:
- For targeted reads, prefer list_tasks/search with filters over dump_database (far cheaper on context).
- Resolve a task/project ID first (search or list), then mutate by ID.
- Tasks: tags replace by default (set_task_tags mode:"add"/"remove" for additive); a task moves project via update_task projectId/projectName or move_tasks.
- Dates must be ISO 8601 with timezone (e.g. 2026-06-20T17:00:00Z); naked dates are rejected.

RESOURCES (read without a tool call):
- omnifocus://inbox — current inbox tasks
- omnifocus://today — tasks due today or overdue (not completed)
- omnifocus://flagged — all flagged tasks
- omnifocus://database/summary — database counts
- omnifocus://perspectives — list of perspectives
- omnifocus://project/{idOrName} — a project and its tasks
- omnifocus://perspective/{name} — tasks visible in a named perspective`,
    },
  );

  const client = new OmniFocusClient();
  registerAllTools(server, client);
  registerResources(server, client);
  registerPrompts(server);

  return { server, client };
}
