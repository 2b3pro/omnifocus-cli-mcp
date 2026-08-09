import { describe, it, expect } from "vitest";
import { buildReorderTaskScript, buildSyncScript } from "../../../../src/omnifocus/scripts/cli-extras.js";

describe("buildReorderTaskScript", () => {
  it("should move task to top", () => {
    const script = buildReorderTaskScript({ taskId: "task-123", top: true });
    expect(script).toContain("task-123");
    expect(script).toContain("parent.beginning");
    expect(script).toContain("moveTasks");
  });

  it("should move task to bottom", () => {
    const script = buildReorderTaskScript({ taskId: "task-123", bottom: true });
    expect(script).toContain("parent.ending");
  });

  it("should move task before another", () => {
    const script = buildReorderTaskScript({ taskId: "task-123", before: "task-456" });
    expect(script).toContain("task-456");
    expect(script).toContain("target.before");
  });

  it("should move task after another", () => {
    const script = buildReorderTaskScript({ taskId: "task-123", after: "task-789" });
    expect(script).toContain("task-789");
    expect(script).toContain("target.after");
  });

  it("should read position flags off args directly (not args.position)", () => {
    const script = buildReorderTaskScript({ taskId: "task-123", top: true });
    // Regression: client now passes a single args object, so the script must
    // read args.top/args.before/etc., not the old nested args.position.*.
    expect(script).toContain("args.top");
    expect(script).not.toContain("args.position");
  });

  it("should produce syntactically valid JavaScript", () => {
    const script = buildReorderTaskScript({ taskId: "task-123", before: "task-456" });
    expect(() => new Function(script)).not.toThrow();
  });
});

describe("buildSyncScript", () => {
  it("should use the JXA application command, not the OmniJS sandbox", () => {
    const script = buildSyncScript();
    // Regression: `Database.sync` does not exist in OmniJS — the old script
    // threw "Database.sync is not a function" on every invocation.
    expect(script).toContain('Application("OmniFocus")');
    expect(script).toContain("app.synchronize()");
    expect(script).not.toContain("Database.sync");
  });

  it("should produce syntactically valid JavaScript", () => {
    expect(() => new Function(buildSyncScript())).not.toThrow();
  });
});
