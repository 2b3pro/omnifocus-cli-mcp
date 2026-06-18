import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerPrompts(server: McpServer): void {
  server.prompt(
    "project-planning",
    "Turn a project into a sequenced, actionable plan, with an approval gate before applying changes",
    { project: z.string().min(1).describe("Project name or ID to plan") },
    async ({ project }) => ({
      messages: [{
        role: "user" as const,
        content: {
          type: "text" as const,
          text: `Plan the OmniFocus project "${project}" into clear, executable work.

1. Call get_project with "${project}" to load it, and get_project_tasks for its current tasks. If it isn't found, plan from intent instead and ask whether to create it (treat status as "not_found").
2. Summarize the project's intended outcome in one concise sentence.
3. Evaluate current task coverage and identify missing steps; turn vague items into concrete, verb-first next actions (observable "done" state).
4. Sequence the work (dependencies first, then what can run in parallel); estimate effort and flag high-risk items.

Output format:
- Project summary (one sentence)
- Work breakdown table: action | estimate | priority | dependency | suggested tags | due/defer | rationale
- The first 3 actions to execute now
- Risk/blocker list with mitigation ideas

Engagement protocol: this is OmniFocus execution planning, not a detached document. After presenting the plan, ask for explicit confirmation before applying it. Once approved, make the changes (create_project if needed, create_task, update_task, set_task_tags) and report the created/updated IDs. Ask for explicit confirmation before deleting anything.`,
        },
      }],
    }),
  );

  server.prompt(
    "weekly-review",
    "Guided weekly review of OmniFocus projects and tasks",
    async () => ({
      messages: [{
        role: "user" as const,
        content: {
          type: "text" as const,
          text: `Perform a weekly review of my OmniFocus system:
1. First call get_review_queue to see projects due for review
2. For each project, call get_project_tasks to check progress
3. Call get_inbox_tasks to process any unprocessed items
4. Call get_flagged_tasks to review priorities
5. Summarize: projects reviewed, inbox items processed, flagged items status
6. Mark reviewed projects with mark_reviewed
Provide a structured summary when done.`,
        },
      }],
    }),
  );

  server.prompt(
    "inbox-processing",
    "Process OmniFocus inbox using GTD methodology",
    async () => ({
      messages: [{
        role: "user" as const,
        content: {
          type: "text" as const,
          text: `Process my OmniFocus inbox using GTD:
1. Call get_inbox_tasks to see all inbox items
2. For each item, help me decide: is it actionable?
   - If not actionable: delete or convert to reference
   - If actionable and <2 min: suggest completing it now
   - If actionable: suggest a project, tags, due/defer dates
3. Use move_tasks, update_task, set_task_tags to organize items
4. Summarize what was processed`,
        },
      }],
    }),
  );

  server.prompt(
    "daily-planning",
    "Plan today's tasks using OmniFocus data",
    async () => ({
      messages: [{
        role: "user" as const,
        content: {
          type: "text" as const,
          text: `Help me plan my day:
1. Call get_database_summary for an overview
2. Call list_tasks with dueBefore set to end of today to find due tasks
3. Call get_flagged_tasks to see priorities
4. Call get_today_completed_tasks to see what's already done
5. Suggest a prioritized plan for the day based on due dates, flags, and estimated time`,
        },
      }],
    }),
  );
}
