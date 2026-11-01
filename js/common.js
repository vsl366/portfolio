/* =====================================================================
   COMMON — shared engine for every page.
   Performance notes:
   - Section positions are measured once (and on resize) and cached, so
     scroll effects never force layout reads mid-frame.
   - Scroll effects only run when the scroll position actually changed.
   - Lenis smooths wheel scrolling (falls back to native if the CDN fails).
   ===================================================================== */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const lowEnd = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t); // smoothstep
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* Seeded RNG so generated art looks the same on every visit. */
function rng(seed = 1) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

/* ---------- smooth scrolling ---------- */
const lenis = !reduceMotion && window.Lenis
  ? new Lenis({ lerp: lowEnd ? 0.16 : 0.1, wheelMultiplier: 0.9, smoothWheel: true })
  : null;
window.__lenis = lenis;

/* ---------- cached measurements ---------- */
let VH = innerHeight, dirty = true;
const boxes = new Map();
function measure(el) {
  const r = el.getBoundingClientRect();
  const b = { top: r.top + scrollY, h: r.height };
  boxes.set(el, b);
  return b;
}
const box = (el) => boxes.get(el) || measure(el);
function remeasure() { VH = innerHeight; boxes.forEach((_, el) => measure(el)); dirty = true; }
let remeasureTimer;
const scheduleRemeasure = () => { clearTimeout(remeasureTimer); remeasureTimer = setTimeout(remeasure, 120); };
addEventListener("resize", scheduleRemeasure);
addEventListener("load", remeasure);
if (document.fonts) document.fonts.ready.then(remeasure);
if (window.ResizeObserver) new ResizeObserver(scheduleRemeasure).observe(document.body);

/* Progress (0→1) of a tall section while its sticky child is pinned. */
function sceneProgress(section) {
  const b = box(section), total = b.h - VH;
  return total > 0 ? clamp((scrollY - b.top) / total) : 0;
}
/* Progress (0→1) of an element travelling through the viewport. */
function viewProgress(el) {
  const b = box(el);
  return clamp((scrollY + VH - b.top) / (b.h + VH));
}
function inView(el, margin = 0) {
  const b = box(el);
  return b.top < scrollY + VH + margin && b.top + b.h > scrollY - margin;
}

/* ---------- one shared rAF loop ---------- */
const frameFns = new Set();   // every frame (canvases, easing)
const scrollFns = new Set();  // only when the scroll position changed
const onFrame = (fn) => frameFns.add(fn);
const onScroll = (fn) => { scrollFns.add(fn); dirty = true; };
let lastSY = -1;
(function loop(t) {
  if (lenis) lenis.raf(t);
  const sy = scrollY;
  if (sy !== lastSY || dirty) { lastSY = sy; dirty = false; scrollFns.forEach((fn) => fn(sy)); }
  frameFns.forEach((fn) => fn(t));
  requestAnimationFrame(loop);
})(performance.now());

/* ---------- footer, year, mail links ---------- */
function fillCommon() {
  $$("[data-site]").forEach((el) => { el.textContent = SITE[el.dataset.site]; });
  $$("[data-mail]").forEach((a) => { a.href = `mailto:${SITE.email}`; });
  const y = $("#year"); if (y) y.textContent = new Date().getFullYear();
  const soc = $("#socials");
  if (soc) {
    // links still set to "#" (e.g. Resume) stay hidden until a real URL is added in data.js
    soc.innerHTML = [{ label: SITE.email, url: `mailto:${SITE.email}` }, ...SITE.socials.filter((x) => x.url && x.url !== "#")]
      .map((s) => `<li><a class="magnetic" href="${esc(s.url)}" ${s.url.startsWith("http") ? 'target="_blank" rel="noopener"' : s.url.endsWith(".pdf") ? "download" : ""}>${esc(s.label)}</a></li>`)
      .join("");
  }
}

