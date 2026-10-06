// Copyright 2026 Anthropic PBC (Token Weather), changes by Manuel
// SPDX-License-Identifier: Apache-2.0
//
// Otto HUD: Otto, a blue octopus, forecasts your context window, above the prompt.
//
//   [Otto] ☂ 60% ━━━━╎━╎━   5h ━━━▒▒╎─ 32%   7d ━━━━━╎▒ 59%
//
// Icons and bars, their details in a card on hover, drawn with Svg (the desktop app, the editor, mobile). The
// terminal gets the same line in text, glyphs and block bars, without Otto or cards:
//
//   ☂ 60% ▂▃▅█ +6.3k   5h ███▎██████ 32%   7d █████▊████ 59%  (used, faded on to the pace's end, the track)
//
// The weather after Anthropic's Token Weather. What is new: Otto, the forecast scaled to
// auto-compact, what the context is made of, and the account limits.
//
// session.start / turn.complete: read $.session.usage() (context, breakdown "summary" = local
// estimates, rate limits). session.measure: a fresher reading of the limits. turn.start, tool.call,
// turn.complete: Otto's mood. ui.render (AbovePrompt): the line, built from blocks; the least
// important ones go first when the band is narrow.
//
// The host reads on(...) and $.noun.method(...) from source, so they are spelled literally, and
// helpers that take $ are top-level functions.

import { HOLD_MS, OTTO, OTTO_COLOR, PLAY_MS, ottoSvg } from "./otto.mjs";
import { WEATHER } from "./weather.mjs";

// ---------- Texts ----------

const TEXT = {
  en: {
    sky: { clear: "Clear", cloudy: "Cloudy", showers: "Showers", storm: "Storm", compact: "Compact soon" },
    // Each limit: its label on the line, its name in the tooltip.
    limits: { five_hour: ["5h", "5-hour limit"], seven_day: ["7d", "7-day limit"], spend_limit: ["$", "Spend limit"] },
    days: "d",
    weekday: (ms) => new Date(ms).toLocaleDateString("en", { weekday: "short" }),
    pct: (n) => n + "%",
    categories: {},
    demo: {
      description: "Otto HUD: /otto-hud demo plays every Otto animation in the band, /otto-hud <animation> one of them",
      usage: (names) => `Usage: /otto-hud demo, or /otto-hud <animation>: ${names}`,
      one: (name) => `Otto plays ${name} above the prompt.`,
      started: "Otto plays all his animations above the prompt (about 75 s). Hover him to read each one's tooltip.",
    },
    moods: {
      idle: "Otto is resting",
      dizzy: "Otto is dizzy: compaction is near",
      thinking: "Claude is thinking",
      working: (tool) => `Claude is using ${tool}`,
      agents: (n) => (n === 1 ? "A subagent is working" : `${n} subagents are working`),
      error: (tool) => `${tool} failed`,
      done: "Turn done",
      failed: "The turn stopped on an error",
    },
    // A title, then one line per fact.
    tips: {
      weather: (word, used, toCompact, at, tokens, window) =>
        `${word}\n${used}% of the context used` + (at ? `\n${toCompact}% of the way to auto-compact (at ${at})` : "") + `\n${tokens} of ${window} tokens used`,
      unmeasured: "Not measured yet",
      turns: (list) => `Tokens added by each recent prompt\n${list || "None measured yet"}`,
      stack: (clear) => (clear ? "What you see in the sky" : "What covers the sky"),
      // The lines a part of the gauge stands for say which (mark), for their legend.
      gauge: (name, used, elapsed, pace, left, at) => [
        name,
        { mark: "used", text: `${used} used` },
        elapsed !== null && { mark: "elapsed", text: `${elapsed}% of the time elapsed` },
        pace && { mark: "pace", text: pace.hit ? `100% in ${pace.hit} at this pace` : `${pace.end} by the reset at this pace` },
        left && `Resets in ${left} at ${at}`,
      ].filter(Boolean),
    },
  },
  fr: {
    sky: { clear: "Clair", cloudy: "Nuageux", showers: "Averses", storm: "Orage", compact: "Compacter bientôt" },
    limits: { five_hour: ["5h", "Limite 5 heures"], seven_day: ["7j", "Limite 7 jours"], spend_limit: ["$", "Limite de dépense"] },
    days: "j",
    weekday: (ms) => new Date(ms).toLocaleDateString("fr", { weekday: "short" }),
    pct: (n) => n + "%",
    categories: {
      "system prompt": "prompt système",
      "system tools": "outils système",
      "mcp tools": "outils MCP",
      "memory files": "mémoire",
      "custom agents": "agents",
    },
    demo: {
      description: "Otto HUD : /otto-hud demo joue toutes les animations d'Otto dans la barre, /otto-hud <animation> l'une d'elles",
      usage: (names) => `Usage : /otto-hud demo, ou /otto-hud <animation> : ${names}`,
      one: (name) => `Otto joue ${name} au-dessus du prompt.`,
      started: "Otto joue toutes ses animations au-dessus du prompt (environ 75 s). Survolez-le pour lire la bulle de chacune.",
    },
    moods: {
      idle: "Otto se repose",
      dizzy: "Otto a le tournis : le compactage approche",
      thinking: "Claude réfléchit",
      working: (tool) => `Claude utilise ${tool}`,
      agents: (n) => (n === 1 ? "Un sous-agent travaille" : `${n} sous-agents travaillent`),
      error: (tool) => `${tool} a échoué`,
      done: "Tour terminé",
      failed: "Le tour s'est arrêté sur une erreur",
    },
    tips: {
      weather: (word, used, toCompact, at, tokens, window) =>
        `${word}\n${used}% du contexte utilisé` + (at ? `\n${toCompact}% du chemin vers l'auto-compact (à ${at})` : "") + `\n${tokens} sur ${window} tokens utilisés`,
      unmeasured: "Pas encore mesurée",
      turns: (list) => `Tokens ajoutés par chaque prompt récent\n${list || "Aucun mesuré pour l'instant"}`,
      stack: (clear) => (clear ? "Ce qu'on voit dans le ciel" : "Ce qui couvre le ciel"),
      gauge: (name, used, elapsed, pace, left, at) => [
        name,
        { mark: "used", text: `${used} utilisés` },
        elapsed !== null && { mark: "elapsed", text: `${elapsed}% du temps écoulé` },
        pace && { mark: "pace", text: pace.hit ? `100% dans ${pace.hit} à ce rythme` : `${pace.end} à la remise à zéro à ce rythme` },
        left && `Remise à zéro dans ${left} à ${at}`,
      ].filter(Boolean),
    },
  },
};
let T = TEXT.en;

