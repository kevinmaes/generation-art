#!/usr/bin/env bash
set -euo pipefail

# Requirements:
# - GitHub CLI installed: https://cli.github.com/
# - Authenticated: gh auth login
# - Repo remote configured
#
# Usage:
#   PROJECT_OWNER="<org_or_user>" PROJECT_NUMBER=<num> bash src/scripts/create_state_issues.sh
#
# Notes:
# - PROJECT_OWNER/PROJECT_NUMBER refer to the GitHub Projects (v2) project to add issues to.
# - If you don't use Projects, you can omit those env vars; the script will just create issues.

REPO=$(git config --get remote.origin.url | sed -E 's#(git@|https://)([^/:]+)[:/](.+)\.git#\3#')
if [[ -z "${REPO}" ]]; then
  echo "Could not determine repo from git remote. Aborting." >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) not found. Please install it: https://cli.github.com/" >&2
  exit 1
fi

# Optional project configuration
PROJECT_OWNER=${PROJECT_OWNER:-}
PROJECT_NUMBER=${PROJECT_NUMBER:-}

add_to_project() {
  local issue_number=$1
  if [[ -n "${PROJECT_OWNER}" && -n "${PROJECT_NUMBER}" ]]; then
    echo "Adding #${issue_number} to project ${PROJECT_OWNER}/${PROJECT_NUMBER}"
    gh project item-add --owner "${PROJECT_OWNER}" --number "${PROJECT_NUMBER}" --url "https://github.com/${REPO}/issues/${issue_number}" >/dev/null
  fi
}

create_issue() {
  local title=$1
  local body_file=$2
  local labels=$3
  local parent_number=${4:-}

  local flags=(issue create --repo "${REPO}" --title "$title" --body-file "$body_file")
  if [[ -n "$labels" ]]; then
    IFS=',' read -ra labs <<< "$labels"
    for l in "${labs[@]}"; do flags+=(--label "$l"); done
  fi
  # Create issue
  local number
  number=$(gh "${flags[@]}" --json number --jq .number)
  echo "$number"

  # Link to parent if provided
  if [[ -n "$parent_number" ]]; then
    gh issue link "$parent_number" --repo "${REPO}" --issue "$number" --type "relates_to" >/dev/null
  fi

  # Add to project if configured
  add_to_project "$number"
}

# Create parent issue
PARENT_TITLE="Improve React state management across the app"
PARENT_BODY="issues/000-parent-improve-state-management.md"
PARENT_LABELS="enhancement,refactor,state"

PARENT_NUMBER=$(create_issue "$PARENT_TITLE" "$PARENT_BODY" "$PARENT_LABELS")
echo "Parent issue created: #${PARENT_NUMBER}"

# Child issues mapping: title -> file
declare -A CHILDREN
CHILDREN[
"Refactor useGedcomData to useReducer and status union"
]="issues/001-useGedcomData-useReducer.md"
CHILDREN[
"Introduce FamilyDataContext to share fetch result and remove duplicates"
]="issues/002-family-data-context-provider.md"
CHILDREN[
"Retire or align GedcomLoader with reducer-based loader"
]="issues/003-retire-gedcomloader-or-align.md"
CHILDREN[
"Standardize loader status via discriminated unions"
]="issues/004-standardize-status-unions.md"
CHILDREN[
"Optional: convert useCanvasExport to reducer with explicit transitions"
]="issues/005-optional-reducer-useCanvasExport.md"
CHILDREN[
"Document React state conventions for this repo"
]="issues/006-doc-state-conventions.md"

# Create children, link to parent, and collect links
CHILD_LIST_MD=""
for title in "${!CHILDREN[@]}"; do
  body_file="${CHILDREN[$title]}"
  number=$(create_issue "$title" "$body_file" "enhancement,state" "$PARENT_NUMBER")
  url="https://github.com/${REPO}/issues/${number}"
  echo "Created child: #${number} $title"
  CHILD_LIST_MD+="- [ ] ${title} (#${number})\n"
  add_to_project "$number"
done

# Update parent body to include links to children
TMP_PARENT=$(mktemp)
awk 'BEGIN{print 0} /<!-- CHILDREN:START -->/{print NR; exit}' "$PARENT_BODY" >/dev/null
START_LINE=$(awk '/<!-- CHILDREN:START -->/{print NR; exit}' "$PARENT_BODY")
END_LINE=$(awk '/<!-- CHILDREN:END -->/{print NR; exit}' "$PARENT_BODY")

if [[ -n "$START_LINE" && -n "$END_LINE" ]]; then
  head -n "$((START_LINE))" "$PARENT_BODY" > "$TMP_PARENT"
  printf "%b" "$CHILD_LIST_MD" >> "$TMP_PARENT"
  tail -n "+$((END_LINE))" "$PARENT_BODY" >> "$TMP_PARENT"
  mv "$TMP_PARENT" "$PARENT_BODY"
  # Update parent issue body remotely to include child links
  gh issue edit "$PARENT_NUMBER" --repo "$REPO" --body-file "$PARENT_BODY"
fi

echo "All done. Parent: https://github.com/${REPO}/issues/${PARENT_NUMBER}"