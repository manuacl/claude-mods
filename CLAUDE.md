# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal marketplace of Claude Code mods (plugins of function hooks), `.claude-plugin/marketplace.json` at the root, one folder per mod under `plugins/`. One mod for now: `plugins/otto-hud`, a band above the prompt (context weather, limits, Otto the animated octopus). Apache-2.0, except Otto (`plugins/otto-hud/OTTO-LICENSE`, all rights reserved); otto-hud is a fork of Anthropic's Token Weather, see `NOTICE`.

## KISS

KISS and SOLID below hold for every mod under `plugins/`; their examples come from otto-hud.

Keep it simple: the simplest thing that works, nothing speculative.

- No build step, no dependencies, no TypeScript compilation: plain ES modules the engine loads as they are.
- One module per mod until a second mod needs to share code; data (like `sprites.mjs`, `weather.mjs`) may live apart.
- Tables over classes (`TEXT`, `FORECAST`, `DEMO`), module variables over `$.state` unless a value must survive a hot reload.
- Workarounds for the desktop's behaviour (SMIL resume, hover cards) stay as small as possible, and go first if the desktop changes.

## SOLID, the light way

SOLID's intent, without its ceremony: no classes, interfaces or injection layers that KISS would refuse. When a change has to touch several places at once, that is the sign a little more of it is due.

