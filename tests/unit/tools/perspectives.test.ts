import { describe, it, expect, vi, beforeEach } from "vitest";
import { OmniFocusClient } from "../../../src/omnifocus/client.js";
import { mockPerspective } from "../../fixtures/perspectives.js";
import { mockTaskList } from "../../fixtures/tasks.js";

vi.mock("../../../src/omnifocus/executor.js", () => ({
  runOmniJS: vi.fn(),
  runOmniJSJson: vi.fn(),
  runJXA: vi.fn(),
  runJXAJson: vi.fn(),
}));

import { runOmniJSJson } from "../../../src/omnifocus/executor.js";
const mockRunOmniJSJson = vi.mocked(runOmniJSJson);

describe("Perspective client methods", () => {
  let client: OmniFocusClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new OmniFocusClient();
  });

  it("should list perspectives", async () => {
    mockRunOmniJSJson.mockResolvedValue([mockPerspective, { id: "persp-2", name: "Flagged" }]);
    const perspectives = await client.listPerspectives();
    expect(perspectives).toHaveLength(2);
    expect(perspectives[0].name).toBe("Due Soon");
  });

  it("should cache perspective list", async () => {
    mockRunOmniJSJson.mockResolvedValue([mockPerspective]);
    await client.listPerspectives();
    await client.listPerspectives();
    expect(mockRunOmniJSJson).toHaveBeenCalledTimes(1);
  });

  it("should get perspective tasks", async () => {
    mockRunOmniJSJson.mockResolvedValue(mockTaskList);
    const tasks = await client.getPerspectiveTasks("Due Soon");
    expect(tasks).toHaveLength(3);
  });
});
