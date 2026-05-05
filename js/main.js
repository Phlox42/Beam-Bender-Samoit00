import { GRID_COLS, GRID_ROWS } from "./constants.js";
import { levels } from "./levels.js";
import { state } from "./state.js";
import {
  canvas,
  levelLabel,
  movesLabel,
  statusText,
  testLaserBtn,
  resetBtn,
  infoBtn,
  startScreen,
  startGameBtn,
  winModal,
  playAgainBtn,
  infoModal,
  closeInfoBtn,
} from "./dom.js";
import { deepClone } from "./utils.js";
import { canPlaceMirrorAt } from "./grid.js";
import { traceLaserPath } from "./laser.js";
import { draw } from "./render.js";
import { registerCanvasInput } from "./input.js";
import { hideMirrorRotationHud } from "./angleHud.js";

//--- beim Start ---
//berechnet tileSize und setzt Canvas-Größe passend zum Bildschirm
function updateCanvasMetrics() {
  const rect = canvas.getBoundingClientRect();
  const tileByWidth = rect.width / GRID_COLS;
  state.tileSize = Math.max(1, Math.floor(tileByWidth));
  canvas.width = state.tileSize * GRID_COLS;
  canvas.height = state.tileSize * GRID_ROWS;
}

//--- Levelverwaltung ---
//aktualisiert Level-Anzeige und Züge-Zähler
function updateHud() {
  levelLabel.textContent = `Level ${state.currentLevelIndex + 1} / ${levels.length}`;
  movesLabel.textContent = `Züge: ${state.moveCount}`;
}

// setzt den Statustext unten
function setStatus(text) {
  statusText.textContent = text;
}

//Klont ein Level aus levels.js in den State, setzt Zähler zurück, ruft draw() auf
function loadLevel(index) {
  state.currentLevelIndex = index;
  state.currentLevel = deepClone(levels[index]);
  state.mirrors = state.currentLevel.mirrors.map((m, i) => ({ ...m, id: i + 1 }));
  state.moveCount = 0;
  state.laserPath = [];
  state.laserAnimating = false;
  state.laserAnimationProgress = 0;
  hideMirrorRotationHud();
  setStatus("Spiegel anordnen, dann Laser testen.");
  updateHud();
  draw();
}

//--- Spiellogik ---
//Prüft ob ein gezogener Spiegel gültig platziert wurde oder zurückspringt
function commitDrag() {
  if (state.draggingMirrorId === null) return;
  const mirror = state.mirrors.find((m) => m.id === state.draggingMirrorId);
  if (mirror) {
    const moved = mirror.x !== state.dragStartGrid.x || mirror.y !== state.dragStartGrid.y;
    if (!canPlaceMirrorAt(mirror.id, mirror.x, mirror.y)) {
      mirror.x = state.dragStartGrid.x;
      mirror.y = state.dragStartGrid.y;
      setStatus("⚠️ Feld besetzt – Spiegel springt zurück.");
    } else if (moved) {
      state.moveCount++;
      updateHud();
      setStatus("Spiegel verschoben.");
    }
  }
  state.draggingMirrorId = null;
  state.dragStartGrid = null;
  draw();
}

//startet die Laser-Berechnung und Animation
function runLaser() {
  if (!state.gameStarted || state.laserAnimating) return;
  const result = traceLaserPath();
  state.laserPath = result.path;
  state.laserAnimating = true;
  state.laserAnimationProgress = 0;
  animateLaser(result.hitTarget);
}

//animiert den Laser-Pfad und zeigt den Erfolg oder Misserfolg an
function animateLaser(hitTarget) {
  const duration = Math.max(400, state.laserPath.length * 100);
  const startTime = performance.now();

  function frame(now) {
    state.laserAnimationProgress = Math.min(1, (now - startTime) / duration);
    draw();
    if (state.laserAnimationProgress < 1) {
      requestAnimationFrame(frame);
      return;
    }

    state.laserAnimating = false;
    if (hitTarget) {
      if (state.currentLevelIndex < levels.length - 1) {
        setStatus("✅ Ziel getroffen! Nächstes Level…");
        setTimeout(() => loadLevel(state.currentLevelIndex + 1), 700);
      } else {
        setStatus("🎉 Alle Level geschafft!");
        state.gameStarted = false;
        setTimeout(() => winModal.classList.remove("hidden"), 400);
      }
    } else {
      setStatus("❌ Ziel verfehlt – Laser erlischt.");
      setTimeout(() => {
        state.laserPath = [];
        draw();
      }, 500);
    }
  }
  requestAnimationFrame(frame);
}

//--- Event-Handler ---
//Registriert die Event-Handler für den Canvas-Input
registerCanvasInput({ commitDrag, runLaser, setStatus, updateHud });

//Ruft runLaser() auf, gleich wie Double Tap
testLaserBtn.addEventListener("click", runLaser);

//Lädt das aktuelle Level neu, setzt den Statustext
resetBtn.addEventListener("click", () => {
  if (!state.gameStarted) return;
  loadLevel(state.currentLevelIndex);
  setStatus("Level zurückgesetzt.");
});

//Öffnet und schließt das Info-Popup
infoBtn.addEventListener("click", () => infoModal.classList.remove("hidden"));
closeInfoBtn.addEventListener("click", () => infoModal.classList.add("hidden"));
infoModal.addEventListener("click", (e) => {
  if (e.target === infoModal) infoModal.classList.add("hidden");
});

//Startet das Spiel, versteckt den Startscreen
startGameBtn.addEventListener("click", () => {
  state.gameStarted = true;
  startScreen.classList.add("hidden");
  loadLevel(0);
});

//Startet das Spiel neu, versteckt den Winscreen
playAgainBtn.addEventListener("click", () => {
  state.gameStarted = true;
  winModal.classList.add("hidden");
  loadLevel(0);
});

//Aktualisiert die Canvas-Größe bei Fenstergrößenänderung
window.addEventListener("resize", () => {
  updateCanvasMetrics();
  draw();
});

//Initialisiert die Canvas-Größe
updateCanvasMetrics();
