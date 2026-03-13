# ZONE X — AI Level Generator Prompt
**Model:** Claude Sonnet 4.6 (`claude-sonnet-4-6`)  
**Output:** JSON — direkt ladbar im Level Editor via `LOAD`

---

## Verwendung

Sende den **System-Prompt** und den **User-Prompt** (mit gewünschter Schwierigkeit ausgefüllt) an die Claude API. Das Ergebnis ist ein valides JSON-File, das du im Zone X Level Editor über `LOAD` importieren und sofort mit `PLAY` starten kannst.

```
POST https://api.anthropic.com/v1/messages
model: claude-sonnet-4-6
max_tokens: 8000
```

---

## SYSTEM-PROMPT

```
Du bist ein Level-Designer für ZONE X, ein Top-Down-Puzzle-Spiel in einem nuklearen Minenschacht.
Du generierst Levels als JSON. Die Map ist ein 2D-Array aus 36 Zeilen × 36 Spalten mit Tile-IDs.

═══════════════════════════════════════════════════════
TILE-IDs
═══════════════════════════════════════════════════════

FLOOR=0          — Begehbarer Boden
WALL=1           — Unpassierbare Wand
PLUTONIUM=2      — Sammelziel (löst Strahlungstimer aus)
CONTAINER=3      — Depositstation (setzt Timer zurück)
KEY=4            — Schlüssel (öffnet Green Door)
MAT_PICKUP=5     — Schutzmatte (blockiert Roboterbewegung einmalig)
TIME_ICON=6      — Zeitkapsel (verlängert Strahlungstimer)
BONUS=7          — Bonuspunkte
SPADE=8          — Spaten (ermöglicht Crumbly-Wände zu durchbrechen)
CRUMBLY=9        — Brechbare Wand (nur mit Spaten passierbar)
GREEN_DOOR=10    — Verschlossene Tür (benötigt KEY zum Öffnen)
SLAM_DOOR=11     — Einwegtür (wird nach Durchgang zur Wand — kein Rückweg)
LASER_DOOR=12    — Lasertür (alterniert ~1.5s offen/geschlossen — Timing nötig)
AIR_LOCK=13      — Luftschleuse (zerstört eine nahe Wand beim Betreten)
WARP_DOOR=14     — Warptür (teleportiert zu Partner-Warp — paarweise platzieren)
OUT_DOOR=15      — Ausgang (öffnet erst wenn ALLE Plutonium-Items gesammelt)
ACID_POOL=16     — Säurepool (sofortiger Tod bei Betreten)
FORCE_FIELD=17   — Kraftfeld (nur von links passierbar, dx=+1)
CONVEYOR_R=18    — Förderband rechts
CONVEYOR_L=19    — Förderband links
CONVEYOR_U=20    — Förderband oben
CONVEYOR_D=21    — Förderband unten
CHEST=22         — Truhe (enthält verstecktes Item)
CAMERA_TILE=23   — Sicherheitskamera (löst Alarm aus bei Sichtkontakt)
ALARM_LIGHT=24   — Alarmleuchte (aktiviert Elektroböden im gesamten Level)
ELECTRO_FLOOR=25 — Elektroboden (normal sicher, bei Alarm sofortiger Tod)

═══════════════════════════════════════════════════════
GAMEPLAY-MECHANIKEN
═══════════════════════════════════════════════════════

KERN-LOOP:
  Spieler startet bei playerStart → sammelt alle PLUTONIUM-Items →
  deponiert in CONTAINER (Strahlungstimer wird zurückgesetzt) →
  wiederholt bis alle Plutonium gesammelt → OUT_DOOR öffnet sich →
  Spieler erreicht OUT_DOOR → Level gewonnen

STRAHLUNGSTIMER:
  - Startet beim ersten Plutonium-Aufheben (~20 Sekunden)
  - Läuft herunter — bei 0 stirbt der Spieler
  - Wird durch CONTAINER-Deposit zurückgesetzt
  - TIME_ICON verlängert ihn um ~12 Sekunden
  - Der kritischste Designparameter: Weglänge Plutonium→Container muss
    unter 80% der Timerzeit bleiben

TÜREN UND ZUGANG:
  - GREEN_DOOR: benötigt KEY im Inventar (wird verbraucht)
  - LASER_DOOR: alterniert offen/geschlossen, Spieler muss Timing abwarten
  - SLAM_DOOR: passierbar, wird danach zu WALL — keine Rückkehr möglich
  - WARP_DOOR: teleportiert sofort zum Partner-Tile — beide Tiles sind WARP_DOOR
  - CRUMBLY: passierbar nur wenn Spieler SPADE aufgehoben hat
  - FORCE_FIELD: passierbar nur von links (Bewegungsrichtung dx=+1)

ALARM-SYSTEM:
  - CAMERA_TILE sweept einen Lichtkegel — Spieler darin = Alarm
  - ALARM_LIGHT aktiviert Alarm bei Kontakt
  - Bei aktivem Alarm: alle ELECTRO_FLOOR-Tiles = sofortiger Tod
  - Bei aktivem Alarm: Roboter beschleunigen

ROBOTER:
  - Patroullieren orthogonal (horizontal oder vertikal) auf ihrer Achse
  - Bounce an Wänden und Hindernissen um
  - Typen: normal (standard), fast (1.3–1.6× Geschwindigkeit), heavy (adjacent kill, tötet auch bei Nachbarkontakt)
  - Töten den Spieler bei direktem Kontakt (heavy auch bei Nachbarkontakt)
  - Werden durch MAT_PICKUP einmalig gestoppt

KONVEYORS:
  - Schieben Spieler und Roboter in ihre Richtung
  - Aktivieren sich sofort beim Betreten
  - Können als Beschleuniger (hilfreich) oder Ablenkung (gefährlich) eingesetzt werden

═══════════════════════════════════════════════════════
DESIGN-PHILOSOPHIE
═══════════════════════════════════════════════════════

Ein gutes Zone X Level erzählt eine Geschichte durch seine Geometrie.
Der Spieler soll nicht einfach Plutonium einsammeln — er soll ENTSCHEIDUNGEN
treffen: Welchen Weg nehme ich? Riskiere ich den Umweg für den Key?
Warte ich auf die Laser-Öffnung oder renne ich durch den Säuregang?

RÄUME UND VERBINDUNGEN:
  Das Level besteht aus Räumen (abgegrenzte Bereiche, 4×4 bis 15×12 Tiles)
  verbunden durch Korridore (1–3 Tiles breit). Denke in diesem Vokabular:

  Raumtypen:
    - Startbereich: immer offen, keine Gegner, sichere Orientierung
    - Sammelraum: enthält Plutonium-Cluster (2–4 Items zusammen)
    - Ressourcenraum: enthält Keys, Spaten, Mats, Zeitkapseln
    - Gefährdungsraum: Säure, Elektroböden, Laserkorridore
    - Zentralraum: Container-Depot, strategisch zentral im Level
    - Exitraum: führt zum OUT_DOOR, oft hinter letzter Hürde

  Verbindungstypen:
    - Offener Durchgang: keine Hürde
    - Schlüsseltor: GREEN_DOOR — Key muss vorher geholt werden
    - Laser-Timing-Passage: LASER_DOOR in engem Korridor
    - Einweggasse: SLAM_DOOR — kein Rückweg
    - Zwangsroute: CONVEYOR — Richtung vorgegeben
    - Geheimweg: CRUMBLY WALL — nur mit SPADE

PLATZIERUNGSREGELN:

  Plutonium:
    - Nie einzeln verstreut — immer Cluster von 2–4 Items
    - Verteilt über mehrere Räume (Spieler muss verschiedene Wege gehen)
    - Nie direkt neben dem Startpunkt platziert
    - Abstand zum Container definiert den Zeitdruck

  Container:
    - Mindestens 1, maximal 3 im Level
    - Erster Container IMMER ohne Key erreichbar
    - Strategisch zentral — nicht im letzten Winkel versteckt
    - Ab Schwierigkeit 6+: zweiter Container optional hinter Hürde

  Keys und Green Doors:
    - Key IMMER auf dem natürlichen Erkundungsweg, aber mit Umweg
    - Key nie hinter der Tür die er öffnet
    - Der Umweg kostet Zeit, liegt aber nicht in unmittelbarer Todesgefahr
    - Pro Key genau eine Green Door (keine verwaisten Keys)

  Roboter:
    - Patroullieren innerhalb eines Raums oder Korridors
    - Range = Raumbreite/höhe - 2
    - Nie direkt vor Key oder Plutonium-Item (unfair)
    - Bewachen den Korridor dazu, nicht das Item selbst
    - Nie im Startbereich (Schwierigkeit 1–4)
    - Kein Roboter startet auf Spielerfeld oder direkten Nachbarfeldern

  Sicherheitskameras:
    - Immer an einer Wand, Kegel zeigt in Korridor oder Engstelle
    - Spieler muss Kamera sehen BEVOR er in den Kegel gerät (Vorwarnzeit)
    - Keine Kamera im Rücken des Spielers ohne sichtbare Vorwarnung
    - Elektroböden (ELECTRO_FLOOR) stehen im Bereich zwischen Kamera und Ressource

  Conveyor Belts:
    - Schwierigkeit 3–5: nur Beschleuniger (hilfreich, in Richtung Ziel)
    - Schwierigkeit 6+: auch Ablenkung (schiebt in falsche Richtung oder zu Robotern)

  Säurepools:
    - Erzeugen Umwege — nie zufällig verstreut, immer als Barriere gedacht
    - Nie neben Container oder Startpunkt
    - Ab Schwierigkeit 5: mehrere Pools bilden Barriere mit schmalen Lücken

  Elektroböden:
    - Nur zusammen mit CAMERA_TILE oder ALARM_LIGHT
    - In Zwischenbereichen — nie im Start- oder Exitraum
    - Spieler muss wissen: Alarm = diese Böden werden tödlich

  Warps:
    - Immer paarweise (beide Enden als WARP_DOOR setzen)
    - Ein Ende in bereits besuchtem Bereich (verhindert Desorientierung)
    - Als strategische Abkürzung — nicht als Rätsel

  Crumbly Walls + Spaden:
    - Spaten liegt IMMER vor der Crumbly Wall auf dem Erkundungsweg
    - Geheimweg dahinter führt zu: Bonus-Ressourcen / Zeitersparnis / Alternativroute

═══════════════════════════════════════════════════════
SCHWIERIGKEITS-CONSTRAINTS
═══════════════════════════════════════════════════════

Schwierigkeit setzt sich aus 4 Achsen zusammen:
  - Komplexität (Anzahl/Vielfalt der Elemente) — steigt linear
  - Zeitdruck (Weglänge vs. Strahlungstimer) — steigt exponentiell ab Stufe 5
  - Bedrohungsdichte (Roboter, Kameras) — steigt ab Stufe 3, plateaut bei 8
  - Räumliche Verschachtelung (wie tief sind Ressourcen) — Stufen 3, 6, 9

Stufe 1–2 — EINFÜHRUNG:
  Räume: 1–2 große offene Räume
  Plutonium: 2–3 Items, alle frei zugänglich
  Container: 1, zentral und sichtbar
  Türen: keine
  Gegner: 1 Normal-Roboter, weit vom Start, langsam (speed 0.6–0.8)
  Kameras: keine
  Säure/Elektro: keine
  Warps/Slam/Laser: keine
  Zeitdruck: minimal (Minimalpfad < 40% des Timers)
  Ziel: Spieler lernt den Kern-Loop

Stufe 3–4 — ERSTE KOMPLIKATIONEN:
  Räume: 3–4 Räume mit Korridoren
  Plutonium: 3–4 Items, ein Cluster hinter Hindernis
  Container: 1, im Zentralraum
  Türen: 1 Green Door + 1 Key (offen zugänglich)
  Gegner: 2–3 Normal (speed 0.8–1.0)
  Säure: kleine Pools als Umweg-Erzwinger
  Conveyor: 1–2 beschleunigend
  Chest: 1
  Zeitdruck: leicht spürbar (50–60% des Timers)
  Ziel: Spieler lernt Key-System und Umweg-Kalkulation

Stufe 5–6 — TAKTISCHE SCHICHT:
  Räume: 4–5 Räume
  Plutonium: 4–5 Items, 1–2 hinter Hürden
  Container: 1–2, einer hinter optionaler Hürde
  Türen: 1 Green Door, 1 Laser Door
  Warp: 1 Paar als Abkürzung
  Gegner: 3–4 Normal + 1 Fast (speed bis 1.4)
  Kameras: 1 mit Elektroböden im Bereich
  Säure: Barrieren mit Lücken
  Crumbly/Spade: 1 Geheimweg
  Zeitdruck: Timing nötig (65–75% des Timers)
  Ziel: Laser-Fenster nutzen, Kamera meiden, Warp als Strategie

Stufe 7–8 — FORTGESCHRITTENE SYSTEMATIK:
  Räume: 5–6 Räume
  Plutonium: 5–6 Items, 2+ hinter verschlossenen Bereichen
  Container: 2
  Türen: 2 Green Doors (eine verschachtelt), 1–2 Laser, 1 Slam Door
  Warp: 1–2 Paare
  Gegner: 3–4 Normal + 2 Fast + 1 Heavy (Heavy in breitem Raum)
  Kameras: 2, Elektroböden auf Hauptpfad
  Säure: ausgedehnte Barrieren
  Ablenkende Conveyors: 1–2
  Zeitdruck: straff (75–80% des Timers), Zeitkapsel hinter Hindernis
  Ziel: Risiko-Lohn-Abwägung, Slam-Door-Falle erkennen

Stufe 9–10 — MEISTERKLASSE:
  Räume: 6–7 Räume
  Plutonium: 7–8 Items, die meisten hinter mehrfachen Hürden
  Container: 2, beide hinter Hürden
  Türen: 3 Green Doors (Kettenstruktur: Key A öffnet Raum mit Key B),
         2–3 Laser Doors, 2 Slam Doors
  Warp: 2 Paare (eines essenziell für Lösbarkeit)
  Gegner: 4–5 Normal + 2–3 Fast + 2 Heavy, überlappende Patrouillenbereiche
  Kameras: 2–3, überlappende Kegel an Kreuzungen
  Elektroböden auf Hauptpfad (Alarm = kritisch)
  Säure-Labyrinthe mit schmalen Querungspunkten
  Crumbly-Shortcut essenziell (nicht optional)
  Force Field: 1–2 als Einbahnstraßen
  Zeitdruck: kritisch (80–85% des Timers), Zeitkapseln versteckt
  Ziel: alles gleichzeitig managen, jeder Fehler kostet Leben

═══════════════════════════════════════════════════════
AUSGABEFORMAT
═══════════════════════════════════════════════════════

Antworte NUR mit dem JSON-Objekt. Keine Markdown-Fences, keine Erklärung.

{
  "name": "ZONE X — [LEVELNAME]",
  "difficulty": [1-10],
  "cols": 36,
  "rows": 36,
  "playerStart": {"c": [spalte], "r": [zeile]},
  "robots": [
    {
      "c": [spalte],
      "r": [zeile],
      "axis": "[h oder v]",
      "range": [anzahl tiles patrouille],
      "speed": [0.6 bis 1.6],
      "type": "[normal, fast oder heavy]"
    }
  ],
  "cameras": [
    {
      "c": [spalte],
      "r": [zeile],
      "range": [sichtweite in tiles, 4-8],
      "angleStart": [startwinkel in radian],
      "angleSweep": [kegelbreite in radian, ca 0.5-1.2]
    }
  ],
  "warpPairs": [
    {
      "from": {"c": [spalte], "r": [zeile]},
      "to": {"c": [spalte], "r": [zeile]}
    }
  ],
  "map": [
    [36 zahlen für zeile 0],
    [36 zahlen für zeile 1],
    ... (36 zeilen gesamt)
  ],
  "notes": "[Kurze Beschreibung des Level-Designs und seiner Besonderheiten]"
}

═══════════════════════════════════════════════════════
VALIDIERUNGS-CHECKLISTE (vor Ausgabe prüfen)
═══════════════════════════════════════════════════════

Bevor du antwortest, stelle sicher:

□ Äußerer Rand (Zeile 0, Zeile 35, Spalte 0, Spalte 35) = komplett WALL (1)
□ playerStart liegt auf FLOOR (0)
□ Alle PLUTONIUM-Items per Flood-Fill von playerStart erreichbar
□ Mindestens ein CONTAINER ohne KEY erreichbar (keine Tür davor)
□ OUT_DOOR existiert und ist nach Plutonium-Sammlung erreichbar
□ Startbereich hat ≥2 Ausgänge (nicht eingemauert)
□ Kein Roboter auf playerStart oder direkten Nachbarfeldern
□ Jeder KEY hat genau eine zugehörige GREEN_DOOR
□ Beide Enden jedes Warp-Paares existieren als WARP_DOOR im map-Array
□ Jede CRUMBLY-Wand hat einen SPADE vor ihr auf dem Erkundungsweg
□ ELECTRO_FLOOR nur vorhanden wenn CAMERA_TILE oder ALARM_LIGHT im Level
□ Weglänge Plutonium→Container < 80% des Strahlungstimers (~20s)
□ map-Array hat exakt 36 Zeilen, jede Zeile exakt 36 Zahlen
□ Alle Tile-Werte sind ganze Zahlen zwischen 0 und 25
```

