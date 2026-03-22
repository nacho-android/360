import { SaveManager } from '../managers/SaveManager.js';
import { InputManager } from '../managers/InputManager.js';
import { AudioManager } from '../managers/AudioManager.js';
import { UIManager } from '../managers/UIManager.js';
import { QuestManager } from '../managers/QuestManager.js';
import { WorldScene } from '../scenes/WorldScene.js';
import { MiniGameManager } from '../systems/MiniGameManager.js';
import { createDefaultState } from '../data/gameData.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.saveManager = new SaveManager();
    this.state = this.saveManager.load();
    this.input = new InputManager();
    this.audio = new AudioManager(this.state.settings);
    this.ui = new UIManager(this);
    this.quests = new QuestManager(this);
    this.minigames = new MiniGameManager(this);
    this.world = new WorldScene(this);
    this.lastFrame = performance.now();
    this.paused = false;
    this.mode = 'menu';
    this.accumulator = 0;
    this.autosaveCooldown = 0;
    this.boundLoop = (time) => this.loop(time);

    this.wireMenus();
    this.resize();
    this.ui.applyAccessibility(this.state.settings);
    this.ui.setContinueVisible(this.saveManager.hasSave() && this.state.hasStarted);
    this.ui.setMainMenuVisible(true);
    this.ui.hideLoading();
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.mode === 'game') this.togglePause(true);
    });
    requestAnimationFrame(this.boundLoop);
  }

  wireMenus() {
    const byId = (id) => document.getElementById(id);
    byId('newGameBtn').addEventListener('click', () => this.startNewGame());
    byId('continueBtn').addEventListener('click', () => this.continueGame());
    byId('mainSettingsBtn').addEventListener('click', () => this.openSettings());
    byId('mainCreditsBtn').addEventListener('click', () => this.openCredits());
    byId('pauseResumeBtn').addEventListener('click', () => this.togglePause(false));
    byId('pauseSettingsBtn').addEventListener('click', () => this.openSettings());
    byId('pauseMainMenuBtn').addEventListener('click', () => this.returnToMenu());
    byId('closeSettingsBtn').addEventListener('click', () => this.closeOverlays());
    byId('closeCreditsBtn').addEventListener('click', () => this.closeOverlays());
    byId('endingContinueBtn').addEventListener('click', () => {
      this.ui.setEndingVisible(false);
      this.mode = 'game';
    });
    byId('resetSaveBtn').addEventListener('click', () => {
      this.saveManager.wipe();
      this.state = createDefaultState();
      window.location.reload();
    });

    const bindCheckbox = (id, key) => {
      byId(id).addEventListener('change', (event) => {
        this.state.settings[key] = event.target.checked;
        this.onSettingsChanged();
      });
    };

    bindCheckbox('muteToggle', 'mute');
    bindCheckbox('subtitlesToggle', 'subtitles');
    bindCheckbox('largeTextToggle', 'largeText');
    bindCheckbox('contrastToggle', 'highContrast');
    bindCheckbox('motionToggle', 'reducedMotion');

    byId('musicSlider').addEventListener('input', (event) => {
      this.state.settings.music = Number(event.target.value);
      this.onSettingsChanged();
    });
    byId('sfxSlider').addEventListener('input', (event) => {
      this.state.settings.sfx = Number(event.target.value);
      this.onSettingsChanged();
    });
  }

  onSettingsChanged() {
    this.audio.applySettings(this.state.settings);
    this.ui.applyAccessibility(this.state.settings);
    this.save(true);
  }

  resize() {
    const ratio = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    const width = Math.max(960, Math.floor(1280 * ratio));
    const height = Math.max(540, Math.floor(720 * ratio));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.viewport = { width, height };
  }

  startNewGame() {
    this.state = createDefaultState();
    this.state.hasStarted = true;
    this.audio.applySettings(this.state.settings);
    this.quests = new QuestManager(this);
    this.minigames = new MiniGameManager(this);
    this.world = new WorldScene(this);
    this.ui.applyAccessibility(this.state.settings);
    this.mode = 'game';
    this.paused = false;
    this.ui.setMainMenuVisible(false);
    this.ui.setPauseVisible(false);
    this.ui.setSettingsVisible(false);
    this.ui.setCreditsVisible(false);
    this.ui.showChapter('Day 1 — Coffee Has Momentum', 'Welcome to Alan’s exceptionally normal morning.');
    this.audio.unlock();
    this.save(true);
  }

  continueGame() {
    if (!this.state.hasStarted) return;
    this.mode = 'game';
    this.paused = false;
    this.ui.setMainMenuVisible(false);
    this.ui.setPauseVisible(false);
    this.ui.setSettingsVisible(false);
    this.ui.setCreditsVisible(false);
    this.audio.unlock();
  }

  returnToMenu() {
    this.mode = 'menu';
    this.paused = false;
    this.ui.setPauseVisible(false);
    this.ui.setSettingsVisible(false);
    this.ui.setCreditsVisible(false);
    this.ui.setMainMenuVisible(true);
    this.save(true);
  }

  openSettings() {
    this.ui.setSettingsVisible(true);
    this.ui.syncSettingsControls(this.state.settings);
  }

  openCredits() {
    this.ui.setCreditsVisible(true);
  }

  closeOverlays() {
    this.ui.setSettingsVisible(false);
    this.ui.setCreditsVisible(false);
  }

  togglePause(forceValue = null) {
    const next = forceValue === null ? !this.paused : forceValue;
    this.paused = next;
    this.mode = next ? 'pause' : 'game';
    this.ui.setPauseVisible(next);
    if (next) this.save(true);
  }

  unlockAchievement(name) {
    if (this.state.achievements.includes(name)) return;
    this.state.achievements.push(name);
    this.ui.showToast(`Achievement unlocked: ${name}`, 3.2);
    this.audio.playSfx('quest');
    this.save(true);
  }

  showEnding() {
    this.mode = 'ending';
    this.ui.setEndingVisible(true, 'The backup grid holds, the sheep accept the compromise, Batty approves exactly nothing out loud, and the campus settles into a victorious exhale. Alan gets home late, tired, and smiling. Bluey blinks like the universe signed off on the whole affair.');
    this.save(true);
  }

  save(force = false) {
    this.state.hasStarted = true;
    this.state.progress.checkpoint = { map: this.world.currentMapKey, x: this.state.player.x, y: this.state.player.y };
    this.saveManager.save(this.state, force);
  }

  update(dt) {
    this.input.update();

    if (this.input.anyInteraction) this.audio.unlock();
    if (this.input.consumePause()) {
      if (this.mode === 'game') this.togglePause(true);
      else if (this.mode === 'pause') this.togglePause(false);
    }

    if (this.mode === 'game') {
      this.state.stats.playSeconds += dt;
      if (this.minigames.isActive()) {
        this.minigames.update(dt);
      } else if (this.ui.activeDialogue) {
        if (this.input.consumeAction()) this.ui.advanceDialogue();
      } else if (this.ui.el.choicePanel.classList.contains('visible')) {
        // Choices are DOM-driven; freeze world input while they are visible.
      } else {
        this.world.update(dt);
      }
      this.ui.update(dt);
      this.ui.updateHUD(this.world.getHUDSnapshot());
      this.autosaveCooldown += dt;
      if (this.autosaveCooldown > 9) {
        this.autosaveCooldown = 0;
        this.save();
      }
    }

    if (this.mode === 'menu' || this.mode === 'pause' || this.mode === 'ending') {
      this.ui.update(dt);
    }
  }

  render() {
    this.world.render(this.ctx, this.viewport.width, this.viewport.height);
    if (this.minigames.isActive()) this.minigames.render(this.ctx, this.viewport.width, this.viewport.height);
  }

  loop(time) {
    const dt = Math.min(0.033, (time - this.lastFrame) / 1000);
    this.lastFrame = time;
    if (this.mode !== 'menu' || this.state.hasStarted) {
      this.update(dt);
      this.render();
    } else {
      this.world.render(this.ctx, this.viewport.width, this.viewport.height);
    }
    requestAnimationFrame(this.boundLoop);
  }
}
