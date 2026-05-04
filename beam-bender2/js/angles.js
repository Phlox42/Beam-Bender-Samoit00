/**
 * Anzeige-/Geometriewinkel der Spiegellinie (Canvas: x rechts, y unten):
 * 0° = waagrecht (parallel zur x-Achse), 90° = senkrecht nach unten,
 * Werte steigen im Uhrzeigersinn.
 *
 * spriteAngleDeg = gespeicherter Rotationswinkel des Spiegel-Sprites (unverändert).
 */
export function mirrorLineAngleFromSpriteRotation(spriteAngleDeg) {
  // Sprite-Startposition ist "/" (45°-Linie).
  // Offset von -45° damit 0° = horizontal (—), 90° = vertikal (|).
  const deg = ((spriteAngleDeg - 45) % 180 + 180) % 180;
  return Math.round(deg);
}
