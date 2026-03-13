# ZONE X v3

A browser-based clone of the 1985 Atari 8-bit game **Zone X** — top-down nuclear mineshaft puzzle.

## Play

Open `zone-x-v3.html` directly in your browser. No server, no dependencies (Three.js loads from CDN).

## Features

- 🎮 Smooth pixel-interpolated movement (player + robots)
- 🗺️ Fog of War with reveal system
- 🤖 Security cameras with sweep cone + alarm system
- ⚡ 25 tile types: conveyors, acid pools, laser doors, warp doors, crumbly walls, electro floors...
- 🎵 Streaming background music + 21 procedural SFX (Web Audio API)
- 🏗️ Built-in Level Editor with AI level generator (difficulty 1–10)
- 📦 Load/Save levels as JSON

## Included Levels

| File | Difficulty | Name |
|------|-----------|------|
| `zonex_difficulty1.json` | 1/10 | First Steps |
| `zonex_difficulty5.json` | 5/10 | Sector Delta |
| `zonex_difficulty10.json` | 10/10 | Breach Protocol |

## Controls

| Key | Action |
|-----|--------|
| Arrow keys / WASD | Move |
| Space | Place mat |
| X | Drop plutonium |
| Z | Toggle minimap |
| F | Toggle fog |
| H | Help screen |
| E | Level editor |
| ESC | Pause |

## Level Editor

Press **E** in-game to open the editor. The current level loads automatically.  
Use **AI GENERATE** + difficulty slider (1–10) to generate procedural levels.  
**SAVE JSON** exports the level, **LOAD** imports it, **PLAY** starts immediately.
