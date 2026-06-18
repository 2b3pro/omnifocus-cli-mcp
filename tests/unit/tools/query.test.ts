import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../../src/server.js";
import { mockTaskList } from "../../fixtures/tasks.js";
import { mockProjectList } from "../../fixtures/projects.js";

vi.mock("../../../src/omnifocus/executor.js", () => ({
  runOmniJS: vi.fn(),
  runOmniJSJson: vi.fn(),
}));

import { runOmniJSJson } from "../../../src/omnifocus/executor.js";
const mockRunOmniJSJson = vi.mocked(runOmniJSJson);

describe("query_omnifocus tool", () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const { server } = createServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    client = new Client({ name: "test-client", version: "1.0.0" });
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    cleanup = async () => { await client.close(); await server.close(); };
  });

  beforeEach(() => vi.clearAllMocks());
  afterAll(async () => { await cleanup(); });

  function call(args: Record<string, unknown>) {
    return client.callTool({ name: "query_omnifocus", arguments: args });
  }
  function parse(result: any) {
    expect(result.isError).toBeFalsy();
    return JSON.parse((result.content as Array<{ text: string }>)[0].text);
  }

  it("is registered and listed", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name)).toContain("query_omnifocus");
  });

  it("returns tasks with count and items by default", async () => {
    mockRunOmniJSJson.mockResolvedValue(mockTaskList as any);
    const data = parse(await call({ entity: "tasks", flagged: true }));
    expect(data.entity).toBe("tasks");
    expect(data.count).toBe(mockTaskList.length);
    expect(data.items).toHaveLength(mockTaskList.length);
  });

  it("summary returns only entity + count (no items)", async () => {
    mockRunOmniJSJson.mockResolvedValue({ count: 42 } as any);
    const data = parse(await call({ entity: "tasks", summary: true }));
    expect(data).toEqual({ entity: "tasks", count: 42 });
    expect(data.items).toBeUndefined();
  });

  it("fields projects each item to only the requested keys", async () => {
    mockRunOmniJSJson.mockResolvedValue(mockTaskList as any);
    const data = parse(await call({ entity: "tasks", fields: ["id", "name"] }));
    for (const item of data.items) {
      expect(Object.keys(item).sort()).toEqual(["id", "name"]);
    }
  });

  it("queries projects", async () => {
    mockRunOmniJSJson.mockResolvedValue(mockProjectList as any);
    const data = parse(await call({ entity: "projects", projectStatus: "active" }));
    expect(data.entity).toBe("projects");
    expect(data.count).toBe(mockProjectList.length);
  });
});
