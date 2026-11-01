/* =====================================================================
   ASSEMBLE — scroll-driven particle scene.
   Starlight gathers into a spiral galaxy, then into a figure made of
   dots, then scatters back into the sky.
   Every target shape is drawn with canvas paths (no image files), then
   sampled into points + colours.
   ===================================================================== */
(() => {
  const section = $("#me"), canvas = $("#assemble-canvas");
  if (!section || !canvas) return;
  const ctx = canvas.getContext("2d");
  const caps = $$("#captions li").map((li) => ({ li, from: +li.dataset.from, to: +li.dataset.to }));

  const C = {
    royal: "#7a5cf0", deep: "#5a3fd0", neon: "#ffb84d", neon2: "#c9b8ff", orange: "#ff6b35",
    mustard: "#ffb84d", cream: "#fff1df", peach: "#f6c9a8", teal: "#ffd9a0",
  };
  const PALETTE = [[255, 184, 77], [255, 107, 53], [255, 241, 223], [201, 184, 255], [122, 92, 240], [246, 201, 168], [228, 71, 43]];

  const mobile = innerWidth < 700;
  const N = mobile ? 1100 : lowEnd ? 1400 : 2300;
  const STAR = [255, 244, 230];
  const rand = rng(7);

  /* ---------- particles ---------- */
  const P = Array.from({ length: N }, () => {
    const a = rand() * Math.PI * 2;
    const roll = rand();
    return {
      sx: rand(), sy: rand(),                                    // star pos (mapped into the free area)
      gr: Math.pow(rand(), 0.9),                                 // galaxy radius (0..1)
      ga: ((rand() * 2) | 0) * Math.PI + (rand() - 0.5) * 1.1,   // galaxy arm + jitter
      bx: Math.cos(a), by: Math.sin(a), br: 0.6 + rand() * 0.9,  // burst direction
      d: rand() * 0.35,                                          // stagger delay
      sw: (rand() - 0.5) * 220,                                  // swirl strength
      ph: rand() * 6.283,
      size: (mobile ? 1.1 : 1.3) + rand() * (mobile ? 1.6 : 2.1),
      kind: roll < 0.58 ? 0 : roll < 0.86 ? 1 : 2,               // 0 dot, 1 sprinkle dash, 2 square
      rot: rand() * 6.283, vr: (rand() - 0.5) * 0.04,
      sc: PALETTE[(rand() * PALETTE.length) | 0],
      cache: {},                                                 // colour strings per held state
    };
  });

  /* ---------- background star field (never moves into a shape) ---------- */
  const fr = rng(41);
  const FIELD = Array.from({ length: mobile ? 160 : lowEnd ? 200 : 320 }, () => ({
    sx: fr(), sy: fr(), r: 0.5 + fr() * 1.1, ph: fr() * 6.283,
    c: fr() < 0.75 ? "255,244,230" : fr() < 0.5 ? "201,184,255" : "255,184,77",
  }));

  /* ---------- shape drawings (1000×1000 design space) ---------- */
  const SHAPES = {
    person(g) {
      // one performer: MJ's fedora, pointed-to-the-sky pose, white glove and socks;
      // a rock singer leaning into a tilted mic stand; an electric guitar slung low.
      // grey = the figure (brightness → dot density), orange = guitar, blue = mic stand
      const grey = (v) => `rgb(${v},${v},${v})`;
      const lit = g.createLinearGradient(330, 0, 700, 0);
      lit.addColorStop(0, grey(250)); lit.addColorStop(1, grey(150));
      const legs = g.createLinearGradient(380, 0, 660, 0);
      legs.addColorStop(0, grey(225)); legs.addColorStop(1, grey(125));
      const limb = (pts, w, style) => {
        g.strokeStyle = style; g.lineWidth = w; g.lineCap = "round"; g.lineJoin = "round";
        g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.stroke();
      };
      const shape = (d, style) => { g.fillStyle = style; g.fill(new Path2D(d)); };
      const ell = (x, y, rx, ry, rot, style) => { g.fillStyle = style; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, 6.283); g.fill(); };
      const MIC = "rgb(80,90,255)", GTR = "rgb(255,110,40)", GTR2 = "rgb(255,200,90)";

      // tilted mic stand, leaning in to the singer's mouth
      limb([232, 938, 186, 968], 10, MIC); limb([232, 938, 282, 968], 10, MIC); limb([232, 938, 232, 968], 10, MIC);
      limb([232, 938, 420, 262], 12, MIC);
      ell(432, 250, 23, 14, -0.65, MIC);

      // legs: weight on one leg, the other knee bent in, up on the toe (white socks)
      limb([478, 575, 455, 742, 440, 896], 54, legs);
      limb([556, 575, 604, 724, 588, 864], 52, legs);
      ell(440, 892, 24, 10, 0, grey(255)); ell(589, 862, 22, 9, -0.2, grey(255));
      shape("M420,898 L370,916 L364,940 L454,936 L462,904 Z", grey(95));
      shape("M574,868 L604,874 L614,934 L590,938 Z", grey(95));
      shape("M458,498 L580,494 L594,588 L446,592 Z", legs);                              // hips

      // jacket, flaring at the hem
      shape("M442,312 C484,298 556,296 592,312 L592,400 C590,452 588,504 598,566 L444,572 C452,504 450,452 444,400 Z", lit);
      limb([518, 312, 522, 500], 6, grey(140));                                           // jacket opening

      // electric guitar slung low across the hips, neck up to the right
      g.save(); g.translate(494, 602); g.rotate(-0.5); g.scale(-1, 1);
      g.fillStyle = GTR2; g.fillRect(-300, -10, 210, 20);
      g.fillStyle = GTR;
      g.beginPath(); g.moveTo(-300, -13); g.lineTo(-346, -24); g.lineTo(-350, 10); g.lineTo(-300, 12); g.closePath(); g.fill();
      g.fill(new Path2D("M-104,8 C-114,-42 -72,-66 -42,-52 C-20,-44 -8,-58 14,-66 C46,-76 76,-62 78,-38 C82,-18 102,-18 112,-2 C124,24 104,62 62,66 C20,70 -12,56 -42,64 C-84,74 -100,46 -104,8 Z"));
      g.fillStyle = GTR2; g.fill(new Path2D("M-60,4 C-60,-20 -30,-30 0,-24 C24,-20 40,-4 34,14 C26,34 -4,34 -30,28 C-50,24 -60,18 -60,4 Z"));
      g.restore();

      // arms: one points straight up (white glove), one grips the mic stand
      limb([580, 322, 628, 228, 650, 132], 38, lit);
      ell(654, 114, 15, 21, 0.15, grey(255)); limb([656, 98, 660, 64], 9, grey(255));
      limb([452, 326, 412, 414, 393, 360], 38, lit);
      ell(393, 360, 18, 16, 0, grey(225));

      // neck + head tipped back toward the mic, under a fedora
      limb([500, 266, 506, 302], 30, grey(195));
      ell(494, 224, 36, 46, -0.35, lit);
      g.save(); g.translate(500, 178); g.rotate(-0.3);
      ell(0, 8, 68, 13, 0, grey(215));                                                    // brim
      shape("M-38,8 C-40,-30 -24,-48 0,-50 C24,-48 40,-30 38,8 Z", grey(225));            // crown
      g.fillStyle = grey(120); g.fillRect(-38, -6, 76, 10);                               // hat band
      g.restore();
    },
  };

  /* Draw a shape offscreen, collect filled pixels, pick N random ones. */
  function sample(draw) {
    const R = 360, off = document.createElement("canvas");
    off.width = off.height = R;
    const g = off.getContext("2d", { willReadFrequently: true });
    g.scale(R / 1000, R / 1000);
    draw(g);
    const { data } = g.getImageData(0, 0, R, R);
    const hits = [];
    for (let i = 0; i < R * R; i++) if (data[i * 4 + 3] > 150) hits.push(i);
    const out = { x: new Float32Array(N), y: new Float32Array(N), c: new Array(N) };
    if (!hits.length) return null;
    const r2 = rng(11);
    for (let k = 0; k < N; k++) {
      let i = hits[(r2() * hits.length) | 0];
      if (draw === SHAPES.person) {
        // brighter grey = more dots (stipple); guitar and mic stand are always kept
        for (let tries = 0; tries < 30; tries++) {
          const rr = data[i * 4], bb = data[i * 4 + 2];
          if (Math.abs(rr - bb) > 80 || r2() <= Math.pow(rr / 255, 1.3)) break;
          i = hits[(r2() * hits.length) | 0];
        }
        let x = ((i % R) + r2()) / R, y = (((i / R) | 0) + r2()) / R;
        const rr = data[i * 4], gg2 = data[i * 4 + 1], bb = data[i * 4 + 2], l = rr / 255;
        let col = l > 0.8 ? [255, 247, 238] : l > 0.6 ? [226, 216, 255] : [176, 156, 248];
        if (rr - bb > 80) col = gg2 > 150 ? [255, 196, 96] : [255, 120, 60];      // guitar
        else if (bb - rr > 80) col = [214, 202, 255];                              // mic stand
        else if (r2() < 0.14) {                  // loose spray around the figure
          const u = Math.max(r2(), 1e-6), v = r2(), m = Math.sqrt(-2 * Math.log(u)) * 0.045;
          x += m * Math.cos(6.283 * v); y += m * Math.sin(6.283 * v);
          col = [200, 186, 255];
        }
        out.x[k] = x; out.y[k] = y; out.c[k] = col;
        continue;
      }
      out.x[k] = ((i % R) + r2()) / R;
      out.y[k] = (((i / R) | 0) + r2()) / R;
      out.c[k] = [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]];
    }
    return out;
  }

  const shapes = {};
  function buildShapes() {
    for (const k in SHAPES) shapes[k] = sample(SHAPES[k]);
  }

  /* ---------- timeline of states over scroll progress ---------- */
  const STAGES = [
    [0.00, "stars"], [0.05, "stars"],
    [0.20, "cloud"], [0.36, "cloud"],
    [0.54, "person"], [0.88, "person"],
    [1.00, "burst"],
  ];
  const isShape = (s) => s !== "stars" && s !== "burst";

  /* ---------- canvas sizing ---------- */
  let w, h, dpr, frame;
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, lowEnd ? 1 : 1.5);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const narrow = w < 900;
    const s = narrow ? Math.min(w * 0.82, h * 0.46) : Math.min(h * 0.72, w * 0.44);
    const cx = narrow ? w / 2 : w * 0.68, cy = narrow ? h * 0.37 : h * 0.5;
    frame = { x: cx - s / 2, y: cy - s / 2, s, cx, cy };
    layoutSky();
  }

  /* star positions, recomputed on resize */
  function layoutSky() {
    for (const p of P) { p.px = p.sx * w; p.py = p.sy * h; }
    for (const f of FIELD) { f.x = f.sx * w; f.y = f.sy * h; }
  }

  const mouse = { x: -9999, y: -9999, moved: false };
  section.addEventListener("mousemove", (e) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.moved = true; });
  section.addEventListener("mouseleave", () => { mouse.x = mouse.y = -9999; mouse.moved = true; });

  const pos = [0, 0];
  const wobble = lowEnd ? 0 : 1;
  function stateAt(p, i, s, t) {
    if (s === "cloud") {                       // a two-armed spiral galaxy, slowly turning
      const r = (p.gr * 0.92 + p.d * 0.22) * frame.s * 0.52, ang = p.ga + p.gr * 7.5 + t * 0.00012 / (0.35 + p.gr);
      pos[0] = frame.cx + Math.cos(ang) * r * 1.18;
      pos[1] = frame.cy + Math.sin(ang) * r * 0.72;
      return p.sc;
    }
    if (s === "stars") {
      pos[0] = p.px + Math.sin(t * 0.0004 + p.ph) * 14 * wobble;
      pos[1] = p.py + Math.cos(t * 0.0003 + p.ph) * 14 * wobble;
      return p.sc;
    }
    if (s === "burst") {
      const R = Math.max(w, h) * p.br;
      pos[0] = frame.cx + p.bx * R; pos[1] = frame.cy + p.by * R;
      return shapes.person ? shapes.person.c[i] : p.sc;
    }
    const sh = shapes[s];
    if (!sh) return stateAt(p, i, "cloud", t);
    pos[0] = frame.x + sh.x[i] * frame.s + Math.sin(t * 0.0016 + p.ph) * 1.4 * wobble;
    pos[1] = frame.y + sh.y[i] * frame.s + Math.cos(t * 0.0013 + p.ph) * 1.4 * wobble;
    return sh.c[i];
  }

  /* background nebula: colour weights keyed to each stage */
  const sticky = section.querySelector(".assemble-sticky");
  const NEB = [[0, .1, .02, .02], [.2, .5, .2, .1], [.52, .7, .16, .12], [.88, .45, .4, .35], [1, .15, .15, .2]];
  let nebKey = "";
  function nebula(prog) {
    let k = 0;
    while (k < NEB.length - 2 && prog >= NEB[k + 1][0]) k++;
    const a = NEB[k], b = NEB[k + 1], t = clamp((prog - a[0]) / (b[0] - a[0]));
    const key = prog.toFixed(3);
    if (key === nebKey) return; nebKey = key;
    sticky.style.setProperty("--ap", key);
    for (let j = 1; j <= 3; j++) sticky.style.setProperty(`--w${j}`, lerp(a[j], b[j], t).toFixed(3));
  }

  let lastProg = -1, lastPinned = null, lastEnter = -1;
  function render(t, prog, pinned, edge = 0) {
    let k = 0;
    while (k < STAGES.length - 2 && prog >= STAGES[k + 1][0]) k++;
    const [a0, A] = STAGES[k], [b0, B] = STAGES[k + 1];
    const seg = clamp((prog - a0) / (b0 - a0 || 1));
    const hold = A === B;
    const star = 1 - clamp(prog / 0.1);    // pieces start life as stars

    ctx.clearRect(0, 0, w, h);

    // warm glow behind assembled shapes
    const g = (isShape(A) ? 1 - seg : 0) + (isShape(B) ? seg : 0);
    if (g > 0.02) {
      const rg = ctx.createRadialGradient(frame.cx, frame.cy, 0, frame.cx, frame.cy, frame.s * 0.7);
      rg.addColorStop(0, `rgba(255,150,70,${0.16 * g})`); rg.addColorStop(1, "rgba(255,150,70,0)");
      ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
    }

    const appear = edge > 0 ? clamp(1 - edge / (VH * 0.8)) : 1;    // 0 → 1 as the scene slides in
    const mouseOn = mouse.x > -9000;
    for (const f of FIELD) {
      const a = (0.35 + 0.45 * Math.sin(t * 0.0016 + f.ph)) * appear;
      if (a <= 0.02) continue;
      ctx.fillStyle = `rgba(${f.c},${a.toFixed(3)})`;
      ctx.fillRect(f.x, f.y, f.r, f.r);
    }
    if (appear !== lastEnter) { lastEnter = appear; sticky.style.setProperty("--enter", appear.toFixed(3)); }
    // while the scene slides in over the hero, fade the pieces near its top edge
    const fadeH = edge > 0 ? VH * 0.5 * clamp(edge / (VH * 0.6)) : 0;
    for (let i = 0; i < N; i++) {
      const p = P[i];
      let x, y, r, gg, b, colStr = null;
      if (hold) {
        const c = stateAt(p, i, B, t); x = pos[0]; y = pos[1];
        if (star === 0) colStr = p.cache[B] || (p.cache[B] = `rgb(${c[0]},${c[1]},${c[2]})`);
        else { r = c[0]; gg = c[1]; b = c[2]; }
      } else {
        const lt = ease(clamp((seg - p.d) / 0.65));
        const ca = stateAt(p, i, A, t); const ax = pos[0], ay = pos[1];
        const cb = stateAt(p, i, B, t); const bx = pos[0], by = pos[1];
        const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
        const off = Math.sin(Math.PI * lt) * p.sw * Math.min(len, 400) / 400;
        x = lerp(ax, bx, lt) - (dy / len) * off;
        y = lerp(ay, by, lt) + (dx / len) * off;
        r = lerp(ca[0], cb[0], lt); gg = lerp(ca[1], cb[1], lt); b = lerp(ca[2], cb[2], lt);
      }
      let s = p.size, kind = p.kind;
      let starA = 1;
      if (star > 0) {
        r = lerp(r, STAR[0], star * 0.9); gg = lerp(gg, STAR[1], star * 0.9); b = lerp(b, STAR[2], star * 0.9);
        s = lerp(s, 0.45 + p.size * 0.18, star);
        if (star > 0.5) kind = 2;
        const tw = 0.5 + 0.5 * Math.sin(t * 0.0018 + p.ph * 3);
        starA = lerp(1, 0.2 + 0.55 * tw, star);
      }
      if (mouseOn) {
        const mx = x - mouse.x, my = y - mouse.y, md = mx * mx + my * my;
        if (md < 8100) { const d = Math.sqrt(md) || 1, f = (90 - d) * 0.55; x += (mx / d) * f; y += (my / d) * f; }
      }

      ctx.globalAlpha = fadeH && y < fadeH ? Math.max(0, y / fadeH) : 1;
      if (appear < 1) ctx.globalAlpha *= clamp((appear * 1.5 - p.d / 0.35 * 0.5) * 2.5);
      ctx.globalAlpha *= starA;
      ctx.fillStyle = colStr || `rgb(${r | 0},${gg | 0},${b | 0})`;
      if (kind === 2 || (kind === 0 && s < 1.5)) ctx.fillRect(x - s, y - s, s * 1.8, s * 1.8);
      else if (kind === 0) { ctx.beginPath(); ctx.arc(x, y, s, 0, 6.283); ctx.fill(); }
      else {                                   // rotated sprinkle without save/restore
        p.rot += p.vr * wobble;
        const c = Math.cos(p.rot), sn = Math.sin(p.rot), L = s * 1.9, W = s * 0.45;
        ctx.beginPath();
        ctx.moveTo(x - c * L + sn * W, y - sn * L - c * W);
        ctx.lineTo(x + c * L + sn * W, y + sn * L - c * W);
        ctx.lineTo(x + c * L - sn * W, y + sn * L + c * W);
        ctx.lineTo(x - c * L - sn * W, y - sn * L + c * W);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
    // captions + bar (captions only once the scene is pinned, so they never overlap the hero)
    if (prog !== lastProg || pinned !== lastPinned) {
      for (const c of caps) {
        c.li.classList.toggle("on", pinned && prog >= c.from && prog <= c.to);
        c.li.classList.toggle("past", prog > c.to);
      }
      nebula(prog);
      lastProg = prog; lastPinned = pinned;
    }
  }

  resize();
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); });

  // explicitly load the display font: fonts.ready alone won't fetch a face nothing has used yet
  const fontLoad = document.fonts ? document.fonts.load('600 200px "Clash Display"').catch(() => {}) : Promise.resolve();
  const ready = Promise.race([fontLoad, new Promise((r) => setTimeout(r, 3000))]);

  if (reduceMotion) {
    ready.then(() => { buildShapes(); render(0, 0.27, true); });
    return;
  }
  ready.then(() => { buildShapes(); lastProg = -1; });

  let active = false, lastEdge = -1;
  new IntersectionObserver(([e]) => {
    active = e.isIntersecting;
  }).observe(section);

  onFrame((t) => {
    if (!active) return;
    const top = box(section).top, prog = sceneProgress(section), pinned = scrollY >= top - 2;
    // on slower machines, skip identical frames
    const edge = Math.max(0, top - scrollY);
    if (lowEnd && prog === lastProg && pinned === lastPinned && edge === lastEdge && !mouse.moved) return;
    mouse.moved = false; lastEdge = edge;
    render(t, prog, pinned, edge);
  });
})();
