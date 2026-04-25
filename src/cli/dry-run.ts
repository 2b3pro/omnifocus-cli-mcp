import { OmniFocusClient } from "../omnifocus/client.js";

export const READING_METHODS = new Set<string>([
  "ping", "getDatabaseSummary", "search", "dumpDatabase",
  "listTasks", "getTask", "getTodayCompletedTasks",
  "listTaskNotifications", "getTaskCount",
  "listProjects", "getProject", "getReviewQueue", "getProjectTasks",
  "listFolders", "getFolder",
  "listTags", "getTag",
  "listPerspectives", "getPerspectiveTasks",
]);

export const MUTATING_METHODS = new Set<string>([
  "saveDatabase", "sync",
  "createTask", "updateTask", "completeTask", "uncompleteTask",
  "dropTask", "deleteTask", "moveTasks", "duplicateTasks", "setTaskTags",
  "addTaskNotification", "appendTaskNote", "convertTaskToProject",
  "removeTaskNotification", "batchCreateTasks", "batchDeleteTasks",
  "batchCompleteTasks", "reorderTask", "quickEntry",
  "createProject", "updateProject", "completeProject", "dropProject",
  "holdProject", "activateProject", "moveProject", "deleteProject",
  "markReviewed",
  "createFolder", "updateFolder", "deleteFolder",
  "createTag", "updateTag", "deleteTag",
]);

export function dryRunClient(client: OmniFocusClient): OmniFocusClient {
  return new Proxy(client, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== "function") return value;
      
      const name = prop as string;
      if (READING_METHODS.has(name)) return value.bind(target);
      
      if (MUTATING_METHODS.has(name)) {
        return async (...args: any[]) => {
          process.stderr.write(`[dry-run] ${name}(${JSON.stringify(args)})\n`);
          return { dryRun: true, method: name, args };
        };
      }
      
      // If it's not explicitly registered, we should probably deny it in dry-run mode
      // unless it's a known non-mutating internal method (like destroy/invalidateCache)
      if (["destroy", "invalidateCache", "invalidateAfterMutation"].includes(name)) {
        return value.bind(target);
      }

      throw new Error(
        `${name} is not in READING_METHODS or MUTATING_METHODS. ` +
        `Add it to scripts/codegen/cli-metadata.ts to enable --dry-run safety.`
      );
    },
  });
}
