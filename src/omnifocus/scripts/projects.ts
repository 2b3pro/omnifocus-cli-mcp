import { serializeProjectFn, serializeTaskFn } from "../serializers.js";
import type { ListProjectsArgs, CreateProjectArgs, UpdateProjectArgs, GetProjectTasksArgs, MoveProjectArgs } from "../../types/omnifocus.js";
import { validateDateArgs } from "../../utils/dates.js";

export function buildListProjectsScript(args: ListProjectsArgs): string {
  const argsJson = JSON.stringify(args);
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeProjectFn}

  var projects = flattenedProjects.slice();

  // Filter by status
  if (args.status === "active") {
    projects = projects.filter(function(p) { return p.status === Project.Status.Active; });
  } else if (args.status === "onHold") {
    projects = projects.filter(function(p) { return p.status === Project.Status.OnHold; });
  } else if (args.status === "done") {
    projects = projects.filter(function(p) { return p.status === Project.Status.Done; });
  } else if (args.status === "dropped") {
    projects = projects.filter(function(p) { return p.status === Project.Status.Dropped; });
  }

  // Filter by folder
  if (args.folderId) {
    projects = projects.filter(function(p) {
      return p.parentFolder && p.parentFolder.id.primaryKey === args.folderId;
    });
  }
  if (args.folderName) {
    projects = projects.filter(function(p) {
      return p.parentFolder && p.parentFolder.name === args.folderName;
    });
  }

  // Search
  if (args.search) {
    var query = args.search.toLowerCase();
    projects = projects.filter(function(p) {
      return p.name.toLowerCase().indexOf(query) !== -1 || (p.note || "").toLowerCase().indexOf(query) !== -1;
    });
  }

  // Pagination
  var offset = args.offset || 0;
  var limit = args.limit || 100;
  projects = projects.slice(offset, offset + limit);

  return JSON.stringify(projects.map(serializeProject));
})()`;
}

export function buildGetProjectScript(idOrName: string): string {
  const argsJson = JSON.stringify({ idOrName });
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeProjectFn}

  var project = byId(flattenedProjects, args.idOrName);
  if (!project) {
    var matches = flattenedProjects.filter(function(p) { return p.name === args.idOrName; });
    if (matches.length > 0) project = matches[0];
  }
  if (!project) throw new Error("Project not found: " + args.idOrName);
  return JSON.stringify(serializeProject(project));
})()`;
}

export function buildCreateProjectScript(args: CreateProjectArgs): string {
  validateDateArgs(args as unknown as Record<string, unknown>, ["deferDate", "dueDate"]);
  const argsJson = JSON.stringify(args);
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeProjectFn}

  var folder = null;
  if (args.folderId) {
    folder = byId(flattenedFolders, args.folderId);
    if (!folder) throw new Error("Folder not found: " + args.folderId);
  } else if (args.folderName) {
    var folders = flattenedFolders.filter(function(f) { return f.name === args.folderName; });
    if (folders.length === 0) throw new Error("Folder not found: " + args.folderName);
    folder = folders[0];
  } else if (args.folder) {
    folder = byId(flattenedFolders, args.folder);
    if (!folder) {
      var fmatches = flattenedFolders.filter(function(f) { return f.name === args.folder; });
      if (fmatches.length === 0) throw new Error("Folder not found: " + args.folder);
      folder = fmatches[0];
    }
  }

  var project = new Project(args.name, folder ? folder.ending : library.ending);

  if (args.note !== undefined) project.note = args.note;
  if (args.sequential !== undefined) project.sequential = args.sequential;
  if (args.singleActionList === true) project.containsSingletonActions = true;
  if (args.completedByChildren !== undefined) project.completedByChildren = args.completedByChildren;
  if (args.deferDate) project.deferDate = new Date(args.deferDate);
  if (args.dueDate) project.dueDate = new Date(args.dueDate);
  if (args.flagged !== undefined) project.flagged = args.flagged;

  if (args.reviewInterval) {
    var ri = project.reviewInterval;
    ri.steps = args.reviewInterval.steps;
    var u = args.reviewInterval.unit;
    ri.unit = u.endsWith("s") ? u : u + "s";
    project.reviewInterval = ri;
  }

  var projTagNames = (args.tags || []).slice();
  if (args.tag && projTagNames.indexOf(args.tag) === -1) projTagNames.push(args.tag);
  if (projTagNames.length > 0) {
    projTagNames.forEach(function(tagName) {
      var matches = flattenedTags.filter(function(t) { return t.name === tagName; });
      if (matches.length > 0) {
        project.task.addTag(matches[0]);
      } else {
        var newTag = new Tag(tagName);
        tags.push(newTag);
        project.task.addTag(newTag);
      }
    });
  }

  return JSON.stringify(serializeProject(project));
})()`;
}

export function buildUpdateProjectScript(args: UpdateProjectArgs): string {
  validateDateArgs(args as unknown as Record<string, unknown>, ["deferDate", "dueDate"]);
  const argsJson = JSON.stringify(args);
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeProjectFn}

  var project = byId(flattenedProjects, args.id);
  if (!project) throw new Error("Project not found: " + args.id);

  if (args.name !== undefined) project.name = args.name;
  if (args.note !== undefined) project.note = args.note;
  if (args.sequential !== undefined) project.sequential = args.sequential;
  if (args.singleActionList !== undefined) project.containsSingletonActions = args.singleActionList;
  if (args.completedByChildren !== undefined) project.completedByChildren = args.completedByChildren;
  if (args.flagged !== undefined) project.flagged = args.flagged;
  if (args.deferDate !== undefined) project.deferDate = args.deferDate ? new Date(args.deferDate) : null;
  if (args.dueDate !== undefined) project.dueDate = args.dueDate ? new Date(args.dueDate) : null;

  if (args.status === "active") project.status = Project.Status.Active;
  else if (args.status === "onHold" || args.status === "on-hold") project.status = Project.Status.OnHold;
  else if (args.status === "done") project.status = Project.Status.Done;
  else if (args.status === "dropped") project.status = Project.Status.Dropped;

  if (args.reviewInterval) {
    var ri = project.reviewInterval;
    ri.steps = args.reviewInterval.steps;
    var u = args.reviewInterval.unit;
    ri.unit = u.endsWith("s") ? u : u + "s";
    project.reviewInterval = ri;
  }

  // Replace the project's tags (applied to the project's representative task).
  var projUpdTags = (args.tags || []).slice();
  if (args.tag !== undefined && projUpdTags.indexOf(args.tag) === -1) projUpdTags.push(args.tag);
  if (args.tags !== undefined || args.tag !== undefined) {
    var projTagMap = {};
    flattenedTags.forEach(function(t) { projTagMap[t.name] = t; });
    project.task.clearTags();
    projUpdTags.forEach(function(name) {
      var tg = projTagMap[name];
      if (!tg) { tg = new Tag(name); tags.push(tg); projTagMap[name] = tg; }
      project.task.addTag(tg);
    });
  }

  return JSON.stringify(serializeProject(project));
})()`;
}

