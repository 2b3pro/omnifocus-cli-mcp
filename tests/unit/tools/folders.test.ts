import { describe, it, expect, vi, beforeEach } from "vitest";
import { OmniFocusClient } from "../../../src/omnifocus/client.js";
import { mockFolder, mockNestedFolder } from "../../fixtures/folders.js";

vi.mock("../../../src/omnifocus/executor.js", () => ({
  runOmniJS: vi.fn(),
  runOmniJSJson: vi.fn(),
  runJXA: vi.fn(),
  runJXAJson: vi.fn(),
}));

import { runOmniJSJson } from "../../../src/omnifocus/executor.js";
const mockRunOmniJSJson = vi.mocked(runOmniJSJson);

describe("Folder client methods", () => {
  let client: OmniFocusClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new OmniFocusClient();
  });

  it("should list folders", async () => {
    mockRunOmniJSJson.mockResolvedValue([mockFolder, mockNestedFolder]);
    const folders = await client.listFolders();
    expect(folders).toHaveLength(2);
  });

  it("should cache folder list", async () => {
    mockRunOmniJSJson.mockResolvedValue([mockFolder]);
    await client.listFolders();
    await client.listFolders();
    expect(mockRunOmniJSJson).toHaveBeenCalledTimes(1);
  });

  it("should create folder", async () => {
    mockRunOmniJSJson.mockResolvedValue(mockFolder);
    const result = await client.createFolder({ name: "Personal" });
    expect(result.name).toBe("Personal");
  });

  it("should create nested folder", async () => {
    mockRunOmniJSJson.mockResolvedValue(mockNestedFolder);
    const result = await client.createFolder({ name: "Health", parentFolderId: "folder-1" });
    expect(result.parentFolderId).toBe("folder-1");
  });

  it("should update folder", async () => {
    mockRunOmniJSJson.mockResolvedValue({ ...mockFolder, name: "Renamed" });
    const result = await client.updateFolder({ id: "folder-1", name: "Renamed" });
    expect(result.name).toBe("Renamed");
  });

  it("should delete folder", async () => {
    mockRunOmniJSJson.mockResolvedValue({ deleted: true, id: "folder-1" });
    const result = await client.deleteFolder("folder-1");
    expect(result.deleted).toBe(true);
  });

  it("should invalidate cache on create", async () => {
    mockRunOmniJSJson.mockResolvedValue([mockFolder]);
    await client.listFolders();

    mockRunOmniJSJson.mockResolvedValue(mockNestedFolder);
    await client.createFolder({ name: "Health" });

    mockRunOmniJSJson.mockResolvedValue([mockFolder, mockNestedFolder]);
    await client.listFolders();
    expect(mockRunOmniJSJson).toHaveBeenCalledTimes(3);
  });
});