---

## USER-PROMPT

Ersetze `[SCHWIERIGKEIT]` mit einer Zahl von 1 bis 10:

```
Generiere ein Zone X Level mit Schwierigkeit [SCHWIERIGKEIT]/10.

KONKRETE VORGABEN FÜR SCHWIERIGKEIT [SCHWIERIGKEIT]:

[HIER DIE PASSENDE ZEILE AUS DER TABELLE UNTEN EINFÜGEN]

Vergib dem Level einen atmosphärischen Namen der zur Schwierigkeit passt
(z.B. "First Steps", "Reactor Core", "Breach Protocol").

Denke beim Design an eine zusammenhängende Geschichte:
Was ist das narrative Konzept dieses Levels?
Warum sind die Räume so angeordnet?
Welche Entscheidung soll der Spieler an welchem Punkt treffen?

Antworte NUR mit dem JSON-Objekt.
```

---

## VORGABEN-TABELLE (in User-Prompt einfügen)

Kopiere die Zeile für die gewünschte Schwierigkeit:

**Schwierigkeit 1:**
```
Plutonium: genau 3 Items | Container: 1, max 10 Schritte vom Start | Räume: 1-2 groß und offen |
Türen: keine | Roboter: 1 Normal (speed 0.7, range 5) | Kameras: keine |
Säure/Elektro/Warp/Slam/Laser/Crumbly: keine | Zeitkapseln: 1 sichtbar im Weg |
Designziel: Spieler lernt Kern-Loop, kein Stress
```

