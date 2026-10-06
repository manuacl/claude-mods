// Copyright 2026 Manuel Chamorro. All rights reserved: Otto is not under the Apache License, see OTTO-LICENSE.
// SPDX-License-Identifier: LicenseRef-Otto
//
// Otto, a blue octopus, blocky, drawn in vectors and animated with SMIL: a mood is a whole SVG. viewBox 98×70, shown
// at 49×35 in the band. Every mood starts from the rest pose (idle at its start), so a change of mood never jumps;
// what plays once (a start) then hands over to loops, or, for the rest moods in ONCE, comes back to the rest pose.

const C = { body: "#4a8fe0", line: "#1f4a8a", eye: "#fff", pupil: "#17233b", cheek: "#ff8fb0", ink: "#1d2433" };
const W = 98, H = 70, X = 40, LEFT = X - 46; // X: the body's center, the anchor of every mood; LEFT just left of the widest pose (desktop's), what flies in aside
const FLOOR = 62, GROUND = 56, SCALE = 1.2; // the body is drawn in its own units, its GROUND set on the canvas' FLOOR

const loop = `repeatCount="indefinite"`;
const anim = (attr, values, dur, extra = "") => `<animate attributeName="${attr}" values="${values}" dur="${dur}s" ${loop} ${extra}/>`;
const turn = (values, dur, extra = "") => `<animateTransform attributeName="transform" type="rotate" values="${values}" dur="${dur}s" ${loop} ${extra}/>`;
const move = (values, dur, extra = "") => `<animateTransform attributeName="transform" type="translate" values="${values}" dur="${dur}s" ${loop} ${extra}/>`;
const spline = (n) => `calcMode="spline" keySplines="${Array(n).fill(".45 0 .55 1").join(";")}"`;

// A limb: an outlined stroke; `inner` animates both strokes the same way.
// A limb of the body's color is an arm: its outline is masked around where it starts, so it joins the body without a
// border and keeps its outline everywhere else. Give arms coordinates in the head's own space so the mask lines up.
const ROOTS = new Set(); // the arms' starting points in the drawing being built; svg() writes their masks
const rootId = (x, y) => `root${x}_${y}`.replace(/\./g, "d").replace(/-/g, "m");
const limb = (d, inner = "", color = C.body, thick = 1) => {
  const path = (c, w) => (w *= thick) && `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${inner}</path>`;
  if (color !== C.body) return path(C.line, 6.4) + path(color, 4.2);
  const [, x, y] = d.match(/^M\s*(-?[\d.]+)[ ,](-?[\d.]+)/);
  ROOTS.add(`${x} ${y}`);
  return `<g mask="url(#${rootId(x, y)})">${path(C.line, 6.4)}</g>${path(color, 4.2)}`;
};

// A tentacle drops from its root, folds outward at the tip, and sways around the root.
function tentacle(x, side, { sway = 6, dur = 2.4, delay = 0, splay = 0 } = {}, [color, width]) {
  const s = side;
  const d = `M0 0 V9 Q0 13 ${4 * s} 13 H${7 * s} V9`;
  return `<g transform="translate(${x} 41) rotate(${(-splay / 3) * s})"><g>${turn(`${-sway};${sway};${-sway}`, dur, `begin="${-delay}s" ${spline(2)}`)}<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/></g></g>`;
}
// 0, 1 in the middle, behind; 2 to 7 left to right.
const TENTACLES = [
  [-4, -1, { delay: 0.3, splay: 8 }],
  [4, 1, { delay: 0.9, splay: 8 }],
  [-13, -1, { delay: 0.1, splay: 20 }],
  [-8, -1, { delay: 0.6, sway: 5, splay: 16 }],
  [-3, -1, { delay: 1.1, sway: 4, splay: 2 }],
  [3, 1, { delay: 0.4, sway: 4, splay: 2 }],
  [8, 1, { delay: 1.4, sway: 5, splay: 16 }],
  [13, 1, { delay: 0.8, splay: 20 }],
];

const HEAD = `M${X - 18} 30 Q${X - 18} 19 ${X - 7} 19 H${X + 7} Q${X + 18} 19 ${X + 18} 30 V39 Q${X + 18} 43 ${X + 14} 43 H${X - 14} Q${X - 18} 43 ${X - 18} 39Z`;
const HIGHLIGHT = `<rect x="${X - 11}" y="22" width="7" height="3" rx="1.5" fill="#fff" opacity=".35"/>`;
// Each tentacle outlined, but no line between them and the head: the head's outline goes under them, its fill over their roots.
// wrapHead moves the head alone (its outline and its fill), wrapLegs the tentacles, wrapLeg one of them by its index.
const body = (skip = [], { wrapHead = (s) => s, wrapLegs = (s) => s, wrapLeg = (i, s) => s } = {}) => {
  const legs = TENTACLES.map(([x, s, o], i) => (skip.includes(i) ? "" : wrapLeg(i, tentacle(X + x, s, o, [C.line, 6.4]) + tentacle(X + x, s, o, [C.body, 4.2])))).join("");
  return wrapHead(`<path d="${HEAD}" fill="${C.line}" stroke="${C.line}" stroke-width="2.2"/>`) + wrapLegs(legs) + wrapHead(`<path d="${HEAD}" fill="${C.body}"/>${HIGHLIGHT}`);
};
// Animations that scale around the ground point.
const onGround = (anims, inner) => `<g transform="translate(${X} ${GROUND})"><g>${anims}<g transform="translate(${-X} ${-GROUND})">${inner}</g></g></g>`;

const EYE = 1.2; // the eyes' size, against how they are drawn below
// Eyes blink every few seconds. look shifts the pupils, roam animates them; closed is "happy", "sad" or "flat";
// droop lowers sad eyelids over them, lower at their outer corners.
function eyes({ look = [0, 0], roam = "", closed = "", spiral = false, droop = false } = {}) {
  const one = (x, side) => {
    if (closed) {
      const d = { happy: `M${x - 3} 31.5 l3 -3 l3 3`, sad: `M${x - 3} 29.5 q3 2.5 6 0`, flat: `M${x - 3} 30 h6` }[closed];
      return `<g transform="translate(${x} 30) scale(${EYE}) translate(${-x} -30)"><path d="${d}" fill="none" stroke="${C.pupil}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></g>`;
    }
    const pupil = spiral
      ? `<g transform="translate(${x} 30)"><path d="M0 0 m-.6 0 a.6 .6 0 1 1 1.2 0 a1.4 1.4 0 1 1 -2.4 .3 a2.2 2.2 0 1 1 3.4 -.8" fill="none" stroke="${C.pupil}" stroke-width=".9">${turn("0;360", 1.2)}</path></g>`
      : `<g>${roam}<rect x="${x + look[0] - 1.7}" y="${28 + look[1]}" width="3.4" height="4" rx=".6" fill="${C.pupil}"/><rect x="${x + look[0]}" y="${28.5 + look[1]}" width="1" height="1" fill="#fff"/></g>`;
    const blink = spiral ? "" : `<animateTransform attributeName="transform" type="scale" values="1 1;1 1;1 .1;1 1" keyTimes="0;.93;.96;1" dur="4.5s" ${loop}/>`;
    const [outer, inner] = [x + 3.7 * side, x - 3.7 * side];
    const lid = droop
      ? `<path d="M${outer} 25.3 L${inner} 25.3 L${inner} 29.2 L${outer} 31Z" fill="${C.body}"/><path d="M${inner} 29.2 L${outer} 31" stroke="${C.pupil}" stroke-width="1.3" stroke-linecap="round"/>`
      : "";
    return `<g transform="translate(${x} 30) scale(${EYE})"><g>${blink}<g transform="translate(${-x} -30)"><rect x="${x - 3.3}" y="26" width="6.6" height="8" rx="1.6" fill="${C.eye}"/>${pupil}${lid}</g></g></g>`;
  };
  return one(X - 6, -1) + one(X + 6, 1);
}

const cheeks = `<rect x="${X - 16}" y="33.8" width="6.5" height="3" rx="1.5" fill="${C.cheek}" opacity=".85"/><rect x="${X + 9.5}" y="33.8" width="6.5" height="3" rx="1.5" fill="${C.cheek}" opacity=".85"/>`;
const stroke = (d) => `<path d="${d}" fill="none" stroke="${C.pupil}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
const MOUTH = {
  smile: stroke(`M${X - 3} 35.3 q3 2.6 6 0`),
  flat: stroke(`M${X - 2.3} 36.2 h4.6`),
  frown: stroke(`M${X - 3.5} 37.6 q3.5 -2.6 7 0`),
  wavy: stroke(`M${X - 4} 36.2 q2 -1.7 4 0 q2 1.7 4 0`),
  o: `<rect x="${X - 1.8}" y="34.6" width="3.6" height="4" rx="1.7" fill="${C.pupil}"/>`,
  grin: `<path d="M${X - 4} 34.8 h8 q0 4.4 -4 4.4 q-4 0 -4 -4.4Z" fill="${C.pupil}"/>`,
  shout: `<ellipse cx="${X}" cy="37.4" rx="2.6" ry="3" fill="${C.pupil}"/>`,
  pout: stroke(`M${X - 2.8} 37.6 q1.4 -2.4 2.8 -1 q1.4 -1.4 2.8 1`),
};
const face = (eyeOptions = {}, mouth = "smile") => eyes(eyeOptions) + cheeks + MOUTH[mouth];

// The body, grown around the ground; bob makes it float.
const grow = (inner) => `<g transform="translate(${X} ${FLOOR}) scale(${SCALE}) translate(${-X} ${-GROUND})">${inner}</g>`;
const bob = (inner, amp = 1.5, dur = 3) => `<g>${move(`0 0;0 ${-amp};0 0`, dur, spline(2))}${grow(inner)}</g>`;
// A point of the body, in the canvas' units.
const at = (x, y) => [X + (x - X) * SCALE, FLOOR + (y - GROUND) * SCALE];

const SHADOW = 1.3; // the shadow's width, against the rx values the moods give
const shadowOf = (rx = "22;19;22", dur = 3, extra = spline(2)) =>
  `<ellipse cx="${X}" cy="65" rx="${22 * SHADOW}" ry="3.2" fill="#000" opacity=".18">${anim("rx", rx.split(";").map((r) => +r * SHADOW).join(";"), dur, extra)}</ellipse>`;
// Around where each arm leaves the body, its outline stays hidden.
const rootMasks = () => {
  const masks = [...ROOTS].map((p) => {
    const [x, y] = p.split(" ");
    return `<mask id="${rootId(x, y)}" maskUnits="userSpaceOnUse" x="-60" y="-60" width="220" height="200"><rect x="-60" y="-60" width="220" height="200" fill="#fff"/><circle cx="${x}" cy="${y}" r="4" fill="#000"/></mask>`;
  });
  ROOTS.clear();
  return masks.length ? `<defs>${masks.join("")}</defs>` : "";
};
const svg = (inner, shadow = shadowOf()) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W / 2}" height="${H / 2}" viewBox="${LEFT} 0 ${W} ${H}">${rootMasks()}${shadow}${inner}</svg>`;

