import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { OmniFocusClient } from "../omnifocus/client.js";
import { formatMcpError } from "../utils/errors.js";

export function registerDatabaseTools(server: McpServer, client: OmniFocusClient): void {
  server.tool(
    "get_database_summary",
    "Get a summary of the OmniFocus database including counts of inbox items, projects, tags, folders, available/due-soon/overdue/flagged tasks",
    {},
    async () => {
      try {
        const summary = await client.getDatabaseSummary();
        return {
          content: [{ type: "text" as const, text: JSON.stringify(summary, null, 2) }],
        };
      } catch (error) {
        const { message } = formatMcpError(error);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );

  server.tool(
    "search",
    "Search across all OmniFocus items (tasks, projects, folders, tags) by name or note content. " +
      "Add any task filter (project, tag, flagged, available, date range) to restrict to matching tasks only. " +
      "Query is optional when filtering — omit it to list all tasks matching the filters.",
    {
      query: z.string().optional().describe("Search query string (matches name/note); optional when using filters"),
      limit: z.number().min(1).max(200).optional().describe("Maximum number of results (default 50)"),
      all: z.boolean().optional().describe("Include completed tasks (default: excluded)"),
      project: z.string().optional().describe("Only tasks in this project (name or ID)"),
      tag: z.string().optional().describe("Only tasks carrying this tag (name or ID)"),
      tagNames: z.array(z.string()).optional().describe("Only tasks carrying ALL these tags (intersection)"),
      tagNamesAny: z.array(z.string()).optional().describe("Only tasks carrying ANY of these tags (union)"),
      flagged: z.boolean().optional().describe("Only flagged tasks"),
      available: z.boolean().optional().describe("Only available (actionable) tasks"),
      dueBefore: z.string().optional().describe("Only tasks due on/before this ISO date"),
      dueAfter: z.string().optional().describe("Only tasks due on/after this ISO date"),
    },
    async (args) => {
      try {
        const results = await client.search(args);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }],
        };
      } catch (error) {
        const { message } = formatMcpError(error);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );

  server.tool(
    "dump_database",
    "Dump the entire OmniFocus database including inbox, projects, folders, tags, and perspectives in a single call. Essential for getting full context.",
    {
      includeCompleted: z.boolean().optional().describe("Include completed/dropped items (default false)"),
      maxDepth: z.number().min(0).optional().describe("Max depth for subtask hierarchy (0 = unlimited, default 0)"),
      hideRecurringDuplicates: z.boolean().optional().describe("Hide future instances of recurring tasks (default false)"),
    },
    async (args) => {
      try {
        const dump = await client.dumpDatabase(args);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(dump, null, 2) }],
        };
      } catch (error) {
        const { message } = formatMcpError(error);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );

  server.tool(
    "save_database",
    "Explicitly save the OmniFocus database to disk",
    {},
    async () => {
      try {
        const result = await client.saveDatabase();
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        const { message } = formatMcpError(error);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );
}