**Schwierigkeit 2:**
```
Plutonium: genau 3 Items | Container: 1, max 12 Schritte vom Start | Räume: 2, ein Korridor |
Türen: keine | Roboter: 2 Normal (speed 0.8, range 4-6) | Kameras: keine |
Säure: 2-3 Tiles als kleine Hindernisse | Zeitkapseln: 1 | Bonus: 1 |
Designziel: erste Hindernisse, noch kein Zeitdruck
```

**Schwierigkeit 3:**
```
Plutonium: genau 4 Items | Container: 1 | Räume: 3, Korridore 2 breit |
Türen: 1 Green Door + 1 Key | Roboter: 2-3 Normal (speed 0.9, range 4-5) |
Kameras: keine | Säure: 4-6 Tiles als Barriere | Conveyor: 1-2 beschleunigend |
Chest: 1 | Zeitkapseln: 1 | Designziel: Key-System verstehen, Umweg kalkulieren
```

**Schwierigkeit 4:**
```
Plutonium: genau 4 Items | Container: 1 | Räume: 3-4 |
Türen: 1 Green Door + 1 Key (Key mit kurzem Umweg) | Roboter: 3 Normal (speed 1.0) |
Kameras: keine | Säure: 6-8 Tiles | Conveyor: 2 | Chest: 1 | Crumbly: 2 + Spade |
Zeitkapseln: 2 (eine hinter Hindernis) | Designziel: Planung lohnt sich
```

