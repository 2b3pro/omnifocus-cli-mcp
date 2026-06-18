import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/server.js";

/**
 * Cross-tool schema contract checks — catches the field-naming/shape bug class
 * we had to fix by hand (e.g. `due` vs `dueDate`, tags accepted as a JSON
 * string instead of an array). Introspects every registered MCP tool's input
 * schema via the protocol.
 */
describe("MCP tool schema consistency", () => {
  let client: Client;
  let cleanup: () => Promise<void>;
  let tools: Array<{ name: string; inputSchema: any }>;

  beforeAll(async () => {
    const { server } = createServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    client = new Client({ name: "test-client", version: "1.0.0" });
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    cleanup = async () => { await client.close(); await server.close(); };
    tools = (await client.listTools()).tools as any;
  });

  afterAll(async () => { await cleanup(); });

  it("registers tools with input schemas", () => {
    expect(tools.length).toBeGreaterThan(40);
  });

  it("uses camelCase property names everywhere (no snake_case)", () => {
    const offenders: string[] = [];
    for (const t of tools) {
      const props = (t.inputSchema?.properties ?? {}) as Record<string, unknown>;
      for (const key of Object.keys(props)) {
        if (/[a-z0-9]_[a-z0-9]/i.test(key)) offenders.push(`${t.name}.${key}`);
      }
    }
    expect(offenders, `snake_case property names found: ${offenders.join(", ")}`).toEqual([]);
  });

  it("declares tag fields as arrays, never strings", () => {
    const tagKeys = ["tags", "tagNames", "addTags", "removeTags"];
    const offenders: string[] = [];
    for (const t of tools) {
      const props = (t.inputSchema?.properties ?? {}) as Record<string, { type?: string }>;
      for (const key of tagKeys) {
        if (props[key] && props[key].type !== "array") offenders.push(`${t.name}.${key} (type=${props[key].type})`);
      }
    }
    expect(offenders, `tag fields must be arrays: ${offenders.join(", ")}`).toEqual([]);
  });

  it("uses canonical date field names (dueDate/deferDate, not due/defer)", () => {
    // Tools that take dates should expose dueDate/deferDate (or *Before/*After),
    // never a bare `due`/`defer` key.
    const offenders: string[] = [];
    for (const t of tools) {
      const props = (t.inputSchema?.properties ?? {}) as Record<string, unknown>;
      for (const bad of ["due", "defer"]) {
        if (bad in props) offenders.push(`${t.name}.${bad}`);
      }
    }
    expect(offenders, `use dueDate/deferDate, not bare due/defer: ${offenders.join(", ")}`).toEqual([]);
  });
});
