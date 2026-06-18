/**
 * Shared setup for live integration tests. Creates a per-run TEST: folder and
 * sample project, exposes tracked-create helpers, and tears everything down in
 * afterAll. Items are created via the project's own client (the code under
 * test) but deleted via the prefix-guarded AppleScript deleter for robustness.
 */
import { beforeAll, afterAll } from "vitest";
import { OmniFocusClient } from "../../src/omnifocus/client.js";
import { TestRegistry } from "./registry.js";
import { assertOmniFocusRunning, createFolder } from "./helpers.js";

export const client = new OmniFocusClient();
export const registry = new TestRegistry(Date.now());

export async function createTrackedTask(args: Parameters<OmniFocusClient["createTask"]>[0]) {
  const task = await client.createTask(args);
  registry.track(task.id, task.name, "task");
  return task;
}

export async function createTrackedProject(args: Parameters<OmniFocusClient["createProject"]>[0]) {
  const project = await client.createProject(args);
  registry.track(project.id, project.name, "project");
  return project;
}

export function setupIntegration() {
  beforeAll(async () => {
    await assertOmniFocusRunning();
    registry.runFolderId = await createFolder(registry.runFolder);
    registry.track(registry.runFolderId, registry.runFolder, "folder");
    const project = await client.createProject({ name: registry.testProject, folderName: registry.runFolder });
    registry.testProjectId = project.id;
    registry.track(project.id, project.name, "project");
  }, 60000);

  afterAll(async () => {
    await registry.cleanupAll();
  }, 60000);
}