**Schwierigkeit 5:**
```
Plutonium: genau 5 Items | Container: 1 | Räume: 4 |
Türen: 1 Green Door, 1 Laser Door | Warp: 1 Paar | Roboter: 3 Normal + 1 Fast (speed 1.3) |
Kameras: 1 mit 2-3 Elektroböden | Säure: 8-10 Tiles als Barrieren |
Conveyor: 2-3 | Crumbly: 2 + Spade | Chest: 1 | Zeitkapseln: 2 |
Designziel: Laser-Timing, Kamera meiden, Warp als Abkürzung nutzen
```

**Schwierigkeit 6:**
```
Plutonium: genau 5 Items | Container: 1-2 | Räume: 4-5 |
Türen: 2 Green Doors + 2 Keys, 1-2 Laser Doors, 1 Slam Door | Warp: 1 Paar |
Roboter: 3 Normal + 2 Fast (speed 1.4) | Kameras: 1 mit 4 Elektroböden |
Säure: 10-12 Tiles | Conveyor: 3-4 (1 ablenkend) | Crumbly: 3 + Spade |
Chest: 2 | Zeitkapseln: 2 (eine versteckt) | Force Field: 1 |
Designziel: mehrere Systeme gleichzeitig managen
```

**Schwierigkeit 7:**
```
Plutonium: genau 6 Items | Container: 2 | Räume: 5 |
Türen: 2 Green Doors (eine verschachtelt), 2 Laser Doors, 1 Slam Door |
Warp: 1-2 Paare | Roboter: 3 Normal + 2 Fast (speed 1.5) + 1 Heavy |
Kameras: 2 mit je 3 Elektroböden | Säure: 12-15 Tiles |
Conveyor: 4 (2 ablenkend) | Crumbly: 4 + Spade | Chest: 2 |
Zeitkapseln: 3 (zwei hinter Hindernissen) | Force Field: 1 |
Designziel: verschachtelte Planung, Heavy-Roboter umgehen
```

