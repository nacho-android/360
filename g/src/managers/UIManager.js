export class UIManager {
  constructor(game) {
    this.game = game;
    this.toastTimer = 0;
    this.activeDialogue = null;
    this.activeChoiceCallback = null;

    this.el = {
      root: document.body,
      loading: document.getElementById('loadingScreen'),
      hud: document.getElementById('hud'),
      location: document.getElementById('locationChip'),
      chapter: document.getElementById('chapterChip'),
      quest: document.getElementById('questText'),
      compass: document.getElementById('compassText'),
      energyFill: document.getElementById('energyFill'),
      energyText: document.getElementById('energyText'),
      inventory: document.getElementById('inventoryChips'),
      toast: document.getElementById('toast'),
      dialogue: document.getElementById('dialogueBox'),
      dialogueSpeaker: document.getElementById('dialogueSpeaker'),
      dialogueBody: document.getElementById('dialogueBody'),
      dialogueAdvance: document.getElementById('dialogueAdvance'),
      choicePanel: document.getElementById('choicePanel'),
      pauseMenu: document.getElementById('pauseMenu'),
      mainMenu: document.getElementById('mainMenu'),
      settingsMenu: document.getElementById('settingsMenu'),
      creditsMenu: document.getElementById('creditsMenu'),
      chapterSplash: document.getElementById('chapterSplash'),
      chapterSplashTitle: document.getElementById('chapterSplashTitle'),
      chapterSplashBody: document.getElementById('chapterSplashBody'),
      endingPanel: document.getElementById('endingPanel'),
      endingText: document.getElementById('endingText'),
      minigameHint: document.getElementById('minigameHint'),
      continueButton: document.getElementById('continueBtn'),
      settingsMute: document.getElementById('muteToggle'),
      settingsSubtitles: document.getElementById('subtitlesToggle'),
      settingsLargeText: document.getElementById('largeTextToggle'),
      settingsContrast: document.getElementById('contrastToggle'),
      settingsReducedMotion: document.getElementById('motionToggle'),
      settingsMusic: document.getElementById('musicSlider'),
      settingsSfx: document.getElementById('sfxSlider'),
      achievementList: document.getElementById('achievementList'),
    };

    this.el.dialogueAdvance.addEventListener('click', () => this.advanceDialogue());
  }

  hideLoading() {
    this.el.loading.classList.add('hidden');
  }

  applyAccessibility(settings) {
    this.el.root.classList.toggle('large-text', settings.largeText);
    this.el.root.classList.toggle('high-contrast', settings.highContrast);
    this.el.root.classList.toggle('reduced-motion', settings.reducedMotion);
    this.syncSettingsControls(settings);
  }

  syncSettingsControls(settings) {
    this.el.settingsMute.checked = settings.mute;
    this.el.settingsSubtitles.checked = settings.subtitles;
    this.el.settingsLargeText.checked = settings.largeText;
    this.el.settingsContrast.checked = settings.highContrast;
    this.el.settingsReducedMotion.checked = settings.reducedMotion;
    this.el.settingsMusic.value = settings.music;
    this.el.settingsSfx.value = settings.sfx;
  }

  updateHUD(snapshot) {
    this.el.location.textContent = snapshot.location;
    this.el.chapter.textContent = snapshot.chapter;
    this.el.quest.textContent = snapshot.quest;
    this.el.compass.textContent = snapshot.compass;
    this.el.energyFill.style.width = `${snapshot.energyRatio * 100}%`;
    this.el.energyText.textContent = `${Math.round(snapshot.energy)} / ${Math.round(snapshot.maxEnergy)} energy`;
    this.el.inventory.innerHTML = snapshot.inventory.map((entry) => (
      `<span class="chip">${entry.icon} ${entry.text}</span>`
    )).join('');
    this.el.achievementList.innerHTML = snapshot.achievements.map((name) => `<span class="chip achievement">🏅 ${name}</span>`).join('');
  }

  setPauseVisible(visible) {
    this.el.pauseMenu.classList.toggle('visible', visible);
  }

  setMainMenuVisible(visible) {
    this.el.mainMenu.classList.toggle('visible', visible);
  }

  setSettingsVisible(visible) {
    this.el.settingsMenu.classList.toggle('visible', visible);
  }

  setCreditsVisible(visible) {
    this.el.creditsMenu.classList.toggle('visible', visible);
  }

  setEndingVisible(visible, text = '') {
    this.el.endingPanel.classList.toggle('visible', visible);
    this.el.endingText.textContent = text;
  }

  setContinueVisible(visible) {
    this.el.continueButton.disabled = !visible;
    this.el.continueButton.classList.toggle('faded', !visible);
  }

  showToast(message, seconds = 2.4) {
    this.el.toast.textContent = message;
    this.el.toast.classList.add('visible');
    this.toastTimer = seconds;
  }

  update(dt) {
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.el.toast.classList.remove('visible');
    }
  }

  openDialogue(lines, onComplete = null) {
    this.activeDialogue = { lines, index: 0, onComplete };
    this.el.dialogue.classList.add('visible');
    this.renderDialogueLine();
  }

  renderDialogueLine() {
    if (!this.activeDialogue) return;
    const line = this.activeDialogue.lines[this.activeDialogue.index];
    this.el.dialogueSpeaker.textContent = line.speaker;
    this.el.dialogueBody.textContent = line.text;
    this.el.dialogueAdvance.textContent = this.activeDialogue.index >= this.activeDialogue.lines.length - 1 ? 'Done' : 'Next';
  }

  advanceDialogue() {
    if (!this.activeDialogue) return;
    this.game.audio.playSfx('click');
    if (this.activeDialogue.index < this.activeDialogue.lines.length - 1) {
      this.activeDialogue.index += 1;
      this.renderDialogueLine();
      return;
    }
    const callback = this.activeDialogue.onComplete;
    this.activeDialogue = null;
    this.el.dialogue.classList.remove('visible');
    if (callback) callback();
  }

  showChoices(prompt, choices, callback) {
    this.el.choicePanel.innerHTML = `<div class="choicePrompt">${prompt}</div>`;
    choices.forEach((choice) => {
      const button = document.createElement('button');
      button.className = 'menuButton compact';
      button.textContent = choice.label;
      button.addEventListener('click', () => {
        this.el.choicePanel.classList.remove('visible');
        callback(choice.value);
      });
      this.el.choicePanel.appendChild(button);
    });
    this.el.choicePanel.classList.add('visible');
  }

  showChapter(title, body) {
    this.el.chapterSplashTitle.textContent = title;
    this.el.chapterSplashBody.textContent = body;
    this.el.chapterSplash.classList.add('visible');
    setTimeout(() => this.el.chapterSplash.classList.remove('visible'), 2800);
  }

  setMinigameHint(text = '', visible = false) {
    this.el.minigameHint.textContent = text;
    this.el.minigameHint.classList.toggle('visible', visible);
  }
}
