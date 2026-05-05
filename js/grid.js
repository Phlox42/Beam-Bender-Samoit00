/*
Verwaltet die Grid-Logik
Grenzen prüfen, Felder belegt?, Spiegel finden
*/

import { GRID_COLS, GRID_ROWS } from "./constants.js";
import { state } from "./state.js";

//Erstellt einen eindeutigen Schlüssel für ein Grid-Koordinatentupel
export const keyOf = (x, y) => `${x},${y}`;

//Prüft ob eine Koordinate innerhalb des Grids liegt
export function isInsideGrid(x, y) {
  return x >= 0 && x < GRID_COLS && y >= 0 && y < GRID_ROWS;
}

//Erstellt eine Map mit allen statischen Objekten im Level
//Wird von canPlaceMirrorAt gebraucht
export function buildStaticMap() {
  const map = new Map();
  state.currentLevel.obstacles.forEach((o) => map.set(keyOf(o.x, o.y), "obstacle"));
  map.set(keyOf(state.currentLevel.source.x, state.currentLevel.source.y), "source");
  map.set(keyOf(state.currentLevel.target.x, state.currentLevel.target.y), "target");
  return map;
}

//Sucht einen Spiegel an einer bestimmten Koordinate
//Wird bei Touch und beim Laser gebraucht
export function findMirrorAt(x, y) {
  return state.mirrors.find((m) => m.x === x && m.y === y) || null;
}

//prüft ob ein Spiegel auf eine Zelle darf
//innerhalb des Rasters, keine fixe Zelle, kein anderer Spiegel
export function canPlaceMirrorAt(mirrorId, x, y) {
  if (!isInsideGrid(x, y)) return false;
  if (buildStaticMap().has(keyOf(x, y))) return false;
  return !state.mirrors.some((m) => m.id !== mirrorId && m.x === x && m.y === y);
}
