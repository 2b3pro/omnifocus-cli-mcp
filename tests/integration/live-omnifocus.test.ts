/**
 * Live integration tests against a real OmniFocus instance.
 * Skipped by default. Run with: OMNIFOCUS_LIVE=1 npm run test:integration
 *
 * All created items carry the TEST: prefix and are tracked in a registry that
 * tears them down in afterAll (children before parents). If a run is aborted,
 * reclaim orphans with: npm run test:integration:cleanup
 */
import { describe, it, expect } from "vitest";
import { TEST_PREFIX } from "./helpers.js";
import { client, registry, createTrackedTask, createTrackedProject, setupIntegration } from "./setup.js";

const LIVE = process.env.OMNIFOCUS_LIVE === "1";

describe.skipIf(!LIVE)("Live OmniFocus Tests", () => {
  setupIntegration();

  it("should get database summary", async () => {
    const summary = await client.getDatabaseSummary();
    expect(summary).toHaveProperty("inboxCount");
    expect(typeof summary.inboxCount).toBe("number");
  });

  it("should create and get a task", async () => {
    const task = await createTrackedTask({ name: `${TEST_PREFIX} Test task` });
    expect(task.name).toContain(TEST_PREFIX);
    const fetched = await client.getTask(task.id);
    expect(fetched.id).toBe(task.id);
  });

  it("should create a task inside the run's test project", async () => {
    const task = await createTrackedTask({ name: `${TEST_PREFIX} In project`, project: registry.testProjectId });
    const fetched = await client.getTask(task.id);
    expect(fetched.id).toBe(task.id);
  });

  it("should create and get a project", async () => {
    const project = await createTrackedProject({ name: `${TEST_PREFIX} Test project` });
    const fetched = await client.getProject(project.id);
    expect(fetched.id).toBe(project.id);
  });

  it("should replace tags via modify", async () => {
    const task = await createTrackedTask({ name: `${TEST_PREFIX} Tagged task` });
    const updated = await client.updateTask({ id: task.id, tags: [`${TEST_PREFIX}tag-a`, `${TEST_PREFIX}tag-b`] });
    const names = updated.tags.map((t) => t.name);
    expect(names).toContain(`${TEST_PREFIX}tag-a`);
    expect(names).toContain(`${TEST_PREFIX}tag-b`);
    for (const t of updated.tags) registry.track(t.id, t.name, "tag");
  });

  it("should delete a task via the client", async () => {
    const task = await createTrackedTask({ name: `${TEST_PREFIX} Doomed task` });
    const res = await client.deleteTask(task.id);
    expect(res.deleted).toBe(true);
    registry.untrack(task.id);
  });

  it("should list perspectives", async () => {
    const perspectives = await client.listPerspectives();
    expect(Array.isArray(perspectives)).toBe(true);
  });
});