// ---------- Forecast ----------

// The tokens of the last `bars` prompts, so one reading more; a second one also tells that a turn has been measured.
// Always the room of every bar and of the longest change (+99.9k), so the gauges after them never move.
const SPARK = { bars: 8, height: 14, bar: 5.5, gap: 2, trend: 6 };
const SPARK_WIDTH = SPARK.bars * SPARK.bar + (SPARK.bars - 1) * SPARK.gap;
const HISTORY = SPARK.bars + 1;

// By percent of the way to auto-compact (of the window when auto-compact is off).
const FORECAST = [
  { upTo: 25, id: "clear" },
  { upTo: 50, id: "cloudy" },
  { upTo: 75, id: "showers" },
  { upTo: 90, id: "storm" },
  { upTo: Infinity, id: "compact" },
];

// ---------- Account limits (5 hours, 7 days) ----------

const H = 3_600_000;
// Each limit's window, for the share of time gone (a spend cap has none), and its place on the line.
const LIMIT_SPAN = { five_hour: 5 * H, seven_day: 168 * H };
const LIMIT_PLACE = { five_hour: 0, seven_day: 1, spend_limit: 2 };
// The pace: the share used by the reset if usage goes on as it went. Over 100: amber; over
// `alert`, or past `used` percent already: red. Before `settle` percent of the window has gone,
// too little time to tell a pace.
const PACE = { settle: 10, alert: 130, used: 90 };
// The latest limits any session measured, shared through $.store.
const LIMITS_KEY = "rateLimits";
const TONES = { calm: "#3fa66b", fast: "#d9962b", alert: "#d64545" };
// The share projected, faded: its tone at this opacity (an alpha in hex).
const FADED = "59";
const grey = (alpha) => `rgba(128,128,128,${alpha})`;
// A gauge: its bar, and how far the mark where the time stands goes past it above and below (px).
const GAUGE = { width: 72, height: 9, overhang: 3 };

// ---------- Drawings ----------

// The weather icon is bigger: an animated drawing reads better with room.
const WEATHER_SIZE = 22;
// Tooltip cards: theme keys, not raw colors, so they follow the light or dark theme.
const TIP = { back: "userMessageBackground", text: "text" };
// On the terminal: a glyph per forecast, Token Weather's own single-width symbols, in its tint; eighths of a cell, from the bottom for the prompts' bars and
// from the left for the limits'; a limit's bar at the least, in cells, and its track's color (a grey that shows on
// dark and light themes alike).
const GLYPHS = { clear: "☀", cloudy: "☁", showers: "☂", storm: "☇", compact: "↯" };
const EIGHTHS = "▁▂▃▄▅▆▇█", LEFT_EIGHTHS = " ▏▎▍▌▋▊▉█";
const TEXT_GAUGE = 10, TEXT_TRACK = "#5f6368";
const WEATHER_COLORS = { clear: "#e0b000", cloudy: "#8ea3b8", showers: "#2f68c0", storm: "#b04fc0", compact: "#d64545" };

// Otto, drawn whole in each mood's SVG (otto.mjs).
const OTTO_CELLS = Math.ceil(OTTO.width / 8);
// At rest between two quiet animations.
const PLAY_EVERY = 45_000;
const pick = (list) => list[Math.floor(Math.random() * list.length)];

// ---------- State ----------