/* ---------- nav: solid on scroll, progress bar, mobile menu, active link, smooth anchors ---------- */
function initNav() {
  const nav = $("#nav"), bar = $(".progress"), toggle = $(".nav-toggle");
  let lastNavY = scrollY;
  onScroll((sy) => {
    nav.classList.toggle("scrolled", sy > 40);
    // hide while scrolling down, reveal on the way back up
    if (sy > lastNavY + 6 && sy > 160) nav.classList.add("nav-hidden");
    else if (sy < lastNavY - 6 || sy < 160) nav.classList.remove("nav-hidden");
    lastNavY = sy;
    const max = document.documentElement.scrollHeight - VH;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? sy / max : 0})`;
  });
  const close = () => { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); toggle.setAttribute("aria-label", "Open menu"); };
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  $$(".nav-links a").forEach((a) => a.addEventListener("click", close));
  addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

  // in-page anchors glide with Lenis
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || !lenis) return;
    const id = a.getAttribute("href"), target = id.length > 1 && document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { duration: 1.8 });
    history.replaceState(null, "", id);
  });

  const links = new Map($$(".nav-links a[href^='#']").map((a) => [a.getAttribute("href").slice(1), a]));
  if (!links.size) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.remove("active"));
      links.get(e.target.id)?.classList.add("active");
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("main [id]").forEach((s) => links.has(s.id) && io.observe(s));
}

/* ---------- scroll reveal + count-up numbers ---------- */
function initReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add("in");
      io.unobserve(el);
      setTimeout(() => { el.style.transitionDelay = ""; }, 1600);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach((el) => {
    const idx = [...el.parentElement.children].filter((n) => n.classList.contains("reveal")).indexOf(el);
    el.style.transitionDelay = `${Math.min(idx, 6) * 90}ms`;
    io.observe(el);
  });

  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countIO.unobserve(e.target);
      const el = e.target, end = +el.dataset.count, dec = +el.dataset.decimals || 0, pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
      if (reduceMotion) return;
      const t0 = performance.now();
      (function step(t) {
        const p = Math.min((t - t0) / 1800, 1), k = 1 - Math.pow(1 - p, 4);
        el.textContent = pre + (end * k).toFixed(dec) + suf;
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach((el) => countIO.observe(el));
}

/* ---------- cursor, magnetic buttons, tilt ---------- */
function initPointer() {
  if (!finePointer) return;
  document.body.classList.add("has-cursor");
  const cursor = $(".cursor"), dot = $(".cursor-dot"), ring = $(".cursor-ring");
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
  addEventListener("mousemove", (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px)`;
    cursor.classList.remove("hidden");
  }, { passive: true });
  document.addEventListener("mouseleave", () => cursor.classList.add("hidden"));
  onFrame(() => {
    if (Math.abs(mx - rx) + Math.abs(my - ry) < 0.1) return;
    rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
    ring.style.transform = `translate(${rx.toFixed(1)}px, ${ry.toFixed(1)}px)`;
  });
  document.addEventListener("mouseover", (e) => cursor.classList.toggle("hover", !!e.target.closest("a, button, .tilt, [data-hover]")));
  if (reduceMotion) return;
  bindMagnetic(document);
  bindTilt(document);
}
function bindMagnetic(root) {
  if (!finePointer || reduceMotion) return;
  $$(".magnetic", root).forEach((el) => {
    if (el._mag) return; el._mag = 1;
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.3}px, ${(e.clientY - r.top - r.height / 2) * 0.4}px)`;
    });
    el.addEventListener("mouseleave", () => { el.style.transform = ""; });
  });
}
function bindTilt(root) {
  if (!finePointer || reduceMotion) return;
  $$(".tilt", root).forEach((el) => {
    if (el._tilt) return; el._tilt = 1;
    const inner = el.querySelector(".tilt-inner") || el;
    inner.style.transition = "transform .5s cubic-bezier(.22,1,.36,1)";
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      inner.style.transform = `perspective(900px) rotateY(${(px - 0.5) * 12}deg) rotateX(${(0.5 - py) * 12}deg) scale(1.02)`;
      el.style.setProperty("--mx", `${px * 100}%`);
      el.style.setProperty("--my", `${py * 100}%`);
      el.style.setProperty("--tx", (px - 0.5).toFixed(3));   // numeric, for parallax layers inside
      el.style.setProperty("--ty", (py - 0.5).toFixed(3));
    });
    el.addEventListener("mouseleave", () => { inner.style.transform = ""; el.style.setProperty("--tx", 0); el.style.setProperty("--ty", 0); });
  });
}

/* ---------- sprinkle blobs (Art & Piano pages) ---------- */
function blobPath(rand, n = 7, wobble = 0.28) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, r = 50 * (1 - wobble / 2 + rand() * wobble);
    pts.push([50 + Math.cos(a) * r, 50 + Math.sin(a) * r]);
  }
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1.map((v) => v.toFixed(1))} ${c2.map((v) => v.toFixed(1))} ${p2.map((v) => v.toFixed(1))}`;
  }
  return d + "Z";
}
let blobId = 0;
function blobSVG({ fill, ink, kind = "dash", seed = 1, density = 1 }) {
  const rand = rng(seed * 97 + 13), id = `spr${blobId++}`;
  const marks = [];
  const count = Math.round(70 * density);
  for (let i = 0; i < count; i++) {
    const x = rand() * 100, y = rand() * 100, rot = rand() * 180;
    if (kind === "dot") marks.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.7 + rand() * 0.6).toFixed(2)}"/>`);
    else if (kind === "squiggle") marks.push(`<path d="M${x.toFixed(1)},${y.toFixed(1)} q2,-3 4,0 t4,0" fill="none" stroke-width="1.1" transform="rotate(${rot.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`);
    else marks.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="3.6" height="1" rx=".5" transform="rotate(${rot.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`);
  }
  const d = blobPath(rand);
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
    <defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs>
    <path d="${d}" fill="${fill}"/>
    <g clip-path="url(#${id})" fill="${ink}" stroke="${ink}">${marks.join("")}</g>
  </svg>`;
}
function spawnBlobs(layer, spec) {
  layer.innerHTML = spec.map((b, i) => `<div class="blob" data-speed="${b.speed ?? 0.2}" style="left:${b.x}%;top:${b.y}%;width:${b.size}px;height:${b.size}px;opacity:${b.opacity ?? 1};--rot:${b.rot ?? 0}deg">${blobSVG({ ...b, seed: b.seed ?? i + 1 })}</div>`).join("");
}

/* ---------- ridgelines: the building block of every landscape ---------- */
function ridgePoints(rand, w, base, amp, n = 6, rough = 0.55) {
  let ys = [base + (rand() - 0.5) * amp, base + (rand() - 0.5) * amp], a = amp;
  for (let k = 0; k < n; k++) {
    const next = [];
    for (let i = 0; i < ys.length - 1; i++) next.push(ys[i], (ys[i] + ys[i + 1]) / 2 + (rand() * 2 - 1) * a);
    next.push(ys[ys.length - 1]); ys = next; a *= rough;
  }
  const step = w / (ys.length - 1);
  return ys.map((y, i) => [i * step, y]);
}
function ridgeSVG(rand, { w = 1600, h = 300, base, amp, color, cls = "", n = 6, rough = 0.55, trees = 0, keep = false }) {
  const pts = ridgePoints(rand, w, base, amp, n, rough);
  let shapes = `<polygon fill="${color}" points="0,${h} ${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")} ${w},${h}"/>`;
  for (let i = 0; i < trees; i++) {                      // Firewatch-style pines on the ridge
    const [x, y] = pts[(rand() * pts.length) | 0], th = 10 + rand() * 18, tw = th * 0.34;
    for (let k = 0; k < 3; k++) {
      const ty = y - th + k * th * 0.28, sp = tw * (0.55 + k * 0.25);
      shapes += `<polygon fill="${color}" points="${x.toFixed(1)},${ty.toFixed(1)} ${(x - sp).toFixed(1)},${(ty + th * 0.42).toFixed(1)} ${(x + sp).toFixed(1)},${(ty + th * 0.42).toFixed(1)}"/>`;
    }
  }
  return `<svg class="${cls}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="${keep ? "xMidYMax slice" : "none"}" aria-hidden="true">${shapes}</svg>`;
}

