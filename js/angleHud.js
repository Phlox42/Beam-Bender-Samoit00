/*
Verwaltet das Rotations-Overlay das beim 2-Finger-Drehen erscheint
(im Display-Overlay an der rechten oberen Ecke des Canvas)

*/

import { mirrorAngleHud, mirrorAngleDial, mirrorAngleValue } from "./dom.js";
import { mirrorLineAngleFromSpriteRotation } from "./angles.js";

/** spriteAngleDeg = interner Sprite-Winkel (wie in state) */
// nimmt internen Sprite-Winkel aus state und rechnet ihn in den Anzeigewinkel um (0° = horizontal)
export function updateMirrorRotationHud(spriteAngleDeg) {
  const lineDeg = mirrorLineAngleFromSpriteRotation(spriteAngleDeg);
  mirrorAngleValue.textContent = `${lineDeg}°`; //Angezeigte Zahl
  mirrorAngleDial.style.setProperty("--mirror-angle", `${lineDeg}deg`); //Zeiger-Drehung
}

//macht das HUD sichtbar und aktualisiert es mit dem aktuellen Winkel
export function showMirrorRotationHud(spriteAngleDeg) {
  mirrorAngleHud.classList.remove("hidden");
  mirrorAngleHud.setAttribute("aria-hidden", "false");
  updateMirrorRotationHud(spriteAngleDeg);
}

//macht das HUD unsichtbar bei onTouchEnd und loadLevel
export function hideMirrorRotationHud() {
  mirrorAngleHud.classList.add("hidden");
  mirrorAngleHud.setAttribute("aria-hidden", "true");
}
