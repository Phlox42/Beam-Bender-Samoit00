/*
Zeichnet auf dem Canvas
*/

import { GRID_COLS, GRID_ROWS } from "./constants.js";
import { canvas, ctx } from "./dom.js";
import { state } from "./state.js";
import { mirrorLineAngleFromSpriteRotation } from "./angles.js";

function tileUnit() {
  return state.tileSize;
}

//Berechnet den Mittelpunkt einer Rasterzelle in Canvas-Pixeln
function cellCenter(x, y) {
  return { cx: (x + 0.5) * state.tileSize, cy: (y + 0.5) * state.tileSize };
}

//Rasterlinien 
function drawGrid() {
  ctx.strokeStyle = "#1a1c2e";
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID_COLS; i++) {
    const px = i * state.tileSize;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, canvas.height);
    ctx.stroke();
  }
  for (let i = 0; i <= GRID_ROWS; i++) {
    const py = i * state.tileSize;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(canvas.width, py);
    ctx.stroke();
  }
}

//Lichtquelle als leuchtenden Farbverlauf mit einem Richtungspfeil 
function drawSource() {
  const u = tileUnit();
  const { x, y } = state.currentLevel.source;
  const { cx, cy } = cellCenter(x, y);
  ctx.fillStyle = "#0d1a30";
  ctx.fillRect(x * state.tileSize + 3, y * state.tileSize + 3, state.tileSize - 6, state.tileSize - 6);
  const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, u * 0.28);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.3, "#7dd8ff");
  grad.addColorStop(1, "#00d4ff00");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, u * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#00d4ff";
  ctx.font = `bold ${Math.max(12, Math.floor(u * 0.2))}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText({ right: "▶", left: "◀", up: "▲", down: "▼" }[state.currentLevel.source.dir] || "▶", cx, cy);
}

//zeichnet das Ziel als Zielscheibe in lila
function drawTarget() {
  const u = tileUnit();
  const { x, y } = state.currentLevel.target;
  const { cx, cy } = cellCenter(x, y);
  ctx.fillStyle = "#1a0d2e";
  ctx.fillRect(x * state.tileSize + 3, y * state.tileSize + 3, state.tileSize - 6, state.tileSize - 6);
  [u * 0.28, u * 0.18, u * 0.08].forEach((r, i) => {
    ctx.strokeStyle = ["#5500aa", "#9933ff", "#cc66ff"][i];
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.fillStyle = "#cc66ff";
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(3, u * 0.05), 0, Math.PI * 2);
  ctx.fill();
}

//Hindernisse mit rotem Schraffur-Muster und Rahmen
function drawObstacles() {
  const u = tileUnit();
  state.currentLevel.obstacles.forEach(({ x, y }) => {
    ctx.fillStyle = "#1e1418";
    ctx.fillRect(x * state.tileSize + 3, y * state.tileSize + 3, state.tileSize - 6, state.tileSize - 6);
    ctx.strokeStyle = "#5a2030";
    ctx.lineWidth = 1.5;
    const x0 = x * state.tileSize + 3;
    const y0 = y * state.tileSize + 3;
    const w = state.tileSize - 6;
    const h = state.tileSize - 6;
    const step = Math.max(8, u * 0.18);
    for (let d = -h; d <= w; d += step) {
      ctx.beginPath();
      ctx.moveTo(x0 + Math.max(0, d), y0 + Math.max(0, -d));
      ctx.lineTo(x0 + Math.min(w, d + h), y0 + Math.min(h, h - d));
      ctx.stroke();
    }
    ctx.strokeStyle = "#8b3040";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x * state.tileSize + 3, y * state.tileSize + 3, state.tileSize - 6, state.tileSize - 6);
  });
}

//Spiegel als Kästchen mit diagonaler Linie
function drawMirrors() {
  const u = tileUnit();
  state.mirrors.forEach((mirror) => {
    const { x, y, angle } = mirror;
    const { cx, cy } = cellCenter(x, y);
    const isActive = mirror.id === state.draggingMirrorId || mirror.id === state.rotationMirrorId;

    //Aktive Spiegel (gerade gezogen oder rotiert) leuchten heller
    ctx.fillStyle = isActive ? "#1e2545" : "#141726";
    ctx.fillRect(x * state.tileSize + 6, y * state.tileSize + 6, state.tileSize - 12, state.tileSize - 12);
    ctx.strokeStyle = isActive ? "#00d4ff" : "#2e3254";
    ctx.lineWidth = isActive ? 2 : 1;
    ctx.strokeRect(x * state.tileSize + 6, y * state.tileSize + 6, state.tileSize - 12, state.tileSize - 12);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.shadowColor = "#88eeff";
    ctx.shadowBlur = isActive ? 14 : 6;
    ctx.strokeStyle = isActive ? "#ffffff" : "#88eeff";
    ctx.lineWidth = isActive ? 4 : 3;
    ctx.lineCap = "round";
    const r = u * 0.3;
    ctx.beginPath();
    ctx.moveTo(-r, r);
    ctx.lineTo(r, -r);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.fillStyle = "#4a5070";
    ctx.font = `${Math.max(9, Math.floor(u * 0.12))}px monospace`;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(`${mirrorLineAngleFromSpriteRotation(angle)}°`, (x + 1) * state.tileSize - 8, (y + 1) * state.tileSize - 6);
  });
}

//zeichnet den Laserstrahl Segment für Segment, basierend auf laserAnimationProgress
function drawLaser() {
  const u = tileUnit();
  if (state.laserPath.length === 0) return;
  const totalToDraw = Math.ceil(state.laserPath.length * state.laserAnimationProgress);
  ctx.save();
  ctx.strokeStyle = "#ff4432";
  ctx.lineWidth = Math.max(2, u * 0.04);
  ctx.lineCap = "round";
  ctx.shadowColor = "#ff7755";
  ctx.shadowBlur = Math.max(8, u * 0.16);
  for (let i = 0; i < totalToDraw; i++) {
    const seg = state.laserPath[i];
    ctx.beginPath();
    ctx.moveTo((seg.from.x + 0.5) * state.tileSize, (seg.from.y + 0.5) * state.tileSize);
    ctx.lineTo((seg.to.x + 0.5) * state.tileSize, (seg.to.y + 0.5) * state.tileSize);
    ctx.stroke();
  }
  ctx.restore();
}

//Wird von main.js und input.js aufgerufen wenn sich etwas ändert
export function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!state.currentLevel) return;
  drawGrid();
  drawObstacles();
  drawSource();
  drawTarget();
  drawMirrors();
  drawLaser();
}
