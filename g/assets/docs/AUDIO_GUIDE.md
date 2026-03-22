# Audio Direction and Integration Guide

## Included in this repository

This build ships with **procedural fallback audio** using WebAudio:

- Ambient loop themes per area
- UI taps and feedback sounds
- Footsteps
- Pickups
- Success / fail cues
- Alarm / finale cues

This means the game works immediately on GitHub Pages without any external audio files.

## Theme goals

- **Campus:** bright, plucky, lightly adventurous
- **Home:** warm, cozy, gentle
- **Drone:** airy, playful, lightly tense
- **Clinic:** careful, precise, reassuring
- **Reef:** dreamy, buoyant, mysterious
- **Finale:** brisk, heroic, humorous tension

## Recommended upgrade path

Replace procedural audio with small compressed assets while keeping the same API surface in `AudioManager.js`.

### Suggested legal-safe sources
- Self-composed loops
- CC0 music libraries
- Original commissioned stems
- Freesound content only after verifying exact licensing and attribution requirements
- Kenney-style CC0 packs where applicable

## Practical export targets

- Music: `.ogg` loop files at 128–160 kbps
- SFX: `.ogg` or `.mp3` short assets
- Keep total initial payload small; lazy-load noncritical themes when needed

## Suggested future file map

```text
assets/audio/
├── music/
│   ├── campus-loop.ogg
│   ├── home-loop.ogg
│   ├── drone-loop.ogg
│   ├── clinic-loop.ogg
│   ├── reef-loop.ogg
│   └── finale-loop.ogg
└── sfx/
    ├── click.ogg
    ├── step.ogg
    ├── pickup.ogg
    ├── quest.ogg
    ├── repair.ogg
    ├── fail.ogg
    ├── pet.ogg
    ├── woosh.ogg
    └── alarm.ogg
```

## Accessibility

Maintain:
- global mute
- separate music / SFX sliders
- subtitles / text equivalents for all critical cues
- avoid using audio-only information for objectives