// Readings: { tokens, window, percent, threshold }, oldest first; kept by the host for the session,
// so a reload of the mod (an edit, an update) goes on with the same history.
let readings = [];
const READINGS = { plugin: "otto-hud", key: "readings" };
// The latest breakdown: { categories } or null.
let breakdown = null;
// The account's limits as last measured: { at (ms), list: SessionRateLimit[] }.
let account = { at: 0, list: [] };
let minuteTimer = null;
// What Otto is doing: { name, look (the drawing), tip, at, then, ms }; see moodOf.
let mood = null;
// The subagents at work, by agentId: from their first tool call to the end of their turn. While
// any is, Otto at rest waits on them, without the pause of a true rest (the main turn may be over,
// waiting on background agents).
const agents = new Set();
let moodTimer = null;

export function register(on, options) {
  on("session.start", async ($, e, next) => {
    const started = await next(e);
    T = TEXT[await languageOf($, options?.language)];
    [breakdown, account] = [null, { at: 0, list: [] }];
    readings = (await $.state.get(READINGS)).value ?? [];
    agents.clear();
    await syncLimits($);
    // A reload's reading stands for the last one, not for another turn.
    await takeReading($, false);
    await setMood($, "idle");
    await $.command.register({ name: "otto-hud", description: T.demo.description, argumentHint: "demo | thinking | laptop | … | dizzy" });
    // Once a minute the time gone moves on, and another session may have measured the limits since.
    minuteTimer?.cancel();
    minuteTimer = $.clock.every(60_000, async () => {
      await syncLimits($);
      $.ui.invalidate("ui.render");
    });
    return started;
  });

  // /otto-hud demo plays them all, /otto-hud <animation> just one.
  on("command.run", { command: "otto-hud" }, async ($, e) => {
    const arg = e.args.trim().toLowerCase();
    if (arg === "demo") {
      await demo($, 0, DEMO.length);
      return { text: T.demo.started };
    }
    const i = DEMO.findIndex(([, , look]) => look === arg);
    if (i < 0) return { text: T.demo.usage(DEMO.map(([, , look]) => look).join(", ")) };
    await demo($, i, i + 1);
    return { text: T.demo.one(DEMO[i][2]) };
  });

  on("turn.start", async ($, e, next) => {
    demoTimer?.cancel();
    await setMood($, "thinking");
    return next(e);
  });

  // The main loop's tools: Otto at his computer, and a reaction when one fails.
  on("tool.call", async ($, e, next) => {
    if (e.agentId) {
      if (!agents.has(e.agentId)) await agentsChanged($, () => agents.add(e.agentId));
      return next(e);
    }
    const tool = String(e.tool).replace(/^mcp__.+?__/, "");
    if (mood?.name === "working") {
      mood.tip = T.moods.working(tool);
      $.ui.invalidate("ui.render");
    } else await setMood($, "working", tool);
    const result = await next(e);
    if (result?.isError) await setMood($, "error", tool);
    return result;
  });

  on("turn.complete", async ($, e, next) => {
    const done = await next(e);
    if (e.agentId) await agentsChanged($, () => agents.delete(e.agentId));
    else {
      await takeReading($);
      await setMood($, { answer: "done", aborted: "idle" }[e.reason] ?? "failed");
    }
    return done;
  });

  // A compaction of the main conversation is no turn, but it moves the context: read it again.
  on("session.compact", async ($, e, next) => {
    const done = await next(e);
    if (!e.agentId && e.trigger !== "precompute" && done?.messages) await takeReading($);
    return done;
  });

  on("session.measure", async ($, e, next) => {
    if (e.changed.includes("rateLimits") && e.rateLimits.length) await syncLimits($, e.rateLimits);
    $.ui.invalidate("ui.render");
    return next(e);
  });

  on("ui.render", { component: "AbovePrompt" }, async ($, e, next) => {
    // The terminal draws the line in text: no Svg there (the test kit's table has one, hence the surface).
    const resolved = $.ui.resolve(e);
    const el = e.surface === "terminal" ? { ...resolved, Svg: undefined } : resolved;
    const idle = readings.length === 0 && account.list.length === 0;
    if (e.props.hasSurvey || idle) return next(e);
    const line = drawLine(el, e.props.bodyColumns ?? 80, await $.clock.now());
    // The mods after us go under our line, without a blank row when they draw nothing.
    const under = await next(e);
    return isEmpty(under) ? line : el.Box({ flexDirection: "column", children: [line, under] });
  });
}

// The language option when it is "en" or "fr". Otherwise Claude Code's language setting ("french",
// "français"…): French when it says so, else English. No locale variables: the desktop app passes none.
async function languageOf($, option) {
  if (option in TEXT) return option;
  const setting = await $.config.list().then((rows) => rows.find((row) => row.key === "language")?.value, () => "");
  return String(setting ?? "").toLowerCase().startsWith("fr") ? "fr" : "en";
}

// ---------- Readings ----------

