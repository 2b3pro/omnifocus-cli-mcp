import { runOmniJSJson } from "./executor.js";
import { Cache } from "./cache.js";
import { config } from "../config.js";
import { buildDatabaseSummaryScript, buildSearchScript, buildDumpDatabaseScript, buildSaveDatabaseScript } from "./scripts/database.js";
import { buildListFoldersScript, buildGetFolderScript, buildCreateFolderScript, buildUpdateFolderScript, buildDeleteFolderScript } from "./scripts/folders.js";
import { buildListTagsScript, buildGetTagScript, buildCreateTagScript, buildUpdateTagScript, buildDeleteTagScript } from "./scripts/tags.js";
import { buildListPerspectivesScript, buildGetPerspectiveTasksScript } from "./scripts/perspectives.js";
import {
  buildListProjectsScript,
  buildGetProjectScript,
  buildCreateProjectScript,
  buildUpdateProjectScript,
  buildCompleteProjectScript,
  buildDropProjectScript,
  buildMoveProjectScript,
  buildDeleteProjectScript,
  buildGetReviewQueueScript,
  buildMarkReviewedScript,
  buildGetProjectTasksScript,
} from "./scripts/projects.js";
import { buildListTasksScript, buildGetTaskScript, buildCreateTaskScript, buildUpdateTaskScript, buildCompleteTaskScript, buildUncompleteTaskScript, buildDropTaskScript, buildDeleteTaskScript, buildMoveTasksScript, buildDuplicateTasksScript, buildSetTaskTagsScript, buildAddTaskNotificationScript, buildAppendTaskNoteScript, buildConvertTaskToProjectScript, buildGetTodayCompletedTasksScript, buildListTaskNotificationsScript, buildRemoveTaskNotificationScript, buildBatchCreateTasksScript, buildBatchDeleteTasksScript, buildBatchCompleteTasksScript, buildGetTaskCountScript } from "./scripts/tasks.js";
import { 
  buildHoldProjectScript, 
  buildActivateProjectScript, 
  buildSyncScript, 
  buildReorderTaskScript, 
  buildQuickEntryScript,
  buildGetForecastScript
} from "./scripts/cli-extras.js";
import type {
  DatabaseSummaryJSON,
  DatabaseDumpJSON,
  TaskJSON,
  TaskWithChildrenJSON,
  ProjectJSON,
  FolderJSON,
  FolderWithChildrenJSON,
  TagJSON,
  TagWithChildrenJSON,
  PerspectiveJSON,
  TaskNotificationJSON,
  ListTasksArgs,
  CreateTaskArgs,
  UpdateTaskArgs,
  GetTaskArgs,
  MoveTasksArgs,
  DuplicateTasksArgs,
  SetTaskTagsArgs,
  AddTaskNotificationArgs,
  BatchCreateTasksArgs,
  BatchDeleteTasksArgs,
  BatchCompleteTasksArgs,
  ListPerspectivesArgs,
  ListProjectsArgs,
  CreateProjectArgs,
  UpdateProjectArgs,
  GetProjectTasksArgs,
  MoveProjectArgs,
  ReorderTaskArgs,
  SearchArgs,
  DumpDatabaseArgs,
  CreateFolderArgs,
  UpdateFolderArgs,
  CreateTagArgs,
  UpdateTagArgs,
} from "../types/omnifocus.js";

export class OmniFocusClient {
  private cache = new Cache();

  private invalidateAfterMutation(...prefixes: string[]): void {
    for (const prefix of prefixes) this.cache.invalidatePrefix(prefix);
  }

  // ─── Database ──────────────────────────────────────────────────────

  async getDatabaseSummary(): Promise<DatabaseSummaryJSON> {
    const cacheKey = "database:summary";
    const cached = this.cache.get<DatabaseSummaryJSON>(cacheKey);
    if (cached) return cached;

    const result = await runOmniJSJson<DatabaseSummaryJSON>(buildDatabaseSummaryScript());
    this.cache.set(cacheKey, result, config.cacheTTL.database);
    return result;
  }

