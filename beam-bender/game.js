/* =========================================================
   Beam Bender – game.js
   MCI2-Lab · Touch-Events auf HTML Canvas
   ========================================================= */

const GRID_SIZE = 8;
const TILE_SIZE = 80;
const CANVAS_SIZE = GRID_SIZE * TILE_SIZE;

// ── Level-Definitionen ──────────────────────────────────────
const levels = [
  {
    source: { x: 0, y: 4, dir: "right" },
    target: { x: 7, y: 1 },
    obstacles: [{ x: 4, y: 4 }, { x: 3, y: 2 }],
    mirrors: [
      { x: 2, y: 4, angle: 45 },
      { x: 5, y: 1, angle: 135 },
    ],
  },
  {
    source: { x: 0, y: 6, dir: "right" },
    target: { x: 6, y: 0 },
    obstacles: [{ x: 3, y: 6 }, { x: 4, y: 4 }, { x: 5, y: 2 }],
    mirrors: [
      { x: 1, y: 6, angle: 45 },
      { x: 4, y: 6, angle: 135 },
      { x: 1, y: 3, angle: 45 },
    ],
  },
  {
    source: { x: 0, y: 7, dir: "right" },
    target: { x: 7, y: 0 },
    obstacles: [{ x: 2, y: 7 }, { x: 3, y: 5 }, { x: 5, y: 3 }, { x: 6, y: 1 }],
    mirrors: [
      { x: 1, y: 6, angle: 45 },
      { x: 4, y: 7, angle: 135 },
      { x: 2, y: 2, angle: 45 },
      { x: 6, y: 5, angle: 135 },
    ],
  },
];

// ── DOM-Referenzen ──────────────────────────────────────────
const canvas       = document.getElementById("gameCanvas");
const ctx          = canvas.getContext("2d");
const levelLabel   = document.getElementById("levelLabel");
const movesLabel   = document.getElementById("movesLabel");
const statusText   = document.getElementById("statusText");
const testLaserBtn = document.getElementById("testLaserBtn");
const resetBtn     = document.getElementById("resetBtn");
const infoBtn      = document.getElementById("infoBtn");
const startScreen  = document.getElementById("startScreen");
const startGameBtn = document.getElementById("startGameBtn");
const winModal     = document.getElementById("winModal");
const playAgainBtn = document.getElementById("playAgainBtn");
const infoModal    = document.getElementById("infoModal");
const closeInfoBtn = document.getElementById("closeInfoBtn");

canvas.width  = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;

// ── Spielzustand ────────────────────────────────────────────
let currentLevelIndex = 0;
let currentLevel      = null;
let mirrors           = [];
let moveCount         = 0;
let gameStarted       = false;

// Drag-State
let draggingMirrorId = null;
let dragStartGrid    = null;

// Rotations-State
// Neu: 1 Finger hält Spiegel → 2. Finger irgendwo → rotiert
let rotationMirrorId    = null;   // der Spiegel der gerade "gehalten" wird
let rotationStartAngle  = null;
let rotationChanged     = false;
let rotationPrevAngle   = null;   // für Winkelberechnung per Finger-Pos

// Double-Tap
let lastTapTime = 0;
const DOUBLE_TAP_MS = 350;

// Laser-Animation
let laserPath              = [];
let laserAnimating         = false;
let laserAnimationProgress = 0;

// ── Hilfsfunktionen ─────────────────────────────────────────
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));
const keyOf = (x, y) => `${x},${y}`;

function loadLevel(index) {
  currentLevelIndex = index;
  currentLevel      = deepClone(levels[index]);
  mirrors           = currentLevel.mirrors.map((m, i) => ({ ...m, id: i + 1 }));
  moveCount         = 0;
  laserPath         = [];
  laserAnimating    = false;
  laserAnimationProgress = 0;
  setStatus("Spiegel anordnen, dann Laser testen.");
  updateHud();
  draw();
}

function updateHud() {
  levelLabel.textContent = `Level ${currentLevelIndex + 1} / ${levels.length}`;
  movesLabel.textContent = `Züge: ${moveCount}`;
}

function setStatus(text) {
  statusText.textContent = text;
}

// ── Grid-Logik ──────────────────────────────────────────────
function isInsideGrid(x, y) {
  return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
}

