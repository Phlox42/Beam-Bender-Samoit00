import { mirrorAngleHud, mirrorAngleDial, mirrorAngleValue } from "./dom.js";
import { mirrorLineAngleFromSpriteRotation } from "./angles.js";

/** spriteAngleDeg = interner Sprite-Winkel (wie in state) */
export function updateMirrorRotationHud(spriteAngleDeg) {
  const lineDeg = mirrorLineAngleFromSpriteRotation(spriteAngleDeg);
  mirrorAngleValue.textContent = `${lineDeg}°`;
  mirrorAngleDial.style.setProperty("--mirror-angle", `${lineDeg}deg`);
}

export function showMirrorRotationHud(spriteAngleDeg) {
  mirrorAngleHud.classList.remove("hidden");
  mirrorAngleHud.setAttribute("aria-hidden", "false");
  updateMirrorRotationHud(spriteAngleDeg);
}

export function hideMirrorRotationHud() {
  mirrorAngleHud.classList.add("hidden");
  mirrorAngleHud.setAttribute("aria-hidden", "true");
}