export function buildCompleteProjectScript(id: string): string {
  const argsJson = JSON.stringify({ id });
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeProjectFn}

  var project = byId(flattenedProjects, args.id);
  if (!project) throw new Error("Project not found: " + args.id);
  project.status = Project.Status.Done;
  return JSON.stringify(serializeProject(project));
})()`;
}

export function buildDropProjectScript(id: string): string {
  const argsJson = JSON.stringify({ id });
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeProjectFn}

  var project = byId(flattenedProjects, args.id);
  if (!project) throw new Error("Project not found: " + args.id);
  project.status = Project.Status.Dropped;
  return JSON.stringify(serializeProject(project));
})()`;
}

export function buildMoveProjectScript(args: MoveProjectArgs): string {
  const argsJson = JSON.stringify(args);
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeProjectFn}

  var project = byId(flattenedProjects, args.projectId);
  if (!project) throw new Error("Project not found: " + args.projectId);

  var folder = null;
  if (args.folderId) {
    folder = byId(flattenedFolders, args.folderId);
    if (!folder) throw new Error("Folder not found: " + args.folderId);
  } else if (args.folderName) {
    var fn = flattenedFolders.filter(function(f) { return f.name === args.folderName; });
    if (fn.length === 0) throw new Error("Folder not found: " + args.folderName);
    folder = fn[0];
  } else if (args.folder) {
    // id-or-name convenience: resolve by ID first, then by name.
    folder = byId(flattenedFolders, args.folder);
    if (!folder) {
      var fm = flattenedFolders.filter(function(f) { return f.name === args.folder; });
      if (fm.length === 0) throw new Error("Folder not found: " + args.folder);
      folder = fm[0];
    }
  }

  // No folder specified → move the project to the library root.
  moveSections([project], folder ? folder.ending : library.ending);
  return JSON.stringify(serializeProject(project));
})()`;
}

export function buildDeleteProjectScript(id: string): string {
  const argsJson = JSON.stringify({ id });
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});

  var project = byId(flattenedProjects, args.id);
  if (!project) throw new Error("Project not found: " + args.id);
  deleteObject(project);
  return JSON.stringify({ deleted: true, id: args.id });
})()`;
}

export function buildGetReviewQueueScript(): string {
  return `(() => {
  ${serializeProjectFn}

  var now = new Date();
  var projects = flattenedProjects.filter(function(p) {
    return p.status === Project.Status.Active && p.nextReviewDate && p.nextReviewDate <= now;
  });

  return JSON.stringify(projects.map(serializeProject));
})()`;
}

export function buildMarkReviewedScript(id: string): string {
  const argsJson = JSON.stringify({ id });
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeProjectFn}

  var project = byId(flattenedProjects, args.id);
  if (!project) throw new Error("Project not found: " + args.id);
  project.lastReviewDate = new Date();
  return JSON.stringify(serializeProject(project));
})()`;
}

export function buildGetProjectTasksScript(args: GetProjectTasksArgs): string {
  const argsJson = JSON.stringify(args);
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeTaskFn}

  var project = byId(flattenedProjects, args.projectId);
  if (!project) throw new Error("Project not found: " + args.projectId);

  var tasks = project.flattenedTasks.slice();
  if (!args.includeCompleted) {
    tasks = tasks.filter(function(t) { return t.taskStatus !== Task.Status.Completed && t.taskStatus !== Task.Status.Dropped; });
  }

  return JSON.stringify(tasks.map(serializeTask));
})()`;
}