function buildStaticMap() {
  const map = new Map();
  currentLevel.obstacles.forEach((o) => map.set(keyOf(o.x, o.y), "obstacle"));
  map.set(keyOf(currentLevel.source.x, currentLevel.source.y), "source");
  map.set(keyOf(currentLevel.target.x, currentLevel.target.y), "target");
  return map;
}

function findMirrorAt(x, y) {
  return mirrors.find((m) => m.x === x && m.y === y) || null;
}

function canPlaceMirrorAt(mirrorId, x, y) {
  if (!isInsideGrid(x, y)) return false;
  if (buildStaticMap().has(keyOf(x, y))) return false;
  return !mirrors.some((m) => m.id !== mirrorId && m.x === x && m.y === y);
}

// ── Koordinaten-Umrechnung ───────────────────────────────────
function canvasPoint(clientX, clientY) {
  const rect   = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top)  * scaleY,
  };
}

function pointToGrid(px, py) {
  return {
    x: Math.floor(px / TILE_SIZE),
    y: Math.floor(py / TILE_SIZE),
  };
}

function mirrorAtCanvasPoint(px, py) {
  const g = pointToGrid(px, py);
  return findMirrorAt(g.x, g.y);
}

// ── Laser-Berechnung ────────────────────────────────────────
function dirToVec(dir) {
  return { up:{x:0,y:-1}, right:{x:1,y:0}, down:{x:0,y:1}, left:{x:-1,y:0} }[dir];
}

function reflectVec(vx, vy, mirrorAngle) {
  const norm = ((Math.round(mirrorAngle / 45) % 4) + 4) % 4;
  const isSlash = (norm === 0 || norm === 2);
  return isSlash ? { x: -vy, y: -vx } : { x: vy, y: vx };
}

function traceLaserPath() {
  const path = [];
  let pos = { x: currentLevel.source.x, y: currentLevel.source.y };
  let vec = dirToVec(currentLevel.source.dir);

  for (let steps = 0; steps < 200; steps++) {
    const next = { x: pos.x + vec.x, y: pos.y + vec.y };
    path.push({ from: { ...pos }, to: { ...next } });

    if (!isInsideGrid(next.x, next.y))
      return { path, hitTarget: false };
    if (next.x === currentLevel.target.x && next.y === currentLevel.target.y)
      return { path, hitTarget: true };
    if (currentLevel.obstacles.some((o) => o.x === next.x && o.y === next.y))
      return { path, hitTarget: false };

    const mirror = findMirrorAt(next.x, next.y);
    if (mirror) vec = reflectVec(vec.x, vec.y, mirror.angle);
    pos = next;
  }
  return { path, hitTarget: false };
}

// ── Laser ausführen ──────────────────────────────────────────
function runLaser() {
  if (!gameStarted || laserAnimating) return;
  const result = traceLaserPath();
  laserPath              = result.path;
  laserAnimating         = true;
  laserAnimationProgress = 0;
  animateLaser(result.hitTarget);
}

function animateLaser(hitTarget) {
  const duration  = Math.max(400, laserPath.length * 100);
  const startTime = performance.now();

  function frame(now) {
    laserAnimationProgress = Math.min(1, (now - startTime) / duration);
    draw();
    if (laserAnimationProgress < 1) { requestAnimationFrame(frame); return; }

    laserAnimating = false;
    if (hitTarget) {
      if (currentLevelIndex < levels.length - 1) {
        setStatus("✅ Ziel getroffen! Nächstes Level…");
        setTimeout(() => loadLevel(currentLevelIndex + 1), 700);
      } else {
        setStatus("🎉 Alle Level geschafft!");
        gameStarted = false;
        setTimeout(() => winModal.classList.remove("hidden"), 400);
      }
    } else {
      setStatus("❌ Ziel verfehlt – Laser erlischt.");
      setTimeout(() => { laserPath = []; draw(); }, 500);
    }
  }
  requestAnimationFrame(frame);
}

