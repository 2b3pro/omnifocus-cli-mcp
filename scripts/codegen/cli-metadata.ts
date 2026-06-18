import type { OmniFocusClient } from "../../src/omnifocus/client.js";

export interface CommandMeta {
  name: string;
  aliases?: string[];
  description: string;
  examples?: string[];
  category: "read" | "write";
  positional?: PositionalSpec[];
  flags?: FlagSpec[];
  bindArgs?: Record<string, unknown>;
  stdin?: boolean;
  outputShape: "task[]" | "project[]" | "folder[]" | "tag[]" | "perspective[]"
              | "task" | "project" | "folder" | "tag" | "summary"
              | "id-list" | "message" | "raw" | "forecast";
  exitCodeOverride?: string;
  mcpExpose?: boolean;
}

export interface PositionalSpec {
  name: string;
  type: "string" | "string[]" | "id" | "id[]" | "idOrName" | "idOrName[]";
  required: boolean;
  description: string;
}

export interface FlagSpec {
  long: string;
  short?: string;
  type: "string" | "boolean" | "number" | "string[]" | "date";
  description: string;
  default?: unknown;
  parser?: "parseCliDate" | "parseCsv" | "parseInt";
  /**
   * The client-API argument key this flag binds to. Defaults to `long`.
   * Use when the CLI flag name differs from the client method's field
   * (e.g. `--due` → `dueDate`, `--estimate` → `estimatedMinutes`).
   */
  argKey?: string;
  /**
   * For boolean flags: the fixed value to assign to `argKey` when the flag
   * is present, instead of `true`. Enables inverse/sentinel flags such as
   * `--unflag` → `{ flagged: false }` or `--clear-due` → `{ dueDate: null }`.
   */
  bindValue?: unknown;
}

export interface MethodMeta {
  commands?: CommandMeta[];
  skip?: boolean;
  category?: "read" | "write";
}

