import { serializeProjectFn, serializeTaskFn } from "../serializers.js";

export function buildHoldProjectScript(idOrName: string): string {
  const argsJson = JSON.stringify({ idOrName });
  return `(() => {
    var args = JSON.parse(${JSON.stringify(argsJson)});
    ${serializeProjectFn}
    var project = byId(flattenedProjects, args.idOrName);
    if (!project) {
      var matches = flattenedProjects.filter(function(p) { return p.name === args.idOrName; });
      if (matches.length > 0) project = matches[0];
    }
    if (!project) return JSON.stringify({ notFound: true });
    project.status = Project.Status.OnHold;
    return JSON.stringify(serializeProject(project));
  })()`;
}

export function buildActivateProjectScript(idOrName: string): string {
  const argsJson = JSON.stringify({ idOrName });
  return `(() => {
    var args = JSON.parse(${JSON.stringify(argsJson)});
    ${serializeProjectFn}
    var project = byId(flattenedProjects, args.idOrName);
    if (!project) {
      var matches = flattenedProjects.filter(function(p) { return p.name === args.idOrName; });
      if (matches.length > 0) project = matches[0];
    }
    if (!project) return JSON.stringify({ notFound: true });
    project.status = Project.Status.Active;
    return JSON.stringify(serializeProject(project));
  })()`;
}

export function buildSyncScript(): string {
  return `(() => {
    Database.sync();
    return JSON.stringify({ success: true, message: "Sync triggered" });
  })()`;
}

export function buildReorderTaskScript(taskId: string, position: { top?: boolean, bottom?: boolean, before?: string, after?: string }): string {
  const argsJson = JSON.stringify({ taskId, position });
  return `(() => {
    var args = JSON.parse(${JSON.stringify(argsJson)});
    ${serializeTaskFn}
    var task = byId(flattenedTasks, args.taskId);
    if (!task) return JSON.stringify({ notFound: true });

    var parent = task.parentTask || task.containingProject;
    var taskList = parent.tasks || parent.flattenedTasks; // Simplified

    if (args.position.top) {
      moveTasks([task], parent.beginning);
    } else if (args.position.bottom) {
      moveTasks([task], parent.ending);
    } else if (args.position.before) {
      var target = byId(flattenedTasks, args.position.before);
      if (target) moveTasks([task], target.before);
    } else if (args.position.after) {
      var target = byId(flattenedTasks, args.position.after);
      if (target) moveTasks([task], target.after);
    }

    return JSON.stringify(serializeTask(task));
  })()`;
}

export function buildQuickEntryScript(args: any): string {
  const argsJson = JSON.stringify(args);
  return `(() => {
    var args = JSON.parse(${JSON.stringify(argsJson)});
    var qe = QuickEntry;
    qe.open();
    var task = qe.inbox.createTask(args.name || "");
    if (args.note) task.note = args.note;
    // ... more field mapping if needed
    return JSON.stringify({ success: true, opened: true });
  })()`;
}

export function buildGetForecastScript(days: number): string {
  return `(() => {
    ${serializeTaskFn}
    var now = new Date();
    var result = [];
    for (var i = 0; i < ${days}; i++) {
      var date = new Date(now);
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);
      var end = new Date(date);
      end.setHours(23, 59, 59, 999);
      
      var tasks = flattenedTasks.filter(function(t) {
        return t.dueDate && t.dueDate >= date && t.dueDate <= end;
      });
      
      result.push({
        date: date.toISOString().split("T")[0],
        tasks: tasks.map(serializeTask)
      });
    }
    return JSON.stringify(result);
  })()`;
}