  async search(queryOrArgs: string | SearchArgs, limit = 50): Promise<Array<{ type: string; id: string; name: string; note?: string }>> {
    const args: SearchArgs = typeof queryOrArgs === "string"
      ? { query: queryOrArgs, limit }
      : { limit, ...queryOrArgs };
    const cacheKey = `database:search:${JSON.stringify(args)}`;
    const cached = this.cache.get<Array<{ type: string; id: string; name: string; note?: string }>>(cacheKey);
    if (cached) return cached;

    const result = await runOmniJSJson<Array<{ type: string; id: string; name: string; note?: string }>>(buildSearchScript(args));
    this.cache.set(cacheKey, result, config.cacheTTL.database);
    return result;
  }

  async dumpDatabase(args: DumpDatabaseArgs = {}): Promise<DatabaseDumpJSON> {
    return runOmniJSJson<DatabaseDumpJSON>(buildDumpDatabaseScript(args));
  }

  async saveDatabase(): Promise<{ saved: boolean }> {
    return runOmniJSJson<{ saved: boolean }>(buildSaveDatabaseScript());
  }

  // ─── Tasks ─────────────────────────────────────────────────────────

  async listTasks(args: ListTasksArgs = {}): Promise<TaskJSON[]> {
    const cacheKey = `tasks:list:${JSON.stringify(args)}`;
    const cached = this.cache.get<TaskJSON[]>(cacheKey);
    if (cached) return cached;

    const result = await runOmniJSJson<TaskJSON[]>(buildListTasksScript(args));
    this.cache.set(cacheKey, result, config.cacheTTL.tasks);
    return result;
  }

  async getTask(idOrArgs: string | GetTaskArgs): Promise<TaskJSON | TaskWithChildrenJSON> {
    const args = typeof idOrArgs === "string" ? { id: idOrArgs } : idOrArgs;
    const cacheKey = `tasks:get:${JSON.stringify(args)}`;
    const cached = this.cache.get<TaskJSON | TaskWithChildrenJSON>(cacheKey);
    if (cached) return cached;

    const result = await runOmniJSJson<TaskJSON | TaskWithChildrenJSON>(buildGetTaskScript(args));
    this.cache.set(cacheKey, result, config.cacheTTL.tasks);
    return result;
  }

  async createTask(args: CreateTaskArgs): Promise<TaskJSON> {
    const result = await runOmniJSJson<TaskJSON>(buildCreateTaskScript(args));
    this.invalidateAfterMutation("tasks:", "database:");
    return result;
  }

  async updateTask(args: UpdateTaskArgs): Promise<TaskJSON> {
    const result = await runOmniJSJson<TaskJSON>(buildUpdateTaskScript(args));
    this.invalidateAfterMutation("tasks:");
    return result;
  }

  async completeTask(idOrArgs: string | { id: string }): Promise<TaskJSON> {
    const id = typeof idOrArgs === "string" ? idOrArgs : idOrArgs.id;
    const result = await runOmniJSJson<TaskJSON>(buildCompleteTaskScript(id));
    this.invalidateAfterMutation("tasks:", "projects:", "database:");
    return result;
  }

  async uncompleteTask(idOrArgs: string | { id: string }): Promise<TaskJSON> {
    const id = typeof idOrArgs === "string" ? idOrArgs : idOrArgs.id;
    const result = await runOmniJSJson<TaskJSON>(buildUncompleteTaskScript(id));
    this.invalidateAfterMutation("tasks:", "projects:", "database:");
    return result;
  }

  async dropTask(idOrArgs: string | { id: string }): Promise<TaskJSON> {
    const id = typeof idOrArgs === "string" ? idOrArgs : idOrArgs.id;
    const result = await runOmniJSJson<TaskJSON>(buildDropTaskScript(id));
    this.invalidateAfterMutation("tasks:", "projects:", "database:");
    return result;
  }

