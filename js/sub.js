/* =====================================================================
   SUB PAGES — Art & Piano.
   ===================================================================== */
const PAL = { royal: "#6b4fd8", neon: "#ffb84d", neon2: "#ffd9a0", orange: "#ff6b35", mustard: "#ffb84d", cream: "#fff1df", peach: "#f6c9a8", navy: "#2a1a4a" };
const page = document.body.dataset.page;

/* ---------- illustrated panel hero that slides apart as you scroll ---------- */
function panels() {
  const host = $("#panels");
  const spec = [
    [PAL.cream, PAL.orange, "dash"], [PAL.cream, PAL.orange, "dot"], [PAL.royal, PAL.cream, "dot"],
    [PAL.mustard, PAL.navy, "squiggle"], [PAL.orange, PAL.cream, "dash"],
  ];
  const r = rng(page === "art" ? 21 : 33);
  host.innerHTML = spec.map((s, i) => {
    const blobs = [0, 1].map((k) => {
      const size = 140 + r() * 160, top = 8 + r() * 62, left = -20 + r() * 60;
      return `<div class="blob" style="top:${top}%;left:${left}%;width:${size}px;height:${size}px">${blobSVG({ fill: s[0], ink: s[1], kind: s[2], seed: i * 7 + k + 3, density: 1.3 })}</div>`;
    }).join("");
    return `<div class="panel panel-${i + 1}" style="--dir:${i % 2 ? 1 : -1}"><span class="roller t"></span>${blobs}<span class="roller b"></span></div>`;
  }).join("");
  if (reduceMotion) return;
  const scene = $(".panels-scene"), sticky = $(".panels-sticky");
  onScroll(() => { if (inView(scene)) sticky.style.setProperty("--p", sceneProgress(scene).toFixed(4)); });
}

/* ---------- ART ---------- */
function art() {
  const cat = (m) => /photo/i.test(m) ? "Photography" : /ibis|digital/i.test(m) ? "Digital" : "Pencil";
  const looks = [[PAL.cream, PAL.orange, "dash"], [PAL.royal, PAL.mustard, "dot"], [PAL.mustard, PAL.navy, "squiggle"], [PAL.orange, PAL.cream, "dot"], [PAL.peach, PAL.royal, "squiggle"]];
  const bgs = [PAL.navy, PAL.peach, PAL.royal, PAL.cream, PAL.orange];
  $("#art-grid").innerHTML = SITE.art.map((a, i) => {
    const l = looks[i % looks.length];
    const media = a.src
      ? `<img src="${esc(a.src)}" alt="${esc(a.title)}, ${esc(a.medium)}" loading="lazy" />`
      : `<span class="art" aria-hidden="true" style="background:${bgs[(i + 2) % bgs.length]}">${blobSVG({ fill: l[0], ink: l[1], kind: l[2], seed: i + 60, density: 1.5 })}</span>`;
    return `<figure class="tile tilt reveal ${a.size || ""}" data-cat="${cat(a.medium)}">
      <div class="tilt-inner">${media}<figcaption><strong>${esc(a.title)}</strong><span>${esc(a.medium)}</span></figcaption></div>
    </figure>`;
  }).join("");

  const cats = ["All", ...new Set(SITE.art.map((a) => cat(a.medium)))];
  const bar = $("#filters");
  bar.innerHTML = cats.map((c, i) => `<button type="button" aria-pressed="${i === 0}">${c}</button>`).join("");
  bar.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    $$("button", bar).forEach((x) => x.setAttribute("aria-pressed", x === b));
    $$(".tile").forEach((t) => t.classList.toggle("hide", b.textContent !== "All" && t.dataset.cat !== b.textContent));
  });
}

