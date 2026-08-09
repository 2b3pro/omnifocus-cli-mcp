import { describe, it, expect } from "vitest";
import {
  buildListPerspectivesScript,
  buildGetPerspectiveTasksScript,
} from "../../../../src/omnifocus/scripts/perspectives.js";

describe("perspective script builders", () => {
  describe("buildListPerspectivesScript", () => {
    it("should generate valid list script", () => {
      const script = buildListPerspectivesScript();
      expect(script).toContain("perspectives");
      expect(script).toContain("serializePerspective");
      expect(script).toContain("JSON.stringify");
    });

    it("should read from the custom-only perspective collection", () => {
      const script = buildListPerspectivesScript();
      expect(script).toContain("Perspective.Custom.all");
    });

    it("should not filter by built-in name — that filter was always a no-op or always-empty", () => {
      const script = buildListPerspectivesScript();
      expect(script).not.toContain("builtInNames");
      expect(script).not.toContain("includeBuiltIn");
      expect(script).not.toContain("includeCustom");
    });
  });

  describe("buildGetPerspectiveTasksScript", () => {
    it("should embed perspective name", () => {
      const script = buildGetPerspectiveTasksScript("Due Soon");
      expect(script).toContain("Due Soon");
    });

    it("should set window perspective", () => {
      const script = buildGetPerspectiveTasksScript("Forecast");
      expect(script).toContain("win.perspective");
    });

    it("should collect tasks from perspective trees", () => {
      const script = buildGetPerspectiveTasksScript("Flagged");
      expect(script).toContain("collectTasks");
      expect(script).toContain("serializeTask");
    });

    it("should handle special characters in name", () => {
      const script = buildGetPerspectiveTasksScript('My "Custom" Perspective');
      expect(script).toContain("JSON.parse");
    });
  });
});
