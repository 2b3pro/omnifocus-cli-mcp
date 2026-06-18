import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { OmniFocusClient } from "../omnifocus/client.js";
import { formatMcpError } from "../utils/errors.js";
import type { ListTasksArgs, ListProjectsArgs } from "../types/omnifocus.js";

/** Keep only the requested fields from each record. Empty/omitted → full record. */
function projectFields<T extends Record<string, unknown>>(items: T[], fields?: string[]): Array<Partial<T>> {
  if (!fields || fields.length === 0) return items;
  return items.map((item) => {
    const out: Partial<T> = {};
    for (const f of fields) {
      if (Object.prototype.hasOwnProperty.call(item, f)) out[f as keyof T] = item[f as keyof T];
    }
    return out;
  });
}

export function registerQueryTools(server: McpServer, client: OmniFocusClient): void {
  server.tool(
    "query_omnifocus",
    "Unified read query for OmniFocus. One tool to fetch tasks or projects with composable filters (filters combine with AND). " +
      "Prefer this over dump_database for targeted lookups. Use summary:true to get just a count (cheapest), and fields:[...] " +
      "to project each result to only the keys you need — both dramatically cut response size.",
    {
      entity: z.enum(["tasks", "projects"]).default("tasks").describe("What to query (default: tasks)"),
      // Task filters
      search: z.string().optional().describe("Full-text match on name and note"),
      completed: z.boolean().optional().describe("tasks: filter by completion status"),
      flagged: z.boolean().optional().describe("tasks: only flagged"),
      available: z.boolean().optional().describe("tasks: only available (actionable)"),
      inInbox: z.boolean().optional().describe("tasks: only inbox tasks"),
      projectId: z.string().optional().describe("tasks: filter by containing project ID"),
      projectName: z.string().optional().describe("tasks: filter by containing project name"),
      tagNames: z.array(z.string()).optional().describe("tasks: must carry all these tags"),
      taskStatus: z.enum(["available", "remaining", "completed", "dropped"]).optional().describe("tasks: status filter"),
      dueAfter: z.string().optional().describe("tasks: due after this ISO date"),
      dueBefore: z.string().optional().describe("tasks: due before this ISO date"),
      deferAfter: z.string().optional().describe("tasks: deferred after this ISO date"),
      deferBefore: z.string().optional().describe("tasks: deferred before this ISO date"),
      // Project filters
      projectStatus: z.enum(["active", "onHold", "done", "dropped"]).optional().describe("projects: status filter"),
      folderId: z.string().optional().describe("projects: filter by folder ID"),
      folderName: z.string().optional().describe("projects: filter by folder name"),
      // Shared
      limit: z.number().min(1).max(1000).optional().describe("Maximum results (default 100)"),
      summary: z.boolean().optional().describe("Return only { entity, count } — no item data"),
      fields: z.array(z.string()).optional().describe("Project each result to only these field names"),
    },
    async (args) => {
      try {
        const { entity = "tasks", summary, fields, limit } = args;

        if (entity === "projects") {
          const projFilters: ListProjectsArgs = {
            status: args.projectStatus,
            folderId: args.folderId,
            folderName: args.folderName,
            search: args.search,
            limit,
          };
          const projects = await client.listProjects(projFilters);
          if (summary) {
            return { content: [{ type: "text" as const, text: JSON.stringify({ entity, count: projects.length }, null, 2) }] };
          }
          const items = projectFields(projects as unknown as Record<string, unknown>[], fields);
          return { content: [{ type: "text" as const, text: JSON.stringify({ entity, count: items.length, items }, null, 2) }] };
        }

        // entity === "tasks"
        const taskFilters: ListTasksArgs = {
          completed: args.completed,
          flagged: args.flagged,
          available: args.available,
          inInbox: args.inInbox,
          projectId: args.projectId,
          projectName: args.projectName,
          tagNames: args.tagNames,
          taskStatus: args.taskStatus,
          dueAfter: args.dueAfter,
          dueBefore: args.dueBefore,
          deferAfter: args.deferAfter,
          deferBefore: args.deferBefore,
          search: args.search,
          limit,
        };
        if (summary) {
          const { count } = await client.getTaskCount(taskFilters);
          return { content: [{ type: "text" as const, text: JSON.stringify({ entity, count }, null, 2) }] };
        }
        const tasks = await client.listTasks(taskFilters);
        const items = projectFields(tasks as unknown as Record<string, unknown>[], fields);
        return { content: [{ type: "text" as const, text: JSON.stringify({ entity, count: items.length, items }, null, 2) }] };
      } catch (error) {
        const { message } = formatMcpError(error);
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );
}
