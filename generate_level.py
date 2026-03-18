import anthropic, json, pathlib, re

# Load API key from .env or environment
import os
api_key = os.environ.get("ANTHROPIC_API_KEY", "")
if not api_key:
    env_file = pathlib.Path(".env")
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if line.startswith("ANTHROPIC_API_KEY="):
                api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                break
if not api_key:
    raise ValueError("ANTHROPIC_API_KEY not found. Set it in .env or as environment variable.")

# Extract system prompt from MD file
doc = pathlib.Path("AI_LEVEL_GENERATOR_V2.md").read_text(encoding="utf-8")
start = doc.index("## SYSTEM-PROMPT") + len("## SYSTEM-PROMPT")
end = doc.index("## USER-PROMPT")
system_raw = doc[start:end].strip()
system_raw = system_raw.lstrip("```").lstrip()
system_raw = system_raw.rstrip("```").rstrip()
system = system_raw.strip()

CONSTRAINTS = {
    6: """Plutonium: 5 | Container: 1-2 | Räume: 4-5
Türen: 2 GREEN_DOORs + 2 Keys, 1-2 LASER, 1 SLAM | Warp: 1 Paar
Roboter: 3 Normal + 2 Fast speed=1.4 | Kameras: 1 + 4 Elektroböden
Säure: 10-12 Tiles | Conveyor: 3-4 (1 ablenkend) | Crumbly: 3 + Spade
Chest: 2 | TIME_ICON: 2 (1 versteckt) | Force Field: 1
Innovation-Richtung: mehrere Systeme gleichzeitig managen - Kamera + Laser + Key-Kette"""
}

difficulty = 6
theme = "überfluteter Reaktorraum"

user = f"""Generiere ein Zone X Level mit Schwierigkeit {difficulty}/10.

Thematischer Fokus: {theme}

CONSTRAINTS FÜR SCHWIERIGKEIT {difficulty}:
{CONSTRAINTS[difficulty]}

Arbeite die drei Phasen durch (Phase 1 intern, Ergebnis ins JSON).
Antworte NUR mit dem JSON-Objekt."""

print(f"Generating Zone X Level — Difficulty {difficulty} — Theme: {theme}")
print(f"System prompt: {len(system)} chars")
print("Calling claude-opus-4-6 (adaptive thinking)...")

client = anthropic.Anthropic(api_key=api_key)
msg = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=8000,
    thinking={"type": "adaptive"},
    system=system,
    messages=[{"role": "user", "content": user}]
)

# Extract text block
raw = ""
for block in msg.content:
    if block.type == "text":
        raw = block.text
        break

print(f"Response length: {len(raw)} chars")

# Parse JSON (strip any accidental markdown fences)
raw_clean = raw.strip()
if raw_clean.startswith("```"):
    raw_clean = re.sub(r"^```[a-z]*\n?", "", raw_clean)
    raw_clean = re.sub(r"\n?```$", "", raw_clean)

level = json.loads(raw_clean)

# Validate basics
rows = len(level.get("map", []))
cols = len(level["map"][0]) if rows > 0 else 0
print(f"\n--- LEVEL GENERATED ---")
print(f"Name:       {level.get('name', '?')}")
print(f"Difficulty: {level.get('difficulty', '?')}")
print(f"Map size:   {rows} x {cols}")
print(f"Robots:     {len(level.get('robots', []))}")
print(f"Cameras:    {len(level.get('cameras', []))}")
print(f"WarpPairs:  {len(level.get('warpPairs', []))}")
print(f"Innovation: {level.get('innovation', '—')}")
print(f"Notes:      {level.get('notes', '—')}")

# Save
out = pathlib.Path("levels/7.json")
out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps(level, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"\nSaved to: {out}")