// ── Drag committen ───────────────────────────────────────────
function commitDrag() {
  if (draggingMirrorId === null) return;
  const mirror = mirrors.find((m) => m.id === draggingMirrorId);
  if (mirror) {
    const moved = mirror.x !== dragStartGrid.x || mirror.y !== dragStartGrid.y;
    if (!canPlaceMirrorAt(mirror.id, mirror.x, mirror.y)) {
      mirror.x = dragStartGrid.x;
      mirror.y = dragStartGrid.y;
      setStatus("⚠️ Feld besetzt – Spiegel springt zurück.");
    } else if (moved) {
      moveCount++;
      updateHud();
      setStatus("Spiegel verschoben.");
    }
  }
  draggingMirrorId = null;
  dragStartGrid    = null;
  draw();
}

// ── Pointer-Events (Desktop + Stift) ────────────────────────
canvas.addEventListener("pointerdown", (e) => {
  if (!gameStarted) return;
  if (e.pointerType === "mouse" && e.button !== 0) return;
  canvas.setPointerCapture(e.pointerId);
  const p = canvasPoint(e.clientX, e.clientY);
  const mirror = mirrorAtCanvasPoint(p.x, p.y);
  if (mirror) {
    draggingMirrorId = mirror.id;
    dragStartGrid    = { x: mirror.x, y: mirror.y };
  }
});

canvas.addEventListener("pointermove", (e) => {
  if (!gameStarted || draggingMirrorId === null) return;
  const p = canvasPoint(e.clientX, e.clientY);
  const g = pointToGrid(p.x, p.y);
  const mirror = mirrors.find((m) => m.id === draggingMirrorId);
  if (mirror && isInsideGrid(g.x, g.y)) { mirror.x = g.x; mirror.y = g.y; draw(); }
});

canvas.addEventListener("pointerup",     commitDrag);
canvas.addEventListener("pointercancel", commitDrag);

canvas.addEventListener("contextmenu", (e) => {
  if (!gameStarted) return;
  e.preventDefault();
  const p = canvasPoint(e.clientX, e.clientY);
  const mirror = mirrorAtCanvasPoint(p.x, p.y);
  if (mirror) {
    mirror.angle = (((mirror.angle + 45) % 180) + 180) % 180;
    moveCount++; updateHud();
    setStatus("Spiegel rotiert (45°).");
    draw();
  }
});

// ── Touch-Events ─────────────────────────────────────────────
canvas.addEventListener("touchstart",  onTouchStart,  { passive: false });
canvas.addEventListener("touchmove",   onTouchMove,   { passive: false });
canvas.addEventListener("touchend",    onTouchEnd,    { passive: false });
canvas.addEventListener("touchcancel", onTouchEnd,    { passive: false });

function onTouchStart(e) {
  e.preventDefault();
  if (!gameStarted) return;

  const touchCount = e.touches.length;

  // ── 1 Finger ────────────────────────────────────────────
  if (touchCount === 1) {
    const now = performance.now();

    // Double Tap erkennen
    if (now - lastTapTime < DOUBLE_TAP_MS) {
      runLaser();
      lastTapTime = 0;
      return;
    }
    lastTapTime = now;

    // Drag starten
    const t = e.touches[0];
    const p = canvasPoint(t.clientX, t.clientY);
    const mirror = mirrorAtCanvasPoint(p.x, p.y);
    if (mirror) {
      draggingMirrorId = mirror.id;
      dragStartGrid    = { x: mirror.x, y: mirror.y };
      // Diesen Spiegel auch als Rotations-Kandidat merken
      rotationMirrorId   = mirror.id;
      rotationStartAngle = mirror.angle;
      rotationChanged    = false;
    } else {
      rotationMirrorId = null;
    }
  }

  // ── 2. Finger kommt dazu → Rotation starten ─────────────
  // Bedingung: Es gibt einen gehaltenen Spiegel (rotationMirrorId gesetzt)
  if (touchCount === 2 && rotationMirrorId !== null) {
    // Drag abbrechen – wir wechseln in Rotationsmodus
    draggingMirrorId = null;
    dragStartGrid    = null;

    // Startwinkel des Finger-Paares merken für Delta-Berechnung
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    rotationPrevAngle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);
    rotationChanged   = false;
  }
}

