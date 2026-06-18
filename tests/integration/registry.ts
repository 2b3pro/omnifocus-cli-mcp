import { safeDeleteById, type ItemType } from "./helpers.js";

interface TrackedItem {
  id: string;
  name: string;
  type: ItemType;
}

/**
 * Tracks every item a test run creates so it can be torn down deterministically
 * (children before parents), via the prefix-guarded AppleScript deleter.
 */
export class TestRegistry {
  private items = new Map<string, TrackedItem>();
  readonly runFolder: string;
  runFolderId = "";
  readonly testProject: string;
  testProjectId = "";

  constructor(stamp: number) {
    this.runFolder = `TEST:${stamp}`;
    this.testProject = "TEST:Sample Project";
  }

  track(id: string, name: string, type: ItemType): void {
    this.items.set(id, { id, name, type });
  }

  untrack(id: string): void {
    this.items.delete(id);
  }

  private getByType(type: ItemType): TrackedItem[] {
    return [...this.items.values()].filter((item) => item.type === type);
  }

  /** Delete in dependency order: tasks → projects → tags → folders. */
  async cleanupAll(): Promise<void> {
    const order: ItemType[] = ["task", "project", "tag", "folder"];
    for (const type of order) {
      for (const item of this.getByType(type)) {
        try {
          await safeDeleteById(item.id, item.type);
          this.untrack(item.id);
        } catch (error) {
          console.warn(`Cleanup warning: failed to delete ${item.type} "${item.name}" (${item.id}):`, error);
        }
      }
    }
  }
}