// Every mood starts from the rest pose, as idle stands at its start, and gets into its own within T0, so that a
// change of mood never jumps: faces cross-fade, arms rise from where the tentacle hung, props pop or fade in, and
// the mood's loops start at T0.
const T0 = 0.35;
const fade = (at, on, dur = 0.2) => `<animate attributeName="opacity" values="${on ? "0;1" : "1;0"}" dur="${dur}s" begin="${at}s" fill="freeze"/>`;
const faceIn = (options = {}, mouth = "smile", at = 0.05) => `<g>${fade(at, false)}${face()}</g><g opacity="0">${fade(at, true)}${face(options, mouth)}</g>`;
// The same for a mood that plays once: the rest face comes back at `end`.
const faceFor = (options, mouth, end) =>
  `<g>${fade(0.05, false)}${fade(end, true)}${face()}</g><g opacity="0">${fade(0.05, true)}${fade(end, false)}${face(options, mouth)}</g>`;
const fadeIn = (inner, at = T0) => `<g opacity="0">${fade(at, true)}${inner}</g>`;
const popIn = ([cx, cy], inner, at = T0) =>
  `<g transform="translate(${cx} ${cy})"><g transform="scale(0)"><animateTransform attributeName="transform" type="scale" values="0;1.12;1" keyTimes="0;.7;1" dur=".3s" begin="${at}s" fill="freeze" calcMode="spline" keySplines=".4 0 .6 1;.4 0 .6 1"/><g transform="translate(${-cx} ${-cy})">${inner}</g></g></g>`;
// A tentacle hanging at rest, as an arm's path (M Q Q) from its root at x, on her left (-1) or right (1).
const restArm = (x, side) => `M${x} 41 Q${x} 48 ${x + 2 * side} 51 Q${x + 4 * side} 53.5 ${x + 7 * side} 52`;
const raise = (from, to, at = 0.05) => `<animate attributeName="d" values="${from};${to}" dur="${T0 - at}s" begin="${at}s" fill="freeze" calcMode="spline" keySplines=".4 0 .6 1"/>`;
// An arm goes back down to where it hung, from `at`.
const lower = (from, to, at) => `<animate attributeName="d" values="${from};${to}" dur="${T0}s" begin="${at}s" fill="freeze" calcMode="spline" keySplines=".4 0 .6 1"/>`;
const later = (extra = "", at = T0) => `begin="${at}s" ${extra}`;

// Props.
// A thought bubble that floats gently up and down, its small bubbles a beat behind; it sits at the top of the picture,
// so it floats down from there and back.
const bubbleCloud = (dots) => {
  const float = (b) => move("0 0;0 4;0 0", 2.6, `begin="${-b}s" ${spline(2)}`);
  const small = (cx, cy, r, b, at) => popIn([cx, cy], `<g>${float(b)}<circle cx="${cx}" cy="${cy}" r="${r}"/></g>`, at);
  return `<g fill="#fff" stroke="${C.line}" stroke-width="1.4">${small(62.5, 21, 2.2, 0.6, T0)}${small(66.5, 15.5, 3, 0.3, T0 + 0.08)}</g>` +
    popIn([78, 9.2], `<g>${float(0)}<ellipse cx="78" cy="9.2" rx="13.5" ry="8.3" fill="#fff" stroke="${C.line}" stroke-width="1.4"/>${dots}</g>`, T0 + 0.16);
};
const star = (fill = "#ffd166") => `<path d="M0 -2.6 L.8 -.8 2.6 0 .8 .8 0 2.6 -.8 .8 -2.6 0 -.8 -.8Z" fill="${fill}" stroke="${C.line}" stroke-width=".5"/>`;
const note = `${limb("M0 0 v-6 l4 -1.5 v6", "", "#ffd166").replace(/6\.4/, "3.4").replace(/4\.2/, "1.4")}<rect x="-2.6" y="-1.6" width="3.4" height="2.8" rx="1.2" fill="#ffd166" stroke="${C.line}" stroke-width=".8"/><rect x="1.4" y="-3.1" width="3.4" height="2.8" rx="1.2" fill="#ffd166" stroke="${C.line}" stroke-width=".8"/>`;

// Sinking onto the ground, as in settle and dejected: the head comes down, the tentacles flatten and spread, then she
// breathes heavily.
const sunk = () => {
  const drop = 6.5, keys = `calcMode="spline" keySplines=".4 0 .6 1"`;
  const headMove =
    `<animateTransform attributeName="transform" type="translate" values="0 0;0 ${drop}" dur=".9s" begin=".1s" fill="freeze" ${keys}/>` +
    `<animateTransform attributeName="transform" type="translate" values="0 ${drop};0 ${drop - 1};0 ${drop}" dur="3.2s" begin="1s" ${loop} ${spline(2)}/>`;
  const squash =
    `<animateTransform attributeName="transform" type="scale" values="1 1;1.14 .56" dur=".9s" begin=".1s" fill="freeze" ${keys}/>` +
    `<animateTransform attributeName="transform" type="scale" values="1.14 .56;1.12 .62;1.14 .56" dur="3.2s" begin="1s" ${loop} ${spline(2)}/>`;
  return {
    wrapHead: (s) => `<g>${headMove}${s}</g>`,
    wrapLegs: (s) => onGround(squash, s),
    shadow: `<ellipse cx="${X}" cy="65" rx="${22 * SHADOW}" ry="3.2" fill="#000" opacity=".18"><animate attributeName="rx" values="${22 * SHADOW};${26 * SHADOW}" dur=".9s" begin=".1s" fill="freeze"/></ellipse>`,
  };
};

// How long the moods that play once at rest last, in seconds, from the rest pose back to it.
const ONCE = { wave: 5, shout: 3.6, tap: 5 };

