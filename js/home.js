/* =====================================================================
   HOME — renders content from SITE and drives the scroll scenes.
   ===================================================================== */
const ARROW_UP = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M5 11 11 5M6 5h5v5"/></svg>`;
const ARROW = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>`;

/* ---------- render content ---------- */
function renderHome() {
  // About story, split into words. A few words get colour accents.
  const accents = { logic: "hl2", creativity: "hl", apis: "hl2", models: "hl2", bugs: "hl2", sketch: "hl3", photos: "hl3", piano: "hl", think: "hl2", look: "hl3" };
  $("#story-text").innerHTML = SITE.story.split(" ").map((w) => {
    const key = w.toLowerCase().replace(/[^a-z]/g, "");
    return `<span class="w ${accents[key] || ""}">${esc(w)}</span>`;
  }).join(" ");

  // Three sides of me — Brahma, Vishnu, Shiva
  $("#trimurti").innerHTML = TM.svg();
  $("#tm-labels").innerHTML = SITE.sides.map((s) => `
    <a class="tm-label" href="${esc(s.href)}" data-k="${s.key}" aria-label="${esc(s.title)}: ${esc(s.sub)}">${esc(s.title)}${ARROW_UP}</a>`).join("");

  $("#stats").innerHTML = SITE.stats.map((s) => `<li class="reveal">
      <strong data-count="${s.value}" data-decimals="${s.decimals}" data-prefix="${esc(s.prefix || "")}" data-suffix="${esc(s.suffix)}">${esc(s.prefix || "")}${s.value.toFixed(s.decimals)}${esc(s.suffix)}</strong>
      <span>${esc(s.label)}</span></li>`).join("");

  // Work — a symmetric 3×3 grid
  $("#work-grid").innerHTML = SITE.projects.map((p, i) => {
    const cta = p.link && p.link !== "#" ? `<a class="proj-cta" href="${esc(p.link)}">${esc(p.cta || "Open")}<span class="sr-only">, ${esc(p.title)}</span></a>` : "";
    return `<article class="proj tilt reveal">
      <div class="tilt-inner">
        ${miniScene(p.scene, i + 1, p.emblem === "pac" ? "pac" : "")}
        <div class="proj-body">
          <span class="proj-kind">${esc(p.kind)}</span>
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.desc)}</p>
          <ul class="chips">${p.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
          ${cta}
        </div>
      </div>
    </article>`;
  }).join("");

  // Skills marquees (content doubled for seamless looping)
  const mq = (list) => { const s = list.map((w) => `<span>${esc(w)}</span>`).join(""); return s + s; };
  $("#mq-a").innerHTML = mq(SITE.marqueeA);
  $("#mq-b").innerHTML = mq(SITE.marqueeB);
  $("#skills-sr").textContent = "Skills: " + [...SITE.marqueeA, ...SITE.marqueeB].join(", ");

  $("#timeline").innerHTML = SITE.journey.map((j) => `<li class="reveal">
      <time>${esc(j.when)}</time><h3>${esc(j.role)} <span>· ${esc(j.org)}</span></h3><p>${esc(j.desc)}</p></li>`).join("");
}

/* ---------- scroll scenes ---------- */
function scenes() {
  const hero = $("#top"), heroSticky = $(".hero-sticky");
  const story = $("#about"), words = $$("#story-text .w"), term = $(".term");
  const sides = $("#sides"), sidesSticky = $(".sides-sticky");
  const work = $("#work");
  const tl = $(".timeline-wrap"), tlFill = $("#timeline-fill");
  const dawn = $("#contact"), dawnSticky = $(".dawn-sticky");

  if (reduceMotion) {
    words.forEach((w) => w.classList.add("lit"));
    term.classList.add("done");
    sidesSticky.style.setProperty("--p", 1);
    ["--s", "--av", "--ab", "--as", "--bo"].forEach((v) => sidesSticky.style.setProperty(v, 1));
    tlFill.style.transform = "scaleY(1)";
    return;
  }

  // HERO mouse depth — eased, and only computed while it's moving
  let mx = 0, my = 0, smx = 0, smy = 0;
  if (finePointer) addEventListener("mousemove", (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });
  onFrame(() => {
    if (Math.abs(mx - smx) + Math.abs(my - smy) < 0.001 || !inView(hero)) return;
    smx += (mx - smx) * 0.06; smy += (my - smy) * 0.06;
    heroSticky.style.setProperty("--mx", smx.toFixed(3));
    heroSticky.style.setProperty("--my", smy.toFixed(3));
  });
  // the three heads: mouse depth + head/label highlight
  let tmx = 0;
  onFrame(() => {
    if (Math.abs(mx - tmx) < 0.001 || !inView(sides)) return;
    tmx += (mx - tmx) * 0.06;
    sidesSticky.style.setProperty("--mx", tmx.toFixed(3));
  });
  const tmSvg = $("#trimurti svg");
  const frameTrio = () => {
    const portrait = innerWidth / innerHeight < 0.8;
    const vb = portrait ? [250, 10, 900, 800] : [0, 0, 1400, 860];
    tmSvg.setAttribute("viewBox", vb.join(" "));
    tmSvg.setAttribute("preserveAspectRatio", portrait ? "xMidYMid meet" : "xMidYMax meet");
    const box = $("#trimurti").getBoundingClientRect(), k = Math.min(box.width / vb[2], box.height / vb[3]);
    const off = (box.width - vb[2] * k) / 2;
    const X = { brahma: 390, vishnu: 700, shiva: 1010 };
    const lb = $("#tm-labels").getBoundingClientRect(), wrapW = lb.width || innerWidth, shift = lb.left - box.left;
    $$("#tm-labels .tm-label").forEach((el) => {
      const half = el.offsetWidth / 2 + 6, x = off + (X[el.dataset.k] - vb[0]) * k - shift;
      el.style.setProperty("--x", `${clamp(x, half, wrapW - half).toFixed(0)}px`);
    });
  };
  frameTrio(); addEventListener("resize", frameTrio);
  const hl = (k) => { if (k) sidesSticky.dataset.hl = k; else delete sidesSticky.dataset.hl; };
  $$("#sides [data-k]").forEach((el) => {
    el.addEventListener("mouseenter", () => hl(el.dataset.k));
    el.addEventListener("mouseleave", () => hl(null));
    el.addEventListener("focus", () => hl(el.dataset.k));
    el.addEventListener("blur", () => hl(null));
  });

  // MARQUEES run as CSS animations (compositor); scroll speed nudges their playback rate
  const anims = $$(".marquee-track").map((t) => t.getAnimations()[0]).filter(Boolean);
  let vel = 0, lastY = scrollY;
  onFrame(() => {
    vel *= 0.92;
    if (anims.length && (vel > 0.02 || anims[0].playbackRate !== 1)) {
      const rate = 1 + Math.min(vel, 6);
      anims.forEach((a) => { a.playbackRate = vel > 0.02 ? rate : 1; });
    }
  });

  let lit = -1;
  onScroll((sy) => {
    vel += Math.abs(sy - lastY) * 0.02; lastY = sy;

    // HERO: the canyon sinks away as the camera tilts up to the stars
    if (inView(hero)) heroSticky.style.setProperty("--p", sceneProgress(hero).toFixed(4));

    // STORY: light words one by one
    if (inView(story)) {
      const stp = sceneProgress(story);
      const n = Math.floor(clamp((stp - 0.04) / 0.56) * words.length);
      if (n !== lit) { lit = n; for (let i = 0; i < words.length; i++) words[i].classList.toggle("lit", i < n); }
      term.classList.toggle("done", n >= words.length);
    }

    // SIDES: Vishnu rises with the chakra, then the heads revolve like a carousel
    if (inView(sides)) {
      const fp = sceneProgress(sides);
      sidesSticky.style.setProperty("--p", fp.toFixed(3));
      const sp = clamp((fp - 0.02) / 0.62);
      const av = ease(clamp(sp / 0.4));                 // Vishnu + chakra arrive
      const car = ease(clamp((sp - 0.4) / 0.24));       // then the carousel turns, swiftly
      const spin = ease(clamp((sp - 0.4) / 0.13));      // one quick turn of Vishnu's head
      const set = (k, v) => sidesSticky.style.setProperty(k, v);
      set("--s", ease(sp).toFixed(3));
      set("--av", av.toFixed(3));
      set("--flash", (clamp((av - 0.72) * 3.6) * (1 - clamp((sp - 0.4) / 0.25))).toFixed(3));
      // Vishnu's head turns once while the others come round from behind it
      set("--vsx", Math.max(Math.abs(Math.cos(spin * Math.PI)), 0.05).toFixed(3));
      const R = 310, D = Math.PI / 180, END = 105;
      const head = (ang, endAng) => {
        const depth = Math.cos(ang), k = clamp((depth + 1) / (1 + Math.cos(endAng)));
        return { x: R * Math.sin(ang) - R * Math.sin(endAng), s: 0.55 + 0.45 * k };
      };
      const b = head((180 + car * END) * D, (180 + END) * D);
      const s2 = head((180 - car * END) * D, (180 - END) * D);
      // hidden until the turn begins, then fade in while still tucked behind Vishnu's head
      set("--bo", ease(clamp((car - 0.04) / 0.3)).toFixed(3));
      set("--bx", `${b.x.toFixed(1)}px`); set("--bs", b.s.toFixed(3));
      set("--sx", `${s2.x.toFixed(1)}px`); set("--ss", s2.s.toFixed(3));
      const wave = clamp((sp - 0.62) / 0.22);
      set("--wave", wave.toFixed(3)); set("--waveo", (wave > 0 && wave < 1 ? (1 - wave) * 0.8 : 0).toFixed(3));
      const lit = clamp(car * 1.5).toFixed(3);
      set("--ab", lit); set("--as", lit);
    }

    // WORK: scroll a little slower here so the projects get read
    if (window.__lenis) {
      const b = box(work), inWork = b.top - sy < VH * 0.5 && b.top + b.h - sy > VH * 0.5;
      window.__lenis.virtualScroll.options.wheelMultiplier = inWork ? 0.5 : 0.9;
    }
    // WORK: card landscapes drift with scroll
    if (inView(work)) {
      const q = viewProgress(work);
      work.style.setProperty("--q", q.toFixed(3));
    }

    // TIMELINE: draw the line as you read
    if (inView(tl)) {
      const b = box(tl);
      tlFill.style.transform = `scaleY(${clamp((VH * 0.65 - (b.top - sy)) / b.h).toFixed(3)})`;
    }

    // DAWN: the sun comes up and the ridges rise into place
    if (inView(dawn)) dawnSticky.style.setProperty("--p", ease(clamp(sceneProgress(dawn) / 0.75)).toFixed(4));
  });


}

/* ---------- the About terminal is real (a little): ls, cat, clear ---------- */
function terminal() {
  const term = $(".term"), body = $(".term-body"), log = $("#term-log"), input = $("#term-input"), typed = $("#term-typed");
  if (!term || !input) return;
  const RESUME = "files/Vishal_S_Resume.pdf";
  const FILES = {
    "about.txt": () => SITE.story,
    "projects.txt": () => SITE.projects.map((p) => `${p.title}  (${p.kind})`).join("\n"),
    "contact.txt": () => [SITE.email, ...SITE.socials.filter((s) => s.url.startsWith("http")).map((s) => s.url)].join("\n"),
    "resume.pdf": null,
  };
  const out = (html, cls = "") => { const p = document.createElement("p"); p.className = "term-out " + cls; p.innerHTML = html; log.appendChild(p); };
  const echo = (cmd) => { const p = document.createElement("p"); p.className = "term-line"; p.innerHTML = `<span class="term-path">~</span> % ${esc(cmd)}`; log.appendChild(p); };
  const run = (raw) => {
    const cmd = raw.trim(), [name, ...args] = cmd.split(/\s+/), arg = args.join(" ");
    echo(raw);
    if (!cmd) return;
    switch (name) {
      case "ls": out(Object.keys(FILES).map((f) => `<span class="${f.includes(".") ? "" : "dir"}">${f}</span>`).join("   ")); break;
      case "cat":
        if (!arg) out("usage: cat &lt;file&gt;", "err");
        else if (arg === "resume.pdf") out(`That's a PDF. Try <b>open resume.pdf</b>.`);
        else if (FILES[arg]) out(esc(FILES[arg]()));
        else out(`cat: ${esc(arg)}: No such file or directory`, "err");
        break;
      case "open":
        if (arg === "resume.pdf") { const a = document.createElement("a"); a.href = RESUME; a.download = ""; a.click(); out("Downloading resume.pdf…"); }
        else out(`open: ${esc(arg || "?")}: not found`, "err");
        break;
      case "clear": case "cls": log.innerHTML = ""; break;
      case "whoami": out("vishal"); break;
      case "help": out("ls · cat &lt;file&gt; · open resume.pdf · clear · whoami"); break;
      default: out(`zsh: command not found: ${esc(name)}`, "err");
    }
  };
  const history = []; let hi = 0;
  // typing must never move the page: remember where we are and snap back if the browser scrolls
  let hold = null;
  const keep = () => {
    if (hold === null || Math.abs(scrollY - hold) < 2) return;
    if (window.__lenis) window.__lenis.scrollTo(hold, { immediate: true, force: true }); else scrollTo(0, hold);
  };
  input.addEventListener("focus", () => { hold = scrollY; });
  input.addEventListener("blur", () => { hold = null; });
  addEventListener("wheel", () => { if (hold !== null) hold = null; input.blur(); }, { passive: true });
  term.addEventListener("click", () => { if (term.classList.contains("done")) input.focus({ preventScroll: true }); });
  input.addEventListener("focus", () => term.classList.add("focus"));
  input.addEventListener("blur", () => term.classList.remove("focus"));
  input.addEventListener("input", () => { typed.textContent = input.value; keep(); requestAnimationFrame(keep); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      run(input.value);
      if (input.value.trim()) history.push(input.value);
      hi = history.length; input.value = ""; typed.textContent = "";
      body.scrollTop = body.scrollHeight;
      keep(); requestAnimationFrame(keep);
    } else if (e.key === "ArrowUp" && history.length) {
      e.preventDefault(); hi = Math.max(0, hi - 1); input.value = history[hi]; typed.textContent = input.value;
    } else if (e.key === "ArrowDown" && history.length) {
      e.preventDefault(); hi = Math.min(history.length, hi + 1); input.value = history[hi] || ""; typed.textContent = input.value;
    } else if (e.key === "Escape") input.blur();
  });
}

/* ---------- boot ---------- */
renderHome();
bootCommon();
scenes();
terminal();
