/*
Verarbeitet Eingaben vom Spieler
*/

import { DOUBLE_TAP_MS } from "./constants.js";
import { canvas } from "./dom.js";
import { state } from "./state.js";
import { canvasPoint, mirrorAtCanvasPoint, pointToGrid } from "./coords.js";
import { isInsideGrid } from "./grid.js";
import { draw } from "./render.js";
import { hideMirrorRotationHud, showMirrorRotationHud } from "./angleHud.js";

//Bekommt vier Funktionen aus der Main
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

  //Rechnet Client-Koordinaten → Canvas → Grid um und setzt die neue Mirror-Position
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

  //prüft ob die neue Position gültig ist.
  canvas.addEventListener("pointerup", commitDrag);
  canvas.addEventListener("pointercancel", commitDrag);

  //Verhindert das Browser-Kontextmenü. Dann Spiegel um 45° drehen, Zug zählen.
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

  //---Touch-Events---
  canvas.addEventListener("touchstart", onTouchStart, { passive: false });
  canvas.addEventListener("touchmove", onTouchMove, { passive: false });
  canvas.addEventListener("touchend", onTouchEnd, { passive: false });
  canvas.addEventListener("touchcancel", onTouchEnd, { passive: false });

  function onTouchStart(e) {
    e.preventDefault();
    if (!state.gameStarted) return;

    const touchCount = e.touches.length;
    //1. Finger Double Tap
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

    //2. Finger Rotation
    //Nur ausgeführt wenn bereits ein Spiegel mit dem 1. Finger gehalten wird
    if (touchCount === 2 && state.rotationMirrorId !== null) {
      state.draggingMirrorId = null;
      state.dragStartGrid = null;

      const t1 = e.touches[0];
      const t2 = e.touches[1];
      state.rotationPrevAngle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);
      state.rotationChanged = false;

      const mirror = state.mirrors.find((m) => m.id === state.rotationMirrorId);
      if (mirror) showMirrorRotationHud(mirror.angle);
    }
  }

  //1 Finger: Spiegel verschieben
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

    //2 Finger: Währen der bewegung
    //Berechnet den Winkel der Linie zwischen den zwei Fingern in Grad.
    if (e.touches.length === 2 && state.rotationMirrorId !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentAngle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);

      const angleDeg = (currentAngle * 180) / Math.PI;
      //Rastet auf den nächsten 45°-Schritt ein und sieht nach 180° gleich aus
      const snapped = (((Math.round(angleDeg / 45) * 45) % 180) + 180) % 180;

      const mirror = state.mirrors.find((m) => m.id === state.rotationMirrorId);
      if (mirror) {
        if (mirror.angle !== snapped) {
          mirror.angle = snapped;
          state.rotationChanged = true;
        }
        showMirrorRotationHud(mirror.angle);
        draw();
      }

      state.rotationPrevAngle = currentAngle;
    }
  }

  //Alle Finger loslassen
  //Drag committen, Rotation als Zug zählen, Alles zurücksetzen
  function onTouchEnd(e) {
    e.preventDefault();
    if (!state.gameStarted) return;

    const remaining = e.touches.length;
    //alle finger weg
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
      hideMirrorRotationHud();
    }

    //2. Finger losgelassen, 1. noch da
    //Rotation beenden, Zug zählen, Drag-State zurücksetzen, HUD verstecken, neu zeichnen
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
      hideMirrorRotationHud();
      draw();
    }
  }
}
