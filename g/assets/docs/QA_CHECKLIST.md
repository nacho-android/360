# QA Checklist

## Functional gameplay
- [ ] New Game starts cleanly from menu
- [ ] Continue works when save exists
- [ ] Pause / resume works during exploration
- [ ] Dialogues advance correctly
- [ ] Choice panel applies Noah buff correctly
- [ ] Each quest starts, advances, and completes as intended
- [ ] Ending triggers after finale repair
- [ ] Postgame free roam works

## Save / load
- [ ] Autosave triggers during active play
- [ ] Hard refresh restores correct map, player position, upgrades, quest states, collectibles, settings
- [ ] Reset Save clears progress safely
- [ ] Save survives browser close / reopen

## Touch controls
- [ ] Joystick updates movement smoothly
- [ ] Action button triggers interaction reliably
- [ ] Sprint only applies while button is held
- [ ] Pause button is responsive
- [ ] Touch targets remain comfortable on small screens

## Keyboard fallback
- [ ] WASD and arrows move correctly
- [ ] Space / Enter interact correctly
- [ ] Shift sprints
- [ ] Esc / P pauses

## Minigames
- [ ] Repair minigame can be completed and failed cleanly
- [ ] Drone minigame rings register properly
- [ ] Dash minigame checkpoints register properly
- [ ] Failing a minigame returns player safely to world state

## Performance
- [ ] Runs at stable framerate on mid-range Android browser
- [ ] Runs acceptably on iPhone Safari
- [ ] No major battery spikes during 10-minute play session
- [ ] Resize / orientation changes do not break layout

## Visual / UX
- [ ] HUD remains readable on small screens
- [ ] Contrast is sufficient in normal and high-contrast modes
- [ ] Landscape feels best while portrait remains usable
- [ ] No overlapping critical UI with safe-area insets
- [ ] Objective guidance always points somewhere meaningful

## Audio
- [ ] Game remains functional if AudioContext fails or user never unlocks audio
- [ ] Mute toggle works
- [ ] Music and SFX sliders change levels
- [ ] Audio does not continue unexpectedly after mute

## Balance
- [ ] Early chapter is forgiving
- [ ] Energy recovery feels fair
- [ ] Objective chain is understandable without confusion
- [ ] Finale feels climactic but not punishing

## Risk areas
- touch input edge cases
- browser audio permissions
- older mobile Safari rendering differences
- save schema changes if content expands later
