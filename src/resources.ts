import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { OmniFocusClient } from "./omnifocus/client.js";
import { formatMcpError } from "./utils/errors.js";

/** Wrap a value (or a thrown error) as a JSON resource content block. */
async function jsonContent(uri: string, produce: () => Promise<unknown>) {
  try {
    const data = await produce();
    return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(data, null, 2) }] };
  } catch (error) {
    const { message } = formatMcpError(error);
    return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ error: message }) }] };
  }
}

function firstVar(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

/** Enumerate named items into resource entries; never throws (listResources must not crash if OmniFocus is unavailable). */
async function safeResourceList(scheme: string, fetch: () => Promise<Array<{ name: string }>>) {
  try {
    const items = (await fetch()) ?? [];
    return {
      resources: items.map((i) => ({
        uri: `omnifocus://${scheme}/${encodeURIComponent(i.name)}`,
        name: i.name,
        mimeType: "application/json",
      })),
    };
  } catch {
    return { resources: [] };
  }
}

/** Prefix-filter names for template completion; never throws. */
async function safeComplete(value: string, fetch: () => Promise<Array<{ name: string }>>) {
  try {
    const items = (await fetch()) ?? [];
    return items.map((i) => i.name).filter((n) => n.toLowerCase().includes(value.toLowerCase())).slice(0, 100);
  } catch {
    return [];
  }
}

export function registerResources(server: McpServer, client: OmniFocusClient): void {
  // ─── Fixed resources ──────────────────────────────────────────────
  server.resource(
    "inbox",
    "omnifocus://inbox",
    { description: "Current OmniFocus inbox tasks", mimeType: "application/json" },
    async (uri) => jsonContent(uri.href, () => client.listTasks({ inInbox: true })),
  );

  server.resource(
    "today",
    "omnifocus://today",
    { description: "Tasks due today or overdue (not completed)", mimeType: "application/json" },
    async (uri) => jsonContent(uri.href, () => {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return client.listTasks({ dueBefore: end.toISOString(), completed: false });
    }),
  );

  server.resource(
    "flagged",
    "omnifocus://flagged",
    { description: "All flagged OmniFocus tasks", mimeType: "application/json" },
    async (uri) => jsonContent(uri.href, () => client.listTasks({ flagged: true, completed: false })),
  );

  server.resource(
    "database-summary",
    "omnifocus://database/summary",
    { description: "OmniFocus database summary with counts", mimeType: "application/json" },
    async (uri) => jsonContent(uri.href, () => client.getDatabaseSummary()),
  );

  server.resource(
    "perspectives",
    "omnifocus://perspectives",
    { description: "List of all OmniFocus perspectives", mimeType: "application/json" },
    async (uri) => jsonContent(uri.href, () => client.listPerspectives()),
  );

  // ─── Template resources ───────────────────────────────────────────
  server.resource(
    "project",
    new ResourceTemplate("omnifocus://project/{idOrName}", {
      list: async () => safeResourceList("project", () => client.listProjects()),
      complete: {
        idOrName: async (value) => safeComplete(value, () => client.listProjects()),
      },
    }),
    { description: "A project and its tasks (by project name or ID)", mimeType: "application/json" },
    async (uri, variables) => jsonContent(uri.href, async () => {
      const idOrName = decodeURIComponent(firstVar(variables.idOrName));
      const project = await client.getProject(idOrName);
      const tasks = await client.getProjectTasks({ projectId: project.id });
      return { project, tasks };
    }),
  );

  server.resource(
    "perspective",
    new ResourceTemplate("omnifocus://perspective/{name}", {
      list: async () => safeResourceList("perspective", () => client.listPerspectives()),
      complete: {
        name: async (value) => safeComplete(value, () => client.listPerspectives()),
      },
    }),
    { description: "Tasks visible in a named OmniFocus perspective", mimeType: "application/json" },
    async (uri, variables) => jsonContent(uri.href, () =>
      client.getPerspectiveTasks(decodeURIComponent(firstVar(variables.name)))),
  );
}