  async deleteTask(idOrArgs: string | { id: string }): Promise<{ deleted: boolean; id: string }> {
    const id = typeof idOrArgs === "string" ? idOrArgs : idOrArgs.id;
    const result = await runOmniJSJson<{ deleted: boolean; id: string }>(buildDeleteTaskScript(id));
    this.invalidateAfterMutation("tasks:", "projects:", "database:");
    return result;
  }

  async moveTasks(args: MoveTasksArgs): Promise<TaskJSON[]> {
    const result = await runOmniJSJson<TaskJSON[]>(buildMoveTasksScript(args));
    this.invalidateAfterMutation("tasks:", "projects:");
    return result;
  }

  async duplicateTasks(args: DuplicateTasksArgs): Promise<TaskJSON[]> {
    const result = await runOmniJSJson<TaskJSON[]>(buildDuplicateTasksScript(args));
    this.invalidateAfterMutation("tasks:", "projects:", "database:");
    return result;
  }

  async setTaskTags(args: SetTaskTagsArgs): Promise<TaskJSON> {
    const result = await runOmniJSJson<TaskJSON>(buildSetTaskTagsScript(args));
    this.invalidateAfterMutation("tasks:", "tags:");
    return result;
  }

  async addTaskNotification(args: AddTaskNotificationArgs): Promise<TaskJSON> {
    const result = await runOmniJSJson<TaskJSON>(buildAddTaskNotificationScript(args));
    this.invalidateAfterMutation("tasks:");
    return result;
  }

  async appendTaskNote(taskId: string, text: string): Promise<TaskJSON> {
    const result = await runOmniJSJson<TaskJSON>(buildAppendTaskNoteScript(taskId, text));
    this.invalidateAfterMutation("tasks:");
    return result;
  }

  async convertTaskToProject(taskId: string): Promise<ProjectJSON> {
    const result = await runOmniJSJson<ProjectJSON>(buildConvertTaskToProjectScript(taskId));
    this.invalidateAfterMutation("tasks:", "projects:", "database:");
    return result;
  }

  async getTodayCompletedTasks(): Promise<TaskJSON[]> {
    const cacheKey = "tasks:todayCompleted";
    const cached = this.cache.get<TaskJSON[]>(cacheKey);
    if (cached) return cached;

    const result = await runOmniJSJson<TaskJSON[]>(buildGetTodayCompletedTasksScript());
    this.cache.set(cacheKey, result, config.cacheTTL.tasks);
    return result;
  }

  async listTaskNotifications(taskId: string): Promise<TaskNotificationJSON[]> {
    const cacheKey = `tasks:notifications:${taskId}`;
    const cached = this.cache.get<TaskNotificationJSON[]>(cacheKey);
    if (cached) return cached;

    const result = await runOmniJSJson<TaskNotificationJSON[]>(buildListTaskNotificationsScript(taskId));
    this.cache.set(cacheKey, result, config.cacheTTL.tasks);
    return result;
  }

  async removeTaskNotification(taskId: string, notificationId: string): Promise<{ removed: boolean; taskId: string; notificationId: string }> {
    const result = await runOmniJSJson<{ removed: boolean; taskId: string; notificationId: string }>(buildRemoveTaskNotificationScript(taskId, notificationId));
    this.invalidateAfterMutation("tasks:");
    return result;
  }

  async batchCreateTasks(args: BatchCreateTasksArgs): Promise<TaskJSON[]> {
    const result = await runOmniJSJson<TaskJSON[]>(buildBatchCreateTasksScript(args));
    this.invalidateAfterMutation("tasks:", "projects:", "database:");
    return result;
  }

  async batchDeleteTasks(args: BatchDeleteTasksArgs): Promise<{ deleted: boolean; id: string }[]> {
    const result = await runOmniJSJson<{ deleted: boolean; id: string }[]>(buildBatchDeleteTasksScript(args));
    this.invalidateAfterMutation("tasks:", "projects:", "database:");
    return result;
  }

