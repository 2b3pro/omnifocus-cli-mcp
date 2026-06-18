import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/server.js";

vi.mock("../../src/omnifocus/executor.js", () => ({
  runOmniJS: vi.fn(),
  runOmniJSJson: vi.fn(),
}));

describe("MCP Prompts", () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const { server } = createServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    client = new Client({ name: "test-client", version: "1.0.0" });

    await server.connect(serverTransport);
    await client.connect(clientTransport);

    cleanup = async () => {
      await client.close();
      await server.close();
    };
  });

  afterAll(async () => {
    await cleanup();
  });

  it("should list all registered prompts", async () => {
    const result = await client.listPrompts();
    const promptNames = result.prompts.map((p) => p.name).sort();
    expect(promptNames).toEqual(["daily-planning", "inbox-processing", "project-planning", "weekly-review"]);
  });

  it("should return weekly-review prompt with instructions", async () => {
    const result = await client.getPrompt({ name: "weekly-review" });
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].role).toBe("user");
    const content = result.messages[0].content as { type: string; text: string };
    expect(content.text).toContain("weekly review");
    expect(content.text).toContain("get_review_queue");
    expect(content.text).toContain("mark_reviewed");
  });

  it("should return inbox-processing prompt with GTD methodology", async () => {
    const result = await client.getPrompt({ name: "inbox-processing" });
    expect(result.messages).toHaveLength(1);
    const content = result.messages[0].content as { type: string; text: string };
    expect(content.text).toContain("GTD");
    expect(content.text).toContain("get_inbox_tasks");
    expect(content.text).toContain("move_tasks");
  });

  it("should return daily-planning prompt with planning steps", async () => {
    const result = await client.getPrompt({ name: "daily-planning" });
    expect(result.messages).toHaveLength(1);
    const content = result.messages[0].content as { type: string; text: string };
    expect(content.text).toContain("plan my day");
    expect(content.text).toContain("get_database_summary");
    expect(content.text).toContain("get_flagged_tasks");
  });
});