async function takeReading($, isTurn = true) {
  try {
    const usage = await $.session.usage({ breakdown: "summary" });
    const context = usage.context;
    if (context && context.window) {
      const tokens = context.tokens ?? 0;
      const percent = Math.round(context.percent ?? (tokens / context.window) * 100);
      const threshold = context.breakdown?.autoCompactThreshold ?? 0;
      // The session.start reading is 0 before any response; drop it once real readings arrive.
      const kept = isTurn ? readings : readings.slice(0, -1);
      readings = [...kept.filter((r) => r.tokens > 0), { tokens, window: context.window, percent, threshold }].slice(-HISTORY);
      await $.state.set(READINGS, readings);
      breakdown = context.breakdown ? { categories: context.breakdown.categories ?? [] } : null;
    }
    // On start the local reading may be stale (an idle session): the shared one wins, and the local
    // one is published only when none exists yet. After a turn the local one is the freshest.
    const list = usage.rateLimits ?? [];
    if (list.length > 0 && (account.list.length === 0 || readings.length > 1)) await syncLimits($, list);
  } catch {
    // No reading this turn; the line keeps the last one.
  }
  $.ui.invalidate("ui.render");
}

// Share of the way to auto-compact, or of the window when auto-compact is off.
function weatherPercent(r) {
  return r.threshold > 0 ? Math.round((r.tokens / r.threshold) * 100) : r.percent;
}

// What each recent prompt added, oldest first, and the forecast it left; a compaction (the context
// shrinks) adds 0.
function turnDeltas() {
  return readings.slice(1).map((r, i) => ({ added: Math.max(0, r.tokens - readings[i].tokens), id: forecastFor(weatherPercent(r)).id }));
}

// How the context moved on the last turn: +6.3k, −40k (a compaction), or =.
function lastTurn() {
  const change = readings.at(-1).tokens - readings.at(-2).tokens;
  return change === 0 ? "=" : (change > 0 ? "+" : "−") + short(Math.abs(change));
}

function forecastFor(percent) {
  return FORECAST.find((band) => percent < band.upTo) ?? FORECAST[FORECAST.length - 1];
}

// The forecast for the latest reading, or null before any.
function forecastNow() {
  const cur = readings.at(-1);
  return cur ? forecastFor(weatherPercent(cur)) : null;
}

// ---------- Limits ----------

// The limits are the account's, so the freshest reading of any session wins. With `fresh` (this
// session just measured them): keep them, and store them unless the store holds a later one.
// Without: take the stored ones when they are later than ours. An unreadable store changes nothing.
async function syncLimits($, fresh) {
  const stored = await $.store.get(LIMITS_KEY).catch(() => null);
  if (fresh) {
    account = { at: await $.clock.now(), list: fresh };
    if (!(stored?.at > account.at)) await $.store.set(LIMITS_KEY, account);
  } else if (stored?.at > account.at && Array.isArray(stored.list)) account = stored;
}

// The limits as they stand now. A window past its reset is empty until it is used again, and a
// subscription always has both windows: one the reading leaves out is empty too. Empty is 0%,
// with no time to tell until the window starts again.
function currentLimits(list, now) {
  const empty = (kind) => ({ kind, percentUsed: 0 });
  const limits = list.map((limit) => (Date.parse(limit.resetsAt ?? "") <= now ? empty(limit.kind) : limit));
  // Before any reading of them (a session's start), the 5-hour and 7-day gauges hold their place, empty and unknown.
  const known = limits.some((limit) => limit.kind in LIMIT_SPAN);
  for (const kind of Object.keys(LIMIT_SPAN)) if (!limits.some((limit) => limit.kind === kind)) limits.push(known ? empty(kind) : { ...empty(kind), unknown: true });
  return limits;
}

// One limit's numbers: share used, share of the window's time gone and share projected by the reset
// (null without a window), tone, ms left before the reset (null once past) and before the limit
// runs out at this pace (null if it does not).
function gaugeOf(limit, now) {
  const used = Math.max(0, limit.percentUsed);
  const reset = Date.parse(limit.resetsAt ?? "");
  const left = reset > now ? reset - now : null;
  const span = LIMIT_SPAN[limit.kind];
  const elapsed = span && left !== null ? clamp(100 - (left / span) * 100) : null;
  const projected = elapsed >= PACE.settle ? (used / elapsed) * 100 : null;
  const tone = used >= PACE.used || projected > PACE.alert ? "alert" : projected > 100 ? "fast" : "calm";
  // At the same pace, the rest of the limit lasts (100 - used) / used of the time gone.
  const runsOut = projected > 100 && used < 100 ? ((100 - used) / used) * (span - left) : null;
  return { kind: limit.kind, used, elapsed, projected, tone, left, reset, runsOut, unknown: !!limit.unknown };
}

// 42 min, 3h02, 2d23h (2j23h in French).
function duration(ms) {
  const min = Math.round(ms / 60_000);
  const two = (n) => String(n).padStart(2, "0");
  if (min < 60) return `${min} min`;
  if (min < 1440) return `${Math.floor(min / 60)}h${two(min % 60)}`;
  return `${Math.floor(min / 1440)}${T.days}${two(Math.floor(min / 60) % 24)}h`;
}

// 16:05, in the machine's time zone.
function clockTime(ms) {
  return new Date(ms).toTimeString().slice(0, 5);
}

function clamp(percent) {
  return Math.max(0, Math.min(100, percent));
}

// ---------- The line ----------

