---
title: OmniFocus CLI LLM Reference
description: Token-optimized reference for LLM consumption
version: 0.1.0
updated: 2026-01-12
format: compact
---

# of CLI (OmniFocus 4 macOS)

## Global Opts
`--json` `--pretty` `-q/--quiet` `--dry-run` `-l/--limit N`

## Dates
`today` `tomorrow` `+3d` `+1w` `next week` `2026-01-15`

---

## TASK JSON SCHEMA

### Brief (default list output)
```json
{"id":"str","name":"str","dueDate":"ISO|null","flagged":bool,"completed":bool}
```

### Full (--full or get task)
```json
{
  "id":"str","name":"str","note":"str","completed":bool,"flagged":bool,
  "deferDate":"ISO|null","dueDate":"ISO|null","completionDate":"ISO|null",
  "estimatedMinutes":int|null,"inInbox":bool,"blocked":bool,
  "tags":["str"],"projectName":"str|null"
}
```

### List Response
```json
{"success":bool,"tasks":[...],"totalCount":int}
```

### Write Response
```json
{"success":bool,"message":"str","id":"str","name":"str",...}
```

### Error Response
```json
{"success":false,"error":"str"}
```

---

## PROJECT JSON SCHEMA
```json
{
  "id":"str","name":"str","note":"str","status":"active|on hold|done|dropped",
  "completed":bool,"flagged":bool,"sequential":bool,
  "deferDate":"ISO|null","dueDate":"ISO|null","completionDate":"ISO|null",
  "lastReviewDate":"ISO|null","nextReviewDate":"ISO|null",
  "taskCount":int,"availableTaskCount":int,"completedTaskCount":int,
  "folderName":"str|null","primaryTag":"str|null","singletonActionHolder":bool
}
```

---

## FOLDER JSON SCHEMA
```json
{"id":"str","name":"str","note":"str","hidden":bool,"projectCount":int,"folderCount":int,"containerName":"str|null"}
```

---

## TAG JSON SCHEMA
```json
{"id":"str","name":"str","allowsNextAction":bool,"hidden":bool,"taskCount":int,"remainingTaskCount":int,"containerName":"str|null"}
```

---

## COMMON PATTERNS

### Add task to inbox
```bash
of add "Task name"
```
→ `{"success":true,"message":"Task created successfully","id":"xxx","name":"Task name",...}`

### Add task to project with due
```bash
of add "Task" -p "Project" -d "+3d" -f
```

### List → pipe IDs
```bash
of list inbox -q | xargs of complete
of list flagged -q | xargs of unflag
```

### Search with filters
```bash
of search --project "Work" --tag "Urgent" --flagged
of search --due-before tomorrow --available
```

### Bulk add (stdin)
```bash
echo -e "Task1\nTask2" | of add -p "Project"
```

### Batch projects (stdin outline)
```bash
echo "- Project
  - Task1
  - Task2" | of add batch -f "Folder"
```

### Project lifecycle
```bash
of project hold "Name"      # pause
of project activate "Name"  # resume
of project complete "Name"  # done
of project drop "Name"      # abandon
```

### Get task details
```bash
of get task ID --json
```

---

## COMMAND REFERENCE

### list
| cmd | opts | alias |
|-----|------|-------|
| `list inbox` | `-l -a --brief --full` | `ls i` |
| `list today` | `-l --flagged --brief --full` | |
| `list flagged` | `-l -a --brief --full` | |
| `list projects` | `-f -l -a --on-hold --brief --full` | `ls p` |
| `list folders` | `-l -f -r/--root-only --hidden` | `ls f` |
| `list tags` | `-l --hidden` | `ls t` |
| `list forecast` | `-d/--days N` | |

### add
| cmd | opts | alias |
|-----|------|-------|
| `add [task] "name"` | `-p -n -d --defer -f -t --tags -e --dry-run` | `add t` |
| `add project "name"` | `-f -n -d --defer --flagged -t --tasks --sequential --parallel --single-actions --dry-run` | `add p` |
| `add batch` (stdin) | `-f -c/--create-folder --sequential --dry-run` | `add b` |
| `quick "name"` | `-d -f` | `q` |

