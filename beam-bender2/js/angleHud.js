import { mirrorAngleHud, mirrorAngleDial, mirrorAngleValue } from "./dom.js";

export function updateMirrorRotationHud(angleDeg) {
  mirrorAngleValue.textContent = `${angleDeg}°`;
  mirrorAngleDial.style.setProperty("--mirror-angle", `${angleDeg}deg`);
}

export function showMirrorRotationHud(angleDeg) {
  mirrorAngleHud.classList.remove("hidden");
  mirrorAngleHud.setAttribute("aria-hidden", "false");
  updateMirrorRotationHud(angleDeg);
}

export function hideMirrorRotationHud() {
  mirrorAngleHud.classList.add("hidden");
  mirrorAngleHud.setAttribute("aria-hidden", "true");
}
