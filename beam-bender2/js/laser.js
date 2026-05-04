import { state } from "./state.js";
import { findMirrorAt, isInsideGrid } from "./grid.js";

export function dirToVec(dir) {
  return { up: { x: 0, y: -1 }, right: { x: 1, y: 0 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 } }[dir];
}

export function reflectVec(vx, vy, mirrorAngle) {
  // Das Spiegel-Sprite startet als "/" (Richtungsvektor: 1, -1),
  // deshalb braucht die physikalische Geradenrichtung einen -45°-Offset.
  const rad = ((mirrorAngle - 45) * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);

  const dot = vx * dx + vy * dy;
  const cross = vx * dy - vy * dx;
  const EPS = 1e-9;

  if (Math.abs(cross) < EPS) return { x: vx, y: vy };
  if (Math.abs(dot) < EPS) return { x: -vx, y: -vy };

  const rx = 2 * dot * dx - vx;
  const ry = 2 * dot * dy - vy;

  return { x: Math.round(rx), y: Math.round(ry) };
}

export function traceLaserPath() {
  const path = [];
  let pos = { x: state.currentLevel.source.x, y: state.currentLevel.source.y };
  let vec = dirToVec(state.currentLevel.source.dir);

  for (let steps = 0; steps < 200; steps++) {
    const next = { x: pos.x + vec.x, y: pos.y + vec.y };
    path.push({ from: { ...pos }, to: { ...next } });

    if (!isInsideGrid(next.x, next.y)) return { path, hitTarget: false };
    if (next.x === state.currentLevel.target.x && next.y === state.currentLevel.target.y)
      return { path, hitTarget: true };
    if (state.currentLevel.obstacles.some((o) => o.x === next.x && o.y === next.y))
      return { path, hitTarget: false };

    const mirror = findMirrorAt(next.x, next.y);
    if (mirror) vec = reflectVec(vec.x, vec.y, mirror.angle);
    pos = next;
  }
  return { path, hitTarget: false };
}
