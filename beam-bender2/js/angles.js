/**
 * Anzeige-/Geometriewinkel der Spiegellinie (Canvas: x rechts, y unten):
 * 0° = waagrecht (parallel zur x-Achse), 90° = senkrecht nach unten,
 * Werte steigen im Uhrzeigersinn.
 *
 * spriteAngleDeg = gespeicherter Rotationswinkel des Spiegel-Sprites (unverändert).
 */
export function mirrorLineAngleFromSpriteRotation(spriteAngleDeg) {
  const A = (spriteAngleDeg * Math.PI) / 180;
  const dx = Math.cos(A) - Math.sin(A);
  const dy = -Math.sin(A) - Math.cos(A);
  let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
  deg = ((deg % 180) + 180) % 180;
  return Math.round(deg);
}
