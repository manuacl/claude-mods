import { test, expect, mock } from "claude-code/testing";

// October 2, 2026, 13:00 UTC.
const NOW = Date.UTC(2026, 9, 2, 13, 0);
const at = (ms: number) => new Date(ms).toTimeString().slice(0, 5);
const day = (ms: number, lang = "en") => new Date(ms).toLocaleDateString(lang, { weekday: "short" }) + " " + at(ms);
const LIMITS = [
  // 7 days: 59% used, 4 of 7 days elapsed (57%): slightly ahead.
  { kind: "seven_day", percentUsed: 59, resetsAt: new Date(NOW + 3 * 86_400_000).toISOString() },
  // 5 hours: 32% used, 2 of 5 hours elapsed (40%): behind time.
  { kind: "five_hour", percentUsed: 32, resetsAt: new Date(NOW + 3 * 3_600_000).toISOString() },
];
const CATEGORIES = [
  { name: "System prompt", tokens: 8_000, kind: "used" },
  { name: "Messages", tokens: 600_000, kind: "used" },
  { name: "Free space", tokens: 300_000, kind: "free" },
  { name: "Autocompact buffer", tokens: 90_000, kind: "buffer" },
];

function world(on: any, env: Record<string, string> = {}) {
  const clock = mock.clock(on, { now: NOW });
  mock.store(on, {});
  mock.env(on, env);
  on("session.start", (_$: any, e: any) => ({ cwd: e.cwd ?? "/tmp" }));
  on("ui.invalidate", () => ({ value: undefined }));
  on("command.register", () => ({ value: undefined }));
  on("ui.render", ($: any, e: any) => $.ui.resolve(e).Box({ children: [] }));
  return clock;
}

// The context's tokens, or a function that reads them at each reading.
function withUsage(on: any, tokens: number | (() => number), rateLimits: unknown[] = LIMITS, threshold = 900_000) {
  on("session.usage", () => {
    const t = typeof tokens === "function" ? tokens() : tokens;
    const breakdown = { categories: CATEGORIES, rawMaxTokens: 1_000_000, autoCompactThreshold: threshold };
    return { value: { startedAt: NOW, rateLimits, context: { tokens: t, window: 1_000_000, percent: Math.round(t / 10_000), breakdown } } };
  });
}

// Texts on the band (not in the hover cards: their lines in the theme's "text" color) and Svg alts.
async function band($: any, surface: "terminal" | "desktop" = "desktop", columns = 300) {
  const ui = await $.ui.mount({ plugin: "otto-hud", surface, component: "AbovePrompt", props: { bodyColumns: columns } as any });
  const texts = (await ui.findAll({ type: "Text" })).filter((t: any) => t.props?.color !== "text").map((t: any) => t.text);
  const alts = (await ui.findAll({ type: "Svg" })).map((s: any) => s.props?.alt);
  return { ui, texts, alts };
}

const start = ($: any) => $.session.start({ source: "startup", cwd: "/tmp" } as any);

// A turn starts and Otto thinks, in whichever animation he picks: past the time the detective holds the band (HOLD_MS),
// so the next move shows at once.
async function think($: any, clock: any) {
  await $.turn.start({ text: "go", turnId: "t1" } as any);
  await clock.advance(4_000);
}

const ottoTip = (alts: string[]) => alts.find((a) => /^(Otto|Claude|Turn|The turn|Bash)/.test(a));

test("desktop: icons with tooltips for the forecast, context and limits", async ($, on) => {
  world(on);
  withUsage(on, 600_000);
  await start($);
  const { texts, alts } = await band($);
  expect(ottoTip(alts)).toBe("Otto is resting");
  // 600k of a 1M window is 60%, but 67% of the way to compaction at 900k: Showers, not Cloudy.
  expect(alts).toContain(
    "Showers\n60% of the context used\n67% of the way to auto-compact (at 900k)\n600k of 1M tokens used\n\nWhat covers the sky\n99% · 600k · messages\n1% · 8k · system prompt",
  );
  expect(texts).toContain("60%");
  expect(alts).toContain("5-hour limit\n32% used\n40% of the time elapsed\n80% by the reset at this pace\nResets in 3h00 at " + at(NOW + 3 * 3_600_000));
  expect(alts).toContain("7-day limit\n59% used\n57% of the time elapsed\n100% in 2d18h at this pace\nResets in 3d00h at " + day(NOW + 3 * 86_400_000));
  expect(texts).toContain("32%");
  expect(texts).toContain("59%");
  // 5 hours before 7 days, whatever the order received.
  expect(texts.indexOf("5h")).toBeLessThan(texts.indexOf("7d"));
});