// Each block: { key, tip, rank, cells, parts, grow?, gap? }, gap the cells before it (3, or fewer
// for a block that goes with the one before). When the line is wider than the band, the
// lowest ranks go first. The bars (grow) then flex into the room left, so the line fills the band: grow is true where
// they flex, or in text a function drawing the block with its bar that many cells wide. Without Svg
// (the terminal) there is no Otto, and no card: the band is one row there, which would cut a card to its first line.
function drawLine(elements, columns, now) {
  const { Box, Svg } = elements;
  const cur = readings.at(-1);
  const blocks = cur ? [weatherBlock(elements, forecastNow(), cur, breakdown?.categories ?? [], now)] : [];
  if (cur) blocks.push(turnsBlock(elements));
  // In line order.
  const place = (limit) => LIMIT_PLACE[limit.kind] ?? 9;
  currentLimits(account.list, now)
    .sort((a, b) => place(a) - place(b))
    .forEach((limit, i) => blocks.push(gaugeBlock(elements, gaugeOf(limit, now), now, 80 - i)));

  // The blocks and the gaps between them, Otto and the gap after him, and the padding 1 on the right, as much as
  // the room Otto keeps on his left.
  const ottoCells = Svg ? OTTO_CELLS + 2 : 0;
  const gapOf = (b, i) => (i === 0 ? 0 : (b.gap ?? 3));
  let kept = blocks;
  const width = (list) => list.reduce((sum, b, i) => sum + b.cells + gapOf(b, i), 0) + 1 + ottoCells;
  while (kept.length > 1 && width(kept) > columns) {
    const lowest = kept.reduce((a, b) => (b.rank < a.rank ? b : a));
    kept = kept.filter((b) => b !== lowest);
  }

  // In text the bars cannot flex: those that grow (a function of their bar's cells) share out the cells left. The
  // band is drawn again at each width, so they follow the terminal's.
  const growing = kept.filter((b) => typeof b.grow === "function");
  const spare = Math.max(0, columns - width(kept));
  const partsOf = (b) => (typeof b.grow !== "function" ? b.parts : b.grow(TEXT_GAUGE + Math.floor(spare / growing.length) + (growing.indexOf(b) < spare % growing.length ? 1 : 0)));

  // Back in display order.
  const children = blocks
    .filter((b) => kept.includes(b))
    .map((b, i) => withTip(elements, b.key, partsOf(b), Svg ? b.tip : null, gapOf(b, i), b.grow === true));
  const m = mood ?? { look: "idle", tip: T.moods.idle, at: now };
  const otto = Svg ? [Box({ flexShrink: 0, children: [withTip(elements, "otto", [Svg({ key: "svg", source: ottoSvg(m.look, now - m.at), alt: m.tip, width: OTTO.width, height: OTTO.height })], m.tip)] })] : [];
  return Box({
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
    paddingRight: 1,
    columnGap: 2,
    // Otto's picture holds his head room (thought bubble, light bulb) above him: not lifted, so he stands in the band.
    children: [...otto, Box({ key: "blocks", flexGrow: 1, minWidth: 0, flexDirection: "row", alignItems: "stretch", children })],
  });
}

// A tooltip: a string with a line per fact, or an array of lines (empty: a blank line).
// A line is a string (empty: a blank line) or { text, color }, which has a legend: a swatch of the color.
const lines = (tip) => (Array.isArray(tip) ? tip : tip.split("\n"));
// A tooltip as plain text, for an Svg's alt.
const plain = (tip) => lines(tip).map((line) => line.text ?? line).join("\n");

// Every block carries its details in a card shown on hover anywhere over it, the band's full height
// (the line stretches its blocks), laid over the band. Plain images, no interactive frame: the
// desktop rebuilds the band on every redraw, and frames flash as they reload. A null tip: no card.
function withTip({ Box, Text }, key, parts, tip, gap = 0, grow = false) {
  const card = tip !== null && Box({
    position: "absolute",
    top: 0,
    left: 0,
    display: "none",
    hover: { display: "flex" },
    flexDirection: "column",
    backgroundColor: TIP.back,
    paddingX: 1,
    // One line each, the first the title when there are more.
    children: lines(tip).map((line, i, all) => {
      const text = Text({ color: TIP.text, bold: i === 0 && all.length > 1, wrap: "truncate-end", children: line.text ?? (line || " ") });
      return line.color ? Box({ flexDirection: "row", columnGap: 1, children: [Text({ color: line.color, children: "■" }), text] }) : text;
    }),
  });
  return Box({ key, marginLeft: gap, ...(grow ? { flexGrow: 1, flexShrink: 1, minWidth: 0 } : { flexShrink: 0 }), flexDirection: "row", columnGap: 1, alignItems: "center", children: card ? [...parts, card] : parts });
}

// The forecast, set by the way to auto-compact, and the share of the window used beside it; what
// fills the context in its tooltip, consulted when needed rather than always in view.
function weatherBlock({ Svg, Text }, f, cur, categories, now) {
  const pct = T.pct(cur.percent);
  const at = cur.threshold > 0 ? short(cur.threshold) : "";
  const rows = contents(categories);
  const tip = [...lines(T.tips.weather(T.sky[f.id], cur.percent, weatherPercent(cur), at, short(cur.tokens), short(cur.window))), ...(rows.length > 0 ? ["", T.tips.stack(f.id === "clear"), ...rows] : [])];
  const icon = Svg
    ? Svg({ key: "svg", source: weatherSvg(f.id, now), alt: plain(tip), width: WEATHER_SIZE, height: WEATHER_SIZE })
    : Text({ key: "svg", color: WEATHER_COLORS[f.id], children: GLYPHS[f.id] });
  const parts = [icon, Text({ key: "pct", children: pct })];
  return { key: "weather", tip, rank: 100, cells: (Svg ? Math.ceil(WEATHER_SIZE / 8) : 1) + 1 + pct.length, parts };
}