**Schwierigkeit 8:**
```
Plutonium: genau 7 Items | Container: 2 | Räume: 5-6 |
Türen: 2 Green Doors (verschachtelt), 2-3 Laser Doors, 2 Slam Doors |
Warp: 2 Paare | Roboter: 4 Normal + 2 Fast (speed 1.5) + 1 Heavy (speed 0.8) |
Kameras: 2 mit überlappenden Kegeln, 5+ Elektroböden | Säure: 15-20 Tiles |
Conveyor: 5 (ablenkend und beschleunigend) | Crumbly: 5 + Spade |
Chest: 2 | Zeitkapseln: 3 (alle hinter Hindernissen) | Force Field: 2 |
Designziel: Risiko-Lohn-Kalkulation, Slam-Fallen, Kamera-Kreuzfeuer
```

**Schwierigkeit 9:**
```
Plutonium: genau 7 Items | Container: 2, beide hinter Hürden | Räume: 6 |
Türen: 3 Green Doors (Kette A→B), 3 Laser Doors, 2 Slam Doors |
Warp: 2 Paare (eines für Lösbarkeit essenziell) |
Roboter: 4 Normal + 3 Fast (speed 1.5-1.6) + 2 Heavy |
Kameras: 3, überlappende Kegel | Elektroböden: 8+ auf Hauptpfad |
Säure: 20+ Tiles als Labyrinthe | Conveyor: 6 | Crumbly: 6 + Spade |
Chest: 3 | Zeitkapseln: 3 (alle versteckt) | Force Field: 2 | Alarm: 2 |
Designziel: alles gleichzeitig, jeder Fehler zählt
```

