import { serializeTaskFn, serializeTaskWithChildrenFn, serializeProjectFn, serializeFolderFn, serializeFolderWithChildrenFn, serializeTagFn, serializeTagWithChildrenFn, serializePerspectiveFn } from "../serializers.js";
import type { DumpDatabaseArgs, SearchArgs } from "../../types/omnifocus.js";

export function buildDatabaseSummaryScript(): string {
  return `(() => {
  var inboxItems = inbox.filter(function(t) { return t.taskStatus === Task.Status.Available; });
  var projects = flattenedProjects.filter(function(p) { return p.status === Project.Status.Active; });
  var tagsList = flattenedTags;
  var folders = flattenedFolders;

  var now = new Date();
  var soon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  var allTasks = flattenedTasks;
  var available = allTasks.filter(function(t) { return t.taskStatus === Task.Status.Available; });
  var dueSoon = available.filter(function(t) { return t.dueDate && t.dueDate <= soon && t.dueDate >= now; });
  var overdue = available.filter(function(t) { return t.dueDate && t.dueDate < now; });
  var flagged = available.filter(function(t) { return t.flagged; });

  return JSON.stringify({
    inboxCount: inboxItems.length,
    projectCount: projects.length,
    tagCount: tagsList.length,
    folderCount: folders.length,
    availableTaskCount: available.length,
    dueSoonTaskCount: dueSoon.length,
    overdueTaskCount: overdue.length,
    flaggedTaskCount: flagged.length
  });
})()`;
}