function onTouchMove(e) {
  e.preventDefault();
  if (!gameStarted) return;

  // ── 1 Finger Drag ────────────────────────────────────────
  if (e.touches.length === 1 && draggingMirrorId !== null) {
    const t = e.touches[0];
    const p = canvasPoint(t.clientX, t.clientY);
    const g = pointToGrid(p.x, p.y);
    const mirror = mirrors.find((m) => m.id === draggingMirrorId);
    if (mirror && isInsideGrid(g.x, g.y)) { mirror.x = g.x; mirror.y = g.y; draw(); }
  }

  // ── 2-Finger Rotation ────────────────────────────────────
  if (e.touches.length === 2 && rotationMirrorId !== null) {
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    const currentAngle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);

    // Winkel in 45°-Schritte einrasten (0–179°, Spiegel symmetrisch)
    const angleDeg = (currentAngle * 180) / Math.PI;
    const snapped  = (((Math.round(angleDeg / 45) * 45) % 180) + 180) % 180;

    const mirror = mirrors.find((m) => m.id === rotationMirrorId);
    if (mirror && mirror.angle !== snapped) {
      mirror.angle    = snapped;
      rotationChanged = true;
      draw();
    }

    rotationPrevAngle = currentAngle;
  }
}

function onTouchEnd(e) {
  e.preventDefault();
  if (!gameStarted) return;

  const remaining = e.touches.length;

  // Alle Finger weg
  if (remaining === 0) {
    // Drag committen
    if (draggingMirrorId !== null) commitDrag();

    // Rotation committen
    if (rotationMirrorId !== null && rotationChanged) {
      moveCount++;
      updateHud();
      setStatus("Spiegel rotiert.");
    }
    rotationMirrorId   = null;
    rotationStartAngle = null;
    rotationChanged    = false;
    rotationPrevAngle  = null;
  }

  // Nur noch 1 Finger übrig (2. Finger losgelassen)
  if (remaining === 1) {
    if (rotationChanged) {
      moveCount++;
      updateHud();
      setStatus("Spiegel rotiert.");
    }
    rotationMirrorId   = null;
    rotationStartAngle = null;
    rotationChanged    = false;
    rotationPrevAngle  = null;
    // Drag ist jetzt auch vorbei da wir eh in Rotation-Modus waren
    draggingMirrorId = null;
    dragStartGrid    = null;
    draw();
  }
}

// ── Render ───────────────────────────────────────────────────
function draw() {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  drawGrid();
  drawObstacles();
  drawSource();
  drawTarget();
  drawMirrors();
  drawLaser();
}

function drawGrid() {
  ctx.strokeStyle = "#1a1c2e";
  ctx.lineWidth   = 1;
  for (let i = 0; i <= GRID_SIZE; i++) {
    const p = i * TILE_SIZE;
    ctx.beginPath(); ctx.moveTo(p, 0);         ctx.lineTo(p, CANVAS_SIZE); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p);         ctx.lineTo(CANVAS_SIZE, p); ctx.stroke();
  }
}

function cellCenter(x, y) {
  return { cx: (x + 0.5) * TILE_SIZE, cy: (y + 0.5) * TILE_SIZE };
}

function drawSource() {
  const { x, y } = currentLevel.source;
  const { cx, cy } = cellCenter(x, y);
  ctx.fillStyle = "#0d1a30";
  ctx.fillRect(x * TILE_SIZE + 3, y * TILE_SIZE + 3, TILE_SIZE - 6, TILE_SIZE - 6);
  const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 22);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.3, "#7dd8ff");
  grad.addColorStop(1, "#00d4ff00");
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#00d4ff";
  ctx.font = "bold 16px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText({ right:"▶", left:"◀", up:"▲", down:"▼" }[currentLevel.source.dir] || "▶", cx, cy);
}

function drawTarget() {
  const { x, y } = currentLevel.target;
  const { cx, cy } = cellCenter(x, y);
  ctx.fillStyle = "#1a0d2e";
  ctx.fillRect(x * TILE_SIZE + 3, y * TILE_SIZE + 3, TILE_SIZE - 6, TILE_SIZE - 6);
  [22, 14, 6].forEach((r, i) => {
    ctx.strokeStyle = ["#5500aa","#9933ff","#cc66ff"][i];
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  });
  ctx.fillStyle = "#cc66ff";
  ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
}