// What each recent prompt added, as bars, and the last turn's change beside them; the same room,
// and a dash for the change, before the first turn is measured.
function turnsBlock({ Box, Svg, Text }) {
  const deltas = turnDeltas();
  const change = readings.length >= 2 ? lastTurn() : "—";
  const trend = Text({ dimColor: true, children: change });
  const tip = T.tips.turns(deltas.map((d) => `+${short(d.added)}`).join(" "));
  const parts = [
    Svg
      ? Svg({ key: "svg", source: turnsSvg(deltas), alt: tip, width: SPARK_WIDTH, height: SPARK.height })
      : Box({ key: "svg", flexShrink: 0, children: textRuns(Text, turnsText(deltas)) }),
    // As wide as its text: the bars after it take up the difference.
    Box({ key: "d", flexShrink: 0, children: [trend] }),
  ];
  // Counted at its widest where the bars flex, so the line holds still; at its own width in text, where the gauges
  // take every cell the line leaves.
  return { key: "turns", tip, rank: 40, cells: (Svg ? Math.ceil(SPARK_WIDTH / 8) + 1 + SPARK.trend : SPARK.bars + 1 + change.length), parts };
}

// What the context is made of, largest first: a line per category with its share and tokens.
function contents(categories) {
  const used = categories.filter((c) => c.kind === "used" && c.tokens > 0).sort((a, b) => b.tokens - a.tokens);
  const total = used.reduce((sum, c) => sum + c.tokens, 0);
  const share = (c) => T.pct(Math.round((c.tokens / total) * 100));
  return used.map((c) => `${share(c)} · ${short(c.tokens)} · ${nameOf(c.name)}`);
}

// The engine's row label, lower-cased, translated when known.
function nameOf(name) {
  const lower = String(name).toLowerCase();
  return T.categories[lower] ?? lower;
}

// A limit (gaugeOf's numbers) in words: its label, value and tooltip, around its gauge.
function gaugeBlock({ Box, Svg, Text }, g, now, rank) {
  const [label, name] = T.limits[g.kind] ?? [g.kind, g.kind];
  const value = g.unknown ? "—" : T.pct(Math.round(g.used));
  // The 5-hour limit is near enough to say at what time it runs out.
  const when = (ms) => (g.kind === "five_hour" ? `${duration(ms)} (${clockTime(now + ms)})` : duration(ms));
  const pace = g.projected === null ? null : { end: T.pct(Math.round(g.projected)), hit: g.runsOut === null ? null : when(g.runsOut) };
  // The reset's time, and its day when it is a day or more away.
  const at = g.left === null ? "" : (g.left >= 24 * H ? T.weekday(g.reset) + " " : "") + clockTime(g.reset);
  const left = g.left === null ? "" : duration(g.left);
  // The lines on the share used, the time elapsed and the pace have the colors they have on the gauge as legends.
  const legend = { used: TONES[g.tone], elapsed: OTTO_COLOR, pace: TONES[g.tone] + FADED };
  const tip = g.unknown
    ? `${name}\n${T.tips.unmeasured}`
    : T.tips.gauge(name, value, g.elapsed === null ? null : Math.round(g.elapsed), pace, left, at).map((line) => (line.mark ? { text: line.text, color: legend[line.mark] } : line));
  // Only the bar is colored, and the value turns red on alert: the label keeps the theme's color.
  const valueText = Text({ key: "v", bold: true, children: value, ...(g.tone === "alert" && { color: "red" }) });
  const labelText = Text({ key: "l", dimColor: true, children: label });
  // The bar flexes: its box takes the room left, and the drawing fills its box. In text it is drawn at the cells
  // drawLine gives it.
  const svgBar = () => Box({ key: "bar", flexGrow: 1, flexShrink: 1, minWidth: 0, children: [Svg({ key: "svg", source: gaugeSvg(g), alt: plain(tip), height: GAUGE.height + 2 * GAUGE.overhang })] });
  const textBar = (n) => Box({ key: "bar", flexShrink: 0, children: textRuns(Text, gaugeText(g, n)) });
  const cells = label.length + 1 + (Svg ? Math.ceil(GAUGE.width / 8) : TEXT_GAUGE) + 1 + value.length;
  // Only the bar gives: its label and value keep their room, on one line.
  const fixed = (key, text) => Box({ key, flexShrink: 0, children: [text] });
  const partsAt = (bar) => [fixed("label", labelText), bar, fixed("value", valueText)];
  return { key: "limit-" + label, tip, rank, cells, grow: Svg ? true : (n) => partsAt(textBar(n)), parts: partsAt(Svg ? svgBar() : textBar(TEXT_GAUGE)) };
}

// ---------- Otto ----------