  async batchCompleteTasks(args: BatchCompleteTasksArgs): Promise<TaskJSON[]> {
    const result = await runOmniJSJson<TaskJSON[]>(buildBatchCompleteTasksScript(args));
    this.invalidateAfterMutation("tasks:", "projects:", "database:");
    return result;
  }

  async getTaskCount(args: ListTasksArgs = {}): Promise<{ count: number }> {
    const cacheKey = `tasks:count:${JSON.stringify(args)}`;
    const cached = this.cache.get<{ count: number }>(cacheKey);
    if (cached) return cached;

    const result = await runOmniJSJson<{ count: number }>(buildGetTaskCountScript(args));
    this.cache.set(cacheKey, result, config.cacheTTL.tasks);
    return result;
  }

  // ─── Projects ─────────────────────────────────────────────────────

  async listProjects(args: ListProjectsArgs = {}): Promise<ProjectJSON[]> {
    const cacheKey = `projects:list:${JSON.stringify(args)}`;
    const cached = this.cache.get<ProjectJSON[]>(cacheKey);
    if (cached) return cached;

    const result = await runOmniJSJson<ProjectJSON[]>(buildListProjectsScript(args));
    this.cache.set(cacheKey, result, config.cacheTTL.projects);
    return result;
  }

  async getProject(idOrArgs: string | { idOrName: string }): Promise<ProjectJSON> {
    const idOrName = typeof idOrArgs === "string" ? idOrArgs : idOrArgs.idOrName;
    const cacheKey = `projects:get:${idOrName}`;
    const cached = this.cache.get<ProjectJSON>(cacheKey);
    if (cached) return cached;

    const result = await runOmniJSJson<ProjectJSON>(buildGetProjectScript(idOrName));
    this.cache.set(cacheKey, result, config.cacheTTL.projects);
    return result;
  }

  async createProject(args: CreateProjectArgs): Promise<ProjectJSON> {
    const result = await runOmniJSJson<ProjectJSON>(buildCreateProjectScript(args));
    this.invalidateAfterMutation("projects:", "folders:", "database:");
    return result;
  }

  async updateProject(args: UpdateProjectArgs): Promise<ProjectJSON> {
    const result = await runOmniJSJson<ProjectJSON>(buildUpdateProjectScript(args));
    this.invalidateAfterMutation("projects:");
    return result;
  }

  async completeProject(idOrArgs: string | { id: string }): Promise<ProjectJSON> {
    const id = typeof idOrArgs === "string" ? idOrArgs : idOrArgs.id;
    const result = await runOmniJSJson<ProjectJSON>(buildCompleteProjectScript(id));
    this.invalidateAfterMutation("projects:", "tasks:", "database:");
    return result;
  }

  async dropProject(idOrArgs: string | { id: string }): Promise<ProjectJSON> {
    const id = typeof idOrArgs === "string" ? idOrArgs : idOrArgs.id;
    const result = await runOmniJSJson<ProjectJSON>(buildDropProjectScript(id));
    this.invalidateAfterMutation("projects:", "tasks:", "database:");
    return result;
  }

  async moveProject(args: MoveProjectArgs): Promise<ProjectJSON> {
    const result = await runOmniJSJson<ProjectJSON>(buildMoveProjectScript(args));
    this.invalidateAfterMutation("projects:", "folders:");
    return result;
  }

  async deleteProject(idOrArgs: string | { id: string }): Promise<{ deleted: boolean; id: string }> {
    const id = typeof idOrArgs === "string" ? idOrArgs : idOrArgs.id;
    const result = await runOmniJSJson<{ deleted: boolean; id: string }>(buildDeleteProjectScript(id));
    this.invalidateAfterMutation("projects:", "tasks:", "folders:", "database:");
    return result;
  }

  async getReviewQueue(): Promise<ProjectJSON[]> {
    const cacheKey = "projects:reviewQueue";
    const cached = this.cache.get<ProjectJSON[]>(cacheKey);
    if (cached) return cached;

    const result = await runOmniJSJson<ProjectJSON[]>(buildGetReviewQueueScript());
    this.cache.set(cacheKey, result, config.cacheTTL.projects);
    return result;
  }