/* Little layered landscapes for cards (they parallax on hover + scroll). */
const SCENES = {
  night: { sky: ["#140d2b", "#4b2f85"], orb: "#fff1dc", glow: "rgba(190,160,255,.55)", orbY: 24, layers: ["#7d68cf", "#4a3790", "#1f1438"], trees: 0 },
  lilac: { sky: ["#241a52", "#9b83e6"], orb: "#fff6ea", glow: "rgba(230,215,255,.6)", orbY: 22, layers: ["#a58ff0", "#6b4fd8", "#2a1a4a"], trees: 0 },
  dusk:  { sky: ["#2a1640", "#d0566e"], orb: "#ffd59a", glow: "rgba(255,170,120,.6)", orbY: 46, layers: ["#b54c74", "#6e2a55", "#2a1230"], trees: 6 },
  ember: { sky: ["#2a1036", "#e0623e"], orb: "#ffe39a", glow: "rgba(255,190,110,.65)", orbY: 50, layers: ["#c4553e", "#7a2c3a", "#2b1020"], trees: 8 },
  dawn:  { sky: ["#ff9a45", "#ffe1a0"], orb: "#fff3c4", glow: "rgba(255,240,190,.8)", orbY: 52, layers: ["#f0a048", "#d86a26", "#6b2410"], trees: 10 },
};
function miniScene(name, seed, emblem) {
  const s = SCENES[name] || SCENES.night, r = rng(seed * 13 + 5);
  const layer = (i, base, amp, trees) => ridgeSVG(r, { w: 400, h: 220, base, amp, color: s.layers[i], cls: `mini-l ml${i + 1}`, n: 5, trees, keep: true });
  const em = emblem === "pac"
    ? `<span class="pac-emblem" aria-hidden="true"><i></i><b></b><b></b><b></b></span>`
    : emblem ? `<span class="mini-emblem" aria-hidden="true">${esc(emblem)}</span>` : "";
  return `<div class="mini" style="--sky1:${s.sky[0]};--sky2:${s.sky[1]};--orb:${s.orb};--glow:${s.glow};--orb-y:${s.orbY}%">
    <span class="mini-orb"></span>${layer(0, 112, 50)}${layer(1, 150, 40, s.trees)}${em}${layer(2, 192, 24, Math.round(s.trees * 0.6))}</div>`;
}

