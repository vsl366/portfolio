/* =====================================================================
   PAC-MAN — browser port of Team 2's raylib/C game (SSN CSE).
   Ported line-by-line from PACMAN.c: same maze, BFS ghost AI, ghost
   personalities, cheat codes, levels, sprites and sounds.
   Runs at a fixed 60 ticks/sec like raylib's SetTargetFPS(60).
   ===================================================================== */
(() => {
  const root = document.getElementById("arcade");
  if (!root) return;
  const canvas = document.getElementById("pac-canvas");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("pac-overlay");
  const BASE = "games/pacman/";

  /* ---------------- constants (from PACMAN.c) ---------------- */
  const ROWS = 21, COLS = 41;
  const screenWidth = 1230, screenHeight = 730, gameWidth = 1230, gameHeight = 630;
  const cellWidth = gameWidth / 41, cellHeight = gameHeight / 21;
  const T = Math.trunc;                       // C (int) cast truncates toward zero
  const STEP = 1000 / 60;
  const col = (r, g, b, a = 255) => `rgba(${r},${g},${b},${a / 255})`;
  const YELLOW = col(253, 249, 0), PINK = col(255, 109, 194), RED = col(230, 41, 55), SKYBLUE = col(102, 191, 255);
  const GRAY = col(130, 130, 130), WHITE = "#fff", RAYWHITE = col(245, 245, 245), BLACK = "#000";
  const loading = [YELLOW, PINK, RED, SKYBLUE];
  const ssnblue = col(13, 65, 190, 225);
  const pacmanColor = col(252, 234, 7);       // (252,234,263) overflows to 7 in C
  const pelletColor = col(245, 140, 50);

  const MAZE0 = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,1],
    [1,2,1,2,1,1,1,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,2,1],
    [1,2,1,2,2,2,2,2,2,2,2,2,2,2,1,2,1,2,2,2,1,0,0,0,0,0,0,0,1,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,2,1,2,1,0,1,1,1,1,1,0,1,1,1,1,1,2,1,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,1,2,1,1,1,1,1,2,1,1,1,1,1,2,1,0,1,1,1,1,1,0,1,1,1,1,1,2,1,1,1,1,1,2,1],
    [1,2,1,2,2,2,2,2,1,2,2,2,2,2,1,2,3,2,1,2,1,0,1,1,1,1,1,0,1,2,2,2,2,2,1,2,2,2,2,2,1],
    [1,2,1,3,1,1,1,2,1,3,1,1,1,2,1,2,1,2,1,2,1,0,1,1,0,1,1,0,1,2,1,1,1,2,1,2,1,1,1,2,1],
    [1,2,1,2,2,2,2,2,1,2,2,2,2,2,1,2,1,2,1,2,1,0,1,1,0,1,1,0,1,2,2,2,2,2,1,2,2,2,2,2,1],
    [0,2,1,1,1,1,1,2,1,1,1,1,1,2,1,2,1,2,1,2,0,0,1,1,0,0,0,0,1,1,1,1,1,2,1,1,1,1,1,2,0],
    [1,2,2,2,2,2,1,2,2,2,2,2,1,2,1,2,1,2,1,2,1,0,1,1,0,1,1,0,2,2,2,2,1,2,1,2,2,2,2,2,1],
    [1,2,1,1,1,2,1,2,1,1,1,2,1,2,1,2,1,2,1,2,1,0,1,1,0,1,1,0,1,1,1,3,1,2,1,3,1,1,1,2,1],
    [1,2,2,2,2,2,1,2,2,2,2,2,1,2,1,2,1,2,1,2,1,0,1,1,1,1,1,0,2,2,2,2,1,2,1,2,2,2,2,2,1],
    [1,2,1,1,1,1,1,2,1,1,1,1,1,2,1,2,1,2,1,2,1,0,1,1,1,1,1,0,1,1,1,1,1,2,1,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,2,1,0,1,1,1,1,1,0,1,1,1,1,1,2,1,2,1,2,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,3,1,2,2,2,1,2,1,2,1,2,1],
    [1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,1,1,1,1,1,2,1,2,1,2,1,2,1],
    [1,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ];
  // The C maze is one contiguous int[21][41]; out-of-range columns read the
  // neighbouring row. A flat array reproduces that behaviour exactly.
  const maze = Int32Array.from(MAZE0.flat());
  const idx = (r, c) => r * COLS + c;
  const M = (r, c) => { const i = idx(r, c); return i >= 0 && i < maze.length ? maze[i] : 0; };
  const setM = (r, c, v) => { const i = idx(r, c); if (i >= 0 && i < maze.length) maze[i] = v; };

  /* ---------------- assets ---------------- */
  // assets load lazily, once the arcade is near the viewport
  const pending = [];
  const img = (p) => { const i = new Image(); i.dataset.src = BASE + p; pending.push(i); return i; };
  const loadAssets = () => { while (pending.length) { const i = pending.pop(); i.src = i.dataset.src; } };
  new IntersectionObserver(([e], io) => { if (e.isIntersecting) { loadAssets(); io.disconnect(); } }, { rootMargin: "1200px 0px" }).observe(root);
  const IM = {
    heart: img("img/heart.png"), maze: img("img/maze.png"), mazeW: img("img/maze-win.png"), gameover: img("img/end.png"),
    ssn: img("img/ssn.png"), logo: img("img/logo.png"), wallpaper: img("img/wallpaper.png"), inky: img("img/inky-big.png"),
    rules: img("img/rules.png"), info: img("img/info.png"),
    fBlue1: img("sprites/ghosts/vulnerable/blue1.png"), fBlue2: img("sprites/ghosts/vulnerable/blue2.png"),
    fWhite1: img("sprites/ghosts/vulnerable/white1.png"), fWhite2: img("sprites/ghosts/vulnerable/white2.png"),
    eyesL: img("sprites/ghosts/eyes/leftEyes.png"), eyesR: img("sprites/ghosts/eyes/rightEyes.png"),
    eyesU: img("sprites/ghosts/eyes/upEyes.png"), eyesD: img("sprites/ghosts/eyes/downEyes.png"),
  };
  const deathAnim = Array.from({ length: 11 }, (_, i) => img(`sprites/pac/deathAnim/death${i + 1}.png`));
  const ghostSprites = (dir, name) => ["L1", "L2", "R1", "R2", "U1", "U2", "D1", "D2"].map((s) => img(`sprites/ghosts/${dir}/${name}${s}.png`));

  /* sounds are created lazily on first click (browsers block autoplay anyway) */
  let muted = false, sounds = null;
  function makeSounds() {
    const S = (file, vol = 1) => {
      const a = new Audio(BASE + "audio/" + file); a.volume = vol; a.preload = "auto";
      return {
        a,
        play() { if (muted) return; a.currentTime = 0; a.play().catch(() => {}); },
        stop() { a.pause(); try { a.currentTime = 0; } catch (e) {} },
        playing() { return !a.paused && !a.ended; },
      };
    };
    sounds = {
      ssn_start: S("startup.mp3", 0.6), pellet: S("munch_1.wav", 0.55), n_siren: S("siren_1.wav", 0.45),
      s_siren: S("siren_3.wav", 0.45), start_s: S("start.mp3", 0.8), pacdead_s: S("pacdead.mp3", 0.5),
    };
  }
  const snd = (k) => (sounds ? sounds[k] : { play() {}, stop() {}, playing() { return false; } });
  const stopAll = () => sounds && Object.values(sounds).forEach((s) => s.stop());

  /* ---------------- game state (C globals + statics) ---------------- */
  let highscore = 5890;                        // Team 2's saved highscore.dat
  try { highscore = Math.max(highscore, +localStorage.getItem("vs-pacman-hs") || 0); } catch (e) {}
  const saveHS = () => { try { localStorage.setItem("vs-pacman-hs", String(highscore)); } catch (e) {} };

  const pacman = { x: gameWidth / 2, y: gameHeight / 2, moveX: 0, moveY: 0, radius: cellWidth * 0.44, speed: 3.0, start: 30, end: 330, gridX: 20, gridY: 10, alive: 1, numGhost: 0 };
  const mkGhost = (sprites, row, col, start_time) => ({
    img: sprites, alive: 1, moveX: 0, moveY: 0, x: col * cellWidth, y: row * cellHeight, speed: 0,
    initial: { row, col }, start: { row, col }, end: { row: 1, col: 1 }, path: [], distance: 0,
    sp: 0, spcounter: 0, start_time, ghostFc: 0, mode: 1, modetime: 1, atcorner: 0,
  });
  const ghosts = [
    mkGhost(ghostSprites("red", "blinky"), 9, 24, 240),
    mkGhost(ghostSprites("orange", "inky"), 8, 24, 480),
    mkGhost(ghostSprites("pink", "pinky"), 11, 24, 540),
    mkGhost(ghostSprites("blue", "clyde"), 12, 24, 600),
  ];

  let screen = 1;
  let PacOldX = 0, PacOldY = 0, speedFactor = 0, oldmoveX = 0, oldmoveY = 0;
  let mainCounter = 0, gameCounter = 0, winCounter = 0, retCounter = 0, messCounter = 0, x = 0, sptime = 0, startplayed = 0;
  let update = 0, is_sp = 0, acceptInput = 0;
  let life = 0, score = 0, win = 0, pelletcount = 0, level = 1;
  let cheatEnabled = 1, cheat = 0, aspirin = 0, freeze = 0, gohome = 0;
  // statics
  let posx = 0, posy = screenHeight / 2, frame_counter = 0, temp_c = 0, alpha = 0, color_index = 0;
  let click = 0, text_size = 35, text_step = 0.4;
  let updateLife = 1, isLvl1 = 1;
  let blinkyCell = 0, clydeCell = 0, pinkyCell = 0, inkyIndex = 0;
  let animFc = -1, pacim = null, ghostTe = null;
  let startupPlayed = false;

  /* ---------------- input (raylib-style "pressed this tick") ---------------- */
  let queued = [], keys = [];
  let mouse = { x: -1, y: -1, down: false }, mouseQueued = false, mousePressed = false;
  const IsKeyPressed = (k) => keys.includes(k);
  const GetKeyPressed = () => keys.find((k) => k.length === 1);
  const isAnyAlphabetKeyPressed = () => keys.some((k) => k.length === 1);

  /* ---------------- BFS (shortestDistanceWithPath) ---------------- */
  function shortestDistanceWithPath(start, end, path) {
    const visited = new Uint8Array(ROWS * COLS), parent = new Int32Array(ROWS * COLS).fill(-1);
    const valid = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS && maze[idx(r, c)] !== 1 && !visited[idx(r, c)];
    if (start.row < 0 || start.row >= ROWS || start.col < 0 || start.col >= COLS) return -1;
    let q = [start], head = 0, distance = 0;
    visited[idx(start.row, start.col)] = 1;
    while (head < q.length) {
      const size = q.length - head;
      for (let i = 0; i < size; i++) {
        const cur = q[head++];
        if (cur.row === end.row && cur.col === end.col) {
          path.length = 0;
          let c = cur;
          while (c.row !== start.row || c.col !== start.col) {
            path.push(c);
            const p = parent[idx(c.row, c.col)];
            c = { row: (p / COLS) | 0, col: p % COLS };
          }
          path.push(start);
          path.reverse();
          return distance;
        }
        const { row, col: cc } = cur;
        for (const [r, c] of [[row - 1, cc], [row + 1, cc], [row, cc - 1], [row, cc + 1]]) {
          if (valid(r, c)) { q.push({ row: r, col: c }); visited[idx(r, c)] = 1; parent[idx(r, c)] = idx(row, cc); }
        }
      }
      distance++;
    }
    return -1;
  }

  /* ---------------- helpers ported from C ---------------- */
  function findgrid(xstart, xend, ystart, yend, dis) {
    for (let i = ystart; i < yend; i++) {
      if (i > 0 && i < 20) {
        for (let j = xstart; j < xend; j++) {
          if (j > 0 && j < 40 && M(i, j) !== 1 && Math.sqrt((pacman.gridX - j) ** 2 + (pacman.gridY - i) ** 2) === dis)
            return [{ row: i, col: j }, 1];
        }
      }
    }
    return [{ row: 1, col: 1 }, 0];
  }
  function resetghost() {
    for (const g of ghosts) {
      g.x = g.initial.col * cellWidth; g.y = g.initial.row * cellHeight;
      g.moveX = 0; g.moveY = 0; g.alive = 1; g.speed = pacman.speed * speedFactor;
      g.sp = 0; g.spcounter = 0;
      g.start = { row: T(g.y / cellHeight), col: T(g.x / cellWidth) };
      g.mode = 1; g.modetime = 1; g.ghostFc = 0; g.atcorner = 0;
    }
  }
  function reset() { for (let i = 0; i < maze.length; i++) maze[i] = Math.abs(maze[i]); }
  function gamestart(lvl) {
    pacman.x = gameWidth / 2; pacman.y = gameHeight / 2;
    PacOldX = pacman.x; PacOldY = pacman.y;
    pacman.moveX = 0; pacman.moveY = 0; pacman.start = 30; pacman.end = 330;
    oldmoveX = 0; oldmoveY = 0;
    mainCounter = 1; gameCounter = 1; retCounter = 300; messCounter = 1; x = 1;
    // (the C version re-declares update/is_sp/acceptInput/cheat/pelletcount as locals here — no-ops)
    reset(); resetghost();
    if (lvl === 1) { life = 3; score = 0; speedFactor = 0.8; sptime = 360; startplayed = 0; win = 0; }
    else if (lvl === 2) { speedFactor = 0.85; sptime = 300; }
    else if (lvl === 3) { speedFactor = 0.9; sptime = 240; }
  }
  function initialise() { pacman.moveX = 0; pacman.moveY = 0; pacman.start = 30; pacman.end = 330; resetghost(); }
  function checkwall() {
    for (;;) { const c = { row: 1 + ((Math.random() * 19) | 0), col: 1 + ((Math.random() * 39) | 0) }; if (M(c.row, c.col) !== 1) return c; }
  }
  function standby() {
    gameCounter = 1;
    for (const g of ghosts) { g.moveX = 0; g.moveY = 0; g.ghostFc = 1; }
    pacman.x = PacOldX; pacman.y = PacOldY; pacman.moveX = 0; pacman.moveY = 0;
  }
  // ---- cheat codes: CHEAT, ASPIRIN, FREEZE, GOHOME ----
  function processCHEAT(k) {
    if (k === "C" && cheat === 0) cheat = 1;
    else if (k === "H" && cheat === 1) cheat = 2;
    else if (k === "E" && cheat === 2) cheat = 3;
    else if (k === "A" && cheat === 3) cheat = 4;
    else if (k === "T" && cheat === 4) {
      for (let i = 0; i < maze.length; i++) if (maze[i] === 2 || maze[i] === 3) { pelletcount += 1; maze[i] = -maze[i]; }
      cheat = 0;
    } else cheat = 0;
  }
  function processASPIRIN(k) {
    const seq = "ASPIRIN";
    if (k === seq[aspirin] && aspirin < 6) aspirin++;
    else if (k === "N" && aspirin === 6) { if (life < 5) life++; aspirin = 0; }
    else aspirin = 0;
  }
  function processFREEZE(k) {
    if (k === "F" && freeze === 0) freeze = 1;
    else if (k === "R" && freeze === 1) freeze = 2;
    else if (k === "E" && freeze === 2) freeze = 3;
    else if (k === "E" && freeze === 3) freeze = 4;
    else if (k === "Z" && freeze === 4) freeze = 5;
    else if (k === "E" && freeze === 5) { freeze = 0; standby(); gameCounter = 240; }
    else freeze = 0;
  }
  function processGOHOME(k) {
    if (k === "G" && gohome === 0) gohome = 1;
    else if (k === "O" && gohome === 1) gohome = 2;
    else if (k === "H" && gohome === 2) gohome = 3;
    else if (k === "O" && gohome === 3) gohome = 4;
    else if (k === "M" && gohome === 4) gohome = 5;
    else if (k === "E" && gohome === 5) { gohome = 0; resetghost(); }
    else gohome = 0;
  }
  const cheatcodes = (k) => { processCHEAT(k); processASPIRIN(k); processFREEZE(k); processGOHOME(k); };

  /* ---------------- drawing helpers ---------------- */
  const FONT = '"Press Start 2P", monospace';
  function text(s, x0, y0, size, color, align = "left") {
    ctx.font = `${size}px ${FONT}`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "top";
    ctx.fillText(s, x0, y0);
  }
  function DrawPacman(px, py, r, a0, a1, color) {
    ctx.fillStyle = color; ctx.beginPath();
    if (a1 - a0 >= 360) ctx.arc(px, py, r, 0, Math.PI * 2);
    else { ctx.moveTo(px, py); ctx.arc(px, py, r, (a0 * Math.PI) / 180, (a1 * Math.PI) / 180); ctx.closePath(); }
    ctx.fill();
  }
  const circle = (cx, cy, r, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); };
  const draw = (im, dx, dy, w, h) => { if (im && im.complete && im.naturalWidth) ctx.drawImage(im, dx, dy, w ?? im.naturalWidth, h ?? im.naturalHeight); };
  function DrawMaze(sp) {
    const r2 = Math.min(cellWidth, cellHeight) * 0.1, r3 = Math.min(cellWidth, cellHeight) * 0.2;
    for (let i = 0; i < ROWS; i++) for (let j = 0; j < COLS; j++) {
      const v = maze[idx(i, j)], cx = j * cellWidth + cellWidth / 2, cy = i * cellHeight + cellHeight / 2;
      if (v === 2) circle(cx, cy, r2, pelletColor);
      else if (v === 3) circle(cx, cy, r3, sp === 0 ? BLACK : pelletColor);
    }
  }
  const inCircle = (p, cx, cy, r) => (p.x - cx) ** 2 + (p.y - cy) ** 2 <= r * r;
  const inRect = (p, rx, ry, rw, rh) => p.x >= rx && p.x <= rx + rw && p.y >= ry && p.y <= ry + rh;
  function backButton() {
    if (inRect(mouse, 50, 630, 120, 50)) {
      ctx.strokeStyle = ssnblue; ctx.lineWidth = 2; ctx.strokeRect(50, 630, 120, 50);
      text("Back", 66, 645, 20, ssnblue);
      if (mouse.down) screen = 2;
    } else {
      ctx.fillStyle = ssnblue; ctx.fillRect(50, 630, 120, 50);
      text("Back", 66, 645, 20, BLACK);
    }
  }

  /* ================= ONE TICK of the original while(!WindowShouldClose()) ================= */
  function tick() {
    keys = queued; queued = [];
    mousePressed = mouseQueued; mouseQueued = false;

    ctx.fillStyle = BLACK; ctx.fillRect(0, 0, screenWidth, screenHeight);
    if (!startupPlayed && screen !== 5) { snd("ssn_start").play(); startupPlayed = true; }

    /* ---------- screen 1: SSN logo + Pac-Man chase intro ---------- */
    if (screen === 1) {
      if (IsKeyPressed("S") || mousePressed) screen = 2;
      frame_counter += 1;
      const a = Math.max(0, Math.min(1, alpha));
      if (frame_counter < 180) { ctx.globalAlpha = a; draw(IM.ssn, screenWidth / 2 - 150, screenHeight / 2 - 64); ctx.globalAlpha = 1; alpha += 0.01; }
      else if (frame_counter < 360) { ctx.globalAlpha = a; draw(IM.ssn, screenWidth / 2 - 150, screenHeight / 2 - 64); ctx.globalAlpha = 1; alpha -= 0.01; }
      if (frame_counter % 15 === 0) temp_c += 1;
      if (frame_counter > 380) {
        if (temp_c % 2 === 0) {
          circle(screenWidth / 2, 600, 20, loading[color_index]);
          DrawPacman(posx, posy, 95, 40, 320, YELLOW);
          if (frame_counter % 15 === 0) { color_index += 1; if (color_index === 4) color_index = 0; }
        } else DrawPacman(posx, posy, 90, 0, 360, YELLOW);
        draw(IM.inky, posx - 350, posy - 100);
        posx += 6;
        if (posx - 350 > screenWidth + 150) screen += 1;
      }
    }
    /* ---------- screen 2: title ---------- */
    if (screen === 2) {
      text_size += text_step;
      if (text_size > 50 || text_size < 35) text_step = -text_step;
      draw(IM.ssn, 50, 625, 100, 50);
      draw(IM.wallpaper, screenWidth / 2 - 125, screenHeight / 2 - 35);
      draw(IM.logo, screenWidth / 5 + 35, 0);
      text("A game recreated by SSN CSE Department", screenWidth / 2, 275, 15, WHITE, "center");
      text("press space to play", screenWidth / 2, 470 - text_size * 0.3, Math.round(text_size * 0.56), YELLOW, "center");
      const info = { x: 225, y: 650 }, dev = { x: 315, y: 650 };
      if (inCircle(mouse, info.x, info.y, 30)) {
        ctx.strokeStyle = ssnblue; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(info.x, info.y, 30, 0, Math.PI * 2); ctx.stroke();
        text("i", info.x, 636, 28, ssnblue, "center");
        if (mouse.down) screen = 4;
      } else { circle(info.x, info.y, 30, ssnblue); text("i", info.x, 636, 28, BLACK, "center"); }
      if (inCircle(mouse, dev.x, dev.y, 30)) {
        ctx.strokeStyle = ssnblue; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(dev.x, dev.y, 30, 0, Math.PI * 2); ctx.stroke();
        text("?", dev.x, 636, 28, ssnblue, "center");
        if (mouse.down) screen = 3;
      } else { circle(dev.x, dev.y, 30, ssnblue); text("?", dev.x, 636, 28, BLACK, "center"); }
      if (IsKeyPressed("SPACE")) { screen = 5; snd("ssn_start").stop(); }
      if (inRect(mouse, 50, 625, 100, 50) && mousePressed) click += 1;
      if (click === 3 || click === 4) text("WE MADE THE BEST PAC-MAN! PERIOD!", screenWidth / 2, 400, 18, WHITE, "center");
      if (click === 7) click = 0;
      text(`HIGH SCORE ${highscore}`, screenWidth / 2, 325, 20, RED, "center");
    }
    /* ---------- screen 3: rules + cheat toggle ---------- */
    if (screen === 3) {
      draw(IM.rules, 50, 10);
      draw(IM.logo, 975, 600, 200, 100);
      ctx.strokeStyle = ssnblue; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(750, 630, 180, 40, 20); ctx.stroke();
      text("CHEAT", 620, 642, 20, ssnblue);
      ctx.fillStyle = ssnblue; ctx.beginPath();
      if (cheatEnabled) { ctx.roundRect(755, 635, 80, 30, 12); ctx.fill(); text("ON", 778, 643, 16, RAYWHITE); text("OFF", 862, 643, 16, ssnblue); }
      else { ctx.roundRect(845, 635, 80, 30, 12); ctx.fill(); text("ON", 778, 643, 16, ssnblue); text("OFF", 862, 643, 16, RAYWHITE); }
      if (inRect(mouse, 845, 635, 80, 30) && mousePressed) cheatEnabled = 0;
      if (inRect(mouse, 755, 635, 80, 30) && mousePressed) cheatEnabled = 1;
      backButton();
    }
    /* ---------- screen 4: info ---------- */
    if (screen === 4) {
      draw(IM.info, 0, 0, screenWidth, screenHeight);
      draw(IM.logo, 975, 600, 200, 100);
      backButton();
    }
    /* ---------- screen 5: the game ---------- */
    if (screen === 5) {
      if (score === 10000 && updateLife) { life++; updateLife = 0; }
      if (level === 1 && isLvl1) { isLvl1 = 0; gamestart(level); }
      else if (pelletcount === 360) {
        winCounter++;
        standby();
        if (winCounter > 120) { level++; winCounter = 1; pelletcount = 0; gamestart(level); }
      }
      if (level === 4) win = 1;
      else if (life === 0 && gameCounter > 70) win = -1;

      if (win === 0) {
        if (isAnyAlphabetKeyPressed() && cheatEnabled) cheatcodes(GetKeyPressed());
        PacOldX = pacman.x; PacOldY = pacman.y;
        gameCounter++;
        if (gameCounter < 240) {
          if (!startplayed) { snd("start_s").play(); startplayed = 1; }
        } else if (gameCounter > 240) {
          const anySp = ghosts.some((g) => g.sp !== 0);
          if (!snd("n_siren").playing() && win === 0 && !anySp) { snd("n_siren").play(); snd("s_siren").stop(); }
          else if (!snd("s_siren").playing() && win === 0 && !snd("n_siren").playing()) { snd("s_siren").play(); snd("n_siren").stop(); }

          const P = pacman, r = P.radius;
          const free = (rowA, colA, rowB, colB) => M(rowA, colA) !== 1 && M(rowB, colB) !== 1;
          const canRight = () => free(T((P.y - r) / cellHeight), T((P.x + r) / cellWidth) + 1, T((P.y + r) / cellHeight), T((P.x + r) / cellWidth) + 1);
          const canLeft = () => free(T((P.y - r) / cellHeight), T((P.x - r) / cellWidth) - 1, T((P.y + r) / cellHeight), T((P.x - r) / cellWidth) - 1);
          const canDown = () => free(T((P.y + r) / cellHeight) + 1, T((P.x - r) / cellWidth), T((P.y + r) / cellHeight) + 1, T((P.x + r) / cellWidth));
          const canUp = () => free(T((P.y - r) / cellHeight) - 1, T((P.x - r) / cellWidth), T((P.y - r) / cellHeight) - 1, T((P.x + r) / cellWidth));
          const anyArrow = IsKeyPressed("RIGHT") || IsKeyPressed("LEFT") || IsKeyPressed("UP") || IsKeyPressed("DOWN");

          if (P.x <= -1 || P.x > screenWidth + 1) acceptInput = 0;
          else if (anyArrow) acceptInput = 1;
          if (acceptInput) {
            if (IsKeyPressed("RIGHT")) {
              update = 0; oldmoveX = 1; cheat = 0;
              if (canRight()) { P.moveX = 1; P.moveY = 0; P.start = 30; P.end = 330; }
            } else if (IsKeyPressed("LEFT")) {
              update = 0; oldmoveX = -1; cheat = 0;
              if (P.gridX !== 27 || Math.abs(P.gridY - 10) > 0)
                if (canLeft()) { P.moveX = -1; P.moveY = 0; P.start = 210; P.end = 510; }
            } else if (IsKeyPressed("DOWN")) {
              update = 1; oldmoveY = 1; cheat = 0;
              if (canDown()) { P.moveX = 0; P.moveY = 1; P.start = 135; P.end = 405; }
            } else if (IsKeyPressed("UP")) {
              update = 1; oldmoveY = -1; cheat = 0;
              if (canUp()) { P.moveX = 0; P.moveY = -1; P.start = 385; P.end = 585; }
            } else if (update === 0) {
              if (oldmoveX === 1) { if (canRight()) { P.moveX = 1; P.moveY = 0; P.start = 30; P.end = 330; } }
              else if (oldmoveX === -1) {
                if (T(P.x / cellWidth) !== 27 || Math.abs(P.gridY - 10) > 0)
                  if (canLeft()) { P.moveX = -1; P.moveY = 0; P.start = 210; P.end = 510; }
              }
            } else if (update === 1) {
              if (oldmoveY === 1) { if (canDown()) { P.moveX = 0; P.moveY = 1; P.start = 135; P.end = 405; } }
              else if (oldmoveY === -1) { if (canUp()) { P.moveX = 0; P.moveY = -1; P.start = 320; P.end = 585; } }
            }
          }
        }
        // ---- wall collision ----
        const P = pacman;
        const nextPosX = T(P.x + P.speed * P.moveX);
        const nextPosY = T(P.y + P.speed * P.moveY);
        let leftEdge = nextPosX - P.radius, rightEdge = nextPosX + P.radius, topEdge = P.y - P.radius, bottomEdge = P.y + P.radius;
        const open4 = () => M(T(topEdge / cellHeight), T(leftEdge / cellWidth)) !== 1 && M(T(topEdge / cellHeight), T(rightEdge / cellWidth)) !== 1 &&
          M(T(bottomEdge / cellHeight), T(leftEdge / cellWidth)) !== 1 && M(T(bottomEdge / cellHeight), T(rightEdge / cellWidth)) !== 1;
        let collideX = false;
        if (P.moveX !== 0 && open4()) collideX = true;
        leftEdge = P.x - P.radius; rightEdge = P.x + P.radius; topEdge = nextPosY - P.radius; bottomEdge = nextPosY + P.radius;
        let collideY = false;
        if (P.moveY !== 0 && open4()) collideY = true;
        if (collideX) P.x = nextPosX;
        if (collideY) P.y = nextPosY;
        else if (P.x < -P.radius) P.x = screenWidth + P.radius;
        else if (P.x > screenWidth + P.radius) P.x = -P.radius;
        else if (P.x >= cellWidth * 40.4 && P.moveX !== 0) P.x = P.x + P.moveX * P.speed;
        else if (P.x >= screenWidth + P.radius + 1 && P.moveX === -1) P.x = P.x - P.speed;
        P.gridX = T(P.x / cellWidth);
        P.gridY = T(P.y / cellHeight);
        // ---- pellets ----
        if (M(P.gridY, P.gridX) === 2) { snd("pellet").play(); setM(P.gridY, P.gridX, -2); score += 10; pelletcount += 1; }
        else if (M(P.gridY, P.gridX) === 3) { snd("pellet").play(); snd("n_siren").stop(); setM(P.gridY, P.gridX, -3); score += 50; is_sp = 1; pelletcount += 1; }
        if (is_sp === 1) {
          for (const g of ghosts) {
            if (T(g.x) / cellWidth < 22 || T(g.x) / cellWidth > 26 || T(g.y) / cellHeight > 13 || T(g.y) / cellHeight < 7) { g.sp = 1; g.spcounter = 0; }
          }
          is_sp = 0;
        }
        // ---- ghosts ----
        for (let i = 0; i < 4; i++) {
          const g = ghosts[i];
          g.start = { row: T(g.y / cellHeight), col: T(g.x / cellWidth) };
          g.ghostFc++;
          if (T(g.x / cellWidth) === P.gridX && T(g.y / cellHeight) === P.gridY) {
            if (g.sp === 1) {
              score += 200 * Math.pow(2, P.numGhost); P.numGhost++;
              g.alive = 0; g.sp = 0; g.spcounter = 0; g.speed = 4 * P.speed;
              g.end = { row: g.initial.row, col: g.initial.col };
            } else if (g.alive) {
              life -= 1; gameCounter = 1; acceptInput = 0; P.alive = 0; initialise();
            }
          }
          if (g.alive === 0 && T(g.x / cellWidth) === g.initial.col && T(g.y / cellHeight) === g.initial.row) { g.ghostFc = 420; g.alive = 1; }
          if (g.alive) {
            if (g.spcounter > sptime || g.sp === 0) {
              g.speed = speedFactor * P.speed; g.sp = 0; g.spcounter = 0; g.atcorner = 0; g.modetime++;
              const blinkyX = T(ghosts[0].x / cellWidth), blinkyY = T(ghosts[0].y / cellHeight);
              const bX = blinkyX, bY = blinkyY;
              if (i === 0) {                                   // Blinky: patrol, then hunt
                const blinkyPath = [[5, 33], [5, 39], [3, 39], [3, 33], [1, 33], [1, 39]];
                if (g.modetime < 660) { const c = blinkyPath[blinkyCell]; if (c) g.end = { row: c[0], col: c[1] }; }
                else g.end = { row: P.gridY, col: P.gridX };
                if (blinkyCell === 6) blinkyCell = 0;
                else if (T(g.y / cellHeight) === blinkyPath[blinkyCell][0] && T(g.x / cellWidth) === blinkyPath[blinkyCell][1]) blinkyCell += 1;
              } else if (i === 1) {                            // Clyde: shy when close
                const clydePacDist = Math.abs(T(g.y / cellHeight) - T(P.y / cellHeight)) + Math.abs(T(g.x / cellWidth) - T(P.x / cellWidth));
                if (g.modetime % 120 === 0) {
                  g.modetime = 0;
                  g.mode = clydePacDist <= 8 || (P.x === PacOldX && P.y === PacOldY) ? 1 : 2;
                }
                if (g.mode === 1) {
                  const clydePath = [[15, 1], [15, 13], [17, 13], [17, 19], [19, 19], [19, 1], [17, 1], [17, 19], [15, 19], [15, 13], [17, 13], [17, 1]];
                  g.end = { row: clydePath[clydeCell][0], col: clydePath[clydeCell][1] };
                  if (clydeCell === 11) clydeCell = 0;
                  else if (T(g.y / cellHeight) === clydePath[clydeCell][0] && T(g.x / cellWidth) === clydePath[clydeCell][1]) clydeCell += 1;
                } else if (g.mode === 2) g.end = { row: T(P.y / cellHeight), col: T(P.x / cellWidth) };
              } else if (i === 2) {                            // Pinky: ambush 4 tiles ahead
                if (g.modetime > 1200) g.mode = 2;
                if (g.modetime > 1920) { g.modetime = 0; g.mode = 1; }
                if (g.mode === 1) {
                  const pinkyRow = T(T(P.y) / cellHeight + P.moveY * 4);
                  const pinkyCol = T(T(P.x) / cellWidth + P.moveX * 4);
                  if ((P.x === PacOldX && P.y === PacOldY) || (M(pinkyRow, pinkyCol) === 1 || (pinkyRow < 0 || pinkyRow > 20) || (pinkyCol < 0 || pinkyCol > 40)) || (pinkyRow === bY && pinkyCol === bX))
                    g.end = { row: T(T(P.y) / cellHeight), col: T(T(P.x) / cellWidth) };
                  else g.end = { row: pinkyRow, col: pinkyCol };
                } else {
                  const pinkyPath = [[1, 13], [3, 13], [3, 3], [1, 1], [5, 1], [5, 15], [1, 15]];
                  g.end = { row: pinkyPath[pinkyCell][0], col: pinkyPath[pinkyCell][1] };
                  if (pinkyCell === 6) pinkyCell = 0;
                  else if (T(g.y / cellHeight) === pinkyPath[pinkyCell][0] && T(g.x / cellWidth) === pinkyPath[pinkyCell][1]) pinkyCell += 1;
                }
              } else if (i === 3) {                            // Inky: mirror Blinky through Pac-Man
                const pacBlinkydis = T(Math.sqrt((P.gridX - blinkyX) ** 2 + (P.gridY - blinkyY) ** 2));
                let inkyCell = null, inkyPathFound = 0;
                if (P.gridY <= blinkyY && P.gridX <= blinkyX) [inkyCell, inkyPathFound] = findgrid(blinkyX, 40, blinkyY, 20, 2 * pacBlinkydis);
                else if (P.gridY <= blinkyY && P.gridX > blinkyX) [inkyCell, inkyPathFound] = findgrid(0, blinkyX, blinkyY, 20, 2 * pacBlinkydis);
                else if (P.gridY > blinkyY && P.gridX < blinkyX) [inkyCell, inkyPathFound] = findgrid(blinkyX, 40, 0, blinkyY, 2 * pacBlinkydis);
                else if (P.gridY > blinkyY && P.gridX > blinkyX) [inkyCell, inkyPathFound] = findgrid(0, blinkyX, 0, blinkyY, 2 * pacBlinkydis);
                if (inkyPathFound === 1) g.end = { ...inkyCell };
                else {
                  const inkyPath = [[15, 21], [15, 39], [19, 39], [19, 35], [15, 35], [15, 29], [17, 29], [17, 21]];
                  g.end = { row: inkyPath[inkyIndex][0], col: inkyPath[inkyIndex][1] };
                  if (inkyIndex === 7) inkyIndex = 0;
                  else if (T(g.y / cellHeight) === inkyPath[inkyIndex][0] && T(g.x / cellWidth) === inkyPath[inkyIndex][1]) inkyIndex += 1;
                }
              }
            }
            if (g.sp === 1) {                                   // frightened: flee to a far corner
              g.speed = 0.4 * P.speed; g.spcounter++;
              if (g.moveX === 0 && g.moveY === 0) { g.atcorner = 1; g.end = checkwall(); }
              else if (!g.atcorner) {
                if (P.x <= g.x && P.y <= g.y) g.end = { row: 19, col: 39 };
                if (P.x <= g.x && P.y >= g.y) g.end = { row: 1, col: 39 };
                if (P.x >= g.x && P.y <= g.y) g.end = { row: 19, col: 1 };
                if (P.x >= g.x && P.y >= g.y) g.end = { row: 1, col: 1 };
              }
            }
          }
          g.distance = shortestDistanceWithPath(g.end, g.start, g.path);
          if (g.distance > 0) {
            g.moveX = g.path[g.distance - 1].col - g.path[g.distance].col;
            g.moveY = g.path[g.distance - 1].row - g.path[g.distance].row;
          } else { g.moveX = 0; g.moveY = 0; }
          if (g.ghostFc > g.start_time && pelletcount < 360) { g.x += g.speed * g.moveX; g.y += g.speed * g.moveY; }
        }
        if (ghosts.every((g) => g.sp === 0)) P.numGhost = 0;

        // ---- draw ----
        ctx.fillStyle = BLACK; ctx.fillRect(0, 0, screenWidth, screenHeight);
        text(String(score), 15, screenHeight * 0.88, 18, WHITE);
        text(`Level ${level}`, 15, screenHeight * 0.92, 18, GRAY);
        text(`Highscore ${highscore}`, 15, screenHeight * 0.96, 18, GRAY);
        for (let i = 1; i <= life; i++) draw(IM.heart, screenWidth / 1.6 + 2 * (i + 1) * cellWidth, screenHeight * 0.88);
        draw(IM.maze, 0, 0, gameWidth, gameHeight);
        if (winCounter < 120 && pelletcount === 360) {
          snd("n_siren").stop(); snd("s_siren").stop();
          if (x % 2 === 0) draw(IM.mazeW, 0, 0, gameWidth, gameHeight);
        }
        if (x % 2 === 0) { DrawMaze(0); mainCounter++; } else DrawMaze(1);
        if (gameCounter < 240 && life === 3 && level === 1 && pelletcount === 0) text("READY!", 685, 457, 16, YELLOW);
        if (P.alive) {
          if ((P.moveX === 0 && P.moveY === 0) || (PacOldX === P.x && PacOldY === P.y)) DrawPacman(P.x, P.y, cellWidth * 0.35, P.start, P.end, pacmanColor);
          else if (x % 2 === 0) DrawPacman(P.x, P.y, cellWidth * 0.35, 0, 360, pacmanColor);
          else DrawPacman(P.x, P.y, cellWidth * 0.35, P.start, P.end, pacmanColor);
          for (const g of ghosts) {
            if (g.alive === 0) {
              if (g.moveX === 1) ghostTe = IM.eyesR; else if (g.moveX === -1) ghostTe = IM.eyesL;
              else if (g.moveY === 1) ghostTe = IM.eyesD; else if (g.moveY === -1) ghostTe = IM.eyesU;
            } else if (g.sp === 1) {
              if (sptime - g.spcounter > 150 && x % 2 === 0) ghostTe = IM.fBlue1;
              else if (sptime - g.spcounter < 150 && x % 2 === 0) ghostTe = IM.fWhite1;
              else ghostTe = IM.fBlue2;
            } else {
              const k = x % 2 === 0 ? 0 : 1;
              if (g.moveX === -1) ghostTe = g.img[0 + k]; else if (g.moveX === 1) ghostTe = g.img[2 + k];
              else if (g.moveY === -1) ghostTe = g.img[4 + k]; else if (g.moveY === 1 && k === 0) ghostTe = g.img[6];
              else ghostTe = g.img[7];
            }
            const c = g.distance >= 0 && g.path[g.distance] ? g.path[g.distance] : g.start;
            draw(ghostTe, c.col * cellWidth, c.row * cellHeight, 25, 25);
          }
        } else {
          animFc++;
          if (!snd("pacdead_s").playing()) { snd("s_siren").stop(); snd("n_siren").stop(); snd("pacdead_s").play(); }
          if (animFc % 4 === 0 && animFc < 41) pacim = deathAnim[animFc / 4];
          draw(pacim, P.x - cellWidth / 2, P.y - cellHeight / 2);
          if (animFc > 80) { gameCounter = 1; initialise(); animFc = -1; P.x = gameWidth / 2; P.y = gameHeight / 2; P.alive = 1; }
        }
        if (mainCounter < 20) mainCounter++; else { mainCounter = 0; x++; }
      } else if (win === -1) {
        if (messCounter < 120) { draw(IM.maze, 0, 0, gameWidth, gameHeight); text("YOU LOSE!", 675, 457, 16, RED); messCounter += 1; }
        else { messCounter = 1; screen = 6; isLvl1 = 1; stopAll(); }
      } else if (win === 1) {
        if (messCounter < 120) { draw(IM.maze, 0, 0, gameWidth, gameHeight); text("YOU WIN!", 678, 457, 16, YELLOW); messCounter += 1; }
        else { messCounter = 1; screen = 6; isLvl1 = 1; stopAll(); }
      }
      if (score > highscore) { highscore = score; saveHS(); }
    }
    /* ---------- screen 6: game over ---------- */
    else if (screen === 6) {
      retCounter -= 1;
      draw(IM.gameover, 0, 0, screenWidth, screenHeight);
      text(`SCORE ${score}`, screenWidth / 2, 200, 20, WHITE, "center");
      text(`Home Screen in ${T(retCounter / 60) + 1} seconds`, screenWidth / 2, 600, 20, WHITE, "center");
      if (retCounter === 0) { win = 0; score = 0; level = 1; pacman.alive = 1; pelletcount = 0; updateLife = 1; screen = 2; retCounter = 300; }
    }
  }

  /* ================= web shell: focus, pause, input, mobile ================= */
  let running = false, acc = 0, last = 0;
  function loop(t) {
    if (!running) return;
    acc += Math.min(t - last, 250); last = t;
    let n = 0;
    while (acc >= STEP && n < 5) { tick(); acc -= STEP; n++; }
    requestAnimationFrame(loop);
  }
  function start() {
    loadAssets();
    if (!sounds) makeSounds();
    overlay.hidden = true; root.classList.add("playing");
    if (!running) { running = true; last = performance.now(); requestAnimationFrame(loop); }
    canvas.parentElement.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
    canvas.focus({ preventScroll: true });
  }
  function pause(msg = "Paused. Tap or click to resume") {
    if (!running) return;
    running = false; stopAll(); startupPlayed = true;
    overlay.hidden = false; overlay.querySelector(".pac-ov-title").textContent = msg;
    root.classList.remove("playing");
  }
  overlay.addEventListener("click", start);
  canvas.addEventListener("blur", (e) => { if (!root.contains(e.relatedTarget)) pause(); });
  new IntersectionObserver(([e]) => { if (!e.isIntersecting) pause(); }, { threshold: 0.35 }).observe(canvas);
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });

  const KEYMAP = { ArrowRight: "RIGHT", ArrowLeft: "LEFT", ArrowUp: "UP", ArrowDown: "DOWN", " ": "SPACE" };
  canvas.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Escape") { canvas.blur(); return; }
    const k = KEYMAP[e.key] || (/^[a-z]$/i.test(e.key) ? e.key.toUpperCase() : null);
    if (!k) return;
    e.preventDefault();
    if (!e.repeat) queued.push(k);
  });
  const toCanvas = (e) => { const r = canvas.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * screenWidth, y: ((e.clientY - r.top) / r.height) * screenHeight }; };
  canvas.addEventListener("pointermove", (e) => { Object.assign(mouse, toCanvas(e)); });
  canvas.addEventListener("pointerleave", () => { mouse.x = mouse.y = -1; mouse.down = false; });
  canvas.addEventListener("pointerdown", (e) => {
    Object.assign(mouse, toCanvas(e)); mouse.down = true; mouseQueued = true;
    // touch: tap the title screen to start, like pressing SPACE
    if (e.pointerType !== "mouse" && screen === 2 && !inCircle(mouse, 225, 650, 34) && !inCircle(mouse, 315, 650, 34)) queued.push("SPACE");
  });
  addEventListener("pointerup", () => { mouse.down = false; });

  // swipe gestures
  let sw = null;
  canvas.addEventListener("touchstart", (e) => { const t = e.touches[0]; sw = { x: t.clientX, y: t.clientY }; }, { passive: true });
  canvas.addEventListener("touchmove", (e) => { if (screen === 5) e.preventDefault(); }, { passive: false });
  canvas.addEventListener("touchend", (e) => {
    if (!sw) return; const t = e.changedTouches[0], dx = t.clientX - sw.x, dy = t.clientY - sw.y; sw = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    queued.push(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "RIGHT" : "LEFT") : (dy > 0 ? "DOWN" : "UP"));
  });
  // on-screen d-pad (doesn't steal focus)
  root.querySelectorAll("[data-key]").forEach((b) => {
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); if (!running) start(); queued.push(b.dataset.key); });
  });
  const muteBtn = document.getElementById("pac-mute");
  muteBtn.addEventListener("pointerdown", (e) => e.preventDefault());
  muteBtn.addEventListener("click", () => {
    muted = !muted; if (muted) stopAll();
    muteBtn.setAttribute("aria-pressed", muted); muteBtn.textContent = muted ? "Sound off" : "Sound on";
  });
  const fsBtn = document.getElementById("pac-fs");
  fsBtn.addEventListener("click", () => { (canvas.requestFullscreen ? canvas.requestFullscreen() : Promise.reject()).then(() => canvas.focus()).catch(() => {}); });

  // poster frame before the first click
  const poster = () => {
    ctx.fillStyle = BLACK; ctx.fillRect(0, 0, screenWidth, screenHeight);
    draw(IM.wallpaper, screenWidth / 2 - 364, screenHeight / 2 - 120);
    draw(IM.logo, screenWidth / 2 - 337, 10);
  };
  IM.wallpaper.addEventListener("load", poster); IM.logo.addEventListener("load", poster);
  poster();

  // test hook (used only by automated checks)
  window.__pac = { get screen() { return screen; }, get score() { return score; }, get pac() { return { ...pacman }; }, get life() { return life; } };
})();