  async markReviewed(idOrArgs: string | { id: string }): Promise<ProjectJSON> {
    const id = typeof idOrArgs === "string" ? idOrArgs : idOrArgs.id;
    const result = await runOmniJSJson<ProjectJSON>(buildMarkReviewedScript(id));
    this.invalidateAfterMutation("projects:");
    return result;
  }

  async getProjectTasks(args: GetProjectTasksArgs): Promise<TaskJSON[]> {
    const cacheKey = `projects:tasks:${JSON.stringify(args)}`;
    const cached = this.cache.get<TaskJSON[]>(cacheKey);
    if (cached) return cached;

    const result = await runOmniJSJson<TaskJSON[]>(buildGetProjectTasksScript(args));
    this.cache.set(cacheKey, result, config.cacheTTL.tasks);
    return result;
  }

  // ─── Folders ──────────────────────────────────────────────────────

  async listFolders(): Promise<FolderJSON[]> {
    const cacheKey = "folders:list";
    const cached = this.cache.get<FolderJSON[]>(cacheKey);
    if (cached) return cached;

    const result = await runOmniJSJson<FolderJSON[]>(buildListFoldersScript());
    this.cache.set(cacheKey, result, config.cacheTTL.folders);
    return result;
  }

  async getFolder(idOrArgs: string | { id: string }): Promise<FolderWithChildrenJSON> {
    const id = typeof idOrArgs === "string" ? idOrArgs : idOrArgs.id;
    const cacheKey = `folders:get:${id}`;
    const cached = this.cache.get<FolderWithChildrenJSON>(cacheKey);
    if (cached) return cached;

    const result = await runOmniJSJson<FolderWithChildrenJSON>(buildGetFolderScript(id));
    this.cache.set(cacheKey, result, config.cacheTTL.folders);
    return result;
  }

  async createFolder(args: CreateFolderArgs): Promise<FolderJSON> {
    const result = await runOmniJSJson<FolderJSON>(buildCreateFolderScript(args));
    this.invalidateAfterMutation("folders:", "database:");
    return result;
  }

  async updateFolder(args: UpdateFolderArgs): Promise<FolderJSON> {
    const result = await runOmniJSJson<FolderJSON>(buildUpdateFolderScript(args));
    this.invalidateAfterMutation("folders:");
    return result;
  }

  async deleteFolder(idOrArgs: string | { id: string }): Promise<{ deleted: boolean; id: string }> {
    const id = typeof idOrArgs === "string" ? idOrArgs : idOrArgs.id;
    const result = await runOmniJSJson<{ deleted: boolean; id: string }>(buildDeleteFolderScript(id));
    this.invalidateAfterMutation("folders:", "projects:", "database:");
    return result;
  }

  // ─── Tags ─────────────────────────────────────────────────────────

  async listTags(): Promise<TagJSON[]> {
    const cacheKey = "tags:list";
    const cached = this.cache.get<TagJSON[]>(cacheKey);
    if (cached) return cached;

    const result = await runOmniJSJson<TagJSON[]>(buildListTagsScript());
    this.cache.set(cacheKey, result, config.cacheTTL.tags);
    return result;
  }

  async getTag(idOrArgs: string | { id: string }): Promise<TagWithChildrenJSON> {
    const id = typeof idOrArgs === "string" ? idOrArgs : idOrArgs.id;
    const cacheKey = `tags:get:${id}`;
    const cached = this.cache.get<TagWithChildrenJSON>(cacheKey);
    if (cached) return cached;

    const result = await runOmniJSJson<TagWithChildrenJSON>(buildGetTagScript(id));
    this.cache.set(cacheKey, result, config.cacheTTL.tags);
    return result;
  }

  async createTag(args: CreateTagArgs): Promise<TagJSON> {
    const result = await runOmniJSJson<TagJSON>(buildCreateTagScript(args));
    this.invalidateAfterMutation("tags:", "database:");
    return result;
  }

