# HEX DRIFT — Neon Void Runner

A browser-based top-down dodger/shooter. Steer a glowing hex-core ship
through waves of geometric enemies, auto-fire lasers, grab power-ups, and
chase a high score that's saved locally in your browser.

## Run it

No build step, no dependencies, no server required.

1. Open `index.html` directly in any modern desktop or mobile browser
   (Chrome, Edge, Firefox, Safari).
2. Click **LAUNCH** to start. Click the speaker icon once to hear audio —
   browsers require a user gesture before playing sound.

Optional, if you prefer serving it locally instead of opening the file
directly (identical behavior either way):

```bash
cd hex-drift
python3 -m http.server 8000
# then open http://localhost:8000
```

## Controls

| Input | Action |
|---|---|
| `W A S D` or Arrow keys | Steer the ship |
| Click-drag / touch-drag on the canvas | Steer the ship (mobile-friendly) |
| `Esc` or `P` | Pause / resume |
| — | Firing is automatic — aim is handled for you |

## Features

- Free-roam movement with smooth accelerated (keyboard) or direct
  drag-to-steer (mouse/touch) physics
- 4 enemy types: drifter, chaser (homes in), splitter (fractures into
  shards on death), shard
- 3 power-ups: shield, rapid-fire, multi-shot, with visible timers via
  on-ship effects
- Wave-based difficulty scaling (spawn rate + enemy speed increase over
  survival time)
- Procedural canvas graphics — no image assets to load
- Procedural Web Audio SFX + looping background music — no audio assets
  to load
- Start menu, pause menu, game-over screen with new-record badge, and a
  How To Play panel
- High score persisted via `localStorage`
- Fully responsive (phones, tablets, desktop) with touch, mouse, and
  keyboard support
- Auto-pause on tab/window blur so you never lose a life off-screen

## Folder structure

```
hex-drift/
├── index.html            # DOM structure: menus, HUD, canvas
├── style.css              # Design system, layout, responsive rules, animations
├── script.js               # Game engine: rendering, physics, audio, input, state
├── README.md               # This file
└── assets/
    ├── images/README.md    # Why no image files are needed (procedural canvas art)
    └── sounds/README.md    # Why no audio files are needed (procedural Web Audio)
```

## Extending it

- **Custom sprites**: load an `Image()` in `script.js` and draw it inside
  `drawPlayer()` / `drawEnemies()` instead of the current vector shapes.
- **Recorded audio**: drop files into `assets/sounds/` and swap the
  relevant `Sound` methods for `new Audio(...)` playback.
- **New enemy types**: add an entry to `ENEMY_TYPES` and a matching
  branch in `drawEnemies()`.
- **New power-ups**: add an entry to `POWERUP_DEFS` and a branch in
  `applyPowerup()`.
