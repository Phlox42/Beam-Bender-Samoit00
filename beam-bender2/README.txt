================================================================
  BEAM BENDER – MCI2 Lab · Touch-Puzzle-Spiel
================================================================

BESCHREIBUNG
------------
Beam Bender ist ein gridbasiertes Lichtstrahl-Puzzle für
Touchscreens (und Desktop). Der Spieler positioniert und
rotiert Spiegel, um einen Laserstrahl von der Lichtquelle
zum Ziel zu lenken – dabei sind fixe Hindernisse zu umgehen.

DATEIEN
-------
  index.html   – Hauptseite (Canvas, HUD, Overlays)
  style.css    – Styling (Dark-Sci-Fi-Ästhetik, Google Fonts)
  js/main.js   – Einstieg: Level laden, Laser, HUD, UI-Events
  js/state.js  – Gemeinsamer Spielzustand
  js/dom.js    – DOM-Referenzen (Canvas, Buttons, Overlays)
  js/constants.js – Rastergröße, Konstanten
  js/levels.js – Level-Definitionen
  js/grid.js   – Raster, Spiegelplatzierung, statische Karte
  js/coords.js – Canvas- zu Gitterkoordinaten
  js/laser.js  – Lichtstrahl-Berechnung (Reflexion)
  js/render.js – Canvas-Zeichnen
  js/input.js  – Maus/Stift/Touch (Drag, Rotation, Doppeltipp)
  js/utils.js  – Hilfsfunktionen (z. B. deepClone)


INSTALLATION & START (Desktop)
-------------------------------
1. Ordner mit VS Code öffnen
2. Live Server starten (Port 5500 oder 3000)
3. Browser: http://localhost:5500


TOUCH-DEBUGGING MIT SCRCPY
--------------------------
Voraussetzung: Android SDK (adb) installiert, Gerät per USB,
               USB-Debugging im Entwicklermenü aktiviert

1. Im Beam-Bender-Ordner:
     scrcpy_open_a_terminal_here.bat   (oder normales Terminal)

2. Gerät prüfen:
     adb devices
     → Gerät muss als "device" erscheinen (nicht "unauthorized")

3. Port weiterleiten (Live Server auf Port 5500):
     adb reverse tcp:5500 tcp:5500
   oder für Port 3000:
     adb reverse tcp:3000 tcp:3000

4. scrcpy starten (Handy-Screen auf PC spiegeln):
     scrcpy

5. Auf dem Handy im Browser:
     http://localhost:5500
   (oder http://localhost:3000 je nach Live-Server-Port)

6. Touch-Interaktionen testen – Touches erscheinen live
   auf dem gespiegelten Bildschirm.


TOUCH-GESTEN IM SPIEL
---------------------
  01  Spiegel verschieben  →  1 Finger, Drag & Drop
      • touchstart: Spiegel unter Finger auswählen
      • touchmove:  Spiegel an neue Gitterposition ziehen
      • touchend:   Spiegel einrasten (bei besetztem Feld: zurück)

  02  Spiegel rotieren     →  2 Finger, Rotation
      • touchstart: 2 Finger auf/neben Spiegel setzen
      • touchmove:  Drehgeste → Einrasten in 45°-Schritten
      • touchend:   Winkel wird übernommen (+1 Zug)

  03  Laser aktivieren     →  Double Tap (1 Finger)
      • 2× tippen innerhalb 350 ms (beliebige Stelle)
      • Laser wird animiert abgefeuert
      • Trifft Ziel → nächstes Level
      • Verfehlt Ziel → Laser erlischt, weiter spielen
      • Laser testen zählt NICHT als Zug!

Desktop-Alternativen:
  • Drag & Drop mit Maus
  • Rechtsklick auf Spiegel → 45°-Rotation
  • Button "⚡ Laser testen"


SPIELREGELN
-----------
  • 3 Level mit steigender Komplexität
  • Nur das Ziel muss getroffen werden
  • Nicht alle Spiegel müssen verwendet werden
  • Lichtquelle, Ziel und Hindernisse sind fix
  • Spiegel sind überall im Raster platzierbar
    (außer auf belegten Feldern → Spiegel springt zurück)
  • Züge-Zähler: nur Spiegel verschieben/rotieren zählt


================================================================