- **Single responsibility**: one function per block (`weatherBlock`, `turnsBlock`, `gaugeBlock`), one per drawing (`gaugeSvg`, `turnsSvg`, `barSvg`), one for the layout (`drawLine`). Computing a value, wording it and drawing it stay apart (`gaugeOf` computes, `gaugeBlock` words it through `TEXT`, `gaugeSvg` draws).
- **Open/closed**: extend through tables (`TEXT`, `FORECAST`, `LIMIT_SPAN`, `DEMO`) and the block contract `{ key, tip, rank, cells, parts, grow?, gap? }`: a new block or language never edits `drawLine`.
- **Liskov**: every block honours that contract, so the line places, drops, flexes and tooltips them all the same way; no special case for one block in the layout.
- **Interface segregation**: a helper takes only what it uses (`{ Svg, Text }`, a gauge's values), not `$` or the whole element table.
- **Dependency inversion**: the mod depends only on the engine's `$` and element table, which the tests stub with `world()`; no global or engine detail is reached around them.

## Commands

Run from `plugins/otto-hud` (or pass the folder):

- `claude plugin test .` runs every `tests/*.test.ts` against the real engine (well under a second). There is no per-test filter: run the whole file.
- `claude plugin validate .` reads the module the way the engine will. Run it after every change to `hooks/`: it rejects things the tests accept (see "Rules the validator enforces").

No build, no package manager: the modules are plain ES modules loaded as they are.

## Checks and releases

- `bash scripts/check.sh` runs what a PR is checked on (`.github/workflows/checks.yml`): `claude plugin validate --strict` on the marketplace and every plugin, and `claude plugin test` on every plugin with tests. No credentials needed. CI pins the CLI version; raise it on purpose.
- A release is a PR label: `bump:patch`, `bump:minor` or `bump:major`. On merge, `.github/workflows/version.yml` bumps every plugin the PR changed (`scripts/bump-version.mjs`, the `version` in its `plugin.json`), commits `Release <tags>` and pushes one `{name}--v{version}` tag per plugin, the format of `claude plugin tag`. No label, no bump.
- There is no deploy step: the marketplace is the repo, and the `version` in `plugin.json` is what installs and `claude plugin update` compare. Changes merged without a bump stay invisible to `claude plugin update` ("already at the latest version").
- The version lives in `plugin.json` only; the marketplace entry has none, so the two cannot disagree.

## Developing in the desktop app

`~/.claude/settings.json` loads otto-hud straight from this repo, with hot reload:

```json
"env": {
  "CLAUDE_CODE_PLUGIN_DIRS": "/Users/manuel/Projects/claude-mods/plugins/otto-hud",
  "CLAUDE_CODE_PLUGIN_DIR_WATCH": "1"
}
```

so do not also install it from the marketplace (`otto-hud@claude-mods`): two copies would draw two bands. Saving a file reloads the mod in the running sessions.

- Env changes only take effect after quitting the desktop app (Cmd+Q) and reopening it. `/reload-plugins` does not unload a version already loaded, even a disabled one, and does not switch versions.
- Without `CLAUDE_CODE_PLUGIN_DIR_WATCH`, desktop sessions (SDK processes) do not watch plugin files at all, and the `dev-mods` hot-reload folder does not reload on edits either.
- A symlinked plugin cache folder seemed to stop the desktop from loading the plugin: use real copies.
- Claude cannot see the desktop app (no screen capture, no computer use on it): ask the user what the band shows, or render SVGs into a page in the built-in browser to check them.

## otto-hud architecture

`hooks/otto-hud.mjs` is the whole mod; `hooks/otto.mjs` (Otto's drawings) and `hooks/weather.mjs` (weather icons) are data.

- **Readings**: `session.start` and `turn.complete` read `$.session.usage({ breakdown: "summary" })` into module state (readings history, breakdown, rate limits). The readings also go to `$.state` (contract in `types/index.d.ts`), so a reload of the mod keeps the history: `session.start` restores them, and its reading replaces the last one instead of counting as a turn. `$.state` lives as long as the session's process, though: a new process (an app relaunch, a resume, a rewind) starts the history empty, so the histogram shows its placeholder until the next turn adds a second reading. Deliberately so: after a rewind the readings past its point describe messages that are gone. `session.compact` takes a reading too, since a compaction is no turn but moves the context. Between readings, `session.measure` (after each response, its figures in the event: no call, no token) sets `live`, the context now, which `current()` lays over the last reading for the forecast and its percent; it is no reading, so the prompts' bars move only at a turn's end. The limits come from the session's own readings and `session.measure`, never shared through `$.store`: two sessions may run on two accounts (another `CLAUDE_CONFIG_DIR` sharing the `plugins` folder, hence its store), and the status line does the same. A minute ticker redraws, as the time gone moves on.
- **The band**: a `ui.render` hook on `AbovePrompt` builds the line from blocks (`weatherBlock`, `turnsBlock`, `gaugeBlock`). Each returns `{ key, tip, rank, cells, parts, grow? }`, wrapped in one hover zone with its tooltip; when the band is narrow the lowest rank goes first (the forecast stays). The layout is flex: Otto and the blocks keep their size (`flexShrink: 0`), the gauges (`grow`) share the room left, their bar a `flexGrow` Box around an Svg with no width (`width="100%"` inside, no viewBox), their label and value in `flexShrink: 0` Boxes so they neither wrap nor overlap. A tooltip line is a string or `{ text, color, mark? }`, drawn with a legend before it (`legendSvg`: a square of the color, or with `mark` the gauges' time mark, all one `LEGEND` box so the texts line up); the gauges' share used, time elapsed and pace lines have them, `TEXT` naming only which (`mark`), `gaugeBlock` picking the colors. `cells` only decides what is dropped. That is the drawing, where the surface has `Svg` and is not `terminal`. The terminal (the render hook drops `Svg` from its table) gets the same blocks in text, no Otto, no cards (a one-row band would cut them): a glyph per forecast (`GLYPHS`), eighths of a cell for the bars (`turnsText`, `gaugeText`, Texts merged by `textRuns`), the gauges at least `TEXT_GAUGE` cells: text cannot flex, so a block's `grow` is there a function of its bar's cells, and `drawLine` shares the band's spare cells (`bodyColumns`, drawn again at each width) among them; so in text a block's `cells` is its exact width (the turns' change counted at its own length, not `SPARK.trend`).
- **Otto's moods**: `turn.start` (thinking), `tool.call` on the main loop (working, with the tool name; error when the result `isError`), `turn.complete` (done, failed or idle). At rest while a limit is reached (`reachedLimit`), Otto sleeps (`asleep`) until the last one reached resets: `limitChanged`, from `session.measure` and the minute ticker, puts him to sleep or wakes him. `moodOf` picks the drawing and its tooltip; a reaction has a `then` mood that `setMood` schedules with `$.clock.after`. A mood in `HOLD_MS` (the detective, until the magnifier is at her eye and a second more) is not cut short: `setMood` defers Claude's next move to its end, unless the mood is asked for by `/otto-hud`.
- **Otto**: `hooks/otto.mjs` builds each mood as one SVG string (`MOODS`), a blue octopus in vectors animated with SMIL, and `PLAY_MS` says how long a mood plays before a reaction moves on. Every mood starts from the rest pose (idle at its start) and gets into its own within `T0`: faces cross-fade, arms rise from the hanging tentacle, props pop in; what plays once then hands over to loops, except the rest moods in `ONCE` (wave, shout, tap), which play once and come back to the rest pose within their duration, `PLAY_MS` taken from it. Arms mask their outline around their root, so they join the body without a border. His colors are all in `C` (body, outline, eyes, pupils, cheeks, shines, suckers); `OTTO_COLOR`, his body's, is exported for the band (the gauges' time mark), so recoloring him is one table.
- **`/otto-hud demo`** plays every mood in turn, `/otto-hud <animation>` one of them (`DEMO` table). The command is registered in `session.start`.
- **Languages**: `TEXT.en` / `TEXT.fr`, chosen by the `language` option, else Claude Code's `language` setting (`$.config.list()`), else English. No locale variables (the desktop app passes none, and reading them holds a directory submission), and the mod cannot read the app's own interface language. Every user-facing string, tooltips and command replies included, lives there in both languages.

## Desktop rendering constraints

Learned the hard way; they shape the code:

- The desktop rebuilds the whole band (every `<img>` / `<iframe>`) on every redraw, and redraws happen often (each tool call, each mood change, the minute ticker). So:
  - An animation must live inside one SVG (SMIL `<animate>`), never in redraws at a frame rate.
  - A redraw restarts SMIL: `ottoSvg` shifts every `begin` by the time elapsed since the mood began, so the animation carries on.
  - No `isInteractive` Svg: those are sandboxed iframes that flash as they reload. Tooltips are hover cards instead (`withTip`: a `display: "none"` Box shown with `hover: { display: "flex" }` inside the block's keyed Box, so hovering anywhere over the block shows it; the card itself must not be keyed).
  - The desktop lifts such a card (no hover `scope`) into a popover anchored to the nearest keyed Box, which is also its hover zone: at that Box's left edge, above it (below if no room), pulled left only to stay within the window. It drops the card's `position`, offsets, `width`, margins, padding, border and background and paints its own chrome, so a mod cannot anchor a card elsewhere (`right`, a negative `left` or a frame all fail); a frame inside the card draws a second background.
  - The desktop drops an `Svg` whose `alt` is empty, silently, though the test kit takes it: give every Svg an alt of one character at least (the tooltips' legends have their shape's glyph).
- An Svg `source` is at most 131072 characters; the busiest mood is about 25k.
- Box offsets and margins are whole cells: Otto is not lifted (his picture holds his head room); finer moves have to happen in the SVG itself.
- A desktop column is 8 CSS px: `cells = Math.ceil(px / 8)` when sizing blocks.
- An Svg without `width` takes its markup's own width, up to its slot: a `width="100%"` SVG inside a flex Box fills it. Text has no `flexShrink`; wrap it in a `flexShrink: 0` Box to keep it whole.
- The weather icons' loops must all divide the period `weatherSvg` aligns them on (18 s, the sun's spin), or a redraw makes them jump.

## Rules the validator enforces

- The host reads `on("<event>", …)` and `$.noun.method(…)` from source: spell them literally, keep helpers that take `$` top-level, and never pass `$` in a call with a spread argument (`setMood($, ...args)` fails validation).
- A hook that throws is skipped whole: in `session.start`, a failing call after `setMood` leaves the rest undone silently.

## Tests

`tests/otto-hud.test.ts` uses `claude-code/testing`: `world()` stubs what the engine would answer (clock, store, env, `ui.invalidate`, `command.register`), and tests mount the band with `$.ui.mount({ surface: "desktop", component: "AbovePrompt" })` and read Text contents and Svg `alt`s (the tooltip texts). In the kit:

- `$.ui.resolve(e)` has `Svg` even on `terminal`, hence the explicit surface check in the render hook.
- Events the mod hooks need a stub beneath it before a test raises them: `turn.start` (`{ turnId }`), `tool.call` (`{ result, isError }`), `turn.complete` (and its input needs `answer`), `command.register`.
- `mock.clock` drives `$.clock.every` / `after`: advance it to play reactions out.
- `Math` is frozen and the kit mocks no randomness, so a test cannot choose which thinking animation plays: `think()` starts a turn and waits out `HOLD_MS` before the next move; force one mood with `$.command.run({ command: "otto-hud", args })`.

## Attribution

Otto in `hooks/otto.mjs` is our own drawing, all rights reserved (`OTTO-LICENSE`, `LicenseRef-Otto`): not Apache like the rest, so keep him in that file and out of other code; the weather icons in `hooks/weather.mjs` are Meteocons (Bas Milius, MIT, monochrome style, recolored by `weatherSvg`). README and `NOTICE` say so.
