#!/usr/bin/env bash
#
# Self-cleaning live check for the OmniFocus CLI write/read fixes.
# Run this in YOUR OWN interactive terminal (NOT through an automation harness)
# so that osascript can talk to the OmniFocus GUI and any macOS Automation
# permission prompt can be approved.
#
# Usage:  bash scripts/live-check.sh [PROJECT_ID]
# Default PROJECT_ID is the one from the conversation.
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
    if "$OF" delete "$TASK_ID" --json >/tmp/lc_del.json 2>&1 && grep -q '"deleted": *true\|deleted":true\|"success": *true' /tmp/lc_del.json; then
      pass "deleted throwaway task"
    else
      fail "could not delete task $TASK_ID — delete it manually (it is tagged \"$MARK\")"
      cat /tmp/lc_del.json
    fi
  fi
}
trap cleanup EXIT

command -v jq >/dev/null || { echo "jq required"; exit 1; }
[[ -x "$OF" ]] || { echo "Build first: npm run build"; exit 1; }

hdr "0. Read-only: project exists (was crashing with [object Object])"
"$OF" get project "$PROJECT" --json | jq -e '.name? // .data?.name? // .id?' >/dev/null \
  && pass "get project works" || { fail "get project failed"; exit 1; }

hdr "1. Create throwaway task in project"
OUT=$("$OF" add "$MARK" --project "$PROJECT" --json)
TASK_ID=$(echo "$OUT" | jq -r '.id // .data.id // empty')
[[ -n "$TASK_ID" ]] && pass "created task $TASK_ID" || { fail "create failed: $OUT"; exit 1; }

hdr "2. Multi-flag modify: tags (replace) + due + flag + note + estimate"
"$OF" mod "$TASK_ID" --tags work,urgent --due tomorrow -f --note "live check" -e 30 --json >/dev/null
GOT=$("$OF" get task "$TASK_ID" --json)
echo "$GOT" | jq -e '[.tags[].name] as $t | ($t|contains(["work"])) and ($t|contains(["urgent"]))' >/dev/null \
  && pass "tags = work,urgent (replace worked)" || fail "tags wrong: $(echo "$GOT" | jq -c '[.tags[].name]')"
echo "$GOT" | jq -e '.flagged == true' >/dev/null && pass "flagged" || fail "not flagged"
echo "$GOT" | jq -e '.dueDate != null' >/dev/null && pass "due date set" || fail "no due date"

hdr "3. Additive tags: --add-tag waiting --remove-tag urgent"
"$OF" mod "$TASK_ID" --add-tag waiting --remove-tag urgent --json >/dev/null
GOT=$("$OF" get task "$TASK_ID" --json)
echo "$GOT" | jq -e '[.tags[].name] as $t | ($t|contains(["work"])) and ($t|contains(["waiting"])) and (($t|contains(["urgent"]))|not)' >/dev/null \
  && pass "tags = work,waiting (added/removed)" || fail "tags wrong: $(echo "$GOT" | jq -c '[.tags[].name]')"

hdr "4. Relative date + unflag"
"$OF" mod "$TASK_ID" --due-by +3d --unflag --json >/dev/null
"$OF" get task "$TASK_ID" --json | jq -e '.flagged == false' >/dev/null && pass "unflagged" || fail "still flagged"

hdr "5. Reorder within project"
"$OF" reorder "$TASK_ID" --top --json | jq -e '.id? // .name?' >/dev/null && pass "reorder --top ran" || fail "reorder failed"

hdr "Done — cleanup runs next."
