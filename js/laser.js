/*
Laser-Berechnung (ohne Aimation)
Richtung, Reflexion, Treffer
*/

import { state } from "./state.js";
import { findMirrorAt, isInsideGrid } from "./grid.js";

//übersetzt eine Richtung ("right", "up" usw.) in einen Bewegungsvektor
export function dirToVec(dir) {
  return { up: { x: 0, y: -1 }, right: { x: 1, y: 0 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 } }[dir];
}

//berechnet neue Richtung nach einer Reflexion an einem Spiegel 
export function reflectVec(vx, vy, mirrorAngle) {
  const rad = ((mirrorAngle - 45) * Math.PI) / 180; //Der Spiegel-Sprite startet als /, daher -45° Offset auf den Winkel
  const dx = Math.cos(rad); //Richtungsvektor x
  const dy = Math.sin(rad); //Richtungsvektor y

  const dot = vx * dx + vy * dy; //wie parallel ist der Laser zur Spiegellinie
  const cross = vx * dy - vy * dx; //wie senkrecht ist der Laser zur Spiegellinie
  const EPS = 1e-9;

  if (Math.abs(cross) < EPS) return { x: vx, y: vy }; //cross ≈ 0 → Laser trifft parallel → geht durch
  if (Math.abs(dot) < EPS) return { x: -vx, y: -vy }; //dot ≈ 0 → Laser trifft senkrecht → wird umgekehrt

  const rx = 2 * dot * dx - vx;
  const ry = 2 * dot * dy - vy;

  return { x: Math.round(rx), y: Math.round(ry) };
}

/*
Hauptalgorithmus
Startet bei der Lichtquelle mit ihrer Richtung
Berechnet die nächste Zelle
Speichert das Segment {from, to} im path-Array
Prüft: Rastergrenze? → Stop. Ziel? → Treffer. Hindernis? → Stop. Spiegel? → Richtung ändern.
Wiederholt bis zu 200 Schritte
*/
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