### modify
| cmd | opts | alias |
|-----|------|-------|
| `modify <id>` | `--name -n -d --due-by --defer --defer-by -f/--flag --unflag -t -p -e --dry-run` | `mod` |
| `flag <ids...>` | | |
| `unflag <ids...>` | | |
| `reorder <id>` | `--top --bottom --before --after --dry-run` | |

### complete/drop/delete
| cmd | opts | alias |
|-----|------|-------|
| `complete <ids...>` | `--dry-run` | `done` |
| `drop <ids...>` | `--dry-run` | |
| `delete <ids...>` | `--dry-run` | `rm` |

### project
| cmd | opts | alias |
|-----|------|-------|
| `project complete <nameOrId>` | `--dry-run` | `proj done` |
| `project drop <nameOrId>` | `--dry-run` | |
| `project hold <nameOrId>` | `--dry-run` | `proj pause` |
| `project activate <nameOrId>` | `--dry-run` | `proj resume` |
| `project review <nameOrId>` | `--dry-run` | |
| `project modify <nameOrId>` | `--name -n -d --defer --clear-due --clear-defer -f --unflag --sequential --parallel -t --status --dry-run` | `proj mod` |

### folder
| cmd | opts | alias |
|-----|------|-------|
| `folder add "name"` | `-p/--parent --dry-run` | `folder create` |
| `folder modify <nameOrId>` | `--name --note --hidden --visible --dry-run` | `folder mod` |
| `move <project>` | `-f/--folder --dry-run` | |

### tag
| cmd | opts | alias |
|-----|------|-------|
| `tag add "name"` | `-p/--parent --no-next-action --dry-run` | `tag create` |
| `tag modify <nameOrId>` | `--name --hidden --visible --allows-next --no-allows-next --dry-run` | `tag mod` |
| `tag delete <nameOrId>` | `--dry-run` | `tag rm` |
| `tag tasks <nameOrId>` | `-l -a` | `tag list` |

### utility
| cmd | opts |
|-----|------|
| `get task <id>` | |
| `get project <nameOrId>` | |
| `get project-tasks <nameOrId>` | `-l -a` |
| `search [query]` | `-l -a -p -t -f --available --due-before --due-after` |
| `review` | `-l -a` |
| `sync` | |
| `qe [name]` | `-n -d --defer -f --save` |
| `perspectives` | |

---

## GOTCHAS

1. **IDs vs Names**: Most commands accept either. IDs are checked first, then names.

2. **--brief is default**: List commands use brief mode (fewer fields, 6x faster). Use `--full` for complete data.

3. **Inbox tasks**: Use `of add` without `-p` for inbox. With `-p "Project"` creates regular task.

4. **Clearing values**: Use empty string `--due ""` to clear dates/tags.

5. **Bulk via stdin**: Pipe tasks (one per line) to `of add`. Use `of add batch` for outline format.

6. **xargs patterns**: Use `-q` to get IDs, pipe to modify commands:
   ```bash
   of list inbox -q | xargs -I {} of modify {} --project "Work"
   ```

7. **Project status values**: `active`, `on-hold` (not `on hold`), `dropped`, `completed`

8. **Sequential vs Parallel**: Sequential projects show one task at a time; parallel show all available.

9. **--dry-run**: All write commands support preview without execution.

10. **OmniFocus must be running**: CLI requires OmniFocus.app to be open.

11. **Permission required**: Grant Automation permission in System Settings > Privacy > Automation.

12. **Relative date adjustments**: `--due-by "+3d"` adjusts existing date; `--due "+3d"` sets from today.

---

## EXAMPLE FLOWS

### Process inbox to project
```bash
of list inbox -q | while read id; do
  of modify "$id" -p "Processing"
done
```

### Create project with tasks
```bash
of add project "Sprint" -f "Work" --tasks "Design,Build,Test,Deploy" --sequential
```

### Weekly review
```bash
of review                           # Projects due for review
of list forecast --days 14 --json   # Upcoming 2 weeks
```

### Template expansion
```bash
CLIENT="Acme"
echo "- Client: $CLIENT
  - Initial call
  - Send proposal
  - Follow up" | of add batch -f "Clients"
```