export const CLI_METADATA: Partial<Record<keyof OmniFocusClient, MethodMeta>> = {
  ping: { skip: true, category: "read" },
  getDatabaseSummary: {
    commands: [
      {
        name: "summary",
        description: "Show a summary of the database.",
        category: "read",
        outputShape: "summary",
      },
    ],
  },
  listTasks: {
    commands: [
      {
        name: "list inbox",
        aliases: ["ls i"],
        description: "List tasks in the Inbox.",
        examples: ["of list inbox", "of ls i --limit 10"],
        category: "read",
        flags: [
          { long: "limit", short: "l", type: "number", default: 100, description: "Maximum results" },
          { long: "all", short: "a", type: "boolean", description: "Include completed" },
          { long: "brief", type: "boolean", default: true, description: "Brief output" },
          { long: "full", type: "boolean", description: "Full output" },
        ],
        bindArgs: { inbox: true },
        outputShape: "task[]",
      },
      {
        name: "list today",
        description: "List tasks due or available today.",
        category: "read",
        flags: [
          { long: "limit", short: "l", type: "number", default: 100, description: "Maximum results" },
          { long: "flagged", type: "boolean", description: "Include flagged" },
          { long: "brief", type: "boolean", default: true, description: "Brief output" },
          { long: "full", type: "boolean", description: "Full output" },
        ],
        bindArgs: { dueBefore: "today", available: true },
        outputShape: "task[]",
      },
      {
        name: "list flagged",
        description: "List all flagged tasks.",
        category: "read",
        flags: [
          { long: "limit", short: "l", type: "number", default: 100, description: "Maximum results" },
          { long: "all", short: "a", type: "boolean", description: "Include completed" },
          { long: "brief", type: "boolean", default: true, description: "Brief output" },
          { long: "full", type: "boolean", description: "Full output" },
        ],
        bindArgs: { flagged: true },
        outputShape: "task[]",
      },
    ],
  },
  getForecast: {
    commands: [
      {
        name: "list forecast",
        description: "List tasks for upcoming days.",
        category: "read",
        flags: [
          { long: "days", short: "d", type: "number", parser: "parseInt", default: 7, description: "Number of days to show" },
        ],
        outputShape: "forecast",
      },
    ],
  },
  search: {
    commands: [
      {
        name: "search",
        aliases: ["s"],
        description: "Search for tasks by name, note, or filters.",
        category: "read",
        positional: [
          { name: "query", type: "string", required: false, description: "Search query" },
        ],
        flags: [
          { long: "limit", short: "l", type: "number", default: 50, description: "Maximum results" },
          { long: "all", short: "a", type: "boolean", description: "Include completed tasks" },
          { long: "project", short: "p", type: "string", description: "Filter by project" },
          { long: "tag", short: "t", type: "string", description: "Filter by tag" },
          { long: "flagged", short: "f", type: "boolean", description: "Only flagged tasks" },
          { long: "available", type: "boolean", description: "Only available tasks" },
          { long: "due-before", type: "date", parser: "parseCliDate", description: "Due before date" },
          { long: "due-after", type: "date", parser: "parseCliDate", description: "Due after date" },
        ],
        outputShape: "task[]",
      },
    ],
  },
  listProjects: {
    commands: [
      {
        name: "list projects",
        aliases: ["ls p"],
        description: "List all active projects.",
        category: "read",
        flags: [
          { long: "folder", short: "f", type: "string", description: "Filter by folder name or ID" },
          { long: "limit", short: "l", type: "number", default: 100, description: "Maximum results" },
          { long: "all", short: "a", type: "boolean", description: "Include completed/dropped/on-hold" },
          { long: "on-hold", type: "boolean", description: "Include on-hold projects" },
          { long: "brief", type: "boolean", default: true, description: "Brief output" },
          { long: "full", type: "boolean", description: "Full output" },
        ],
        outputShape: "project[]",
      },
    ],
  },
  listFolders: {
    commands: [
      {
        name: "list folders",
        aliases: ["ls f"],
        description: "List folder hierarchy.",
        category: "read",
        flags: [
          { long: "limit", short: "l", type: "number", default: 100, description: "Maximum results" },
          { long: "folder", short: "f", type: "string", description: "List subfolders within this folder" },
          { long: "root-only", short: "r", type: "boolean", description: "Only show top-level folders" },
          { long: "hidden", type: "boolean", description: "Include hidden folders" },
        ],
        outputShape: "folder[]",
      },
    ],
  },
  listTags: {
    commands: [
      {
        name: "list tags",
        aliases: ["ls t"],
        description: "List all tags.",
        category: "read",
        flags: [
          { long: "limit", short: "l", type: "number", default: 100, description: "Maximum results" },
          { long: "hidden", type: "boolean", description: "Include hidden tags" },
        ],
        outputShape: "tag[]",
      },
      {
        name: "tag tasks",
        aliases: ["tag list"],
        description: "List tasks with a specific tag.",
        category: "read",
        positional: [
          { name: "name", type: "idOrName", required: true, description: "Tag name or ID" },
        ],
        flags: [
          { long: "limit", short: "l", type: "number", default: 100, description: "Maximum results" },
          { long: "all", short: "a", type: "boolean", description: "Include completed tasks" },
        ],
        outputShape: "task[]",
      },
    ],
  },
  createTask: {
    commands: [
      {
        name: "add",
        aliases: ["add t", "add task"],
        description: "Add a new task.",
        category: "write",
        positional: [
          { name: "name", type: "string", required: true, description: "Task name" },
        ],
        flags: [
          { long: "project", short: "p", type: "string", argKey: "project", description: "Project name or ID" },
          { long: "note", short: "n", type: "string", description: "Task note" },
          { long: "due", short: "d", type: "date", parser: "parseCliDate", argKey: "dueDate", description: "Due date" },
          { long: "defer", type: "date", parser: "parseCliDate", argKey: "deferDate", description: "Defer date" },
          { long: "flagged", short: "f", type: "boolean", description: "Mark as flagged" },
          { long: "tag", short: "t", type: "string", argKey: "tag", description: "Primary tag" },
          { long: "tags", type: "string[]", parser: "parseCsv", description: "Multiple tags (comma-sep)" },
          { long: "estimate", short: "e", type: "number", parser: "parseInt", argKey: "estimatedMinutes", description: "Estimated minutes" },
        ],
        outputShape: "task",
      },
      {
        name: "quick",
        aliases: ["q"],
        description: "Quick add to Inbox.",
        category: "write",
        positional: [
          { name: "name", type: "string", required: true, description: "Task name" },
        ],
        flags: [
          { long: "due", short: "d", type: "date", parser: "parseCliDate", argKey: "dueDate", description: "Due date" },
          { long: "flagged", short: "f", type: "boolean", description: "Mark as flagged" },
        ],
        bindArgs: { inbox: true },
        outputShape: "task",
      },
      {
        name: "add batch",
        aliases: ["add b"],
        description: "Create projects and tasks from an indented outline via stdin.",
        category: "write",
        stdin: true,
        flags: [
          { long: "folder", short: "f", type: "string", description: "Add to specific folder" },
          { long: "sequential", type: "boolean", description: "Make all projects sequential" },
        ],
        outputShape: "task[]",
      },
    ],
  },
  updateTask: {
    commands: [
      {
        name: "modify",
        aliases: ["mod"],
        description: "Update an existing task. Combine any number of flags in one call.",
        examples: [
          "of modify abc123 --name \"New name\" --due tomorrow -f",
          "of mod abc123 --tags work,urgent --project Inbox",
          "of mod abc123 --add-tag waiting --remove-tag urgent --due-by +3d",
        ],
        category: "write",
        positional: [
          { name: "id", type: "id", required: true, description: "Task ID" },
        ],
        flags: [
          { long: "name", type: "string", description: "Set task name" },
          { long: "note", short: "n", type: "string", description: "Set task note" },
          { long: "due", short: "d", type: "date", parser: "parseCliDate", argKey: "dueDate", description: "Set due date" },
          { long: "due-by", type: "string", argKey: "dueBy", description: "Adjust due date relatively (+3d, -1w)" },
          { long: "clear-due", type: "boolean", argKey: "dueDate", bindValue: null, description: "Clear the due date" },
          { long: "defer", type: "date", parser: "parseCliDate", argKey: "deferDate", description: "Set defer date" },
          { long: "defer-by", type: "string", argKey: "deferBy", description: "Adjust defer date relatively" },
          { long: "clear-defer", type: "boolean", argKey: "deferDate", bindValue: null, description: "Clear the defer date" },
          { long: "flag", short: "f", type: "boolean", argKey: "flagged", bindValue: true, description: "Set flagged" },
          { long: "unflag", type: "boolean", argKey: "flagged", bindValue: false, description: "Remove flag" },
          { long: "tag", short: "t", type: "string", argKey: "tag", description: "Replace tags with this single tag" },
          { long: "tags", type: "string[]", parser: "parseCsv", description: "Replace all tags (comma-sep)" },
          { long: "add-tag", type: "string[]", parser: "parseCsv", argKey: "addTags", description: "Add tags (comma-sep)" },
          { long: "remove-tag", type: "string[]", parser: "parseCsv", argKey: "removeTags", description: "Remove tags (comma-sep)" },
          { long: "project", short: "p", type: "string", argKey: "project", description: "Move to project (name or ID)" },
          { long: "estimate", short: "e", type: "number", parser: "parseInt", argKey: "estimatedMinutes", description: "Set estimated minutes" },
        ],
        outputShape: "task",
      },
      {
        name: "flag",
        description: "Flag task(s).",
        category: "write",
        positional: [
          { name: "ids...", type: "id[]", required: true, description: "Task IDs" },
        ],
        bindArgs: { flagged: true },
        outputShape: "message",
      },
      {
        name: "unflag",
        description: "Remove flag from task(s).",
        category: "write",
        positional: [
          { name: "ids...", type: "id[]", required: true, description: "Task IDs" },
        ],
        bindArgs: { flagged: false },
        outputShape: "message",
      },
    ],
  },
  completeTask: {
    commands: [
      {
        name: "complete",
        aliases: ["done"],
        description: "Mark task(s) as complete.",
        category: "write",
        positional: [
          { name: "ids...", type: "id[]", required: true, description: "Task IDs" },
        ],
        outputShape: "message",
      },
    ],
  },
  dropTask: {
    commands: [
      {
        name: "drop",
        description: "Drop task(s).",
        category: "write",
        positional: [
          { name: "ids...", type: "id[]", required: true, description: "Task IDs" },
        ],
        outputShape: "message",
      },
    ],
  },
  deleteTask: {
    commands: [
      {
        name: "delete",
        aliases: ["rm"],
        description: "Permanently delete task(s).",
        category: "write",
        positional: [
          { name: "ids...", type: "id[]", required: true, description: "Task IDs" },
        ],
        outputShape: "message",
      },
    ],
  },
  reorderTask: {
    commands: [
      {
        name: "reorder",
        description: "Reorder a task within its project.",
        category: "write",
        positional: [
          { name: "taskId", type: "id", required: true, description: "Task ID" },
        ],
        flags: [
          { long: "top", type: "boolean", description: "Move to first position" },
          { long: "bottom", type: "boolean", description: "Move to last position" },
          { long: "before", type: "string", description: "Move before another task" },
          { long: "after", type: "string", description: "Move after another task" },
        ],
        outputShape: "task",
      },
    ],
  },
  createProject: {
    commands: [
      {
        name: "add project",
        aliases: ["add p"],
        description: "Create a new project.",
        category: "write",
        positional: [
          { name: "name", type: "string", required: true, description: "Project name" },
        ],
        flags: [
          { long: "folder", short: "f", type: "string", argKey: "folder", description: "Add to specific folder (name or ID)" },
          { long: "note", short: "n", type: "string", description: "Project note" },
          { long: "due", short: "d", type: "date", parser: "parseCliDate", argKey: "dueDate", description: "Due date" },
          { long: "defer", type: "date", parser: "parseCliDate", argKey: "deferDate", description: "Defer date" },
          { long: "flagged", type: "boolean", description: "Mark as flagged" },
          { long: "tag", short: "t", type: "string", argKey: "tag", description: "Add primary tag" },
          { long: "tags", type: "string[]", parser: "parseCsv", description: "Add multiple tags (comma-sep)" },
          { long: "sequential", type: "boolean", description: "Sequential project" },
          { long: "parallel", type: "boolean", argKey: "sequential", bindValue: false, description: "Parallel project" },
          { long: "single-actions", type: "boolean", argKey: "singleActionList", description: "Single action list" },
        ],
        outputShape: "project",
      },
    ],
  },
  updateProject: {
    commands: [
      {
        name: "project modify",
        aliases: ["proj mod"],
        description: "Modify project properties.",
        category: "write",
        positional: [
          { name: "id", type: "id", required: true, description: "Project ID" },
        ],
        flags: [
          { long: "name", type: "string", description: "Rename project" },
          { long: "note", short: "n", type: "string", description: "Set project note" },
          { long: "due", short: "d", type: "date", parser: "parseCliDate", argKey: "dueDate", description: "Set due date" },
          { long: "defer", type: "date", parser: "parseCliDate", argKey: "deferDate", description: "Set defer date" },
          { long: "clear-due", type: "boolean", argKey: "dueDate", bindValue: null, description: "Clear due date" },
          { long: "clear-defer", type: "boolean", argKey: "deferDate", bindValue: null, description: "Clear defer date" },
          { long: "flag", short: "f", type: "boolean", argKey: "flagged", bindValue: true, description: "Flag project" },
          { long: "unflag", type: "boolean", argKey: "flagged", bindValue: false, description: "Unflag project" },
          { long: "tag", short: "t", type: "string", argKey: "tag", description: "Replace tags with this single tag" },
          { long: "tags", type: "string[]", parser: "parseCsv", description: "Replace all tags (comma-sep)" },
          { long: "status", type: "string", description: "Set status (active, on-hold, done, dropped)" },
          { long: "sequential", type: "boolean", description: "Set to sequential" },
          { long: "parallel", type: "boolean", argKey: "sequential", bindValue: false, description: "Set to parallel" },
        ],
        outputShape: "project",
      },
    ],
  },
  completeProject: {
    commands: [
      {
        name: "project complete",
        aliases: ["proj done"],
        description: "Mark project as complete.",
        category: "write",
        positional: [
          { name: "id", type: "id", required: true, description: "Project ID" },
        ],
        outputShape: "project",
      },
    ],
  },
  dropProject: {
    commands: [
      {
        name: "project drop",
        description: "Mark project as dropped.",
        category: "write",
        positional: [
          { name: "id", type: "id", required: true, description: "Project ID" },
        ],
        outputShape: "project",
      },
    ],
  },
  holdProject: {
    commands: [
      {
        name: "project hold",
        aliases: ["pause"],
        description: "Put project on hold.",
        category: "write",
        positional: [
          { name: "idOrName", type: "idOrName", required: true, description: "Project name or ID" },
        ],
        outputShape: "project",
      },
    ],
  },
  activateProject: {
    commands: [
      {
        name: "project activate",
        aliases: ["resume"],
        description: "Resume an on-hold project.",
        category: "write",
        positional: [
          { name: "idOrName", type: "idOrName", required: true, description: "Project name or ID" },
        ],
        outputShape: "project",
      },
    ],
  },
  markReviewed: {
    commands: [
      {
        name: "project review",
        description: "Mark project as reviewed.",
        category: "write",
        positional: [
          { name: "id", type: "id", required: true, description: "Project ID" },
        ],
        outputShape: "project",
      },
    ],
  },
  moveProject: {
    commands: [
      {
        name: "move",
        description: "Move a project to a different folder.",
        category: "write",
        positional: [
          { name: "projectId", type: "id", required: true, description: "Project ID" },
        ],
        flags: [
          { long: "folder", short: "f", type: "string", description: "Target folder (omit for root)" },
        ],
        outputShape: "project",
      },
    ],
  },
  createFolder: {
    commands: [
      {
        name: "folder add",
        aliases: ["folder create"],
        description: "Create a new folder.",
        category: "write",
        positional: [
          { name: "name", type: "string", required: true, description: "Folder name" },
        ],
        flags: [
          { long: "parent", short: "p", type: "string", argKey: "parentFolderId", description: "Parent folder ID" },
        ],
        outputShape: "folder",
      },
    ],
  },
  updateFolder: {
    commands: [
      {
        name: "folder modify",
        aliases: ["folder mod"],
        description: "Modify an existing folder.",
        category: "write",
        positional: [
          { name: "id", type: "id", required: true, description: "Folder ID" },
        ],
        flags: [
          { long: "name", type: "string", description: "Rename folder" },
          { long: "hidden", type: "boolean", argKey: "status", bindValue: "dropped", description: "Hide (drop) folder" },
          { long: "visible", type: "boolean", argKey: "status", bindValue: "active", description: "Show (activate) folder" },
        ],
        outputShape: "folder",
      },
    ],
  },
  createTag: {
    commands: [
      {
        name: "tag add",
        aliases: ["tag create"],
        description: "Create a new tag.",
        category: "write",
        positional: [
          { name: "name", type: "string", required: true, description: "Tag name" },
        ],
        flags: [
          { long: "parent", short: "p", type: "string", argKey: "parentTagId", description: "Parent tag ID" },
          { long: "no-next-action", type: "boolean", argKey: "allowsNextAction", bindValue: false, description: "Disable next action" },
        ],
        outputShape: "tag",
      },
    ],
  },
  updateTag: {
    commands: [
      {
        name: "tag modify",
        aliases: ["tag mod"],
        description: "Modify an existing tag.",
        category: "write",
        positional: [
          { name: "id", type: "id", required: true, description: "Tag ID" },
        ],
        flags: [
          { long: "name", type: "string", description: "Rename tag" },
          { long: "hidden", type: "boolean", argKey: "status", bindValue: "dropped", description: "Hide (drop) tag" },
          { long: "visible", type: "boolean", argKey: "status", bindValue: "active", description: "Show (activate) tag" },
          { long: "allows-next", type: "boolean", argKey: "allowsNextAction", bindValue: true, description: "Enable next action" },
          { long: "no-allows-next", type: "boolean", argKey: "allowsNextAction", bindValue: false, description: "Disable next action" },
        ],
        outputShape: "tag",
      },
    ],
  },
  deleteTag: {
    commands: [
      {
        name: "tag delete",
        aliases: ["tag rm"],
        description: "Delete a tag.",
        category: "write",
        positional: [
          { name: "id", type: "id", required: true, description: "Tag ID" },
        ],
        outputShape: "message",
      },
    ],
  },
  sync: {
    commands: [
      {
        name: "sync",
        description: "Synchronize the database.",
        category: "write",
        outputShape: "message",
      },
    ],
  },
  getReviewQueue: {
    commands: [
      {
        name: "review",
        description: "List projects due for review.",
        category: "read",
        flags: [
          { long: "limit", short: "l", type: "number", default: 50, description: "Maximum results" },
          { long: "all", short: "a", type: "boolean", description: "Include all active projects" },
        ],
        outputShape: "project[]",
      },
    ],
  },
  getTask: {
    commands: [
      {
        name: "get task",
        aliases: ["get t"],
        description: "Get detailed information about a task.",
        category: "read",
        positional: [
          { name: "id", type: "id", required: true, description: "Task ID" },
        ],
        outputShape: "task",
      },
    ],
  },
  getProject: {
    commands: [
      {
        name: "get project",
        aliases: ["get p"],
        description: "Get detailed information about a project.",
        category: "read",
        positional: [
          { name: "idOrName", type: "idOrName", required: true, description: "Project name or ID" },
        ],
        outputShape: "project",
      },
    ],
  },
  getProjectTasks: {
    commands: [
      {
        name: "get project-tasks",
        aliases: ["get pt"],
        description: "List tasks in a project.",
        category: "read",
        positional: [
          { name: "projectId", type: "id", required: true, description: "Project ID" },
        ],
        flags: [
          { long: "limit", short: "l", type: "number", default: 100, description: "Maximum results" },
          { long: "all", short: "a", type: "boolean", description: "Include completed tasks" },
        ],
        outputShape: "task[]",
      },
    ],
  },
  listPerspectives: {
    commands: [
      {
        name: "perspectives",
        aliases: ["persp"],
        description: "List available perspectives.",
        category: "read",
        outputShape: "perspective[]",
      },
    ],
  },
  quickEntry: {
    commands: [
      {
        name: "qe",
        aliases: ["quick-entry"],
        description: "Open Quick Entry panel.",
        category: "write",
        positional: [
          { name: "name", type: "string", required: false, description: "Task name" },
        ],
        flags: [
          { long: "note", short: "n", type: "string", description: "Task note" },
          { long: "due", short: "d", type: "date", parser: "parseCliDate", description: "Due date" },
          { long: "defer", type: "date", parser: "parseCliDate", description: "Defer date" },
          { long: "flagged", short: "f", type: "boolean", description: "Mark as flagged" },
          { long: "save", type: "boolean", description: "Auto-save the task" },
        ],
        outputShape: "message",
      },
    ],
  },
};