/* ---------- PIANO ---------- */
function piano() {
  // pieces
  $("#piece-list").innerHTML = SITE.pieces.map((p, i) => `<li class="track reveal">
      <span class="n">${String(i + 1).padStart(2, "0")}</span>
      <div><h3>${esc(p.title)}</h3><span class="composer">${esc(p.composer)}</span></div>
      <span class="status">${esc(p.note)}</span>
      ${p.youtube ? `<iframe src="https://www.youtube-nocookie.com/embed/${esc(p.youtube)}" title="${esc(p.title)}" loading="lazy" allowfullscreen></iframe>` : ""}
    </li>`).join("");

  // keyboard: C4 → C6
  const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  // DAW-style layout: the home row is the white keys, the row above the black keys; Z / X shift the octave
  const KEYMAP = "a w s e d f t g y h u j k o l p ; '".split(" ");
  let shift = 0;                                   // 0 = starts at C4, 12 = starts at C5
  const start = 60, end = 84;
  const whites = [];
  for (let m = start; m <= end; m++) if (!NAMES[m % 12].includes("#")) whites.push(m);
  const keys = $("#keys");
  keys.style.setProperty("--whites", whites.length);
  let html = "";
  for (let m = start; m <= end; m++) {
    const name = NAMES[m % 12] + (Math.floor(m / 12) - 1), black = name.includes("#");
    const style = black ? ` style="left:calc(${(whites.indexOf(m - 1) + 1) / whites.length * 100}% - (100% / ${whites.length} * 0.3))"` : "";
    html += `<button type="button" class="key${black ? " black" : ""}" data-m="${m}" aria-label="${name}"${style}></button>`;
  }
  keys.innerHTML = html;
  const keyEls = [...keys.children], octLabel = $("#oct");
  function labelKeys() {
    keyEls.forEach((k) => { const i = +k.dataset.m - start - shift; k.textContent = KEYMAP[i] ? KEYMAP[i].toUpperCase() : ""; });
    if (octLabel) octLabel.textContent = `C${4 + shift / 12}`;
  }
  labelKeys();

  // audio
  let ac, master;
  const voices = new Map();
  const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function audio() {
    if (!ac) {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = 0.5;
      const comp = ac.createDynamicsCompressor();
      master.connect(comp).connect(ac.destination);
    }
    if (ac.state === "suspended") ac.resume();
    return ac;
  }
  function noteOn(m) {
    if (voices.has(m)) return;
    const a = audio(), t = a.currentTime, f = freq(m), kind = $("#voice").value;
    const g = a.createGain(), filt = a.createBiquadFilter();
    filt.type = "lowpass"; filt.frequency.value = kind === "synth" ? 2400 : 5000;
    g.connect(filt).connect(master);
    const parts = kind === "bell" ? [[1, "sine", 0.6], [3.5, "sine", 0.18], [6.2, "sine", 0.06]]
      : kind === "synth" ? [[1, "sawtooth", 0.22], [1.006, "sawtooth", 0.18], [0.5, "square", 0.08]]
      : [[1, "triangle", 0.55], [2, "sine", 0.18], [3, "sine", 0.06], [4, "sine", 0.03]];
    const oscs = parts.map(([mul, type, vol]) => {
      const o = a.createOscillator(), og = a.createGain();
      o.type = type; o.frequency.value = f * mul; og.gain.value = vol;
      o.connect(og).connect(g); o.start(t); return o;
    });
    const decay = kind === "bell" ? 3.5 : kind === "synth" ? 0 : 2.4;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.9, t + 0.008);
    if (decay) g.gain.exponentialRampToValueAtTime(0.001, t + decay);
    else g.gain.setTargetAtTime(0.5, t + 0.01, 0.2);
    voices.set(m, { g, oscs, decay });
    keys.querySelector(`[data-m="${m}"]`)?.classList.add("on");
    burst(m);
  }
  function noteOff(m) {
    const v = voices.get(m); if (!v) return;
    voices.delete(m);
    const t = ac.currentTime;
    v.g.gain.cancelScheduledValues(t);
    v.g.gain.setValueAtTime(Math.max(v.g.gain.value, 0.0001), t);
    v.g.gain.exponentialRampToValueAtTime(0.0001, t + (v.decay ? 0.5 : 0.25));
    v.oscs.forEach((o) => o.stop(t + 0.6));
    keys.querySelector(`[data-m="${m}"]`)?.classList.remove("on");
  }

  // pointer (mouse + touch), with glissando when dragging
  let down = false;
  keys.addEventListener("pointerdown", (e) => { const k = e.target.closest(".key"); if (!k) return; down = true; noteOn(+k.dataset.m); });
  keys.addEventListener("pointerover", (e) => { const k = e.target.closest(".key"); if (k && down) noteOn(+k.dataset.m); });
  keys.addEventListener("pointerout", (e) => { const k = e.target.closest(".key"); if (k) noteOff(+k.dataset.m); });
  addEventListener("pointerup", () => { down = false; [...voices.keys()].forEach(noteOff); });
  keys.addEventListener("keydown", (e) => { const k = e.target.closest(".key"); if (k && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); noteOn(+k.dataset.m); } });
  keys.addEventListener("keyup", (e) => { const k = e.target.closest(".key"); if (k) noteOff(+k.dataset.m); });

  // computer keyboard
  const held = new Map();                          // physical key → note, so a shift mid-chord still releases cleanly
  addEventListener("keydown", (e) => {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || /input|select|textarea/i.test(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    if (k === "z" || k === "x") {
      const next = Math.max(0, Math.min(12, shift + (k === "x" ? 12 : -12)));
      if (next !== shift) { shift = next; labelKeys(); }
      return;
    }
    const i = KEYMAP.indexOf(k), m = start + shift + i;
    if (i < 0 || m > end || held.has(k)) return;
    held.set(k, m); noteOn(m);
  });
  addEventListener("keyup", (e) => {
    const k = e.key.toLowerCase(), m = held.get(k);
    if (m !== undefined) { held.delete(k); noteOff(m); }
  });

  // floating notes / sprinkles above the keys
  const fx = $("#note-fx"), wrap = $(".keys-wrap"), ctx = fx.getContext("2d");
  const parts = [];
  function sizeFx() { const d = Math.min(devicePixelRatio || 1, 2); fx.width = fx.clientWidth * d; fx.height = fx.clientHeight * d; ctx.setTransform(d, 0, 0, d, 0, 0); }
  sizeFx(); addEventListener("resize", sizeFx);
  const COLS = [PAL.mustard, PAL.orange, PAL.neon2, PAL.cream, PAL.neon];
  function burst(m) {
    if (reduceMotion) return;
    const k = keys.querySelector(`[data-m="${m}"]`), kr = k.getBoundingClientRect(), wr = wrap.getBoundingClientRect();
    const x = kr.left - wr.left + kr.width / 2;
    parts.push({ x, y: fx.clientHeight, vx: (Math.random() - 0.5) * 0.6, vy: -1.6 - Math.random(), life: 1, glyph: "♪♫♩♬"[(Math.random() * 4) | 0], c: COLS[(Math.random() * COLS.length) | 0], big: true });
    for (let i = 0; i < 8; i++) parts.push({ x, y: fx.clientHeight, vx: (Math.random() - 0.5) * 3, vy: -1 - Math.random() * 3, life: 1, rot: Math.random() * 6, c: COLS[(Math.random() * COLS.length) | 0] });
  }
  onFrame(() => {
    if (!parts.length) return;
    ctx.clearRect(0, 0, fx.clientWidth, fx.clientHeight);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx; p.y += p.vy; p.vy += p.big ? 0.004 : 0.05; p.life -= p.big ? 0.008 : 0.02;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      ctx.globalAlpha = p.life; ctx.fillStyle = p.c;
      if (p.big) { ctx.font = "28px serif"; ctx.fillText(p.glyph, p.x - 8, p.y); }
      else { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot += 0.1); ctx.fillRect(-4, -1, 8, 2.4); ctx.restore(); }
    }
    ctx.globalAlpha = 1;
  });
}

/* ---------- boot ---------- */
panels();
if (page === "art") art();
if (page === "piano") piano();
bootCommon();