function drawObstacles() {
  currentLevel.obstacles.forEach(({ x, y }) => {
    ctx.fillStyle = "#1e1418";
    ctx.fillRect(x * TILE_SIZE + 3, y * TILE_SIZE + 3, TILE_SIZE - 6, TILE_SIZE - 6);
    ctx.strokeStyle = "#5a2030"; ctx.lineWidth = 1.5;
    const x0 = x * TILE_SIZE + 3, y0 = y * TILE_SIZE + 3, sz = TILE_SIZE - 6;
    for (let d = -sz; d <= sz; d += 14) {
      ctx.beginPath();
      ctx.moveTo(x0 + Math.max(0, d),    y0 + Math.max(0, -d));
      ctx.lineTo(x0 + Math.min(sz, d+sz), y0 + Math.min(sz, sz-d));
      ctx.stroke();
    }
    ctx.strokeStyle = "#8b3040"; ctx.lineWidth = 1.5;
    ctx.strokeRect(x * TILE_SIZE + 3, y * TILE_SIZE + 3, TILE_SIZE - 6, TILE_SIZE - 6);
  });
}

function drawMirrors() {
  mirrors.forEach((mirror) => {
    const { x, y, angle } = mirror;
    const { cx, cy } = cellCenter(x, y);
    const isActive = mirror.id === draggingMirrorId || mirror.id === rotationMirrorId;

    ctx.fillStyle = isActive ? "#1e2545" : "#141726";
    ctx.fillRect(x * TILE_SIZE + 6, y * TILE_SIZE + 6, TILE_SIZE - 12, TILE_SIZE - 12);
    ctx.strokeStyle = isActive ? "#00d4ff" : "#2e3254";
    ctx.lineWidth   = isActive ? 2 : 1;
    ctx.strokeRect(x * TILE_SIZE + 6, y * TILE_SIZE + 6, TILE_SIZE - 12, TILE_SIZE - 12);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.shadowColor = "#88eeff";
    ctx.shadowBlur  = isActive ? 14 : 6;
    ctx.strokeStyle = isActive ? "#ffffff" : "#88eeff";
    ctx.lineWidth   = isActive ? 4 : 3;
    ctx.lineCap     = "round";
    ctx.beginPath(); ctx.moveTo(-24, 24); ctx.lineTo(24, -24); ctx.stroke();
    ctx.shadowBlur  = 0;
    ctx.restore();

    ctx.fillStyle    = "#4a5070";
    ctx.font         = "10px monospace";
    ctx.textAlign    = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(`${angle}°`, (x+1)*TILE_SIZE - 8, (y+1)*TILE_SIZE - 6);
  });
}

function drawLaser() {
  if (laserPath.length === 0) return;
  const totalToDraw = Math.ceil(laserPath.length * laserAnimationProgress);
  ctx.save();
  ctx.strokeStyle = "#ff4432";
  ctx.lineWidth   = 3;
  ctx.lineCap     = "round";
  ctx.shadowColor = "#ff7755";
  ctx.shadowBlur  = 12;
  for (let i = 0; i < totalToDraw; i++) {
    const seg = laserPath[i];
    ctx.beginPath();
    ctx.moveTo((seg.from.x + 0.5) * TILE_SIZE, (seg.from.y + 0.5) * TILE_SIZE);
    ctx.lineTo((seg.to.x   + 0.5) * TILE_SIZE, (seg.to.y   + 0.5) * TILE_SIZE);
    ctx.stroke();
  }
  ctx.restore();
}

// ── Button-Events ────────────────────────────────────────────
testLaserBtn.addEventListener("click", runLaser);

resetBtn.addEventListener("click", () => {
  if (!gameStarted) return;
  loadLevel(currentLevelIndex);
  setStatus("Level zurückgesetzt.");
});

infoBtn.addEventListener("click", () => infoModal.classList.remove("hidden"));
closeInfoBtn.addEventListener("click", () => infoModal.classList.add("hidden"));
infoModal.addEventListener("click", (e) => {
  if (e.target === infoModal) infoModal.classList.add("hidden");
});

startGameBtn.addEventListener("click", () => {
  gameStarted = true;
  startScreen.classList.add("hidden");
  loadLevel(0);
});

playAgainBtn.addEventListener("click", () => {
  gameStarted = true;
  winModal.classList.add("hidden");
  loadLevel(0);
});