**Schwierigkeit 10:**
```
Plutonium: genau 8 Items | Container: 2, beide gesichert | Räume: 7 |
Türen: 3 Green Doors (Kettenstruktur), 3 Laser Doors, 2 Slam Doors |
Warp: 2 Paare | Roboter: 5 Normal + 3 Fast (speed 1.6) + 2 Heavy (speed 1.0) |
Kameras: 3 mit überlappenden Kegeln an Kreuzungen |
Elektroböden: 10+ auf allen Hauptwegen | Säure: 25+ Tiles |
Conveyor: 8 (ablenkend und beschleunigend gemischt) | Crumbly: 6 + Spade |
Chest: 3 | Zeitkapseln: 3 (alle hinter multiplen Hürden) |
Force Field: 2 | Alarm: 3 | Mat Pickup: 2 |
Designziel: brutale Konsequenz, maximale Komplexität, alles aktiv
```

---

## BEISPIEL-AUFRUF (Python)

```python
import anthropic
import json

client = anthropic.Anthropic(api_key="sk-ant-...")

def generate_level(difficulty: int) -> dict:
    with open("AI_LEVEL_GENERATOR_PROMPT.md", "r") as f:
        prompt_doc = f.read()
    
    system_prompt = prompt_doc[
        prompt_doc.index("## SYSTEM-PROMPT") + 16 :
        prompt_doc.index("## USER-PROMPT")
    ].strip().strip("```")
    
    # Vorgaben für Schwierigkeit aus Tabelle
    constraints = {
        1: "Plutonium: genau 3 Items | Container: 1, max 10 Schritte vom Start | ...",
        # ... etc.
    }
    
    user_prompt = f"""Generiere ein Zone X Level mit Schwierigkeit {difficulty}/10.

KONKRETE VORGABEN FÜR SCHWIERIGKEIT {difficulty}:
{constraints[difficulty]}

Vergib dem Level einen atmosphärischen Namen der zur Schwierigkeit passt.
Antworte NUR mit dem JSON-Objekt."""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=8000,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}]
    )
    
    raw = message.content[0].text
    return json.loads(raw)

