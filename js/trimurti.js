/* =====================================================================
   TRIMURTI — three faceted heads in a flat poster style.
   Faces carry no features — just long, sculpted planes and a cut jaw.
   Each god is drawn twice: a dark silhouette, and the coloured version on
   top whose opacity (--ab / --av / --as) is driven by scroll, so they
   light up as they rise.
   ===================================================================== */
const TM = (() => {
  const GOLD = { lit: "#ffd76e", mid: "#f2b443", dark: "#d48a2c", deep: "#b86f22", gem: "#ff6b35" };
  const SILVER = { lit: "#f2f2f8", mid: "#cfd0de", dark: "#a8a9c0", deep: "#8b8ca6", gem: "#7a5cf0" };
  const SKIN = {
    brahma: { lit: "#fff6f0", mid: "#f3e3df", dark: "#e2cacb", beard: "#fbf7f4", beard2: "#e6dcde", hair: "#ebe2e8", line: "#fff1df" },
    vishnu: { lit: "#8069f2", mid: "#6a52e2", dark: "#533bc6", hair: "#22174a", hair2: "#2e2163" },
    shiva:  { lit: "#7260d0", mid: "#5c4ab6", dark: "#463693", hair: "#1f1543", hair2: "#2b1e5a", moon: "#f3ecff" },
  };
  const SIL = "#1b1a4a";   // dark-blue silhouette
  const sil = (o) => Object.fromEntries(Object.keys(o).map((k) => [k, SIL]));
  const P = (pts, fill, extra = "") => `<polygon points="${pts}" fill="${fill}" ${extra}/>`;
  const D = (d, fill, extra = "") => `<path d="${d}" fill="${fill}" ${extra}/>`;

  /* ---------- profile (facing left): long face, sharp cut jaw, no features ---------- */
  const PROF = "M86,0 L44,20 L28,66 L24,108 L36,124 L8,192 L28,204 L26,218 L16,228 L30,238 L20,248 L34,262 L26,296 L52,322 L150,318 L178,248 L216,176 L228,96 L192,20 Z";
  function profile(C, { outline = false } = {}) {
    return `
      ${P("44,420 196,420 330,490 370,800 -170,800 -140,490", C.dark)}
      ${P("44,420 112,420 44,800 -170,800 -140,490", C.mid)}
      ${P("56,300 150,300 180,440 62,440", C.dark)}${P("56,300 96,304 94,440 62,440", C.mid)}
      ${outline ? D(PROF, "none", `stroke="${C.line}" stroke-width="10" stroke-linejoin="round"`) : ""}
      ${D(PROF, C.mid)}
      ${P("44,20 28,66 24,108 36,124 8,192 28,204 26,218 16,228 30,238 20,248 34,262 26,296 52,322 72,262 60,196 72,130 64,44", C.lit)}
      ${P("72,130 150,150 158,236 150,318 52,322 72,262 60,196", C.dark)}`;
  }

  /* ---------- front: wide, long, sculpted, no features ---------- */
  function frontBody(C) {
    return `
      ${P("-74,340 0,340 0,760 -400,760 -370,460 -256,372", C.mid)}${P("0,340 74,340 256,372 370,460 400,760 0,760", C.dark)}
      ${P("-256,372 -84,352 -64,490 -236,530", C.lit, 'opacity=".5"')}
      ${P("-66,250 0,250 0,356 -78,356", C.mid)}${P("0,250 66,250 78,356 0,356", C.dark)}`;
  }
  function frontHead(C) {
    return `
      ${P("-130,0 0,0 0,304 -30,304 -64,288 -120,222 -128,170 -132,80", C.lit)}
      ${P("0,0 130,0 132,80 128,170 120,222 64,288 30,304 0,304", C.mid)}
      ${P("-128,150 -76,170 -46,300 -64,288 -120,222", C.mid)}${P("128,150 76,170 46,300 64,288 120,222", C.dark)}
      ${P("-30,304 30,304 22,312 -22,312", C.dark, 'opacity=".6"')}`;
  }

  /* ---------- crowns ---------- */
  function crenel(y, x0, x1, n, h, fill) {
    let s = "";
    const w = (x1 - x0) / n;
    for (let i = 0; i < n; i++) s += `${(x0 + i * w).toFixed(1)},${y} ${(x0 + i * w + w / 2).toFixed(1)},${y - h} `;
    return P(`${x0},${y} ${s}${x1},${y}`, fill);
  }
  function vishnuCrown(g) {
    let s = "";
    // side spires + wings
    s += P("-196,-30 -150,-30 -160,-150 -178,-196 -196,-150", g.mid) + P("196,-30 150,-30 160,-150 178,-196 196,-150", g.dark);
    s += P("-150,4 -214,-60 -204,-92 -140,-44", g.lit) + P("150,4 214,-60 204,-92 140,-44", g.mid);
    s += P("-146,8 -168,92 -140,100 -126,8", g.mid) + P("146,8 168,92 140,100 126,8", g.dark);
    // tiers, each split into lit / mid halves with darker outer facets
    s += P("-146,-40 0,-40 0,8 -146,8", g.lit) + P("0,-40 146,-40 146,8 0,8", g.mid);
    s += P("-138,-40 0,-40 0,-126 -116,-126", g.lit) + P("0,-40 138,-40 116,-126 0,-126", g.mid);
    s += P("-138,-40 -96,-40 -82,-126 -116,-126", g.mid) + P("138,-40 96,-40 82,-126 116,-126", g.dark);
    s += P("-108,-126 0,-126 0,-204 -88,-204", g.lit) + P("0,-126 108,-126 88,-204 0,-204", g.mid);
    s += P("-108,-126 -72,-126 -62,-204 -88,-204", g.mid) + P("108,-126 72,-126 62,-204 88,-204", g.dark);
    s += P("-76,-204 0,-204 0,-268 -56,-268", g.lit) + P("0,-204 76,-204 56,-268 0,-268", g.mid);
    s += P("-40,-268 0,-268 0,-340", g.lit) + P("0,-268 40,-268 0,-340", g.mid);
    // crenellated tier edges
    s += crenel(-126, -116, 116, 9, 16, g.lit) + crenel(-204, -88, 88, 7, 14, g.lit) + crenel(-268, -56, 56, 5, 12, g.lit);
    s += P("-146,-40 146,-40 146,-30 -146,-30", g.deep) + P("-116,-126 116,-126 114,-118 -114,-118", g.deep) + P("-88,-204 88,-204 86,-197 -86,-197", g.deep);
    // jewels
    return s;
  }
  const VCROWN_CLIP = `<polygon points="-146,8 -146,-40 -116,-126 -88,-204 -56,-268 0,-340 56,-268 88,-204 116,-126 146,-40 146,8"/>`;
  function brahmaCrown(g) {
    return `
      <circle cx="-2" cy="-4" r="28" fill="${g.mid}"/><circle cx="240" cy="-4" r="28" fill="${g.dark}"/>
      ${D("M4,-30 C10,-112 62,-156 119,-158 C176,-156 228,-112 234,-30 Z", g.mid)}
      ${D("M4,-30 C10,-112 62,-156 119,-158 L119,-30 Z", g.lit)}
      ${P("-4,-32 119,-32 119,26 0,26", g.lit)}${P("119,-32 240,-32 238,26 119,26", g.mid)}
      ${P("-4,-32 240,-32 240,-23 -4,-23", g.deep)}
      ${P("102,-154 119,-154 119,-210", g.lit)}${P("119,-154 136,-154 119,-210", g.mid)}
`;
  }
  const BCROWN_CLIP = `<path d="M4,-30 C10,-112 62,-156 119,-158 C176,-156 228,-112 234,-30 Z"/><polygon points="-4,-32 240,-32 238,26 0,26"/>`;
  const SHINE = `<polygon class="tm-shine" points="-420,-420 -300,-420 -540,520 -660,520" fill="url(#tmShine)"/>`;

  /* ---------- the three ---------- */
  function brahma(C, g) {
    return `<g transform="translate(266,302) scale(1.08)">
      ${D("M156,8 L228,62 L238,190 L212,236 L182,160 Z", C.hair)}
      ${profile(C, { outline: true })}
      ${D("M18,224 L62,214 L146,262 L170,318 L150,392 L100,446 L58,468 L36,410 L22,330 Z", C.beard)}
      ${D("M62,214 L146,262 L170,318 L150,392 L100,446 L96,340 Z", C.beard2)}
      ${brahmaCrown(g)}
      ${g === SILVER ? `<g clip-path="url(#tmClipB)">${SHINE}</g>` : ""}
    </g>`;
  }
  function vishnu(C, g) {
    return `<g transform="translate(700,322)">
      ${D("M-136,-10 L-196,40 L-236,210 L-292,380 L-186,400 L-150,250 L-128,60 Z", C.hair)}
      ${D("M136,-10 L196,40 L236,210 L292,380 L186,400 L150,250 L128,60 Z", C.hair2)}
      ${frontBody(C)}
      <g class="tm-vhead">
      ${frontHead(C)}
      <g transform="scale(.9)">${vishnuCrown(g)}${g === GOLD ? `<g clip-path="url(#tmClipV)">${SHINE}</g>` : ""}</g>
      </g>
    </g>`;
  }
  function shiva(C) {
    // a little wider than the others: the face is stretched horizontally
    return `<g transform="translate(1156,302) scale(-1.24,1.08)">
      ${D("M160,40 L234,96 L250,250 L232,360 L262,500 L206,510 L190,360 L182,220 Z", C.hair)}
      ${profile(C)}
      ${D("M44,20 L74,-8 L160,-16 L226,40 L238,160 L214,232 L186,170 L160,108 L116,64 L62,46 Z", C.hair)}
      <ellipse cx="134" cy="-40" rx="78" ry="60" fill="${C.hair}"/>
      <ellipse cx="130" cy="-104" rx="46" ry="40" fill="${C.hair2}"/>
      ${D("M62,-28 C96,-12 168,-12 206,-30", "none", `stroke="${C.hair2}" stroke-width="8"`)}
      ${D("M50,-108 A42,42 0 1,0 50,-24 A56,56 0 0,1 50,-108 Z", C.moon)}
    </g>`;
  }

  /* ---------- background: the chakra halo, rays, sparkles, embers ---------- */
  function chakra() {
    const cx = 700, cy = 214, R = 284, r = 262, n = 40;
    let pts = "";
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2, rr = i % 2 ? r : R;
      pts += `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)} `;
    }
    let spokes = "";
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2, w = 0.035;
      const p = (ang, rr) => `${(cx + Math.cos(ang) * rr).toFixed(1)},${(cy + Math.sin(ang) * rr).toFixed(1)}`;
      spokes += `<polygon points="${p(a - w * 3, 60)} ${p(a - w, 214)} ${p(a + w, 214)} ${p(a + w * 3, 60)}" fill="#e6a23a"/>`;
    }
    return `<g class="tm-halo"><polygon points="${pts}" fill="#e6a23a"/><circle cx="${cx}" cy="${cy}" r="256" fill="#f2b443"/>
      <circle cx="${cx}" cy="${cy}" r="222" fill="none" stroke="#d48a2c" stroke-width="7"/>${spokes}
      <circle cx="${cx}" cy="${cy}" r="62" fill="#e6a23a"/></g>`;
  }
  function rays() {
    let s = "";
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2, w = 0.05, p = (ang, rr) => `${(700 + Math.cos(ang) * rr).toFixed(0)},${(214 + Math.sin(ang) * rr).toFixed(0)}`;
      s += `<polygon points="700,214 ${p(a - w, 900)} ${p(a + w, 900)}"/>`;
    }
    return `<g class="tm-rays" fill="url(#tmRay)">${s}</g>`;
  }
  const sparkle = (x, y, k, d) => `<path class="tm-spark" style="--d:${d}s" d="M0,-10 L2.4,-2.4 L10,0 L2.4,2.4 L0,10 L-2.4,2.4 L-10,0 L-2.4,-2.4Z" transform="translate(${x},${y}) scale(${k})" fill="#fff1df"/>`;
  function embers() {
    const r = rng(77);
    let s = "";
    for (let i = 0; i < 32; i++) {
      const dur = 7 + r() * 8;
      s += `<circle class="tm-ember" style="--dur:${dur.toFixed(1)}s;--d:-${(r() * dur).toFixed(1)}s" cx="${(260 + r() * 880).toFixed(0)}" cy="860" r="${(1.5 + r() * 2).toFixed(1)}" fill="${r() < 0.7 ? "#ffb84d" : "#fff1df"}"/>`;
    }
    return `<g class="tm-embers">${s}</g>`;
  }
  // a sea of night clouds the three rise out of
  function cloudBank(y, col, rim, seed, amp) {
    // runs far past both edges so it never ends on screen; only the billowing top is outlined
    const r = rng(seed); let x = -2200, top = `M-2200,${y} `;
    while (x < 3600) {
      const big = r() < 0.3, w = big ? 200 + r() * 140 : 60 + r() * 110, hgt = amp * (big ? 0.9 + r() * 0.6 : 0.3 + r() * 0.6);
      top += `C${x + w * 0.05},${y - hgt} ${x + w * 0.95},${y - hgt} ${x + w},${y + (r() - 0.5) * 18} `;
      x += w;
    }
    return `<path d="${top}L${x},${y + 600} L-2200,${y + 600} Z" fill="${col}"/><path d="${top}" fill="none" stroke="${rim}" stroke-opacity=".35" stroke-width="2.5"/>`;
  }
  const godLink = (x, w, href, label) => `<a class="tm-link" href="${href}" tabindex="-1" aria-label="${label}"><rect x="${x}" y="120" width="${w}" height="640" fill="transparent"/></a>`;
  function god(cls, key, glow, body, link) {
    return `<g class="tm-god ${cls}" data-k="${key}">
      <circle class="tm-glow" cx="${glow[0]}" cy="${glow[1]}" r="330" fill="url(#${glow[2]})"/>
      <g class="tm-sil">${body(true)}</g><g class="tm-col">${body(false)}</g>${link}</g>`;
  }

  function svg() {
    return `<svg viewBox="0 0 1400 860" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
  <defs>
    <radialGradient id="tmBack"><stop offset="0" stop-color="#4a2f86" stop-opacity=".95"/><stop offset=".6" stop-color="#2c1b55" stop-opacity=".6"/><stop offset="1" stop-color="#2c1b55" stop-opacity="0"/></radialGradient>
    <radialGradient id="tmRay" cx="700" cy="214" r="900" gradientUnits="userSpaceOnUse"><stop offset=".2" stop-color="#ffd76e" stop-opacity=".5"/><stop offset="1" stop-color="#ffd76e" stop-opacity="0"/></radialGradient>
    <radialGradient id="tmGlowB"><stop offset="0" stop-color="#fff1df" stop-opacity=".35"/><stop offset="1" stop-color="#fff1df" stop-opacity="0"/></radialGradient>
    <radialGradient id="tmGlowV"><stop offset="0" stop-color="#ffb84d" stop-opacity=".4"/><stop offset="1" stop-color="#ffb84d" stop-opacity="0"/></radialGradient>
    <radialGradient id="tmGlowS"><stop offset="0" stop-color="#c9b8ff" stop-opacity=".4"/><stop offset="1" stop-color="#c9b8ff" stop-opacity="0"/></radialGradient>
    <linearGradient id="tmShine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="tmFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c0815" stop-opacity="0"/><stop offset=".55" stop-color="#0c0815" stop-opacity=".85"/><stop offset="1" stop-color="#0c0815"/></linearGradient>
    <radialGradient id="tmFlash"><stop offset="0" stop-color="#fff6d8" stop-opacity=".95"/><stop offset=".35" stop-color="#ffd76e" stop-opacity=".45"/><stop offset="1" stop-color="#ffb84d" stop-opacity="0"/></radialGradient>
    <filter id="tmBlur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter>
    <clipPath id="tmClipV">${VCROWN_CLIP}</clipPath>
    <clipPath id="tmClipB">${BCROWN_CLIP}</clipPath>
  </defs>
  <g class="tm-back">
    <ellipse cx="700" cy="420" rx="700" ry="480" fill="url(#tmBack)"/>
    ${rays()}
    ${sparkle(220, 130, 1.1, 0)}${sparkle(1180, 150, .9, 1.4)}${sparkle(1260, 470, 1.2, 2.2)}${sparkle(130, 460, .8, .7)}${sparkle(980, 80, .6, 2.8)}
  </g>
  <g class="tm-rings" fill="none">
    <circle class="tm-ring tm-ring1" cx="700" cy="214" r="330" stroke="#ffd76e" stroke-opacity=".38" stroke-width="2" stroke-dasharray="2 13"/>
    <circle class="tm-ring tm-ring2" cx="700" cy="214" r="378" stroke="#ffd76e" stroke-opacity=".2" stroke-width="3" stroke-dasharray="46 12 6 12"/>
    <circle class="tm-ring tm-ring3" cx="700" cy="214" r="430" stroke="#c9b8ff" stroke-opacity=".2" stroke-width="4" stroke-linecap="round" stroke-dasharray=".5 26"/>
  </g>
  <g class="tm-halo-wrap">${chakra()}</g>
  <circle class="tm-flash" cx="700" cy="214" r="560" fill="url(#tmFlash)"/>
  ${god("tm-b", "brahma", [400, 440, "tmGlowB"], (s) => brahma(s ? sil(SKIN.brahma) : SKIN.brahma, s ? sil(SILVER) : SILVER), godLink(200, 360, "art.html", "Art"))}
  ${god("tm-s", "shiva", [1000, 440, "tmGlowS"], (s) => shiva(s ? sil(SKIN.shiva) : SKIN.shiva), godLink(860, 340, "piano.html", "Piano"))}
  ${god("tm-v", "vishnu", [700, 380, "tmGlowV"], (s) => vishnu(s ? sil(SKIN.vishnu) : SKIN.vishnu, s ? sil(GOLD) : GOLD), godLink(560, 280, "#work", "Code"))}
  <circle class="tm-wave" cx="700" cy="420" r="300" fill="none" stroke="#fff1df" stroke-width="3"/>
  <g class="tm-clouds tm-clouds-b">${cloudBank(735, "#251843", "#c9b8ff", 5, 70)}</g>
  <g class="tm-clouds tm-clouds-f">${cloudBank(790, "#170f2c", "#c9b8ff", 9, 60)}</g>
  ${embers()}
  <rect x="-2200" y="630" width="5800" height="232" fill="url(#tmFade)" pointer-events="none"/>
  <rect x="-2200" y="860" width="5800" height="600" fill="#0c0815" pointer-events="none"/>
</svg>`;
  }

  /* small line icons for the labels */
  const ICONS = {
    brahma: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M16 6c3 4 3 10 0 14-3-4-3-10 0-14Z"/><path d="M16 20c-2-4-7-6-11-5 1 4 5 7 11 5Zm0 0c2-4 7-6 11-5-1 4-5 7-11 5Z"/><path d="M5 24h22"/></svg>`,
    vishnu: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="16" cy="16" r="10"/><circle cx="16" cy="16" r="3"/>${Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2; return `<path d="M${(16 + Math.cos(a) * 3).toFixed(1)} ${(16 + Math.sin(a) * 3).toFixed(1)} L${(16 + Math.cos(a) * 10).toFixed(1)} ${(16 + Math.sin(a) * 10).toFixed(1)}"/>`; }).join("")}</svg>`,
    shiva: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M22 5a10 10 0 1 0 5 15A8 8 0 1 1 22 5Z"/></svg>`,
  };

  return { svg, ICONS };
})();
