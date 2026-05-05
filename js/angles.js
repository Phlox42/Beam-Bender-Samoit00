/*
 Anzeige-/Geometriewinkel der Spiegellinie (Canvas: x rechts, y unten):
 0° = waagrecht (parallel zur x-Achse), 90° = senkrecht nach unten,
 Werte steigen im Uhrzeigersinn.
 */
export function mirrorLineAngleFromSpriteRotation(spriteAngleDeg) {
  // Startposition ist "/" (45°-Linie).
  // Offset von -45° damit 0° = horizontal (—), 90° = vertikal (|).
  const deg = ((spriteAngleDeg - 45) % 180 + 180) % 180;
  return Math.round(deg);
}

//-45 verschiebt den Offset
//% 180 Spiegel nach 180° symmetrisch
//+ 180) % 180 damit negative Werte nicht entstehen