test("the terminal draws the line in text, without Otto or tooltips", async ($, on) => {
  world(on);
  withUsage(on, 600_000);
  await start($);
  // The line takes 59 cells with its bars at their least, 10 cells.
  const { ui, texts, alts } = await band($, "terminal", 59);
  expect(alts).toEqual([]);
  // Showers at 67% of the way to compaction; no prompt measured yet; the 5-hour limit 32% used (3 cells and a
  // quarter of 10), 80% by the reset: solid, faded, the track, all full cells.
  for (const t of ["☂", "60%", "▁▁▁▁▁▁▁▁", "—", "5h", "███", "▎", "████", "██", "32%"]) expect(texts).toContain(t);
  // The quarter cell's other three quarters are the faded color that follows it, not the terminal's background.
  const quarter = (await ui.findAll({ type: "Text" })).find((t: any) => t.text === "▎").props;
  expect(quarter.backgroundColor).toMatch(/^#[0-9a-f]{6}$/);
  expect(quarter.backgroundColor).not.toBe(quarter.color);
  expect((await ui.findAll({ type: "Text" })).some((t: any) => t.props?.color === "text")).toBe(false);
  // What it draws, with the gaps between its blocks (3) and their parts (1) and its padding, fits.
  const drawn = (t: string[]) => t.join("").length + 3 * 3 + 6 + 1;
  expect(drawn(texts)).toBe(59);
  // 16 cells wider, each bar takes 8 of them: 32% of 18 cells is 5 and three quarters.
  const wider = (await band($, "terminal", 75)).texts;
  for (const t of ["█████", "▊", "████████", "████"]) expect(wider).toContain(t);
  expect(drawn(wider)).toBe(drawn(texts) + 16);
});

test("a narrow band drops the least important blocks first", async ($, on) => {
  world(on);
  withUsage(on, 600_000);
  await start($);
  const { texts, alts } = await band($, "desktop", 40);
  // The 7-day gauge goes first; Otto and the forecast stay.
  expect(texts).not.toContain("7d");
  expect(ottoTip(alts)).toBe("Otto is resting");
  expect(alts.some((a: string) => a.startsWith("Showers"))).toBe(true);
  expect(texts).toContain("60%");
});

test("before the limits are measured, the 5h and 7d gauges hold their place, empty, with a dash", async ($, on) => {
  world(on);
  withUsage(on, 300_000, []);
  await start($);
  const { texts, alts } = await band($);
  expect(alts.some((a: string) => a.startsWith("Cloudy"))).toBe(true);
  expect(texts).toEqual(["30%", "—", "5h", "—", "7d", "—"]);
  expect(alts).toContain("5-hour limit\nNot measured yet");
  expect(alts).toContain("7-day limit\nNot measured yet");
});

test("a window past its reset, or left out of the reading, shows empty at 0%", async ($, on) => {
  world(on);
  // The 5-hour window reset a minute ago; the reading has no 7-day window.
  withUsage(on, 300_000, [{ kind: "five_hour", percentUsed: 80, resetsAt: new Date(NOW - 60_000).toISOString() }]);
  await start($);
  const { texts, alts } = await band($);
  expect(texts).toEqual(expect.arrayContaining(["5h", "7d"]));
  expect(texts.filter((t: string) => t === "0%")).toHaveLength(2);
  expect(alts).toContain("5-hour limit\n0% used");
  expect(alts).toContain("7-day limit\n0% used");
});

test("the pace says when a limit runs out, but not in the first hours of a window", async ($, on) => {
  world(on);
  withUsage(on, 300_000, [
    // 60% used in 2 of 5 hours: the rest lasts 80 minutes at this pace.
    { kind: "five_hour", percentUsed: 60, resetsAt: new Date(NOW + 3 * 3_600_000).toISOString() },
    // 8 hours into the week: too early for a pace.
    { kind: "seven_day", percentUsed: 5, resetsAt: new Date(NOW + 160 * 3_600_000).toISOString() },
  ]);
  await start($);
  const { alts } = await band($);
  expect(alts).toContain("5-hour limit\n60% used\n40% of the time elapsed\n100% in 1h20 (" + at(NOW + 80 * 60_000) + ") at this pace\nResets in 3h00 at " + at(NOW + 3 * 3_600_000));
  expect(alts).toContain("7-day limit\n5% used\n5% of the time elapsed\nResets in 6d16h at " + day(NOW + 160 * 3_600_000));
});

test("the context's composition is in the forecast's tooltip, not on the band, without color swatches", async ($, on) => {
  world(on);
  withUsage(on, 300_000);
  await start($);
  const { ui, alts } = await band($);
  expect(alts.filter((a: string) => a.includes("What covers the sky"))).toHaveLength(1);
  expect(alts.find((a: string) => a.includes("What covers the sky"))).toMatch(/^Cloudy/);
  // The only legends are the gauges': three each.
  expect((await ui.findAll({ type: "Svg" })).filter((s: any) => ["■", "│"].includes(s.props?.alt))).toHaveLength(6);
});

test("under a clear sky, nothing covers it: the composition is what you see in it", async ($, on) => {
  world(on);
  withUsage(on, 100_000);
  await start($);
  const { alts } = await band($);
  expect(alts.find((a: string) => a.startsWith("Clear"))).toContain("\n\nWhat you see in the sky\n");
});

test("the tokens each prompt added, as bars in the forecast they left, a compaction counting as none", async ($, on) => {
  world(on);
  let tokens = 100_000;
  withUsage(on, () => tokens);
  on("turn.complete", () => ({ text: "" }));
  await start($);
  // A single reading: nothing to compare yet, but the same room, so the gauges after it stay put.
  const svg = async () => (await (await band($)).ui.findAll({ type: "Svg" })).find((s: any) => s.props?.alt?.startsWith("Tokens added")).props;
  const before = await svg();
  expect(before.alt).toBe("Tokens added by each recent prompt\nNone measured yet");
  expect((await band($)).texts).toContain("—");
  // Clear, Showers (500k is 56% of the way to 900k), then a compaction back to Clear.
  for (const t of [106_300, 500_000, 50_000]) {
    tokens = t;
    await $.turn.complete({ reason: "answer", answer: "" } as any);
  }
  const { texts, alts } = await band($);
  expect(alts).toContain("Tokens added by each recent prompt\n+6.3k +394k +0");
  expect(texts).toContain("−450k");
  const after = await svg();
  expect(after.width).toBe(before.width);
  // Five empty slots, then each prompt in its forecast's tint, faded but for the latest.
  const fills = [...after.source.matchAll(/fill="([^"]+)"/g)].map((m) => m[1]);
  expect(fills.slice(5)).toEqual(["#e0b00080", "#2f68c080", "#e0b000"]);
});

test("/compact, which is no turn, reads the context again: the forecast and its percent follow", async ($, on) => {
  world(on);
  let tokens = 500_000;
  withUsage(on, () => tokens);
  on("turn.complete", () => ({ text: "" }));
  const summary = [{ role: "user", text: "The summary", toolUses: [] }];
  on("session.compact", () => ({ messages: summary }));
  await start($);
  await $.turn.complete({ reason: "answer", answer: "" } as any);
  expect((await band($)).texts).toContain("50%");
  tokens = 50_000;
  await $.session.compact({ trigger: "manual", messages: summary } as any);
  const { texts, alts } = await band($);
  expect(texts).toContain("5%");
  expect(texts).toContain("−450k");
  expect(alts.some((a: string) => a.startsWith("Clear"))).toBe(true);
});

test("a reload of the mod keeps the prompts measured, and does not count as another one", async ($, on) => {
  world(on);
  let tokens = 100_000;
  withUsage(on, () => tokens);
  on("turn.complete", () => ({ text: "" }));
  await start($);
  for (const t of [106_300, 108_300]) {
    tokens = t;
    await $.turn.complete({ reason: "answer", answer: "" } as any);
  }
  // A reload runs session.start again.
  await start($);
  const { texts, alts } = await band($);
  expect(alts).toContain("Tokens added by each recent prompt\n+6.3k +2k");
  expect(texts).toContain("+2k");
});

test("French labels when Claude Code's language setting is French, whatever the locale", async ($, on) => {
  world(on, { LANG: "en_US.UTF-8" });
  on("config.list", () => ({ value: [{ key: "language", value: "french" }] }) as any);
  withUsage(on, 600_000);
  await start($);
  const { alts } = await band($);
  expect(ottoTip(alts)).toBe("Otto se repose");
});

test("English unless the setting says French: the locale variables are not read", async ($, on) => {
  world(on, { LANG: "fr_FR.UTF-8" });
  withUsage(on, 600_000);
  await start($);
  expect(ottoTip((await band($)).alts)).toBe("Otto is resting");
});

test("French labels everywhere when Claude Code's language setting is French", async ($, on) => {
  world(on);
  on("config.list", () => ({ value: [{ key: "language", value: "français" }] }) as any);
  withUsage(on, 600_000);
  await start($);
  const { texts, alts } = await band($);
  expect(ottoTip(alts)).toBe("Otto se repose");
  expect(alts).toContain(
    "Averses\n60% du contexte utilisé\n67% du chemin vers l'auto-compact (à 900k)\n600k sur 1M tokens utilisés\n\nCe qui couvre le ciel\n99% · 600k · messages\n1% · 8k · prompt système",
  );
  expect(texts).toContain("60%");
  expect(alts.some((a: string) => a.includes("1% · 8k · prompt système"))).toBe(true);
  expect(texts).toContain("7j");
  expect(alts).toContain("Limite 7 jours\n59% utilisés\n57% du temps écoulé\n100% dans 2j18h à ce rythme\nRemise à zéro dans 3j00h à " + day(NOW + 3 * 86_400_000, "fr"));
});

test("past 90% of the way to compaction: Compact soon, and Otto is dizzy", async ($, on) => {
  world(on);
  withUsage(on, 850_000);
  await start($);
  const { alts } = await band($);
  expect(alts.some((a: string) => a.startsWith("Compact soon"))).toBe(true);
  expect(ottoTip(alts)).toBe("Otto is dizzy: compaction is near");
});

test("Otto follows Claude: thinking, at his computer, a failed tool, then the end of the turn", async ($, on) => {
  const clock = world(on);
  withUsage(on, 600_000);
  on("tool.call", (_$: any, e: any) => ({ result: "", isError: e.input?.fail === true }) as any);
  on("turn.complete", () => ({ text: "" }));
  on("turn.start", (_$: any, e: any) => ({ turnId: e.turnId }));
  await start($);
  const tip = async () => ottoTip((await band($)).alts);
  await think($, clock);
  expect(await tip()).toBe("Claude is thinking");
  await $.tool.call({ tool: "Bash", input: { command: "ls" } } as any);
  expect(await tip()).toBe("Claude is using Bash");
  await $.tool.call({ tool: "Bash", input: { command: "false", fail: true } } as any);
  expect(await tip()).toBe("Bash failed");
  // The reaction played (the crow takes longest), back at the computer.
  await clock.advance(9_000);
  expect(await tip()).toBe("Claude is using Bash");
  await $.turn.complete({ reason: "answer", answer: "" } as any);
  expect(await tip()).toBe("Turn done");
  await clock.advance(6_000);
  expect(await tip()).toBe("Otto is resting");
});

test("the detective finishes bringing the magnifier to her eye before Claude's next move shows", async ($, on) => {
  const clock = world(on);
  withUsage(on, 600_000);
  on("tool.call", () => ({ result: "" }));
  on("turn.start", (_$: any, e: any) => ({ turnId: e.turnId }));
  await start($);
  const tip = async () => ottoTip((await band($)).alts);
  await $.command.run({ command: "otto-hud", args: "detective" } as any);
  await clock.advance(1_000);
  await $.tool.call({ tool: "Bash", input: { command: "ls" } } as any);
  expect(await tip()).toBe("Claude is thinking");
  await clock.advance(2_800);
  expect(await tip()).toBe("Claude is using Bash");
});

test("Otto keeps working while subagents do, after the main turn ends", async ($, on) => {
  const clock = world(on);
  withUsage(on, 600_000);
  on("tool.call", () => ({ result: "" }));
  on("turn.complete", () => ({ text: "" }));
  on("turn.start", (_$: any, e: any) => ({ turnId: e.turnId }));
  await start($);
  const tip = async () => (await band($)).alts.find((a: string) => /^(Otto|Claude|Turn|A subagent|\d+ subagents)/.test(a));
  await think($, clock);
  // Two background subagents get to work, and the main turn ends.
  await $.tool.call({ tool: "Read", input: {}, agentId: "a1" } as any);
  await $.tool.call({ tool: "Read", input: {}, agentId: "a2" } as any);
  await $.turn.complete({ reason: "answer", answer: "" } as any);
  await clock.advance(6_000);
  expect(await tip()).toBe("2 subagents are working");
  // Waiting on them, sitting, under the Svg size limit.
  const svg = (await (await band($)).ui.findAll({ type: "Svg" })).find((s: any) => s.props?.alt === "2 subagents are working").props;
  expect(svg.source.length).toBeLessThan(131072);
  await $.turn.complete({ reason: "answer", answer: "", agentId: "a1" } as any);
  expect(await tip()).toBe("A subagent is working");
  await $.turn.complete({ reason: "answer", answer: "", agentId: "a2" } as any);
  expect(await tip()).toBe("Otto is resting");
});

test("Otto's animation stays under the Svg size limit and carries on across redraws", async ($, on) => {
  const clock = world(on);
  withUsage(on, 600_000);
  on("tool.call", () => ({ result: "" }));
  on("turn.start", (_$: any, e: any) => ({ turnId: e.turnId }));
  await start($);
  await think($, clock);
  await $.tool.call({ tool: "Bash", input: { command: "ls" } } as any);
  const otto = async () => (await (await band($)).ui.findAll({ type: "Svg" })).find((s: any) => s.props?.alt === "Claude is using Bash").props;
  const first = await otto();
  expect(first.isInteractive).toBeUndefined();
  expect(first.source.length).toBeLessThan(131072);
  expect(first.source).toContain('begin="0ms"');
  await clock.advance(1_000);
  // Drawn again a second later: every animation begins a second earlier.
  expect((await otto()).source).toContain('begin="-1000ms"');
  // Long after, what played once (the computer coming in) ends a millisecond after the picture appears, so it shows
  // frozen at its end instead of not at all.
  await clock.advance(60_000);
  const late = (await otto()).source as string;
  const once = [...late.matchAll(/<animate[^>]*dur="([\d.]+)s"[^>]*fill="freeze"[^>]*>/g)].filter((m) => !m[0].includes("repeatCount"));
  expect(once.some(([tag, dur]) => Number(tag.match(/begin="(-?\d+)ms"/)![1]) === 1 - Math.round(Number(dur) * 1000))).toBe(true);
  // But a move that handed over to a loop (an arm's way to the keys, then typing) stays behind it: the later begin wins.
  for (const [run] of late.matchAll(/(?:<(?:animate|animateTransform|set)\b[^>]*>)+/g)) {
    const tags = run.match(/<[^>]*>/g)!.map((t) => ({ attr: t.match(/attributeName="([^"]+)"/)?.[1], at: Number(t.match(/begin="(-?\d+)ms"/)?.[1]), loops: t.includes("repeatCount") }));
    for (const loop of tags.filter((t) => t.loops)) for (const t of tags.filter((t) => !t.loops && t.attr === loop.attr)) expect(t.at).toBeLessThanOrEqual(loop.at);
  }
});

test("/otto-hud demo plays every animation in turn, then Otto rests", async ($, on) => {
  const clock = world(on);
  withUsage(on, 600_000);
  await start($);
  const result: any = await $.command.run({ command: "otto-hud", args: "demo" } as any);
  expect(result.text).toContain("all his animations");
  const tip = async () => ottoTip((await band($)).alts);
  const seen = new Set<string>();
  for (let i = 0; i < 110; i++) {
    seen.add(String(await tip()));
    await clock.advance(1_000);
  }
  for (const t of ["Claude is thinking", "Claude is using Bash", "Claude is using Edit", "Bash failed", "Turn done", "Otto is dizzy: compaction is near"]) expect(seen).toContain(t);
  expect(await tip()).toBe("Otto is resting");
});

test("the rest animations that play once are done by the time they hand over, back at the rest pose", async ($, on) => {
  world(on);
  withUsage(on, 600_000);
  await start($);
  for (const [look, ms] of [["wave", 5_000], ["shout", 3_600], ["tap", 5_000]] as const) {
    await $.command.run({ command: "otto-hud", args: look } as any);
    const svg = (await (await band($)).ui.findAll({ type: "Svg" })).find((s: any) => s.props?.alt === "Otto is resting").props;
    expect(svg.source.length).toBeLessThan(131072);
    // Every animation that does not loop forever, as at rest, has ended by then.
    for (const [tag] of (svg.source as string).matchAll(/<(?:animate|animateTransform|set)\b[^>]*>/g)) {
      if (tag.includes('repeatCount="indefinite"')) continue;
      const begin = Number(tag.match(/begin="(-?\d+)ms"/)![1]), dur = Number(tag.match(/dur="([\d.]+)s"/)?.[1] ?? 0) * 1000;
      expect(begin + dur * Number(tag.match(/repeatCount="(\d+)"/)?.[1] ?? 1)).toBeLessThanOrEqual(ms + 1);
    }
  }
});

test("/otto-hud <animation> plays just that one; an unknown name lists them", async ($, on) => {
  const clock = world(on);
  withUsage(on, 600_000);
  await start($);
  const tip = async () => ottoTip((await band($)).alts);
  const played: any = await $.command.run({ command: "otto-hud", args: "dejected" } as any);
  expect(played.text).toBe("Otto plays dejected above the prompt.");
  expect(await tip()).toBe("Bash failed");
  await clock.advance(5_000);
  expect(await tip()).toBe("Otto is resting");
  const help: any = await $.command.run({ command: "otto-hud", args: "nope" } as any);
  expect(help.text).toContain("thinking, puzzled, detective, laptop");
});

test("the bars flex into the room the band leaves, their labels and values fixed, and add no words", async ($, on) => {
  world(on);
  withUsage(on, 600_000);
  await start($);
  const { ui, texts } = await band($);
  const boxes = await ui.findAll({ type: "Box" });
  // Each gauge grows and shrinks; its bar takes the room, the Svg as wide as its Box.
  const gauge = boxes.find((b: any) => b.props?.key === "limit-5h")?.props;
  expect(gauge).toMatchObject({ flexGrow: 1, flexShrink: 1, minWidth: 0 });
  expect(boxes.find((b: any) => b.props?.key === "bar")?.props).toMatchObject({ flexGrow: 1, minWidth: 0 });
  const svg = (await ui.findAll({ type: "Svg" })).find((s: any) => s.props?.alt?.startsWith("5-hour")).props;
  expect(svg.width).toBeUndefined();
  expect(svg.source).toContain('width="100%"');
  // The other blocks, and a gauge's label and value, keep their size: nothing wraps or overlaps.
  for (const key of ["weather", "turns", "label", "value"]) expect(boxes.find((b: any) => b.props?.key === key)?.props.flexShrink).toBe(0);
  expect(texts).toEqual(["60%", "—", "5h", "32%", "7d", "59%"]);
});

test("a gauge's tooltip has its parts' colors as legends: the share used, the time elapsed, the pace", async ($, on) => {
  world(on);
  withUsage(on, 600_000);
  await start($);
  const { ui, alts } = await band($);
  // The desktop drops an Svg with an empty alt: none has one.
  expect(alts.every((a: string) => a.trim() !== "")).toBe(true);
  // The 5-hour gauge is calm: a green square for the share used, the time mark in Otto's blue, a faded green square for
  // the pace; all in the same box, so the texts line up.
  const legends = (await ui.findAll({ type: "Svg" })).filter((s: any) => ["■", "│"].includes(s.props?.alt)).slice(0, 3).map((s: any) => s.props);
  expect(legends.map((l: any) => [l.width, l.height])).toEqual([[9, 15], [9, 15], [9, 15]]);
  expect(legends[0].source).toContain('<rect y="3" width="9" height="9" rx="1.5" fill="#3fa66b"/>');
  expect(legends[1].source).toContain('<rect x="3.5" width="2" height="15" rx="1" fill="#4a8fe0"/>');
  expect(legends[2].source).toContain('fill="#3fa66b59"');
});

test("where the time stands, a gauge has a mark in Otto's blue that goes past its bar above and below", async ($, on) => {
  world(on);
  withUsage(on, 600_000);
  await start($);
  const svg = (await (await band($)).ui.findAll({ type: "Svg" })).find((s: any) => s.props?.alt?.startsWith("5-hour")).props;
  // The bar is 9 px tall, the drawing 3 px more above and below; the mark at 40% (the time elapsed) runs its full height.
  expect(svg.height).toBe(15);
  expect(svg.source).toContain('<svg y="3" width="100%" height="9">');
  expect(svg.source).toContain('<rect x="40.0%" width="2" height="15" rx="1" transform="translate(-1 0)" fill="#4a8fe0"/>');
  expect(svg.source).not.toContain("<mask");
});

test("the weather icon is tinted and its animation follows the clock across redraws", async ($, on) => {
  const clock = world(on);
  withUsage(on, 600_000);
  await start($);
  const icon = async () => (await (await band($)).ui.findAll({ type: "Svg" })).find((s: any) => s.props?.alt?.startsWith("Showers")).props.source;
  const first = await icon();
  expect(first).toContain('"#2f68c0"');
  expect(first).not.toContain('"black"');
  expect(first).toContain('begin="400ms"');
  await clock.advance(1_000);
  // A second later every loop begins a second earlier, so it carries on where it was.
  expect(await icon()).toContain('begin="-600ms"');
});