  async updateTag(args: UpdateTagArgs): Promise<TagJSON> {
    const result = await runOmniJSJson<TagJSON>(buildUpdateTagScript(args));
    this.invalidateAfterMutation("tags:");
    return result;
  }

  async deleteTag(idOrArgs: string | { id: string }): Promise<{ deleted: boolean; id: string }> {
    const id = typeof idOrArgs === "string" ? idOrArgs : idOrArgs.id;
    const result = await runOmniJSJson<{ deleted: boolean; id: string }>(buildDeleteTagScript(id));
    this.invalidateAfterMutation("tags:", "tasks:", "database:");
    return result;
  }

  // ─── Perspectives ─────────────────────────────────────────────────

  async listPerspectives(args: ListPerspectivesArgs = {}): Promise<PerspectiveJSON[]> {
    const cacheKey = `perspectives:list:${JSON.stringify(args)}`;
    const cached = this.cache.get<PerspectiveJSON[]>(cacheKey);
    if (cached) return cached;

    const result = await runOmniJSJson<PerspectiveJSON[]>(buildListPerspectivesScript(args));
    this.cache.set(cacheKey, result, config.cacheTTL.perspectives);
    return result;
  }

  async getPerspectiveTasks(nameOrArgs: string | { name: string }): Promise<TaskJSON[]> {
    const name = typeof nameOrArgs === "string" ? nameOrArgs : nameOrArgs.name;
    const cacheKey = `perspectives:tasks:${name}`;
    const cached = this.cache.get<TaskJSON[]>(cacheKey);
    if (cached) return cached;

    const result = await runOmniJSJson<TaskJSON[]>(buildGetPerspectiveTasksScript(name));
    this.cache.set(cacheKey, result, config.cacheTTL.tasks);
    return result;
  }

  // ─── Utility ──────────────────────────────────────────────────────

  async ping(): Promise<{ ok: true; version: string }> {
    return runOmniJSJson<{ ok: true; version: string }>(`JSON.stringify({ ok: true, version: app.version })`);
  }

  async holdProject(idOrArgs: string | { idOrName: string }): Promise<ProjectJSON> {
    const idOrName = typeof idOrArgs === "string" ? idOrArgs : idOrArgs.idOrName;
    const result = await runOmniJSJson<ProjectJSON>(buildHoldProjectScript(idOrName));
    this.invalidateAfterMutation("projects:");
    return result;
  }

  async activateProject(idOrArgs: string | { idOrName: string }): Promise<ProjectJSON> {
    const idOrName = typeof idOrArgs === "string" ? idOrArgs : idOrArgs.idOrName;
    const result = await runOmniJSJson<ProjectJSON>(buildActivateProjectScript(idOrName));
    this.invalidateAfterMutation("projects:");
    return result;
  }

  async sync(): Promise<{ success: boolean; message: string }> {
    return runOmniJSJson<{ success: boolean; message: string }>(buildSyncScript());
  }

  async reorderTask(args: ReorderTaskArgs): Promise<TaskJSON> {
    const result = await runOmniJSJson<TaskJSON>(buildReorderTaskScript(args));
    this.invalidateAfterMutation("tasks:");
    return result;
  }

  async quickEntry(args: any): Promise<{ success: boolean; opened: true }> {
    return runOmniJSJson<{ success: boolean; opened: true }>(buildQuickEntryScript(args));
  }

  async getForecast(daysOrArgs: number | { days?: number } = 7): Promise<any[]> {
    const days = typeof daysOrArgs === "number" ? daysOrArgs : (daysOrArgs.days ?? 7);
    const result = await runOmniJSJson<any[]>(buildGetForecastScript(days));
    return result;
  }

  // ─── Cache management ─────────────────────────────────────────────

  invalidateCache(prefix?: string): void {
    if (prefix) {
      this.cache.invalidatePrefix(prefix);
    } else {
      this.cache.invalidateAll();
    }
  }

  destroy(): void {
    this.cache.destroy();
  }
}
