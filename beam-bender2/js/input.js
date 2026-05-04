import { DOUBLE_TAP_MS } from "./constants.js";
import { canvas } from "./dom.js";
import { state } from "./state.js";
import { canvasPoint, mirrorAtCanvasPoint, pointToGrid } from "./coords.js";
import { isInsideGrid } from "./grid.js";
import { draw } from "./render.js";

export function registerCanvasInput({ commitDrag, runLaser, setStatus, updateHud }) {
  canvas.addEventListener("pointerdown", (e) => {
    if (!state.gameStarted) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    canvas.setPointerCapture(e.pointerId);
    const p = canvasPoint(e.clientX, e.clientY);
    const mirror = mirrorAtCanvasPoint(p.x, p.y);
    if (mirror) {
      state.draggingMirrorId = mirror.id;
      state.dragStartGrid = { x: mirror.x, y: mirror.y };
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!state.gameStarted || state.draggingMirrorId === null) return;
    const p = canvasPoint(e.clientX, e.clientY);
    const g = pointToGrid(p.x, p.y);
    const mirror = state.mirrors.find((m) => m.id === state.draggingMirrorId);
    if (mirror && isInsideGrid(g.x, g.y)) {
      mirror.x = g.x;
      mirror.y = g.y;
      draw();
    }
  });

  canvas.addEventListener("pointerup", commitDrag);
  canvas.addEventListener("pointercancel", commitDrag);

  canvas.addEventListener("contextmenu", (e) => {
    if (!state.gameStarted) return;
    e.preventDefault();
    const p = canvasPoint(e.clientX, e.clientY);
    const mirror = mirrorAtCanvasPoint(p.x, p.y);
    if (mirror) {
      mirror.angle = (((mirror.angle + 45) % 180) + 180) % 180;
      state.moveCount++;
      updateHud();
      setStatus("Spiegel rotiert (45°).");
      draw();
    }
  });

  canvas.addEventListener("touchstart", onTouchStart, { passive: false });
  canvas.addEventListener("touchmove", onTouchMove, { passive: false });
  canvas.addEventListener("touchend", onTouchEnd, { passive: false });
  canvas.addEventListener("touchcancel", onTouchEnd, { passive: false });

  function onTouchStart(e) {
    e.preventDefault();
    if (!state.gameStarted) return;

    const touchCount = e.touches.length;

    if (touchCount === 1) {
      const now = performance.now();

      if (now - state.lastTapTime < DOUBLE_TAP_MS) {
        runLaser();
        state.lastTapTime = 0;
        return;
      }
      state.lastTapTime = now;

      const t = e.touches[0];
      const p = canvasPoint(t.clientX, t.clientY);
      const mirror = mirrorAtCanvasPoint(p.x, p.y);
      if (mirror) {
        state.draggingMirrorId = mirror.id;
        state.dragStartGrid = { x: mirror.x, y: mirror.y };
        state.rotationMirrorId = mirror.id;
        state.rotationStartAngle = mirror.angle;
        state.rotationChanged = false;
      } else {
        state.rotationMirrorId = null;
      }
    }

    if (touchCount === 2 && state.rotationMirrorId !== null) {
      state.draggingMirrorId = null;
      state.dragStartGrid = null;

      const t1 = e.touches[0];
      const t2 = e.touches[1];
      state.rotationPrevAngle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);
      state.rotationChanged = false;
    }
  }

  function onTouchMove(e) {
    e.preventDefault();
    if (!state.gameStarted) return;

    if (e.touches.length === 1 && state.draggingMirrorId !== null) {
      const t = e.touches[0];
      const p = canvasPoint(t.clientX, t.clientY);
      const g = pointToGrid(p.x, p.y);
      const mirror = state.mirrors.find((m) => m.id === state.draggingMirrorId);
      if (mirror && isInsideGrid(g.x, g.y)) {
        mirror.x = g.x;
        mirror.y = g.y;
        draw();
      }
    }

    if (e.touches.length === 2 && state.rotationMirrorId !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentAngle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);

      const angleDeg = (currentAngle * 180) / Math.PI;
      const snapped = (((Math.round(angleDeg / 45) * 45) % 180) + 180) % 180;

      const mirror = state.mirrors.find((m) => m.id === state.rotationMirrorId);
      if (mirror && mirror.angle !== snapped) {
        mirror.angle = snapped;
        state.rotationChanged = true;
        draw();
      }

      state.rotationPrevAngle = currentAngle;
    }
  }

  function onTouchEnd(e) {
    e.preventDefault();
    if (!state.gameStarted) return;

    const remaining = e.touches.length;

    if (remaining === 0) {
      if (state.draggingMirrorId !== null) commitDrag();

      if (state.rotationMirrorId !== null && state.rotationChanged) {
        state.moveCount++;
        updateHud();
        setStatus("Spiegel rotiert.");
        draw();
      }
      state.rotationMirrorId = null;
      state.rotationStartAngle = null;
      state.rotationChanged = false;
      state.rotationPrevAngle = null;
    }

    if (remaining === 1) {
      if (state.rotationChanged) {
        state.moveCount++;
        updateHud();
        setStatus("Spiegel rotiert.");
        draw();
      }
      state.rotationMirrorId = null;
      state.rotationStartAngle = null;
      state.rotationChanged = false;
      state.rotationPrevAngle = null;
      state.draggingMirrorId = null;
      state.dragStartGrid = null;
      draw();
    }
  }
}
