---
title: OmniFocus CLI-MCP LLM Reference
format: compact
---

# of CLI-MCP (OmniFocus 4 macOS)

## Global Opts
`--json` `--pretty` `-q/--quiet` `--dry-run` `-l/--limit N`

## Dates
`today` `tomorrow` `+3d` `+1w` `next week` `YYYY-MM-DD`

---

### `of summary`

### `of list inbox`
ALIAS: `ls i`
FLAGS: --limit|-l, --all|-a, --brief, --full

### `of list today`
FLAGS: --limit|-l, --flagged, --brief, --full

### `of list flagged`
FLAGS: --limit|-l, --all|-a, --brief, --full

### `of list forecast`
FLAGS: --days|-d

### `of search`
ALIAS: `s`
ARGS: query
FLAGS: --limit|-l, --all|-a, --project|-p, --tag|-t, --flagged|-f, --available, --due-before, --due-after

### `of list projects`
ALIAS: `ls p`
FLAGS: --folder|-f, --limit|-l, --all|-a, --on-hold, --brief, --full

### `of list folders`
ALIAS: `ls f`
FLAGS: --limit|-l, --folder|-f, --root-only|-r, --hidden

### `of list tags`
ALIAS: `ls t`
FLAGS: --limit|-l, --hidden

### `of tag tasks`
ALIAS: `tag list`
ARGS: name!
FLAGS: --limit|-l, --all|-a

### `of add`
ALIAS: `add t`, `add task`
ARGS: name!
FLAGS: --project|-p, --note|-n, --due|-d, --defer, --flagged|-f, --tag|-t, --tags, --estimate|-e

### `of quick`
ALIAS: `q`
ARGS: name!
FLAGS: --due|-d, --flagged|-f

### `of add batch`
ALIAS: `add b`
FLAGS: --folder|-f, --sequential

### `of modify`
ALIAS: `mod`
ARGS: id!
FLAGS: --name, --note|-n, --due|-d, --due-by, --defer, --defer-by, --flag|-f, --unflag, --tag|-t, --project|-p, --estimate|-e

### `of flag`
ARGS: ids...!

### `of unflag`
ARGS: ids...!

### `of complete`
ALIAS: `done`
ARGS: ids...!

### `of drop`
ARGS: ids...!

### `of delete`
ALIAS: `rm`
ARGS: ids...!

### `of reorder`
ARGS: taskId!
FLAGS: --top, --bottom, --before, --after

### `of add project`
ALIAS: `add p`
ARGS: name!
FLAGS: --folder|-f, --note|-n, --due|-d, --defer, --flagged, --tag|-t, --tasks, --sequential, --parallel, --single-actions

### `of project modify`
ALIAS: `proj mod`
ARGS: id!
FLAGS: --name, --note|-n, --due|-d, --defer, --clear-due, --clear-defer, --flag|-f, --unflag, --tag|-t, --status, --sequential, --parallel

### `of project complete`
ALIAS: `proj done`
ARGS: id!

### `of project drop`
ARGS: id!

### `of project hold`
ALIAS: `pause`
ARGS: idOrName!

### `of project activate`
ALIAS: `resume`
ARGS: idOrName!

### `of project review`
ARGS: id!

### `of move`
ARGS: projectId!
FLAGS: --folder|-f

### `of folder add`
ALIAS: `folder create`
ARGS: name!
FLAGS: --parent|-p

### `of folder modify`
ALIAS: `folder mod`
ARGS: id!
FLAGS: --name, --note, --hidden, --visible

### `of tag add`
ALIAS: `tag create`
ARGS: name!
FLAGS: --parent|-p, --no-next-action

### `of tag modify`
ALIAS: `tag mod`
ARGS: id!
FLAGS: --name, --hidden, --visible, --allows-next, --no-allows-next

### `of tag delete`
ALIAS: `tag rm`
ARGS: id!

### `of sync`

### `of review`
FLAGS: --limit|-l, --all|-a

### `of get task`
ALIAS: `get t`
ARGS: id!

### `of get project`
ALIAS: `get p`
ARGS: idOrName!

### `of get project-tasks`
ALIAS: `get pt`
ARGS: projectId!
FLAGS: --limit|-l, --all|-a

### `of perspectives`
ALIAS: `persp`

### `of qe`
ALIAS: `quick-entry`
ARGS: name
FLAGS: --note|-n, --due|-d, --defer, --flagged|-f, --save

