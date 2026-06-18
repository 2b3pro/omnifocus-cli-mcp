#!/usr/bin/env bash
#
# Self-cleaning live check for the OmniFocus CLI write/read fixes.
# Run in an interactive terminal so osascript can reach the OmniFocus GUI.
#
# Usage:  bash scripts/live-check.sh [PROJECT_ID]
#
set -uo pipefail

OF="./dist/bin/of.js"
PROJECT="${1:-pBIWz9As-F-}"
MARK="__LIVECHECK__ throwaway (safe to delete)"
TASK_ID=""

pass() { printf '  \033[32m✓\033[0m %s\n' "$1"; }
fail() { printf '  \033[31m✗\033[0m %s\n' "$1"; }
hdr()  { printf '\n\033[1m%s\033[0m\n' "$1"; }

cleanup() {
  if [[ -n "$TASK_ID" ]]; then
    hdr "Cleanup: deleting throwaway task $TASK_ID"
    if "$OF" delete "$TASK_ID" --json 2>/dev/null | jq -e '.success == true' >/dev/null; then
      pass "deleted throwaway task"
    else
      fail "could not delete $TASK_ID — remove it manually (named \"$MARK\")"
    fi
  fi
}
trap cleanup EXIT

command -v jq >/dev/null || { echo "jq required"; exit 1; }
[[ -x "$OF" ]] || { echo "Build first: npm run build"; exit 1; }

hdr "0. Read-only: project exists (was crashing with [object Object])"
"$OF" get project "$PROJECT" --json 2>/dev/null | jq -e '.project.name' >/dev/null \
  && pass "get project works" || { fail "get project failed"; exit 1; }

hdr "1. Create throwaway task in project"
TASK_ID=$("$OF" add "$MARK" --project "$PROJECT" --json 2>/dev/null | jq -r '.task.id')
[[ -n "$TASK_ID" && "$TASK_ID" != null ]] && pass "created $TASK_ID" || { fail "create failed"; exit 1; }

hdr "2. Multi-flag modify: tags(replace) + due + flag + note + estimate"
"$OF" mod "$TASK_ID" --tags work,urgent --due tomorrow -f --note "live check" -e 30 --json >/dev/null 2>&1
GOT=$("$OF" get task "$TASK_ID" --json 2>/dev/null)
echo "$GOT" | jq -e '.task.tags as $t | ($t|index("work")) and ($t|index("urgent"))' >/dev/null \
  && pass "tags = work,urgent (replace)" || fail "tags: $(echo "$GOT" | jq -c '.task.tags')"
echo "$GOT" | jq -e '.task.flagged == true' >/dev/null && pass "flagged" || fail "not flagged"
echo "$GOT" | jq -e '.task.dueDate != null'  >/dev/null && pass "due set" || fail "no due"
echo "$GOT" | jq -e '.task.estimatedMinutes == 30' >/dev/null && pass "estimate 30" || fail "estimate wrong"

hdr "3. Additive tags: --add-tag waiting --remove-tag urgent"
"$OF" mod "$TASK_ID" --add-tag waiting --remove-tag urgent --json >/dev/null 2>&1
"$OF" get task "$TASK_ID" --json 2>/dev/null | jq -e '.task.tags as $t | ($t|index("work")) and ($t|index("waiting")) and (($t|index("urgent"))|not)' >/dev/null \
  && pass "tags = work,waiting" || fail "additive tags wrong"

hdr "4. Relative --due-by +3d + --unflag"
"$OF" mod "$TASK_ID" --due-by +3d --unflag --json >/dev/null 2>&1
"$OF" get task "$TASK_ID" --json 2>/dev/null | jq -e '.task.flagged == false' >/dev/null && pass "unflagged" || fail "still flagged"

hdr "5. Reorder within project"
"$OF" reorder "$TASK_ID" --top --json 2>/dev/null | jq -e '.task.id // .task.name' >/dev/null && pass "reorder --top" || fail "reorder failed"

hdr "6. Search filter finds the task by tag"
"$OF" search --tag waiting --json 2>/dev/null | jq -e --arg id "$TASK_ID" '.tasks | map(.id) | index($id)' >/dev/null \
  && pass "search --tag waiting finds it" || fail "search filter miss"

hdr "Done — cleanup runs next."