/* ---------- horizons: layered ridges that rise into place as you scroll ---------- */
const HZ_PAL = {
  night: ["#2b2056", "#1b1336", "#0c0815"],
  dusk: ["#46204c", "#28122f", "#0c0815"],
  ember: ["#5a2230", "#2e1121", "#0c0815"],
};
function initHorizons() {
  const list = $$(".horizon").map((el, k) => {
    const pal = HZ_PAL[el.dataset.pal] || HZ_PAL.night, r = rng(k * 31 + 7);
    el.innerHTML = [0, 1, 2].map((i) => ridgeSVG(r, { base: [120, 175, 230][i], amp: [110, 80, 50][i], color: pal[i], cls: `hz hz${i + 1}` })).join("");
    return { host: el.closest("section") || el.parentElement, layers: [...el.children], scene: el.dataset.mode === "scene" };
  });
  if (reduceMotion || !list.length) return;
  const depth = [60, 130, 200];
  onScroll(() => {
    for (const h of list) {
      if (!inView(h.host, 200)) continue;
      const k = 1 - (h.scene ? sceneProgress(h.host) : viewProgress(h.host));
      h.layers.forEach((L, i) => { L.style.transform = `translate3d(0, ${(k * depth[i]).toFixed(1)}px, 0)`; });
    }
  });
}

/* ---------- generic scroll parallax: any [data-speed] element ---------- */
function initParallax() {
  if (reduceMotion) return;
  const items = $$("[data-speed]").map((el) => ({ el, host: el.closest("section") || el.parentElement, speed: parseFloat(el.dataset.speed), blob: el.classList.contains("blob") }));
  onScroll((sy) => {
    for (const it of items) {
      if (!inView(it.host, VH)) continue;
      const b = box(it.host);
      const off = (b.top - sy + b.h / 2 - VH / 2) * -it.speed;
      it.el.style.transform = it.blob
        ? `translate3d(0, ${off.toFixed(1)}px, 0) rotate(calc(var(--rot, 0deg) + ${(off * 0.04).toFixed(2)}deg))`
        : `translate3d(0, ${off.toFixed(1)}px, 0)`;
    }
  });
}

