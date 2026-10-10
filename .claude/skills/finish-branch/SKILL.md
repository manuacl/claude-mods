---
name: finish-branch
description: Audit a claude-mods branch (git state, `scripts/check.sh`, the CLAUDE.md rules on the diff) THEN push it, open the PR and label its bump. Trigger when the user says "finis la branche", "push pr", "prêt à merger ?", "ouvre la PR", "/finish-branch".
---

# Finish branch - claude-mods

Branch → open PR with its bump label, never a PR opened on red:

- **Phase A, audit**: steps 1 to 3 in order, stop at the first red one and fix it before going on.
- **Phase B, push + PR + label**: steps 4 and 5, only once phase A is green.

## Phase A - audit

### 1. Git state

```bash
git fetch origin main --quiet
[ "$(git rev-parse --abbrev-ref HEAD)" != main ] || echo "FAIL: on main, branch first"
[ -z "$(git status --short)" ] || echo "FAIL: uncommitted changes, commit them first"
[ "$(git rev-list --count HEAD..origin/main)" -eq 0 ] || echo "FAIL: behind origin/main, rebase"
gh pr list --head "$(git rev-parse --abbrev-ref HEAD)" --state all
```

- On main: `git checkout -b <name>`, the work comes along.
- Behind: `git rebase origin/main`. A `Release <tags>` commit on main only touches `plugin.json`
  versions: never resolve a conflict there by keeping the branch's version.
- A PR of this branch already **merged** (squash merges leave the branch's commits unmerged in
  git's eyes): start a new branch from `origin/main` and bring the work over, never push to the
  merged one.

### 2. The PR checks

```bash
bash scripts/check.sh
```

The same script CI runs (`.github/workflows/checks.yml`): `claude plugin validate --strict` on the
marketplace and every plugin, `claude plugin test` on every plugin with tests. CI pins its CLI
(`@anthropic-ai/claude-code@<version>` in `checks.yml`); when `claude --version` here is newer, a
green run here may still go red there, and the other way round: say which version ran.

### 3. The CLAUDE.md rules the checks do not see

Read the diff (`git diff origin/main...HEAD`) against each rule; report each as ✅, ❌ or n/a.

- **A test with every change**: a change under `plugins/<name>/hooks/` comes with a test in
  `plugins/<name>/tests/` that fails without it. No coverage tool says so: check by hand.
- **Docs follow the code**: a behaviour changed in a mod is said where it is described, the
  plugin's `README.md` (its features, and its Privacy section when the mod reads, stores or sends
  something new) and the architecture section of the root `CLAUDE.md`. A sentence that now
  describes old behaviour is ❌.
- **Both languages**: every user-facing string added or changed (band, tooltips, command
  replies) is in `TEXT.en` and `TEXT.fr`.
- **Otto stays in his file**: Otto's drawing is all rights reserved (`OTTO-LICENSE`): none of it
  in another file than `hooks/otto.mjs`.
- **KISS**: no dependency, no build step, no TypeScript to compile, no abstraction the change does
  not need.
- **Desktop constraints** the test kit accepts: every `Svg` has a non-empty `alt`; animation lives
  in SMIL inside one SVG, never in redraws; no `isInteractive` Svg; an Svg `source` under 131072
  characters.
- **Shell scripts** (`scripts/*.sh`, which run locally on macOS and in CI on Linux): they hold on
  macOS bash 3.2: no `case` inside `$(...)`, no `stat -c` alone, no `mktemp` template with a suffix, `wc -l`
  through `tr -d " "`.
- **Commits**: messages say what changed for the user, prefixed by the plugin (`otto-hud: ...`).

Then show the user the table of steps 1 to 3 and go on only if everything is ✅ or n/a.

## Phase B - push, PR, label

### 4. Push and open the PR

```bash
git push -u origin HEAD
gh pr create --base main --title "<plugin>: <what changes, under 70 characters>" --body "$(cat <<'EOF'
<Why: the problem or the need, in a sentence or two.>

- <What changes, one line per point, for the user.>

Tests: <what the new or changed tests check>. <Docs updated.>
EOF
)"
```

When the branch already has an open PR, the push updates it: do not create another.

### 5. The bump label

Hand over to `.claude/skills/bump-label/` with the PR number: it picks the level from the diff,
applies it without asking and reports the next version of each plugin changed.

## Report

The audit table, the PR link (`https://github.com/manuacl/claude-mods/pull/<n>`), the label and the
versions it will release on merge, and anything skipped (and why).
