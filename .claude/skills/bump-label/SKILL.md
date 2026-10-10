---
name: bump-label
description: Pick the SemVer bump level (major, minor, patch, or none when nothing reaches a user) of a claude-mods PR from its diff and apply the matching `bump:<level>` label. The skill decides; no confirmation prompt. Trigger when the user asks to "label the PR for release", "tag the PR with a bump level", or from `finish-branch`.
---

# Bump label - claude-mods

A `bump:<level>` label on a PR is the release: on merge, `.github/workflows/version.yml` bumps the
`version` in the `plugin.json` of every plugin the PR changed (`scripts/bump-version.mjs`), commits
`Release <tags>` and pushes one `{name}--v{version}` tag per plugin. That version is what installs and
`claude plugin update` compare. **No label, no bump**: the PR merges and nobody sees it in an update.

## Convention

- `bump:major` (red, `D93F0B`): a user has to change something: an option, a command or a block
  removed or renamed, a behaviour they relied on gone.
- `bump:minor` (yellow, `FBCA04`): something new a user can see or use (a block, a mood, an option,
  a command, a language).
- `bump:patch` (green, `0E8A16`): a fix, a tweak of something that exists, a wording, a drawing touched up.
- No label: nothing that ships changed.

## Inputs

Derive them when the caller does not pass them:

```bash
pr_number=$(gh pr view --json number --jq .number)
changed_files=$(git diff --name-only origin/main...HEAD)
git log --format='%B' origin/main..HEAD
```

## Procedure

### 1. Pick the level

First match wins:

| Signal | Level |
|---|---|
| No changed path under `plugins/<name>/` outside `tests/` (root `CLAUDE.md`, `README.md`, `.github/`, `scripts/`, `.claude/`, tests only) | none |
| The diff removes or renames a setting (`userConfig` in `plugin.json`), a command (`$.command.register`), or something a user relied on | major |
| The diff adds something a user sees or uses | minor |
| Anything else that ships | patch |

The commits here have no `feat:` / `fix:` prefixes (`otto-hud: ...`): read the diff and the
commit messages, not their prefixes. A plugin's `README.md` ships (it is the plugin's page), so a
README-only change of a plugin is a `patch`. `.claude-plugin/marketplace.json` alone is none: it
carries no version, and `version.yml` bumps only plugins.

### 2. Apply it, no prompt

The user opted into the pick by invoking this skill (or `finish-branch`): do not ask. They swap it
after the fact with `gh pr edit <n> --remove-label bump:X --add-label bump:Y`.

```bash
chosen=patch   # none | major | minor | patch, from step 1

# A PR has at most one bump label: strip any other, and for none that is the whole job.
for l in $(gh pr view "$pr_number" --json labels --jq '.labels[].name' | grep '^bump:' || true); do
  [ "$l" = "bump:$chosen" ] || gh pr edit "$pr_number" --remove-label "$l"
done
[ "$chosen" = none ] || gh pr edit "$pr_number" --add-label "bump:$chosen"
```

The three labels exist on the repo already.

## Report

One line per plugin the PR changed, its next version read from its `plugin.json`:

- `PR #3 tagged bump:patch (otto-hud 0.4.2 → 0.4.3 on merge)`
- `PR #4: no bump, nothing that ships changed`

```bash
node -p "require('./plugins/otto-hud/.claude-plugin/plugin.json').version"
```