/* ---------- the sky slowly warms from night to dawn as you scroll down ---------- */
function initSkyglow() {
  const g = $(".skyglow"); if (!g) return;
  onScroll((sy) => {
    const max = document.documentElement.scrollHeight - VH;
    g.style.opacity = (Math.pow(clamp(sy / (max || 1)), 1.6) * 0.75).toFixed(3);
  });
}

/* ---------- starfield: twinkling stars + warm links near the mouse ---------- */
const Stars = (() => {
  const canvas = $("#stars");
  if (!canvas) return { pause() {}, resume() {} };
  const ctx = canvas.getContext("2d");
  let w, h, dpr, stars = [], running = true;
  const mouse = { x: -9999, y: -9999 };
  function setup() {
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    w = innerWidth; h = innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(Math.round((w * h) / (lowEnd ? 16000 : 9000)), lowEnd ? 90 : 170);
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h, z: Math.random() * 0.8 + 0.2,
      r: Math.random() * 1.3 + 0.3, tw: Math.random() * Math.PI * 2,
      c: Math.random() < 0.8 ? "255,244,230" : Math.random() < 0.5 ? "201,184,255" : "255,184,77",
    }));
  }
  let lastY = scrollY;
  function draw(t) {
    if (!running) return;
    const dy = scrollY - lastY; lastY = scrollY;
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      s.y -= dy * s.z * 0.25;                       // depth parallax on scroll
      s.x += 0.04 * s.z;
      if (s.y < -5) s.y += h + 10; else if (s.y > h + 5) s.y -= h + 10;
      if (s.x > w + 5) s.x = -5;
      const a = 0.35 + 0.65 * Math.abs(Math.sin(t / 900 + s.tw));
      ctx.fillStyle = `rgba(${s.c},${(a * s.z).toFixed(3)})`;
      ctx.fillRect(s.x, s.y, s.r * (0.8 + s.z), s.r * (0.8 + s.z));
      if (finePointer) {
        const dx = s.x - mouse.x, dyy = s.y - mouse.y, d2 = dx * dx + dyy * dyy;
        if (d2 < 25600) {
          ctx.strokeStyle = `rgba(255,184,77,${((1 - Math.sqrt(d2) / 160) * 0.35).toFixed(3)})`;
          ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
    }
  }
  setup();
  if (reduceMotion) { draw(0); running = false; return { pause() {}, resume() {} }; }
  let tmr;
  addEventListener("resize", () => { clearTimeout(tmr); tmr = setTimeout(setup, 150); });
  addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  document.addEventListener("mouseleave", () => { mouse.x = mouse.y = -9999; });
  onFrame(draw);
  return {
    pause() { if (running) { running = false; ctx.clearRect(0, 0, w, h); } },
    resume() { running = true; },
  };
})();

/* ---------- loading screen (parallax ridges + VSL), then reveal the page ---------- */
function initLoader(after) {
  const L = $("#loader");
  let fired = false;
  const finish = () => {
    if (fired) return; fired = true;
    document.documentElement.classList.add("loaded");
    if (lenis) lenis.start();
    if (after) after();
    if (L) setTimeout(() => L.remove(), 1700);
  };
  if (!L || reduceMotion) { if (L) L.remove(); finish(); return; }
  let seen = false;
  try { seen = sessionStorage.getItem("vsl-seen") === "1"; sessionStorage.setItem("vsl-seen", "1"); } catch (e) {}
  if (seen) L.classList.add("quick");
  const minTime = seen ? 700 : 1900, t0 = performance.now();
  if (lenis) lenis.stop();
  // wait only for what's visible first: the loader/hero artwork and the fonts
  const timeout = (ms) => new Promise((r) => setTimeout(r, ms));
  const art = $$("#loader img, .hero-sticky img, .panels-sticky img").map((im) => (im.decode ? im.decode().catch(() => {}) : Promise.resolve()));
  const fonts = document.fonts ? Promise.race([document.fonts.ready, timeout(2500)]) : Promise.resolve();
  Promise.all([...art, fonts]).then(() => setTimeout(finish, Math.max(0, minTime - (performance.now() - t0))));
  setTimeout(finish, 4500); // never block the page
}

/* ---------- boot shared bits ---------- */
function bootCommon() {
  fillCommon();
  initNav();
  initPointer();
  initParallax();
  initHorizons();
  initSkyglow();
  initLoader(initReveal);
}