export const MOODS = {
  // At rest.
  idle: svg(bob(body() + face())),
  lookaround: svg(
    bob(
      `<g>${turn(`0 ${X} 50;-3 ${X} 50;-3 ${X} 50;3 ${X} 50;3 ${X} 50;0 ${X} 50`, 5, later(`keyTimes="0;.1;.4;.5;.85;1"`))}` +
        body() +
        faceIn({ roam: move("0 0;-1.4 0;-1.4 0;1.4 0;1.4 0;0 0", 5, later(`keyTimes="0;.1;.4;.5;.85;1"`)) }, "flat") +
        "</g>",
    ),
  ),
  bubbles: svg(
    bob(body() + faceIn({ look: [0.6, -0.6] }, "o")) +
      [[3.2, 0], [4.4, 0.9], [2.6, 1.8]]
        .map(([r, b]) => {
          const [x, y] = at(X + 2, 35);
          return `<circle cx="${x}" cy="${y}" r="${r}" fill="#dff1ff" stroke="${C.line}" stroke-width="1" opacity="0">${move("0 0;14 2;26 -26", 2.7, `begin="${b + T0}s" ${spline(2)}`)}${anim("opacity", "0;1;1;0", 2.7, `keyTimes="0;.15;.8;1" begin="${b + T0}s"`)}</circle>`;
        })
        .join(""),
  ),
  // She waves from afar: a tentacle rises high over her head and swings from side to side, her eyes smiling, five
  // times; then it comes back down. Plays once.
  wave: (() => {
    const WAVES = 5, END = ONCE.wave - T0, WAVE = (END - T0) / WAVES;
    const rest = restArm(X + 13, 1);
    const a = `M${X + 13} 41 Q${X + 25} 40 ${X + 24} 27 Q${X + 23} 16 ${X + 17} 9`;
    const b = `M${X + 13} 41 Q${X + 25} 40 ${X + 25} 27 Q${X + 25} 16 ${X + 31} 11`;
    const swings = `<animate attributeName="d" values="${a};${b};${a}" dur="${WAVE.toFixed(3)}s" begin="${T0}s" repeatCount="${WAVES}" ${spline(2)}/>`;
    // Her body goes with the tentacle: it leans away as the tentacle rises, rocks out with each swing and bounces
    // at either end of it, then stands up again as the tentacle comes down.
    const tilt = (values, dur, begin, extra) => `<animateTransform attributeName="transform" type="rotate" values="${values.map((v) => `${v} ${X} ${FLOOR}`).join(";")}" dur="${dur}s" begin="${begin}s" ${extra}/>`;
    const ease = `calcMode="spline" keySplines=".4 0 .6 1"`;
    const rock =
      tilt([0, -4], T0 - 0.05, 0.05, `fill="freeze" ${ease}`) +
      tilt([-4, 6, -4], WAVE.toFixed(3), T0, `repeatCount="${WAVES}" ${spline(2)}`) +
      tilt([-4, 0], T0, END, `fill="freeze" ${ease}`);
    const bounce = `<animateTransform attributeName="transform" type="translate" values="0 0;0 -1.6;0 0" dur="${(WAVE / 2).toFixed(3)}s" begin="${T0}s" repeatCount="${WAVES * 2}" ${spline(2)}/>`;
    return svg(`<g>${rock}<g>${bounce}${bob(body([7]) + faceFor({ closed: "happy" }, "grin", END + 0.1) + limb(rest, raise(rest, a) + swings + lower(a, rest, END)))}</g></g>`);
  })(),
  // She calls out: two tentacles cup her mouth like a megaphone, she bends forward and leans into each call, and waves of sound go out
  // on both sides, twice; then her tentacles come back down. Plays once.
  shout: (() => {
    const CALLS = 2, END = ONCE.shout - T0, CALL = (END - T0) / CALLS; // a call, then its echo dies down
    const cup = (side) => {
      const r = X + 13 * side, rest = restArm(r, side);
      const up = `M${r} 41 Q${X + 12 * side} 45 ${X + 9.5 * side} 42 Q${X + 7.5 * side} 39.5 ${X + 6.4 * side} 37`;
      return limb(rest, raise(rest, up) + lower(up, rest, END));
    };
    const [mx, my] = at(X, 36.5);
    const waves = [-1, 1]
      .map((side) =>
        [0, 0.15, 0.3]
          .map((b) => {
            const x = mx + 25 * side;
            return `<path d="M${x} ${my - 4.5} q${2.6 * side} 4.5 0 9" fill="none" stroke="${C.line}" stroke-width="1.6" stroke-linecap="round" opacity="0">${move(`0 0;${9 * side} 0;${9 * side} 0`, CALL, later(`keyTimes="0;.5;1"`, T0 + b))}${anim("opacity", "0;1;0;0", CALL, later(`keyTimes="0;.1;.5;1"`, T0 + b))}</path>`;
          })
          .join(""),
      )
      .join("")
      .replaceAll(loop, `repeatCount="${CALLS}"`);
    // She bends forward to call, for the whole of it: her head comes down and nearer, her tentacles give.
    const ease = `calcMode="spline" keySplines=".4 0 .6 1"`;
    const bend = (type, from, to) =>
      `<animateTransform attributeName="transform" type="${type}" values="${from};${to}" dur="${T0 - 0.05}s" begin=".05s" fill="freeze" ${ease}/>` +
      `<animateTransform attributeName="transform" type="${type}" values="${to};${from}" dur="${T0}s" begin="${END}s" fill="freeze" ${ease}/>`;
    const wrapHead = (s) => `<g>${bend("translate", "0 0", "0 2.5")}<g transform="translate(${X} 43)"><g>${bend("scale", "1", "1.08")}<g transform="translate(${-X} -43)">${s}</g></g></g></g>`;
    const wrapLegs = (s) => onGround(bend("scale", "1 1", "1.06 .86"), s);
    const lean = `<animateTransform attributeName="transform" type="scale" values="1;1.05;1;1" keyTimes="0;.12;.5;1" dur="${CALL}s" ${later(`repeatCount="${CALLS}" calcMode="spline" keySplines=".3 0 .5 1;.45 0 .55 1;0 0 1 1"`)}/>`;
    return svg(
      `<g transform="translate(${X} ${FLOOR})"><g>${lean}<g transform="translate(${-X} ${-FLOOR})">` +
        grow(body([2, 7], { wrapHead, wrapLegs }) + wrapHead(faceFor({ closed: "happy" }, "shout", END + 0.1) + cup(-1) + cup(1))) +
        `</g></g></g>` +
        waves,
      shadowOf("22;22", 1),
    );
  })(),
  // She knocks at the window: she walks up to it on her tentacles as it comes in from beyond the picture onto its
  // edges, leans on its sill with two tentacles and, looking at us, her head tilted, knocks on the glass with the side of a third, from
  // its bend to its tip, flattened against it at each knock, three times two knocks; then she walks back to her rest pose and the window goes.
  // Plays once.
  tap: (() => {
    const D = ONCE.tap, NEAR = 1.25; // how much bigger she looks up at the window
    // An animation over the whole play from its [time, value] steps, eased between them.
    const track = (attr, steps, type) => {
      const k = `values="${steps.map(([, v]) => v).join(";")}" keyTimes="${steps.map(([t]) => +(t / D).toFixed(3)).join(";")}" dur="${D}s" begin="0s" fill="freeze" calcMode="spline" keySplines="${Array(steps.length - 1).fill(".4 0 .6 1").join(";")}"`;
      return type ? `<animateTransform attributeName="transform" type="${type}" ${k}/>` : `<animate attributeName="${attr}" ${k}/>`;
    };
    const WALK = 0.95, STEPS = 4, STEP = WALK / STEPS, IN = 0.05 + WALK, OUT = D - 0.05 - WALK, PRESS = 0.1;
    const KNOCKS = [1.45, 1.75, 2.45, 2.75, 3.45, 3.75];
    // From `from` to `to` between a and b, back between c and d.
    const stay = (from, to, [a, b] = [0.05, IN], [c, d] = [OUT, D - 0.05]) => [[0, from], [a, from], [b, to], [c, to], [d, from], [D, from]];
    const knocks = (rest, pressed) => [[0, rest], ...KNOCKS.flatMap((t) => [[t - PRESS, rest], [t, pressed], [t + PRESS, rest]]), [D, rest]];
    // Walking, there and back: each step lifts every other tentacle (`parity`), or every step, her whole body.
    const walk = (rest, lifted, parity) => [
      [0, rest],
      ...[0.05, OUT].flatMap((w) =>
        Array.from({ length: STEPS }, (_, k) => k).filter((k) => parity === undefined || k % 2 === parity)
          .flatMap((k) => [[w + k * STEP, rest], [w + (k + 0.5) * STEP, lifted], ...(parity === undefined && k < STEPS - 1 ? [] : [[w + (k + 1) * STEP, rest]])]),
      ),
      [D, rest],
    ];
    const wrapLeg = (i, s) => `<g>${track("", walk("0 0", "0 -2.6", [0, 3, 5].includes(i) ? 0 : 1), "translate")}${s}</g>`;
    // The window, around the picture's edges: a wooden frame, a sill along the bottom (its top seen from above, then
    // its front), two glints on the glass.
    const [L, T, R, B] = [LEFT, 0, LEFT + W, H], F = 3.5, SILL = 63, LIP = 65.5;
    const WOOD = "#c49a5a", DARK = "#a87a40", line = `stroke="${C.line}" stroke-width="1.2" stroke-linejoin="round"`;
    const sillTop = `<path d="M${L + F} ${SILL} H${R - F} L${R} ${LIP} H${L}Z" fill="${WOOD}" ${line}/>`;
    const frame =
      `<path d="M${L} ${T} H${R} V${LIP} H${L}Z M${L + F} ${T + F} V${SILL} H${R - F} V${T + F}Z" fill="${DARK}" fill-rule="evenodd" ${line}/>` +
      `<rect x="${L}" y="${LIP}" width="${W}" height="${B - LIP}" fill="${DARK}" ${line}/>` +
      `<path d="M${R - 16} ${T + 7} l-7 7 M${R - 11} ${T + 8} l-4 4" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`;
    const comes = track("", stay("2", "1"), "scale");
    const [cx, cy] = [L + W / 2, H / 2];
    const window = (inner) => `<g transform="translate(${cx} ${cy})"><g>${comes}<g transform="translate(${-cx} ${-cy})">${inner}</g></g></g>`;
    // Her arms, once she is there: two from hanging to lying along the sill, over it; one up to the glass, bent.
    const ARMS = [[IN - 0.25, IN + 0.1], [OUT, OUT + 0.4]];
    const lean = (x, s) => `M${x} 41 Q${x + 1 * s} 53 ${x + 4 * s} 56.6 Q${x + 6 * s} 58.4 ${x + 12 * s} 58.4`;
    const leans = [-1, 1].map((s) => limb(restArm(X + 13 * s, s), track("d", stay(restArm(X + 13 * s, s), lean(X + 13 * s, s), ...ARMS)))).join("");
    const knock = limb(restArm(X + 8, 1), track("d", stay(restArm(X + 8, 1), `M${X + 8} 41 Q${X + 20} 46 ${X + 19.5} 40 Q${X + 19.5} 35 ${X + 19.5} 29.5`, ...ARMS)));
    // Its side, from the bend to the tip, flattened on the glass: it shows once the arm is up and spreads at each
    // knock, its suckers against the glass, short lines going out from it.
    const [px, py] = [X + 19.5, 35];
    const side =
      `<g opacity="0">${track("opacity", [[0, 0], [ARMS[0][1] - 0.05, 0], [ARMS[0][1], 1], [OUT, 1], [OUT + 0.05, 0], [D, 0]])}<g transform="translate(${px} ${py})">` +
      `<g>${track("", knocks("1 1", "1.4 1.15"), "scale")}<rect x="-2.9" y="-9.1" width="5.8" height="15.5" rx="2.9" fill="${C.body}" stroke="${C.line}" stroke-width="1.1"/>` +
      [-6.7, -4, -1.3, 1.4, 4.1].map((y) => `<circle cy="${y}" r=".95" fill="#8fbcf0" stroke="${C.line}" stroke-width=".5"/>`).join("") + `</g>` +
      `<g opacity="0">${track("opacity", knocks(0, 1))}<path d="M6 -5.5 l2.4 -1.4 M6.6 0 h2.8 M6 5.5 l2.4 1.4" stroke="${C.line}" stroke-width="1.1" stroke-linecap="round"/></g></g></g>`;
    // Her head tilts a little to her own right (our left) as she knocks, and straightens a little at each knock; the
    // knocking tentacle stays where it is.
    const tilt = track("", stay(`0 ${X} 43`, `-8 ${X} 43`, ...ARMS), "rotate");
    const nod = track("", knocks(`0 ${X} 43`, `1.75 ${X} 43`), "rotate");
    const wrapHead = (s) => `<g>${tilt}<g>${nod}${s}</g></g>`;
    const near = track("", stay("1", `${NEAR}`), "scale");
    const steps = track("", walk("0 0", "0 -1.2"), "translate");
    const her = (inner) => `<g>${steps}<g transform="translate(${X} ${FLOOR})"><g>${near}<g transform="translate(${-X} ${-FLOOR})">${grow(inner)}</g></g></g></g>`;
    return svg(window(sillTop) + her(body([2, 7], { wrapHead, wrapLeg }) + wrapHead(faceFor({}, "o", OUT + 0.2)) + knock + side) + window(frame) + her(leans));
  })(),

  // She settles on the ground: the tentacles spread and flatten, the head comes down, the eyes close; then she breathes.
  settle: (() => {
    const drop = 6.5, keys = `calcMode="spline" keySplines=".4 0 .6 1"`;
    const headMove =
      `<animateTransform attributeName="transform" type="translate" values="0 0;0 ${drop}" dur=".9s" begin=".3s" fill="freeze" ${keys}/>` +
      `<animateTransform attributeName="transform" type="translate" values="0 ${drop};0 ${drop - 0.8};0 ${drop}" dur="3.2s" begin="1.2s" ${loop} ${spline(2)}/>`;
    const squash =
      `<animateTransform attributeName="transform" type="scale" values="1 1;1.14 .56" dur=".9s" begin=".3s" fill="freeze" ${keys}/>` +
      `<animateTransform attributeName="transform" type="scale" values="1.14 .56;1.12 .61;1.14 .56" dur="3.2s" begin="1.2s" ${loop} ${spline(2)}/>`;
    const swap = (on) => fade(1.4, on, 0.25);
    return svg(
      grow(
        body([], { wrapHead: (s) => `<g>${headMove}${s}</g>`, wrapLegs: (s) => onGround(squash, s) }) +
          `<g>${headMove}<g>${swap(false)}${face()}</g><g opacity="0">${swap(true)}${face({ closed: "sad" })}</g></g>`,
      ),
      `<ellipse cx="${X}" cy="65" rx="${22 * SHADOW}" ry="3.2" fill="#000" opacity=".18"><animate attributeName="rx" values="${22 * SHADOW};${26 * SHADOW}" dur=".9s" begin=".3s" fill="freeze"/></ellipse>`,
    );
  })(),

  // She rises a little and twirls three times on herself, her tentacles flung out, then comes back down and rests.
  // Seen from the front, a turn narrows her to a line and widens her again; her back, without a face, shows for the
  // other half. Plays once.
  twirl: (() => {
    const UP = 0.5, DOWN = 2.7, LAND = 3.2, D = LAND, TURNS = 3, STEP = 0.04;
    const show = (at, on = true) => `<set attributeName="opacity" to="${on ? 1 : 0}" begin="${at}s" fill="freeze"/>`;
    const smooth = (u) => u * u * (3 - 2 * u);
    const clamp = (u) => Math.min(1, Math.max(0, u));
    const turn = (t) => TURNS * smooth(clamp((t - UP) / (DOWN - UP)));
    const lift = (t) => smooth(clamp(t / UP)) - smooth(clamp((t - DOWN) / (LAND - DOWN)));
    const times = Array.from({ length: Math.round(D / STEP) + 1 }, (_, i) => +(i * STEP).toFixed(2));
    const keys = `keyTimes="${times.map((t) => +(t / D).toFixed(4)).join(";")}"`;
    const track = (fn) => times.map((t) => fn(t)).join(";");
    const width = (t) => Math.cos(2 * Math.PI * turn(t)).toFixed(3);
    const facing = (front) => `<animate attributeName="opacity" values="${track((t) => (Math.cos(2 * Math.PI * turn(t)) >= 0) === front ? 1 : 0)}" ${keys} calcMode="discrete" dur="${D}s" fill="freeze"/>`;
    const fling = (t) => { const f = lift(t); return `${(1 + 0.18 * f).toFixed(3)} ${(1 - 0.1 * f).toFixed(3)}`; };
    const spinning = `<animateTransform attributeName="transform" type="scale" values="${track((t) => `${width(t)} 1`)}" ${keys} dur="${D}s" fill="freeze"/>`;
    const wrapLegs = (s) => onGround(`<animateTransform attributeName="transform" type="scale" values="${track(fling)}" ${keys} dur="${D}s" fill="freeze"/>`, s);
    return svg(
      `<g>${`<animateTransform attributeName="transform" type="translate" values="${track((t) => `0 ${(-7 * lift(t)).toFixed(2)}`)}" ${keys} dur="${D}s" fill="freeze"/>`}` +
        `<g transform="translate(${X} 0)"><g>${spinning}<g transform="translate(${-X} 0)">` +
        grow(`<g>${facing(true)}${body([], { wrapLegs })}<g>${show(LAND, false)}${faceIn({ closed: "happy" }, "smile", 0.1)}</g><g opacity="0">${show(LAND)}${face()}</g></g><g opacity="0">${facing(false)}${body([], { wrapLegs })}</g>`) +
        `</g></g></g></g>`,
      `<ellipse cx="${X}" cy="65" rx="${22 * SHADOW}" ry="3.2" fill="#000" opacity=".18"><animate attributeName="rx" values="${track((t) => (22 * SHADOW * (1 - 0.3 * lift(t))).toFixed(1))}" ${keys} dur="${D}s" fill="freeze"/></ellipse>`,
    );
  })(),

  // Thinking.
  thinking: svg(
    bob(
      body([2]) +
        faceIn({ look: [0.9, -1.1] }, "flat") +
        (() => {
          // A tentacle rises from where it hung, goes out on her left and scratches the side of her head: three quick
          // strokes, a pause.
          const rest = restArm(X - 13, -1);
          const a = `M${X - 13} 41 Q${X - 26} 44 ${X - 26} 33 Q${X - 26} 22 ${X - 18.5} 23`;
          const b = `M${X - 13} 41 Q${X - 26} 44 ${X - 26} 36 Q${X - 26} 30 ${X - 18.5} 30.5`;
          return limb(rest, raise(rest, a) + anim("d", [a, b, a, b, a, b, a, a].join(";"), 2, later(`keyTimes="0;.09;.18;.27;.36;.45;.54;1" calcMode="spline" keySplines="${Array(7).fill(".45 0 .55 1").join(";")}"`)));
        })(),
      1,
      4,
    ) +
      bubbleCloud(
        `<g fill="${C.line}">${[71, 78, 85].map((x, i) => `<rect x="${x - 2.1}" y="7.1" width="4.2" height="4.2" rx="1.1" opacity=".25">${anim("opacity", ".25;1;.25;.25", 1.5, `keyTimes="0;.2;.45;1" begin="${i * 0.25}s"`)}</rect>`).join("")}</g>`,
      ),
  ),
  // She scratches her head on her left; the question mark on her right.
  puzzled: svg(
    bob(
      body([2]) +
        faceIn({ look: [1, -1.2] }, "wavy") +
        (() => {
          const rest = restArm(X - 14, -1);
          const up = `M${X - 14} 41 Q${X - 25} 42 ${X - 25} 33 Q${X - 25} 24 ${X - 21} 24`;
          return limb(rest, raise(rest, up) + turn([0, 5, 0, 5, 0, 0].map((a) => `${a} ${X - 14} 41`).join(";"), 1.8, later(`keyTimes="0;.12;.24;.36;.48;1"`)));
        })(),
      1,
      4,
    ) +
      popIn(
        [77, 18.5],
        `<g transform="translate(77 18.5) scale(1.35)"><g>${turn("-20;20;-20", 1.8, spline(2))}${limb("M-4 -4 q0 -5 4.5 -5 q4.5 0 4.5 4.2 q0 3 -4 4.5 v2.5", "", "#ffd166")}<rect x="-2" y="5" width="4" height="4" rx="1.2" fill="#ffd166" stroke="${C.line}" stroke-width="1"/></g></g>`,
      ),
  ),

  // A tentacle goes behind her back and comes out over her head with a detective's cap, which it puts on her; then
  // again with a magnifier, which it brings to her eye as she bends over the ground, her eye huge in the lens. Both
  // grow out of her back, hidden until they rise over her head. The start plays once, then she sways as she searches.
  detective: (() => {
    const ease = (n) => `calcMode="spline" keySplines="${Array(n).fill(".4 0 .6 1").join(";")}"`;
    const once = (type, values, dur, begin) =>
      `<animateTransform attributeName="transform" type="${type}" values="${values}" dur="${dur}s" begin="${begin}s" fill="freeze" ${ease(values.split(";").length - 1)}/>`;
    const show = (at, on = true) => `<set attributeName="opacity" to="${on ? 1 : 0}" begin="${at}s" fill="freeze"/>`;
    // A cap turned a little to her right: a low crown, the visor over her forehead.
    const cap = `<path d="M${X - 15} 24 Q${X - 15} 14 ${X} 14 Q${X + 15} 14 ${X + 15} 24 Q${X} 21.5 ${X - 15} 24Z" fill="#c49a5a" stroke="${C.line}" stroke-width="1"/>
      <path d="M${X - 2} 14.2 Q${X - 3} 18 ${X - 2} 22.8 M${X + 8} 15 Q${X + 9} 19 ${X + 8} 22.8 M${X - 14.6} 19 Q${X} 17 ${X + 14.6} 19" fill="none" stroke="#8a6436" stroke-width=".8"/>
      <path d="M${X - 3} 23.2 Q${X + 10} 21.2 ${X + 20} 23 Q${X + 24} 24.2 ${X + 22} 25.6 Q${X + 10} 26.8 ${X - 3} 25.2Z" fill="#a87a40" stroke="${C.line}" stroke-width="1" stroke-linejoin="round"/>
      <rect x="${X + 1}" y="12.6" width="2.8" height="2.4" rx="1" fill="#a87a40" stroke="${C.line}" stroke-width=".8"/>`;
    // The magnifier, held at 0 0, GRIP from the lens' center, the rest of its handle (to HANDLE) showing below the grip.
    const RADIUS = 11, GRIP = 20, HANDLE = 26, K = RADIUS / 7, u = [Math.cos((62 * Math.PI) / 180), Math.sin((62 * Math.PI) / 180)];
    const along = (k) => `${((k - GRIP) * u[0]).toFixed(2)} ${((k - GRIP) * u[1]).toFixed(2)}`; // k from the lens' center
    const [lx, ly] = [-GRIP * u[0], -GRIP * u[1]].map((n) => +n.toFixed(2));
    const T = { behind: 0.3, cap: 0.95, loupe: 2.25, look: 2.75, search: 2.9 }; // the tentacle goes behind her, the cap comes forward, the magnifier, the lens reaches her eye, the search loops
    const loupe = (front) =>
      `<path d="M${along(HANDLE)} L${along(RADIUS + 1)}" stroke="#6b4a2b" stroke-width="3.6" stroke-linecap="round"/><path d="M${along(RADIUS + 0.8)} L${along(RADIUS + 3.4)}" stroke="#4a5563" stroke-width="4.3"/>
      <circle cx="${lx}" cy="${ly}" r="${RADIUS}" fill="#e6f4ff" fill-opacity=".3" stroke="#4a5563" stroke-width="2.6">${front ? `<animate attributeName="fill-opacity" values=".3;.95" dur=".25s" begin="${T.look}s" fill="freeze"/>` : ""}</circle>` +
      (front
        ? `<g opacity="0"><animate attributeName="opacity" values="0;1" dur=".25s" begin="${T.look}s" fill="freeze"/><g transform="translate(${lx} ${ly}) scale(${K.toFixed(3)})"><g>
            <animateTransform attributeName="transform" type="scale" values="1 1;1 1;1 .1;1 1" keyTimes="0;.93;.96;1" dur="4.5s" ${loop}/>
            <rect x="-4.2" y="-4.8" width="8.4" height="9.6" rx="2.4" fill="${C.eye}"/>
            <g>${move("0 0;.9 .3;0 0;-1.5 -.45;0 0", 3.2, `begin="${T.search}s" ${spline(4)}`)}<rect x="-1.2" y="-1" width="4.4" height="5.2" rx="1" fill="${C.pupil}"/><rect x="1.4" y="-.4" width="1.4" height="1.4" fill="#fff"/></g></g></g></g>`
        : "") +
      `<path transform="translate(${lx} ${ly}) scale(${K.toFixed(3)})" d="M-4.6 -1.2 q.5 -2.8 3.4 -3.6" fill="none" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".9"/>`;
    // At her eye she holds it by the side, the handle out past her right: turned SIDE degrees from how it comes out.
    const SIDE = 32, aside = [Math.cos(((62 - SIDE) * Math.PI) / 180), Math.sin(((62 - SIDE) * Math.PI) / 180)];
    const held = `${(X + 8 + GRIP * aside[0]).toFixed(2)} ${(30.5 + GRIP * aside[1]).toFixed(2)}`;
    // The tentacle doing it all: hanging; at her side; behind her; over her head with the cap; setting it on her head;
    // behind her again; over her head with the magnifier; out to her right with it; holding it under her face.
    const P = (dx, y) => `${X + dx} ${y}`;
    const arm = {
      hang: `M${P(8, 41)} Q${P(8, 48)} ${P(10, 51)} Q${P(12, 53.5)} ${P(15, 52)}`,
      side: `M${P(8, 41)} Q${P(17, 44)} ${P(20, 38)} Q${P(22, 34)} ${P(21, 30)}`,
      behind: `M${P(8, 41)} Q${P(17, 44)} ${P(20, 37)} Q${P(22, 31)} ${P(8, 30)}`,
      capUp: `M${P(8, 41)} Q${P(18, 43)} ${P(20, 34)} Q${P(22, 24)} ${P(14, 14)}`,
      capOn: `M${P(8, 41)} Q${P(18, 43)} ${P(20, 35)} Q${P(22, 28)} ${P(14, 21)}`,
      behindAgain: `M${P(8, 41)} Q${P(17, 44)} ${P(20, 39)} Q${P(22, 35)} ${P(8, 36)}`,
      loupeUp: `M${P(8, 41)} Q${P(17, 44)} ${P(22, 42)} Q${P(28, 40)} ${P(34, 40)}`,
      pull: `M${P(8, 41)} Q${P(18, 45)} ${P(26, 43)} Q${P(34, 41)} ${P(39.3, 41.2)}`,
      hold: `M${P(8, 41)} Q${P(14, 47)} ${P(19, 46)} Q${P(24, 45)} ${held}`,
    };
    const tip = (k) => arm[k].split(" ").slice(-2).join(" ");
    const steps = [
      ["side", 0.3, 0], ["behind", 0.2, T.behind], ["capUp", 0.45, 0.5], ["capOn", 0.3, T.cap], ["behindAgain", 0.2, 1.25],
    ];
    // Bringing the magnifier out is one flowing move: it slows at its ends, never at the poses between.
    const FLOW = `keyTimes="0;.36;.57;1" calcMode="spline" keySplines=".45 0 .6 .75;.3 .35 .7 .7;.3 .3 .55 1"`;
    const armMoves =
      steps
        .map(([to, dur, begin], i) => `<animate attributeName="d" values="${arm[i ? steps[i - 1][0] : "hang"]};${arm[to]}" dur="${dur}s" begin="${begin}s" fill="freeze" ${ease(1)}/>`)
        .join("") + `<animate attributeName="d" values="${["behindAgain", "loupeUp", "pull", "hold"].map((k) => arm[k]).join(";")}" dur="1.4s" begin="1.45s" fill="freeze" ${FLOW}/>`;
    // An item at the tentacle's tip, from small and hidden behind her head to full size over it.
    const grows = (from, to, dur, begin, item) =>
      `<g transform="translate(${tip(from)})">${once("translate", `${tip(from)};${tip(to)}`, dur, begin)}<g transform="scale(.6)">${once("scale", ".6;1", dur, begin)}${item}</g></g>`;
    const CAP_HOLD = [X + 14, 21]; // where the tentacle holds the cap: the right of its crown
    // Bending over: the head comes down and tilts towards the lens, the tentacles give a little; then she sways.
    const PIVOT = `${X} 43`;
    const bend =
      once("translate", "0 0;0 3", 0.6, T.loupe) +
      `<g>${once("rotate", `0 ${PIVOT};14 ${PIVOT}`, 0.6, T.loupe)}<animateTransform attributeName="transform" type="rotate" values="14 ${PIVOT};18 ${PIVOT};14 ${PIVOT};10 ${PIVOT};14 ${PIVOT}" dur="3.2s" begin="${T.search}s" ${loop} ${spline(4)}/>`;
    const wrapHead = (s) => `<g>${bend}${s}</g></g>`;
    // Her eyes follow: the tentacle going behind her, the cap above, the tentacle again, the magnifier, then down through the lens.
    const roam =
      `<animateTransform attributeName="transform" type="translate" values="-1 -1.5;.5 -1.5;-.4 -3;-.4 -3;.5 -1.5;.2 -2.6;0 0" keyTimes="0;.18;.33;.44;.51;.79;1" dur="2.85s" fill="freeze"/>` +
      move("0 0;.6 .2;0 0;-1 -.3;0 0", 3.2, `begin="${T.search}s" ${spline(4)}`);
    return svg(
      grow(
        // Behind her: the tentacle, the cap, the magnifier.
        `<g opacity="0">${show(T.behind)}${show(T.loupe, false)}${limb(arm.side, armMoves)}</g>` +
          `<g opacity="0">${show(0.5)}${show(T.cap, false)}${grows("behind", "capUp", 0.45, 0.5, `<g transform="translate(${-CAP_HOLD[0]} ${-CAP_HOLD[1]})">${cap}</g>`)}</g>` +
          `<g opacity="0">${show(1.45)}${show(T.loupe, false)}<g transform="translate(${tip("behindAgain")})"><animateTransform attributeName="transform" type="translate" values="${tip("behindAgain")};${tip("loupeUp")};${tip("pull")}" keyTimes="0;.625;1" dur=".8s" begin="1.45s" fill="freeze" calcMode="spline" keySplines=".45 0 .6 .75;.3 .35 .7 .7"/><g transform="rotate(-35)"><animateTransform attributeName="transform" type="rotate" values="-35;10;3" keyTimes="0;.625;1" dur=".8s" begin="1.45s" fill="freeze" calcMode="spline" keySplines=".45 0 .6 .75;.3 .35 .7 .7"/><g transform="scale(.45)">${once("scale", ".45;1", 0.5, 1.45)}${loupe(false)}</g></g></g></g>` +
          body([6], { wrapHead, wrapLegs: (s) => onGround(once("scale", "1 1;1.06 .8", 0.6, T.loupe), s) }) +
          // In front: the cap set on her head, the magnifier brought to her eye, the tentacle.
          wrapHead(
            faceIn({ look: [1, 1.5], roam }, "o") +
              `<g opacity="0">${show(T.cap)}<g transform="translate(0 -7)">${once("translate", "0 -7;0 0", 0.3, T.cap)}${cap}</g></g>` +
              `<g opacity="0">${show(T.loupe)}<g transform="translate(${P(39.3, 41.2)})"><animateTransform attributeName="transform" type="translate" values="${P(39.3, 41.2)};${held}" dur=".6s" begin="${T.loupe}s" fill="freeze" calcMode="spline" keySplines=".3 .3 .55 1"/><g transform="rotate(3)"><animateTransform attributeName="transform" type="rotate" values="3;${-SIDE - 6};${-SIDE}" keyTimes="0;.6;1" dur=".6s" begin="${T.loupe}s" fill="freeze" ${ease(2)}/>${loupe(true)}</g></g></g>` +
              `<g>${show(T.behind, false)}${show(T.loupe)}${limb(arm.hang, armMoves)}</g>`,
          ),
      ),
      shadowOf("22;22", 1),
    );
  })(),

  // Tools.
  // From her rest pose she sits down, a tentacle goes behind her back and comes out over her head with a closed
  // laptop, grown from small and hidden until then; she brings it down in front of her, opens it, and types with two
  // tentacles reaching over its screen, which hides her up to just under her mouth, happily rocking her head. The
  // start plays once.
  laptop: (() => {
    const ease = (n) => `calcMode="spline" keySplines="${Array(n).fill(".4 0 .6 1").join(";")}"`;
    const once = (type, values, dur, begin) =>
      `<animateTransform attributeName="transform" type="${type}" values="${values}" dur="${dur}s" begin="${begin}s" fill="freeze" ${ease(values.split(";").length - 1)}/>`;
    const show = (at, on = true) => `<set attributeName="opacity" to="${on ? 1 : 0}" begin="${at}s" fill="freeze"/>`;
    const DROP = 3; // sitting, the head comes down this much; arms are drawn with the head, the laptop on the ground
    const T = { sat: 0.6, behind: 0.7, out: 0.9, front: 1.4, down: 2.0, open: 2.3, type: 2.6 };
    // The laptop, held at the right end of its base (0 0): closed, a slab; opening, its screen rises.
    const laptop = (opens) =>
      `<rect x="-38" y="-3.4" width="38" height="2" rx="1" fill="#d8dee6" stroke="${C.line}" stroke-width="1.2">${
        opens
          ? `<animate attributeName="y" values="-3.4;-17.1" dur=".3s" begin="${T.down}s" fill="freeze" ${ease(1)}/><animate attributeName="height" values="2;16.5" dur=".3s" begin="${T.down}s" fill="freeze" ${ease(1)}/>`
          : ""
      }</rect>` +
      (opens ? `<rect x="-21.2" y="-11.05" width="4.4" height="4.4" rx="1.1" fill="#9aa7b6" opacity="0"><animate attributeName="opacity" values="0;1" dur=".15s" begin="${T.down + 0.15}s" fill="freeze"/></rect>` : "") +
      `<rect x="-38" y="-1.6" width="38" height="3.2" rx="1.6" fill="#b9c3cf" stroke="${C.line}" stroke-width="1"/>`;
    const HOLD = { hidden: [X + 9, 32], up: [X + 27, 29], placed: [X + 19, 58.6] }; // on the ground's coordinates; placed a little in front of her, nearer to us
    const TILT = 28; // out on her right, held up at a slant, its far end over her head
    const at = ([x, y]) => `${x} ${y}`;
    // The right tentacle, in the head's coordinates (DROP above the ground's).
    const R = `M${X + 8} 41`;
    const arm = {
      hang: `${R} Q${X + 8} 48 ${X + 10} 51 Q${X + 12} 53.5 ${X + 15} 52`,
      side: `${R} Q${X + 17} 44 ${X + 20} 38 Q${X + 22} 34 ${X + 21} 30`,
      behind: `${R} Q${X + 17} 44 ${X + 20} 37 Q${X + 22} 31 ${X + 9} 29`,
      up: `${R} Q${X + 19} 44 ${X + 25} 38 Q${X + 28} 33 ${X + 27} ${29 - DROP}`,
      down: `${R} Q${X + 17} 43 ${X + 20} 46 Q${X + 21} 49 ${X + 19} ${58.6 - DROP}`,
    };
    // Typing: a hump over the screen's edge, the tip behind it; each side taps in turn.
    const typing = (side) => {
      const x = (dx) => X + dx * side;
      return {
        low: `M${x(8)} 41 Q${x(10)} 42 ${x(10)} 43 Q${x(10)} 44 ${x(7.5)} 45`,
        up: `M${x(8)} 41 Q${x(10.5)} 36.75 ${x(10.38)} 36.5 Q${x(10.25)} 36.25 ${x(7.5)} 40`,
        down: `M${x(8)} 41 Q${x(10)} 38.25 ${x(9.75)} 38.63 Q${x(9.5)} 39 ${x(7)} 42.5`,
      };
    };
    const [left, right] = [typing(-1), typing(1)];
    const d = (from, to, dur, begin) => `<animate attributeName="d" values="${from};${to}" dur="${dur}s" begin="${begin}s" fill="freeze" ${ease(1)}/>`;
    const tap = (k, begin) => `<animate attributeName="d" values="${k.up};${k.down};${k.up}" dur=".3s" begin="${begin}s" ${loop}/>`;
    const rightMoves =
      d(arm.hang, arm.side, 0.3, 0.4) + d(arm.side, arm.behind, 0.2, T.behind) + d(arm.behind, arm.up, 0.5, T.out) +
      d(arm.up, arm.down, 0.6, T.front) + d(arm.down, right.up, 0.3, T.open) + tap(right, T.type);
    const leftMoves = d(left.low, left.up, 0.3, T.open) + tap(left, T.type + 0.15);
    // Sitting: the head comes down, the tentacles give. Typing, she happily rocks her head from side to side.
    // It slows only at each side: through the middle it keeps its speed (the end splines start and finish at the
    // middle one's slope), so it never stops there.
    const rock = [0, 12, -12, 0].map((a) => `${a} ${X} 43`).join(";");
    const wrapHead = (s) =>
      `<g>${once("translate", `0 0;0 ${DROP}`, T.sat, 0)}<g><animateTransform attributeName="transform" type="rotate" values="${rock}" keyTimes="0;.25;.75;1" dur="1.6s" begin="${T.type}s" ${loop} calcMode="spline" keySplines=".3 .545 .55 1;.45 0 .55 1;.45 0 .7 .455"/>${s}</g></g>`;
    const wrapLegs = (s) => onGround(once("scale", "1 1;1.05 .8", T.sat, 0), s);
    // Her eyes: ahead, then the tentacle going behind her, the laptop over her head, then down on it.
    const roam = `<animateTransform attributeName="transform" type="translate" values="0 -1.3;0 -1.3;1 -1.3;.5 -3;.5 -3;0 0" keyTimes="0;.2;.35;.5;.7;1" dur="2s" fill="freeze"/>`;
    return svg(
      grow(
        // Behind her: the tentacle and the closed laptop.
        wrapHead(`<g opacity="0">${show(T.behind)}${show(T.front, false)}${limb(arm.side, rightMoves)}</g>`) +
          `<g opacity="0">${show(T.out)}${show(T.front, false)}<g transform="translate(${at(HOLD.hidden)})">${once("translate", `${at(HOLD.hidden)};${at(HOLD.up)}`, 0.5, T.out)}<g>${once("rotate", `0;${TILT}`, 0.5, T.out)}<g transform="scale(.5)">${once("scale", ".5;1", 0.5, T.out)}${laptop(false)}</g></g></g></g>` +
          body([6], { wrapHead, wrapLegs }) +
          wrapHead(
            `<g>${fade(T.type, false)}${faceIn({ look: [0, 1.3], roam }, "flat")}</g><g opacity="0">${fade(T.type, true)}${face({ closed: "happy" })}</g>` +
              `<g>${show(T.behind, false)}${show(T.front)}${limb(arm.hang, rightMoves)}</g>` +
              `<g opacity="0">${show(T.open)}${limb(left.low, leftMoves)}</g>`,
          ) +
          // In front: the laptop brought down to the ground and opened.
          `<g opacity="0">${show(T.front)}<g transform="translate(${at(HOLD.up)})">${once("translate", `${at(HOLD.up)};${at(HOLD.placed)}`, 0.6, T.front)}<g transform="rotate(${TILT})">${once("rotate", `${TILT};0`, 0.6, T.front)}<g><animateTransform attributeName="transform" type="translate" values="0 0;.4 .8;0 0;-.4 .8;0 0" keyTimes="0;.15;.5;.65;1" dur=".3s" begin="${T.type}s" ${loop}/>${laptop(true)}</g></g></g></g>`,
      ),
      shadowOf("22;22", 1),
    );
  })(),
  // A retro all-in-one computer, seen from her side: it falls on her right from above and bounces, her eyes follow it
  // down, then she turns to it, leans in and types with a tentacle from each side while code writes itself on the
  // screen. The start plays once.
  desktop: (() => {
    const ease = (n) => `calcMode="spline" keySplines="${Array(n).fill(".4 0 .6 1").join(";")}"`;
    const T = { land: 0.8, reach: 0.8, type: 1.2 };
    const SHELL = "#e9e7df", SHADE = "#c9c6bb", SURF = "#6cc2ab", SURF_DARK = "#4a9e88", SCREEN = "#12302b";
    // The screen faces her, a little turned to us: its lines slant with its edges.
    const slope = -2.9 / 14;
    const line = (x, y, w, color, i) => {
      const len = Math.hypot(w, w * slope).toFixed(2);
      return `<path d="M${x} ${y} l${w} ${(w * slope).toFixed(2)}" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="${len}" stroke-dashoffset="${len}">
        <animate attributeName="stroke-dashoffset" values="${len};${len};0;0;${len}" keyTimes="0;${(i * 0.15).toFixed(2)};${(i * 0.15 + 0.15).toFixed(2)};.9;1" dur="3.2s" begin="${T.type}s" ${loop}/></path>`;
    };
    // After the photo: seen three-quarters from her side, a near-square greyed-white front with a big screen faces
    // her, edged in surf green; the green shell bulges round to its back; two little green speakers and a disc slot
    // under the screen; a green foot; a keyboard of grey keys in a green frame, and a round mouse on its cable.
    const computer =
      `<path d="M63 56.5 L79 54.5 L84 57.2 L67.5 59.6Z" fill="${SURF_DARK}" stroke="${C.line}" stroke-width="1" stroke-linejoin="round"/>
      <path d="M80 21.5 Q88.5 22.5 90.6 32 Q92 40 89.5 46 Q86.5 52.5 80 53.5Z" fill="${SURF}" stroke="${C.line}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M82.5 24.5 Q87.5 27 88.6 34" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".55"/>
      <path d="M60.5 25.5 L80.5 21.5 L80.5 54 L60.5 52Z" fill="${SURF}" stroke="${C.line}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M61.8 26.7 L79.3 23.2 L79.3 52.8 L61.8 50.9Z" fill="${SHELL}" stroke-linejoin="round"/>
      <path d="M63.6 29 L77.6 26.1 L77.6 44.4 L63.6 45.2Z" fill="${SCREEN}" stroke="${SHADE}" stroke-width=".9" stroke-linejoin="round"/>
      <ellipse cx="64.9" cy="48" rx="1.7" ry="1.1" fill="${SURF}"/><ellipse cx="76.5" cy="47.6" rx="1.7" ry="1.1" fill="${SURF}"/>
      <path d="M68.6 48.6 L72.8 48.1" stroke="${SURF_DARK}" stroke-width="1" stroke-linecap="round"/>` +
      [[64.6, 32, 10, "#9ff0c8"], [65.8, 35.2, 6.5, "#ffd166"], [65.8, 38.4, 8.5, "#9ff0c8"], [64.6, 41.6, 5, "#9ff0c8"]].map(([x, y, w, c], i) => line(x, y, w, c, i)).join("") +
      // The keyboard and the mouse in front of it.
      `<path d="M73 61.2 Q76 63 79 58" fill="none" stroke="${SHADE}" stroke-width=".8"/>
      <rect x="51" y="58.4" width="18" height="3.8" rx="1.4" fill="${SURF}" stroke="${C.line}" stroke-width="1"/><rect x="52.3" y="59.4" width="15.4" height="1.8" rx=".6" fill="${SHADE}"/>
      <path d="M53 60.3 h14" stroke="${SHELL}" stroke-width=".9" stroke-dasharray="1.4 .7"/>
      <ellipse cx="72" cy="61.2" rx="2.4" ry="1.4" fill="${SURF}" stroke="${C.line}" stroke-width=".9"/>`;
    // It falls from above the picture and bounces twice on the ground before settling.
    const pop = `<g transform="translate(0 -80)"><animateTransform attributeName="transform" type="translate" values="0 -80;0 0;0 -5;0 0;0 -1.5;0 0" keyTimes="0;.55;.7;.82;.9;1" dur="${T.land}s" fill="freeze" calcMode="spline" keySplines=".5 0 1 1;0 0 .5 1;.5 0 1 1;0 0 .5 1;.5 0 1 1"/><g transform="translate(91 62) scale(1.25) translate(-91 -62)">${computer}</g></g>`;
    // Once it has landed she turns to it: her body narrows a little, her face moves over to the side towards it and
    // narrows more; she leans a little towards it.
    const TURN = 0.4, BODY = 0.9, FACE = 0.8, FACE_SHIFT = 5;
    const turnTo = (scale, shift, s) =>
      `<g><animateTransform attributeName="transform" type="translate" values="0 0;${shift} 0" dur="${TURN}s" begin="${T.land}s" fill="freeze" ${ease(1)}/>` +
      `<g transform="translate(${X} 0)"><g><animateTransform attributeName="transform" type="scale" values="1 1;${scale} 1" dur="${TURN}s" begin="${T.land}s" fill="freeze" ${ease(1)}/><g transform="translate(${-X} 0)">${s}</g></g></g></g>`;
    const lean = (s) => `<g><animateTransform attributeName="transform" type="rotate" values="0 ${X + 10} ${GROUND};8 ${X + 10} ${GROUND}" dur="${TURN}s" begin="${T.land}s" fill="freeze" ${ease(1)}/>${s}</g>`;
    // A tentacle from each side goes to the keyboard, the left one across her front; they tap in turn.
    const ARMS = [[-8, 55, 3], [13, 61, 7]]; // root offset, tip x on the keyboard, the tentacle it replaces
    const arms = ARMS.map(([dx, tip], i) => {
      const r = +(X + dx * BODY).toFixed(2); // where its root is once she has turned
      const hang = `M${r} 41 Q${r} 48 ${r + 2} 51 Q${r + 4} 53.5 ${r + 7} 52`;
      const rest = dx < 0 ? `M${r} 41 Q${r + 4} 50 ${r + 13} 50.5 Q${tip - 4} 51 ${tip} 52.6` : `M${r} 41 Q${r + 6} 44 ${r + 8} 48 Q${tip + 0.5} 51 ${tip} 52.6`;
      const lift = dx < 0 ? `M${r} 41 Q${r + 4} 47.5 ${r + 12} 46.5 Q${tip - 3} 45 ${tip} 47.2` : `M${r} 41 Q${r + 6} 42.5 ${r + 8.5} 45 Q${tip + 1} 46 ${tip} 47.2`;
      return limb(
        hang,
        `<animate attributeName="d" values="${hang};${rest}" dur=".4s" begin="${T.reach}s" fill="freeze" ${ease(1)}/>` +
          `<animate attributeName="d" values="${rest};${lift};${rest}" dur=".3s" begin="${T.type + i * 0.15}s" ${loop} ${spline(2)}/>`,
      );
    }).join("");
    const back = `<animateTransform attributeName="transform" type="translate" values="0 0;-14 0" dur=".45s" begin=".25s" fill="freeze" ${ease(1)}/>`;
    // Her eyes follow it down, then stay on the screen.
    const roam = `<animateTransform attributeName="transform" type="translate" values="-1.6 -.3;0 -2.2;.4 0;0 0" keyTimes="0;.35;.75;1" dur="1s" fill="freeze"/>`;
    return svg(
      // As it lands she backs away to the left, to make room for it.
      pop + `<g>${back}` + grow(lean(turnTo(BODY, 0, body(ARMS.map(([, , k]) => k)) + turnTo(FACE / BODY, FACE_SHIFT, faceIn({ look: [1.6, 0.3], roam }, "smile"))) + arms)) + `</g>`,
      `<g>${back}${shadowOf("22;22", 1)}</g>`,
    );
  })(),

  // A tool failed.
  // She sinks onto the ground as in settle, crestfallen: eyelids drooping over eyes cast down, a frown; then breathes
  // heavily while a big drop of sweat slides down the side of her head, again and again.
  dejected: (() => {
    const { wrapHead, wrapLegs, shadow } = sunk();
    // The drop, three times the size it had: it appears high on her right, slides down and fades, over and over.
    const sweat =
      `<g opacity="0"><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.12;.78;1" dur="3.2s" begin="1.1s" ${loop}/>` +
      `<g>${move("0 0;0 0;0 6;0 6", 3.2, `keyTimes="0;.12;.85;1" begin="1.1s" ${spline(3)}`)}` +
      // A teardrop: pointed at the top, its bottom a half circle.
      `<path d="M${X + 19} 11 C${X + 20.5} 19 ${X + 24.4} 24 ${X + 24.4} 29.9 A5.4 5.4 0 0 1 ${X + 13.6} 29.9 C${X + 13.6} 24 ${X + 17.5} 19 ${X + 19} 11Z" fill="#9fd3ff" stroke="${C.line}" stroke-width="1.4"/>` +
      `<path d="M${X + 16} 31.5 q-.5 -3.8 1.4 -7" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".85"/></g></g>`;
    return svg(
      grow(
        body([], { wrapHead, wrapLegs }) + wrapHead(faceIn({ look: [0, 1.6], droop: true }, "frown") + sweat),
      ),
      shadow,
    );
  })(),
  // A cloud of ink grows all around her, from nothing to its full size, and fades, while she jolts and winces. It has
  // a white edge, to show on a dark background too.
  ink: (() => {
    const D = 2.6, CENTER = [X, 37];
    const puffs = Array.from({ length: 12 }, (_, i) => {
      const a = (i * 30 * Math.PI) / 180, d = 22 + (i % 2) * 5, r = 9 + (i % 3) * 2.2;
      return [CENTER[0] + d * Math.cos(a), CENTER[1] + d * Math.sin(a) * 0.75, r];
    });
    const grows = later(`keyTimes="0;.55;1" calcMode="spline" keySplines=".25 .6 .45 1;0 0 1 1"`);
    // Drawn twice: a little bigger in white, then in ink, for a white edge round the whole cloud.
    const cloud = (grown, color) =>
      puffs.map(([x, y, r]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="0" fill="${color}">${anim("r", `0;${r + grown + 1.5};${r + grown + 1.5}`, D, grows)}</circle>`).join("");
    return svg(
      `<g opacity=".88">${anim("opacity", ".88;.88;0;0", D, later(`keyTimes="0;.5;.85;1"`))}${cloud(1.3, "#fff")}${cloud(0, C.ink)}</g>` +
        `<g>${move("0 0;2 -2;0 0;0 0", D, later(`keyTimes="0;.08;.3;1"`))}${grow(body() + faceIn({ closed: "sad" }, "wavy"))}</g>`,
    );
  })(),

  // Sunk onto the ground as in dejected, she sulks: eyelids low, a pout. The silence crow of anime flies across
  // above her head and leaves three dots behind it, which fade once it has gone.
  crow: (() => {
    const D = 10.5, FLIGHT = 7, START = 1, FROM = -42, TO = 112, Y = 14, SIZE = 1.3; // a slow, leisurely pass
    const ink = C.ink, edge = `stroke="#fff" stroke-width=".9" stroke-linejoin="round"`;
    // Our own round crow, facing left: a fan of tail feathers, a round body, a big round eye, an open yellow beak,
    // and a notched wing that flaps.
    const up = `M1 -2 Q4 -10.5 9.5 -9.5 Q7.5 -7 8.5 -5 Q5.5 -4.5 2.5 -1Z`;
    const down = `M1 1 Q4 9.5 9.5 8.5 Q7.5 6 8.5 4 Q5.5 3.5 2.5 1Z`;
    const bird =
      [[9, -2.6, -18], [10.2, 0, 0], [9, 2.6, 18]].map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="3.4" ry="1.5" transform="rotate(${a} ${x} ${y})" fill="${ink}" ${edge}/>`).join("") +
      `<circle r="6.4" fill="${ink}" ${edge}/>` +
      `<path d="M-5.6 -.9 L-10.6 .1 L-5.4 1.1Z" fill="#ffc940" stroke="${ink}" stroke-width=".5" stroke-linejoin="round"/>` +
      `<path d="M-5.4 1.7 L-9.3 3 L-5 3.5Z" fill="#ffc940" stroke="${ink}" stroke-width=".5" stroke-linejoin="round"/>` +
      `<circle cx="-2.4" cy="-1.8" r="2.9" fill="#fff" stroke="${ink}" stroke-width=".5"/><circle cx="-3.1" cy="-1.7" r="1.15" fill="${ink}"/>` +
      `<path d="${up}" fill="${ink}" ${edge}>${anim("d", `${up};${down};${up}`, 0.6, spline(2))}</path>`;
    // From out of sight on the right it flies across with a slight wave, then stays out of sight on the left until
    // the next pass (the motion adds to where the group stands).
    const flight = `<animateMotion path="M0 0 Q${(TO - FROM) / 4} -3 ${(TO - FROM) / 2} 1 T${TO - FROM} 0" dur="${D}s" keyPoints="0;1;1" keyTimes="0;${(FLIGHT / D).toFixed(2)};1" calcMode="linear" begin="${START}s" ${loop}/>`;
    // Its dots, all along its way across the picture: each appears once the crow has passed it, and all fade together
    // after it has gone.
    const dots = Array.from({ length: 10 }, (_, i) => -6 + i * 10)
      .map((x) => {
        const t = ((x + 10 - FROM) / (TO - FROM)) * FLIGHT; // once its tail is past
        const k = (n) => +(n / D).toFixed(3);
        return `<circle cx="${x}" cy="${Y + 2}" r="2.3" fill="${ink}" ${edge} opacity="0"><animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;${k(t)};${k(t + 0.15)};${k(FLIGHT + 0.3)};${k(FLIGHT + 0.9)};1" dur="${D}s" begin="${START}s" ${loop}/></circle>`;
      })
      .join("");
    const { wrapHead, wrapLegs, shadow } = sunk();
    return svg(
      grow(body([], { wrapHead, wrapLegs }) + wrapHead(faceIn({ look: [-0.6, 0.6], droop: true }, "pout"))) +
        dots +
        `<g transform="translate(${FROM} ${Y})">${flight}<g transform="scale(${-SIZE} ${SIZE})">${bird}</g></g>`,
      shadow,
    );
  })(),

  // The turn is done.
  lightbulb: svg(
    bob(
      body([7]) +
        faceIn({ look: [1, -1.2] }, "grin") +
        (() => {
          const rest = restArm(X + 13, 1);
          const up = `M${X + 13} 41 Q${X + 23} 41 ${X + 23} 33 Q${X + 23} 29 ${X + 23} 25`;
          return limb(rest, raise(rest, up) + turn(`0 ${X + 13} 41;-4 ${X + 13} 41;0 ${X + 13} 41`, 1.2, later(spline(2))));
        })(),
      1,
      3,
    ) +
      // The bulb in the picture's top right corner, its rays against the edges, by her raised tentacle: it lights up,
      // its rays flash, a filament glows.
      popIn(
        [77.6, 14.4],
        `<g transform="translate(77.6 14.4) scale(.8)">
        <g stroke="#e0b000" stroke-width="2" stroke-linecap="round" opacity="0">${anim("opacity", "0;0;1;1;0", 2.4, later(`keyTimes="0;.2;.3;.9;1"`))}<path d="M0 -14 v-3 M14 0 h3 M-14 0 h-3 M9.9 -9.9 l2.2 -2.2 M-9.9 -9.9 l-2.2 -2.2"/></g>
        <rect x="-11" y="-11" width="22" height="22" rx="9" fill="#ffe27a" stroke="${C.line}" stroke-width="1.6" fill-opacity=".2">${anim("fill-opacity", ".2;.2;1;1;.2", 2.4, later(`keyTimes="0;.2;.3;.9;1"`))}</rect>
        <path d="M-4 3 l2 -4 l2 4 l2 -4 l2 4" fill="none" stroke="#b08a00" stroke-width="1.2" stroke-linejoin="round" opacity=".5">${anim("opacity", ".5;.5;1;1;.5", 2.4, later(`keyTimes="0;.2;.3;.9;1"`))}</path>
        <rect x="-6" y="11" width="12" height="8" rx="2" fill="#b9c3cf" stroke="${C.line}" stroke-width="1.3"/><path d="M-6 14.5 h12" stroke="${C.line}" stroke-width=".9"/></g>`,
      ),
  ),
  jump: (() => {
    const keys = `keyTimes="0;.15;.4;.65;.75;1"`;
    return svg(
      `<g>${move("0 0;0 1.5;0 -9;0 0;0 1;0 0", 1.4, later(keys))}${grow(body() + faceIn({ closed: "happy" }, "grin"))}</g>`,
      shadowOf("22;23;15;22;23;22", 1.4, later(keys)),
    );
  })(),
  dance: svg(
    `<g>${turn([0, 7, 0, -7, 0].map((a) => `${a} ${X} ${FLOOR}`).join(";"), 1.2, later(spline(4)))}` +
      grow(
        body([2, 7]) +
          faceIn({ closed: "happy" }, "grin") +
          [-1, 1]
            .map((side) => {
              const r = X + 13 * side, rest = restArm(r, side);
              const up = `M${r} 41 Q${r + 10 * side} 41 ${r + 10 * side} 35.5 Q${r + 10 * side} 33 ${r + 10 * side} 30`;
              // Each arm waves in turn, the right half a beat later.
              return limb(rest, raise(rest, up) + turn([0, -25 * side, 0].map((a) => `${a} ${r} 41`).join(";"), 0.6, later(spline(2), side < 0 ? T0 : T0 + 0.3)));
            })
            .join(""),
      ) +
      `</g>` +
      // Two notes, twice their first size, rise and fade by turns.
      [[67, 36, 0], [79, 44, 0.8]]
        .map(([x, y, b]) => `<g transform="translate(${x} ${y})" opacity="0"><g>${move("0 0;3 -14", 1.6, `begin="${b + T0}s"`)}<g transform="scale(2)">${note}</g></g>${anim("opacity", "0;1;1;0", 1.6, `keyTimes="0;.2;.7;1" begin="${b + T0}s"`)}</g>`)
        .join(""),
    shadowOf("22;20;22", 0.6),
  ),

  // Compaction is near.
  dizzy: svg(
    `<g>${turn([0, 6, 0, -6, 0].map((a) => `${a} ${X} ${FLOOR}`).join(";"), 1.8, later(spline(4)))}${grow(body() + faceIn({ spiral: true }, "wavy"))}</g>` +
      fadeIn([0, 0.6, 1.2].map((b) => `<g><animateMotion dur="1.8s" ${loop} begin="-${b}s" path="M${X} 8.8 a19 2 0 1 0 0.1 0Z"/><g transform="scale(2.6)">${star()}</g></g>`).join("")),
    shadowOf("22;20;22", 0.9),
  ),

};

// The size Otto is drawn at in the band, in px.
export const OTTO = { width: W / 2, height: H / 2 };

// How long each mood plays before a reaction moves on (ms): its start and about a loop of it.
export const PLAY_MS = {
  idle: 3000, lookaround: 5400, bubbles: 3500, settle: 4500, twirl: 3600,
  ...Object.fromEntries(Object.entries(ONCE).map(([name, s]) => [name, s * 1000])),
  thinking: 4000, puzzled: 4000, detective: 5500,
  laptop: 4500, desktop: 4500,
  dejected: 4500, ink: 3000, crow: 8500,
  lightbulb: 3200, jump: 3200, dance: 3200, dizzy: 4000,
};

// How long a mood holds the band before Claude's next move may replace it: the detective brings the magnifier to her
// eye (2.75 s) and looks through it a second.
export const HOLD_MS = { detective: 3750 };

// The mood's SVG, `along` ms after it began: the desktop rebuilds the picture on every redraw, so every animation
// begins that much earlier and the drawing carries on where it was. A browser shows nothing of an animation that
// played once and ended before the picture appeared, not even its frozen end: such an animation begins just early
// enough to end a millisecond after, so it freezes where it should.
export function ottoSvg(name, along) {
  const TAG = /<(?:animate|animateTransform|animateMotion|set)\b[^>]*>/g;
  // A run of animation tags animates one element; the later begin wins an attribute, so only the last on each
  // attribute is clamped: clamping one it hands over to (an arm's earlier moves) would put it back on top.
  return MOODS[name].replace(new RegExp(`(?:${TAG.source})+`, "g"), (run) => {
    const tags = run.match(TAG).map((tag) => {
      const begin = tag.match(/begin="(-?[\d.]+)s"/);
      return { tag, begin, at: begin ? begin[1] * 1000 : 0, attr: tag.match(/attributeName="([^"]+)"/)?.[1] };
    });
    return tags
      .map(({ tag, begin, at, attr }) => {
        const last = !tags.some((t) => t.attr === attr && t.at > at);
        at -= along;
        const dur = tag.match(/dur="([\d.]+)s"/);
        if (last && dur && tag.includes('fill="freeze"') && !tag.includes("repeatCount")) at = Math.max(at, 1 - dur[1] * 1000);
        const value = `begin="${Math.round(at)}ms"`;
        return begin ? tag.replace(begin[0], value) : tag.replace(/\/?>$/, (end) => ` ${value}${end}`);
      })
      .join("");
  });
}