// The drawing for what Claude is doing, its tooltip, and for a reaction (`then`) the mood it goes on to once played.
function moodOf(name, tool, forced) {
  const choose = (list) => forced ?? pick(list);
  const play = (look, tip, then, ms = PLAY_MS[look]) => ({ look, tip, then, ms });
  if (name === "thinking") return play(choose(["thinking", "puzzled", "detective"]), T.moods.thinking);
  if (name === "working") return play(choose(["laptop", "desktop"]), T.moods.working(tool));
  if (name === "error") return play(choose(["dejected", "ink", "crow"]), T.moods.error(tool), "working");
  if (name === "done") return play(choose(["lightbulb", "jump", "dance", "twirl"]), T.moods.done, "idle");
  if (name === "failed") return play("dejected", T.moods.failed, "idle");
  // At rest while subagents work: sitting, waiting on them.
  if (agents.size > 0 && !forced && (name === "idle" || name === "rest")) return play("settle", T.moods.agents(agents.size));
  // Dizzy when compaction is near.
  if (forced === "dizzy" || (!forced && forecastNow()?.id === "compact")) return play("dizzy", T.moods.dizzy);
  // At rest: standing a while, then now and then a quiet animation (rarely a twirl), then standing again.
  if (name === "rest") return play("idle", T.moods.idle, "idle", PLAY_EVERY);
  const look = forced ?? (Math.random() < 0.15 ? "twirl" : pick(["lookaround", "bubbles", "wave", "shout", "tap"]));
  return play(look, T.moods.idle, forced ? undefined : "rest");
}

// A subagent started or ended: Otto at rest takes up the work, or lays it down, with the count.
async function agentsChanged($, change) {
  change();
  if (mood?.name === "idle" || mood?.name === "rest") await setMood($, "idle");
}

async function setMood($, name, tool, forced) {
  moodTimer?.cancel();
  const now = await $.clock.now();
  // A mood that holds the band (HOLD_MS) is not cut short: the next one waits, unless asked for by name.
  const wait = mood && !forced ? (HOLD_MS[mood.look] ?? 0) - (now - mood.at) : 0;
  if (wait > 0) {
    moodTimer = $.clock.after(wait, () => setMood($, name, tool));
    return;
  }
  mood = { name, tool, at: now, ...moodOf(name, tool, forced) };
  if (mood.then) moodTimer = $.clock.after(mood.ms, () => setMood($, mood.then, mood.tool));
  $.ui.invalidate("ui.render");
}

// /otto-hud demo: every animation in turn, each with the tooltip it has in a session; or one of them.
const DEMO = [
  ["thinking", "", "thinking"],
  ["thinking", "", "puzzled"],
  ["thinking", "", "detective"],
  ["working", "Bash", "laptop"],
  ["working", "Edit", "desktop"],
  ["error", "Bash", "dejected"],
  ["error", "Bash", "ink"],
  ["error", "Bash", "crow"],
  ["done", "", "lightbulb"],
  ["done", "", "jump"],
  ["done", "", "dance"],
  ["done", "", "twirl"],
  ["idle", "", "lookaround"],
  ["idle", "", "bubbles"],
  ["idle", "", "wave"],
  ["idle", "", "shout"],
  ["idle", "", "tap"],
  ["idle", "", "settle"],
  ["idle", "", "dizzy"],
];
let demoTimer = null;

async function demo($, i, end) {
  demoTimer?.cancel();
  if (i >= end) return setMood($, "idle");
  const [name, tool, look] = DEMO[i];
  await setMood($, name, tool, look);
  moodTimer?.cancel();
  demoTimer = $.clock.after(Math.max(mood.ms, 2500) + 500, () => demo($, i + 1, end));
}

// ---------- SVG ----------

// A Meteocons icon at its size, in the weather's tint. Its loops all divide 18 s (the sun's slowed
// spin), so starting each one where the wall clock says carries the animation on across redraws.
function weatherSvg(id, now) {
  const phase = now % 18000;
  return WEATHER[id]
    .replace("<svg ", `<svg width="${WEATHER_SIZE}" height="${WEATHER_SIZE}" `)
    .replaceAll('"black"', `"${WEATHER_COLORS[id]}"`)
    .replace(/begin="([\d.]+)s"/g, (_, s) => `begin="${Math.round(s * 1000 - phase)}ms"`);
}

