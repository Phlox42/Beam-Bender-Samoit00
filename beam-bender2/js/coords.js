import { canvas } from "./dom.js";
import { state } from "./state.js";
import { findMirrorAt } from "./grid.js";

export function canvasPoint(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

export function pointToGrid(px, py) {
  return {
    x: Math.floor(px / state.tileSize),
    y: Math.floor(py / state.tileSize),
  };
}

export function mirrorAtCanvasPoint(px, py) {
  const g = pointToGrid(px, py);
  return findMirrorAt(g.x, g.y);
}