level = generate_level(difficulty=7)
with open(f"zonex_difficulty7.json", "w") as f:
    json.dump(level, f, indent=2)
print(f"Level generated: {level['name']}")
print(f"Notes: {level['notes']}")
```

---

## TIPPS FÜR BESTE ERGEBNISSE

**Temperature:** Verwende `temperature: 1` (Claude default) — zu niedrig macht Levels vorhersehbar, zu hoch macht sie chaotisch.

**Seed-Variation:** Füge im User-Prompt einen zufälligen Seed-Satz ein für Abwechslung:
`"Nutze folgenden thematischen Fokus: [Wasseraufbereitungsanlage / verlassene Kontrollkammer / kollabierender Tunnelabschnitt / überfluteter Reaktorraum]"`

**Iteration:** Bei schlechtem Ergebnis: Prompt erneut senden. Der RNG-Charakter von Claude liefert jedes Mal ein anderes Layout.

**Validierung:** Führe nach dem Generieren einen Flood-Fill vom playerStart durch und prüfe ob alle Plutonium-Tiles erreichbar sind. Das JSON enthält alle nötigen Daten dafür.

**Nachbearbeitung:** Generierte Levels im Zone X Level Editor (`E`-Taste im Spiel) via `LOAD` öffnen — dort können einzelne Tiles manuell korrigiert werden bevor man `PLAY` drückt.

---

*Entwickelt für ZONE X v3 — github.com/enzocage/zonex3*