// One rounded bar per prompt in the tint of the forecast it left, the latest on the right, earlier
// ones faded, each as tall as its share of the largest; a slot no prompt fills yet is a faint stub.
function turnsSvg(deltas) {
  const most = Math.max(1, ...deltas.map((d) => d.added));
  const empty = SPARK.bars - deltas.length;
  const bars = Array.from({ length: SPARK.bars }, (_, i) => {
    const d = deltas[i - empty];
    const h = d === undefined ? 2 : Math.max(1, (d.added / most) * SPARK.height);
    const fill = d === undefined ? grey(0.2) : WEATHER_COLORS[d.id] + (i === SPARK.bars - 1 ? "" : "80");
    return `<rect x="${i * (SPARK.bar + SPARK.gap)}" y="${(SPARK.height - h).toFixed(1)}" width="${SPARK.bar}" height="${h.toFixed(1)}" rx="1.5" fill="${fill}"/>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SPARK_WIDTH}" height="${SPARK.height}" viewBox="0 0 ${SPARK_WIDTH} ${SPARK.height}">${bars.join("")}</svg>`;
}

// A limit: solid up to the share used, faded on up to the share projected by the reset (to the end
// when the pace runs past the limit), and marked in Otto's blue where the time stands.
function gaugeSvg(g) {
  const color = TONES[g.tone];
  const body = span(0, clamp(g.projected ?? 0), color + FADED) + span(0, clamp(g.used), color);
  return barSvg(GAUGE.height, body, g.elapsed === null ? [] : [clamp(g.elapsed)]);
}

// A bar with round ends as wide as its box (no viewBox: positions in %, the ends' radius in px): a
// grey track and `body` on it, and over it 2 px marks at `marks` %, in Otto's blue, that go past
// the bar by GAUGE.overhang above and below. Ids carry what tells the drawings apart, in case a
// page holds several.
function barSvg(height, body, marks = []) {
  const ends = `ends${height}`;
  const over = GAUGE.overhang, full = height + 2 * over;
  const lines = marks.map((n) => `<rect x="${n.toFixed(1)}%" width="2" height="${full}" rx="1" transform="translate(-1 0)" fill="${OTTO_COLOR}"/>`).join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="${full}">` +
    `<svg y="${over}" width="100%" height="${height}"><defs><clipPath id="${ends}"><rect width="100%" height="${height}" rx="${height / 2}"/></clipPath></defs>` +
    `<g clip-path="url(#${ends})">${span(0, 100, grey(0.2))}${body}</g></svg>${lines}</svg>`
  );
}

// A full-height slice of a bar, from x0 to x1 %.
function span(x0, x1, fill) {
  return x1 > x0 ? `<rect x="${x0.toFixed(1)}%" width="${(x1 - x0).toFixed(1)}%" height="100%" fill="${fill}"/>` : "";
}

// ---------- Text ----------

// The prompts' bars in eighths of a cell, as turnsSvg draws them: the latest bright, the earlier dim, an empty slot
// the lowest eighth, dim.
function turnsText(deltas) {
  const most = Math.max(1, ...deltas.map((d) => d.added));
  const empty = SPARK.bars - deltas.length;
  return Array.from({ length: SPARK.bars }, (_, i) => {
    const d = deltas[i - empty];
    if (d === undefined) return [EIGHTHS[0], { dimColor: true }];
    return [EIGHTHS[Math.round((d.added / most) * (EIGHTHS.length - 1))], { color: WEATHER_COLORS[d.id], dimColor: i < SPARK.bars - 1 }];
  });
}

// A limit as gaugeSvg draws it, `cells` wide, in full cells: solid up to the share used, to the eighth of a cell;
// faded on up to the share projected; the track after. The cell the share used ends in takes, behind its eighths,
// the color of what follows, so no gap shows there.
function gaugeText(g, cells) {
  const color = TONES[g.tone], faded = mix(color, TEXT_TRACK, 0.55);
  const at = (percent) => (clamp(percent) / 100) * cells;
  const used = at(g.used), ahead = at(g.projected ?? 0);
  return Array.from({ length: cells }, (_, i) => {
    const after = i + 0.5 < ahead ? faded : TEXT_TRACK;
    const part = Math.round(Math.min(1, Math.max(0, used - i)) * 8);
    if (part === 8) return ["█", { color }];
    if (part > 0) return [LEFT_EIGHTHS[part], { color, backgroundColor: after }];
    return ["█", { color: after }];
  });
}

// Between two #rrggbb colors, `t` of the way from a to b.
function mix(a, b, t) {
  const channel = (hex, k) => parseInt(hex.slice(1 + 2 * k, 3 + 2 * k), 16);
  return "#" + [0, 1, 2].map((k) => Math.round(channel(a, k) + (channel(b, k) - channel(a, k)) * t).toString(16).padStart(2, "0")).join("");
}

// [glyph, props] cells as Texts, one per run of the same props.
function textRuns(Text, cells) {
  const runs = [];
  for (const [glyph, props] of cells) {
    const last = runs.at(-1);
    if (last && JSON.stringify(last[1]) === JSON.stringify(props)) last[0] += glyph;
    else runs.push([glyph, props]);
  }
  return runs.map(([children, props], i) => Text({ key: String(i), ...props, children }));
}

// ---------- Helpers ----------

// 950, 6.3k, 98.3k, 107k, 1M, 1.2M: a decimal only below 100 of the unit.
function short(n) {
  const [unit, size] = n >= 1e6 ? ["M", 1e6] : n >= 1e3 ? ["k", 1e3] : ["", 1];
  const v = n / size;
  return (size === 1 || v >= 100 ? Math.round(v) : +v.toFixed(1)) + unit;
}

// Nothing to show: no node, blank text, or boxes and texts that hold only that.
function isEmpty(node) {
  if (Array.isArray(node)) return node.every(isEmpty);
  if (node && typeof node === "object") return (node.type === "Box" || node.type === "Text") && isEmpty(node.props?.children);
  return !String(node ?? "").trim() || node === false;
}