export function buildSearchScript(queryOrArgs: string | SearchArgs, limit = 50): string {
  const args: SearchArgs = typeof queryOrArgs === "string"
    ? { query: queryOrArgs, limit }
    : { limit: queryOrArgs.limit ?? 50, ...queryOrArgs };
  const argsJson = JSON.stringify(args);
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  var query = (args.query || "").toLowerCase();
  var limit = args.limit || 50;
  // Task-specific filters; when any is set, only tasks are returned.
  var hasTaskFilter = !!(args.project || args.tag || args.flagged || args.available || args.dueBefore || args.dueAfter);
  var dueBefore = args.dueBefore ? new Date(args.dueBefore) : null;
  var dueAfter = args.dueAfter ? new Date(args.dueAfter) : null;

  var results = [];

  var tasks = flattenedTasks;
  for (var i = 0; i < tasks.length && results.length < limit; i++) {
    var t = tasks[i];
    if (query && t.name.toLowerCase().indexOf(query) === -1 && (t.note || "").toLowerCase().indexOf(query) === -1) continue;
    if (!args.all && t.taskStatus === Task.Status.Completed) continue;
    if (args.flagged === true && !t.flagged) continue;
    if (args.available === true && t.taskStatus !== Task.Status.Available) continue;
    if (args.project) {
      var cp = t.containingProject;
      if (!cp || (cp.id.primaryKey !== args.project && cp.name !== args.project)) continue;
    }
    if (args.tag) {
      var tagged = false;
      var tt = t.tags;
      for (var k = 0; k < tt.length; k++) {
        if (tt[k].id.primaryKey === args.tag || tt[k].name === args.tag) { tagged = true; break; }
      }
      if (!tagged) continue;
    }
    if (dueBefore && (!t.dueDate || t.dueDate > dueBefore)) continue;
    if (dueAfter && (!t.dueDate || t.dueDate < dueAfter)) continue;
    results.push({ type: "task", id: t.id.primaryKey, name: t.name, note: (t.note || "").substring(0, 200) });
  }

  // Projects/folders/tags are only included for plain text search (no task filters).
  if (!hasTaskFilter) {
    var projects = flattenedProjects;
    for (var i = 0; i < projects.length && results.length < limit; i++) {
      var p = projects[i];
      if (p.name.toLowerCase().indexOf(query) !== -1 || (p.note || "").toLowerCase().indexOf(query) !== -1) {
        results.push({ type: "project", id: p.id.primaryKey, name: p.name, note: (p.note || "").substring(0, 200) });
      }
    }

    var folders = flattenedFolders;
    for (var i = 0; i < folders.length && results.length < limit; i++) {
      var f = folders[i];
      if (f.name.toLowerCase().indexOf(query) !== -1) {
        results.push({ type: "folder", id: f.id.primaryKey, name: f.name });
      }
    }

    var tags = flattenedTags;
    for (var i = 0; i < tags.length && results.length < limit; i++) {
      var tg = tags[i];
      if (tg.name.toLowerCase().indexOf(query) !== -1) {
        results.push({ type: "tag", id: tg.id.primaryKey, name: tg.name });
      }
    }
  }

  return JSON.stringify(results.slice(0, limit));
})()`;
}

export function buildDumpDatabaseScript(args: DumpDatabaseArgs = {}): string {
  const argsJson = JSON.stringify(args);
  return `(() => {
  var args = JSON.parse(${JSON.stringify(argsJson)});
  ${serializeTaskFn}
  ${serializeTaskWithChildrenFn}
  ${serializeProjectFn}
  ${serializeFolderFn}
  ${serializeFolderWithChildrenFn}
  ${serializeTagFn}
  ${serializeTagWithChildrenFn}
  ${serializePerspectiveFn}

  var maxDepth = args.maxDepth || 0;
  var includeCompleted = args.includeCompleted || false;

  var hideRecurringDuplicates = args.hideRecurringDuplicates || false;

  // Inbox tasks
  var inboxTasks = inbox.slice();
  if (!includeCompleted) {
    inboxTasks = inboxTasks.filter(function(t) { return t.taskStatus !== Task.Status.Completed && t.taskStatus !== Task.Status.Dropped; });
  }
  if (hideRecurringDuplicates) {
    var now2 = new Date();
    inboxTasks = inboxTasks.filter(function(t) {
      if (!t.repetitionRule) return true;
      return !t.deferDate || t.deferDate <= now2;
    });
  }
  var inboxSerialized = inboxTasks.map(function(t) { return serializeTaskWithChildren(t, 0, maxDepth); });

  // Projects
  var projects = flattenedProjects.slice();
  if (!includeCompleted) {
    projects = projects.filter(function(p) { return p.status !== Project.Status.Done && p.status !== Project.Status.Dropped; });
  }
  var projectsSerialized = projects.map(serializeProject);

  // Folders (top-level with recursive children)
  var topFolders = Array.from(library).filter(function(x) { return x instanceof Folder; });
  var foldersSerialized = topFolders.map(function(f) { return serializeFolderWithChildren(f, 0, maxDepth); });

  // Tags (top-level with recursive children)
  var topTags = tags.slice();
  var tagsSerialized = topTags.map(function(t) { return serializeTagWithChildren(t, 0, maxDepth); });

  // Perspectives
  var perspectives = Perspective.Custom.all.slice();
  var perspectivesSerialized = perspectives.map(serializePerspective);

  // Summary
  var now = new Date();
  var soon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  var allTasks = flattenedTasks;
  var available = allTasks.filter(function(t) { return t.taskStatus === Task.Status.Available; });
  var dueSoon = available.filter(function(t) { return t.dueDate && t.dueDate <= soon && t.dueDate >= now; });
  var overdue = available.filter(function(t) { return t.dueDate && t.dueDate < now; });
  var flagged = available.filter(function(t) { return t.flagged; });

  var summary = {
    inboxCount: inbox.filter(function(t) { return t.taskStatus === Task.Status.Available; }).length,
    projectCount: flattenedProjects.filter(function(p) { return p.status === Project.Status.Active; }).length,
    tagCount: flattenedTags.length,
    folderCount: flattenedFolders.length,
    availableTaskCount: available.length,
    dueSoonTaskCount: dueSoon.length,
    overdueTaskCount: overdue.length,
    flaggedTaskCount: flagged.length
  };

  return JSON.stringify({
    inbox: inboxSerialized,
    projects: projectsSerialized,
    folders: foldersSerialized,
    tags: tagsSerialized,
    perspectives: perspectivesSerialized,
    summary: summary
  });
})()`;
}

export function buildSaveDatabaseScript(): string {
  return `(() => {
  document.save();
  return JSON.stringify({ saved: true });
})()`;
}
