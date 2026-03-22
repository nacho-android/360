# Alan: Campus of Controlled Chaos

A mobile-first, GitHub Pages-friendly, stylized 2.5D browser adventure about Alan, a research veterinarian navigating a deeply lovable science campus full of eccentric colleagues, mysterious turtles, organized rats, and catastrophically important coffee.

## Why this project uses stylized 2.5D instead of lightweight 3D

This release targets the best balance of:

- **Visual impact**: a rich isometric look with depth, shadows, animated props, and expressive UI.
- **Mobile performance**: HTML5 Canvas 2D is lighter than a browser 3D stack on mid-range phones.
- **GitHub Pages simplicity**: static files only, no bundler, no server.
- **Maintainability**: modular JavaScript, data-driven quests, and swappable art/audio paths.

## Current playable release content

- Large isometric campus overworld
- Home, rooftop, clinic, and dream reef side scenes
- Multiple quest arcs and a finale
- NPC interactions with character writing and objective guidance
- Touch joystick, action buttons, pause, fullscreen support
- Procedural music and SFX via WebAudio
- Local save / autosave via `localStorage`
- Achievements, collectibles, upgrades, checkpoints, and postgame free roam

## Controls

### Touch
- Left thumb: joystick movement
- Right buttons:
  - **TALK / REPAIR** = interact, advance dialogue, activate minigame input
  - **SPRINT** = sprint while held
  - **PAUSE** = pause menu

### Keyboard
- Move: WASD / arrow keys
- Interact / confirm: Space / Enter
- Sprint: Shift
- Pause: Esc / P

## Folder structure

```text
alan-campus-hustle/
├── index.html
├── style.css
├── README.md
├── assets/
│   ├── audio/
│   │   └── README.md
│   ├── docs/
│   │   ├── AUDIO_GUIDE.md
│   │   ├── CHARACTERS.md
│   │   ├── FIREBASE_OPTIONAL.md
│   │   ├── GDD.md
│   │   └── QA_CHECKLIST.md
│   └── images/
│       └── README.md
├── src/
│   ├── main.js
│   ├── core/
│   │   └── Game.js
│   ├── data/
│   │   └── gameData.js
│   ├── entities/
│   │   └── actors.js
│   ├── managers/
│   │   ├── AudioManager.js
│   │   ├── InputManager.js
│   │   ├── QuestManager.js
│   │   ├── SaveManager.js
│   │   └── UIManager.js
│   ├── scenes/
│   │   └── WorldScene.js
│   ├── systems/
│   │   └── MiniGameManager.js
│   └── utils/
│       └── helpers.js
└── .github/
    └── workflows/
        └── deploy-pages.yml
```

## Running locally

Because this uses ES modules, run it from a simple static server rather than opening `index.html` directly.

Examples:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Deploying to GitHub Pages

You can host this as-is on GitHub Pages. See:

- `assets/docs/GDD.md`
- `assets/docs/FIREBASE_OPTIONAL.md`
- `.github/workflows/deploy-pages.yml`

## Asset replacement strategy

This project intentionally uses legally safe placeholder visuals and procedural audio so it runs without external assets.

You can later replace:

- Canvas-drawn props with sprite sheets
- Procedural notes with composed music loops
- UI icons with your own SVG assets
- Character markers with illustrated portraits

See `assets/audio/README.md`, `assets/images/README.md`, and `assets/docs/AUDIO_GUIDE.md`.

## Accessibility notes

Included now:

- Large text toggle
- High contrast toggle
- Reduced motion toggle
- Subtitles toggle
- Mute toggle
- Large mobile touch targets
- Strong contrast and readable HUD chips

## Known scope of this release

This is a strong vertical slice / release-one repository, not a content-complete RPG. The architecture is built for future chapters, more minigames, richer dialogue branches, and full art/audio swaps.
