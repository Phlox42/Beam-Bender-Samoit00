/*
Übersetzt zwischen drei verschiedenen Koordinatensystemen:
Client-Koordinaten: Pixel relativ zum Browser-Fenster
Canvas-Koordinaten: Pixel relativ zur Canvas-Ecke
Grid-Koordinaten: Raster-Zellen (0–7 / 0–11)
*/

import { canvas } from "./dom.js";
import { state } from "./state.js";
import { findMirrorAt } from "./grid.js";

//Zieht die Canvas-Position ab und korrigiert den CSS-Skalierungsfaktor
export function canvasPoint(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

//Canvas → Grid. Teilt durch tileSize und rundet ab.
export function pointToGrid(px, py) {
  return {
    x: Math.floor(px / state.tileSize),
    y: Math.floor(py / state.tileSize),
  };
}

//Canvas-Koordinaten → Grid → findMirrorAt()
//Welcher Spiegel wurde angetippt
export function mirrorAtCanvasPoint(px, py) {
  const g = pointToGrid(px, py);
  return findMirrorAt(g.x, g.y);
}
