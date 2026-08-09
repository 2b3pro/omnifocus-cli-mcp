import { describe, it, expect, vi, beforeEach } from "vitest";
import { OmniFocusClient } from "../../../src/omnifocus/client.js";
import { mockTask, mockFlaggedTask, mockInboxTask, mockTaskList, mockCompletedTask } from "../../fixtures/tasks.js";

// Mock executor
vi.mock("../../../src/omnifocus/executor.js", () => ({
  runOmniJS: vi.fn(),
  runOmniJSJson: vi.fn(),
  runJXA: vi.fn(),
  runJXAJson: vi.fn(),
}));

import { runOmniJSJson } from "../../../src/omnifocus/executor.js";
const mockRunOmniJSJson = vi.mocked(runOmniJSJson);

describe("Task client methods", () => {
  let client: OmniFocusClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new OmniFocusClient();
  });

  describe("listTasks", () => {
    it("should return task list", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockTaskList);
      const tasks = await client.listTasks();
      expect(tasks).toHaveLength(3);
      expect(tasks[0].name).toBe("Buy groceries");
    });

    it("should pass filter args to script", async () => {
      mockRunOmniJSJson.mockResolvedValue([mockFlaggedTask]);
      await client.listTasks({ flagged: true });
      const script = mockRunOmniJSJson.mock.calls[0][0];
      expect(script).toContain("flagged");
    });

    it("should cache results", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockTaskList);
      await client.listTasks();
      await client.listTasks();
      expect(mockRunOmniJSJson).toHaveBeenCalledTimes(1);
    });

    it("should handle inbox filter", async () => {
      mockRunOmniJSJson.mockResolvedValue([mockInboxTask]);
      await client.listTasks({ inInbox: true });
      const script = mockRunOmniJSJson.mock.calls[0][0];
      expect(script).toContain("inInbox");
    });

    it("should handle tag filter", async () => {
      mockRunOmniJSJson.mockResolvedValue([mockTask]);
      await client.listTasks({ tagNames: ["errands"] });
      const script = mockRunOmniJSJson.mock.calls[0][0];
      expect(script).toContain("tagNames");
    });
  });

  describe("getTask", () => {
    it("should return a single task", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockTask);
      const task = await client.getTask("task-abc-123");
      expect(task.id).toBe("task-abc-123");
      expect(task.name).toBe("Buy groceries");
    });

    it("should cache task by ID", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockTask);
      await client.getTask("task-abc-123");
      await client.getTask("task-abc-123");
      expect(mockRunOmniJSJson).toHaveBeenCalledTimes(1);
    });
  });

  describe("createTask", () => {
    it("should create and return a task", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockTask);
      const result = await client.createTask({ name: "Buy groceries" });
      expect(result.name).toBe("Buy groceries");
    });

    it("should invalidate task cache after creation", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockTaskList);
      await client.listTasks();

      mockRunOmniJSJson.mockResolvedValue(mockTask);
      await client.createTask({ name: "New task" });

      mockRunOmniJSJson.mockResolvedValue(mockTaskList);
      await client.listTasks();
      // listTasks called twice: original + after cache invalidation
      expect(mockRunOmniJSJson).toHaveBeenCalledTimes(3);
    });
  });

  describe("completeTask", () => {
    it("should complete and return task", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockCompletedTask);
      const result = await client.completeTask("task-abc-123");
      expect(result.completed).toBe(true);
    });
  });

  describe("updateTask", () => {
    it("should update and return task", async () => {
      mockRunOmniJSJson.mockResolvedValue({ ...mockTask, name: "Updated name" });
      const result = await client.updateTask({ id: "task-abc-123", name: "Updated name" });
      expect(result.name).toBe("Updated name");
    });
  });

  describe("deleteTask", () => {
    it("should delete and return confirmation", async () => {
      mockRunOmniJSJson.mockResolvedValue({ deleted: true, id: "task-abc-123" });
      const result = await client.deleteTask("task-abc-123");
      expect(result.deleted).toBe(true);
    });
  });

  describe("moveTasks", () => {
    it("should move tasks and return results", async () => {
      mockRunOmniJSJson.mockResolvedValue([mockTask]);
      const result = await client.moveTasks({ taskIds: ["task-abc-123"], projectId: "proj-2" });
      expect(result).toHaveLength(1);
    });
  });

  describe("setTaskTags", () => {
    it("should set tags and return task", async () => {
      mockRunOmniJSJson.mockResolvedValue(mockFlaggedTask);
      const result = await client.setTaskTags({
        taskId: "task-def-456",
        tagNames: ["work", "important"],
        mode: "replace",
      });
      expect(result.tags).toHaveLength(2);
    });
  });
});
