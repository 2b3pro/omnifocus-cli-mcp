import { EXIT_CODES } from "./exit-codes.js";
import { OmniFocusError } from "../utils/errors.js";

export interface GlobalOpts {
  json?: boolean;
  pretty?: boolean;
  quiet?: boolean;
  schema?: string;
}

export function formatOutput(result: any, opts: GlobalOpts, outputShape: string): void {
  const wrapped = wrapInV1Schema(result, opts, outputShape);
  
  if (opts.quiet) {
    emitQuiet(wrapped, outputShape);
  } else if (opts.json || opts.pretty) {
    emitJson(wrapped, opts.pretty);
  } else {
    emitHuman(wrapped, outputShape);
  }
}

export function formatError(error: any, opts: GlobalOpts): void {
  const errorObj = {
    success: false,
    error: error instanceof Error ? error.message : String(error),
    code: error instanceof OmniFocusError ? error.code : "GENERIC",
    schemaVersion: "1.0",
  };

  if (opts.json || opts.pretty) {
    // In --json mode, errors go to stdout as JSON
    console.log(JSON.stringify(errorObj, null, opts.pretty ? 2 : 0));
  } else {
    console.error(`Error: ${errorObj.error}`);
  }
}

function wrapInV1Schema(result: any, opts: GlobalOpts, outputShape: string): any {
  const base = {
    success: true,
    schemaVersion: "1.0",
  };

  if (result && result.dryRun) {
    return { ...base, ...result };
  }

  switch (outputShape) {
    case "task[]":
      return { ...base, tasks: result.map((t: any) => transformTask(t, opts)), totalCount: result.length };
    case "project[]":
      return { ...base, projects: result.map((p: any) => transformProject(p, opts)), totalCount: result.length };
    case "folder[]":
      return { ...base, folders: result.map((f: any) => transformFolder(f, opts)), totalCount: result.length };
    case "tag[]":
      return { ...base, tags: result.map((t: any) => transformTag(t, opts)), totalCount: result.length };
    case "perspective[]":
      return { ...base, perspectives: result, totalCount: result.length };
    case "task":
      return { ...base, task: transformTask(result, { ...opts, full: true }) };
    case "project":
      return { ...base, project: transformProject(result, { ...opts, full: true }) };
    case "folder":
      return { ...base, folder: transformFolder(result, { ...opts, full: true }) };
    case "tag":
      return { ...base, tag: transformTag(result, { ...opts, full: true }) };
    case "message":
      return { ...base, message: result.message || result, id: result.id, name: result.name };
    default:
      return { ...base, data: result };
  }
}

function transformTask(t: any, opts: any) {
  const brief = {
    id: t.id,
    name: t.name,
    dueDate: t.dueDate,
    flagged: t.flagged,
    completed: t.completed,
  };
  
  if (opts.full) {
    return {
      ...brief,
      note: t.note,
      deferDate: t.deferDate,
      completionDate: t.completionDate,
      estimatedMinutes: t.estimatedMinutes,
      inInbox: t.inInbox,
      blocked: t.blocked || false,
      tags: t.tags?.map((tag: any) => tag.name) || [],
      projectName: t.containingProjectName || null,
    };
  }
  return brief;
}

function transformProject(p: any, opts: any) {
  return {
    id: p.id,
    name: p.name,
    note: p.note,
    status: transformProjectStatus(p.status),
    completed: p.completed,
    flagged: p.flagged,
    sequential: p.sequential,
    deferDate: p.deferDate,
    dueDate: p.dueDate,
    completionDate: p.completionDate,
    lastReviewDate: p.lastReviewDate,
    nextReviewDate: p.nextReviewDate,
    taskCount: p.taskCount,
    availableTaskCount: p.remainingTaskCount, // v1 used remaining for available count? check DESIGN
    completedTaskCount: p.taskCount - p.remainingTaskCount,
    folderName: p.containingFolderName || null,
    primaryTag: p.tags?.[0]?.name || null,
    singletonActionHolder: p.singleActionList,
  };
}

function transformProjectStatus(status: string) {
  switch (status) {
    case "onHold": return "on hold";
    default: return status;
  }
}

function transformFolder(f: any, opts: any) {
  return {
    id: f.id,
    name: f.name,
    note: f.note || "",
    hidden: f.status === "dropped",
    projectCount: f.projectCount,
    folderCount: f.folderCount,
    containerName: f.containingFolderName || null,
  };
}

function transformTag(t: any, opts: any) {
  return {
    id: t.id,
    name: t.name,
    allowsNextAction: t.allowsNextAction,
    hidden: t.status === "dropped",
    taskCount: t.availableTaskCount + (t.remainingTaskCount - t.availableTaskCount), // approximation
    remainingTaskCount: t.remainingTaskCount,
    containerName: t.containingTagName || null,
  };
}

function emitQuiet(wrapped: any, outputShape: string) {
  const listKey = getListKey(outputShape);
  if (listKey && wrapped[listKey]) {
    wrapped[listKey].forEach((item: any) => console.log(item.id));
  } else if (wrapped.id) {
    console.log(wrapped.id);
  } else if (wrapped.task?.id) {
    console.log(wrapped.task.id);
  } else if (wrapped.project?.id) {
    console.log(wrapped.project.id);
  } else if (wrapped.folder?.id) {
    console.log(wrapped.folder.id);
  } else if (wrapped.tag?.id) {
    console.log(wrapped.tag.id);
  }
}

function getListKey(outputShape: string): string | null {
  switch (outputShape) {
    case "task[]": return "tasks";
    case "project[]": return "projects";
    case "folder[]": return "folders";
    case "tag[]": return "tags";
    case "perspective[]": return "perspectives";
    default: return null;
  }
}

function emitJson(wrapped: any, pretty?: boolean) {
  console.log(JSON.stringify(wrapped, null, pretty ? 2 : 0));
}

function emitHuman(wrapped: any, outputShape: string) {
  // Simple human output for now, v1 parity uses emoji and tables but this is secondary
  if (wrapped.message) {
    console.log(wrapped.message);
    return;
  }

  const listKey = getListKey(outputShape);
  if (listKey && wrapped[listKey]) {
    wrapped[listKey].forEach((item: any) => {
      const icon = getIcon(outputShape, item);
      console.log(`${icon} ${item.name} (${item.id})`);
    });
    console.log(`\nTotal: ${wrapped.totalCount}`);
  } else {
    const entity = wrapped.task || wrapped.project || wrapped.folder || wrapped.tag;
    if (entity) {
      console.log(`Name: ${entity.name}`);
      console.log(`ID: ${entity.id}`);
      if (entity.note) console.log(`Note: ${entity.note}`);
    } else {
      console.log(JSON.stringify(wrapped, null, 2));
    }
  }
}

function getIcon(outputShape: string, item: any): string {
  switch (outputShape) {
    case "task[]": return item.completed ? "✅" : (item.flagged ? "🚩" : "◯");
    case "project[]": return "📁";
    case "folder[]": return "📂";
    case "tag[]": return "🏷️";
    default: return "•";
  }
}
