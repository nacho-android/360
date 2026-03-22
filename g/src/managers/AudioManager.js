const NOTE_FREQUENCIES = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  G3: 196.0,
  A3: 220.0,
  B3: 246.94,
};

const THEMES = {
  campus: ['C4', 'E4', 'G4', 'E4', 'D4', 'G4', 'E4', 'C4'],
  home: ['C4', 'G3', 'A3', 'C4', 'E4', 'C4', 'A3', 'G3'],
  drone: ['E4', 'G4', 'B4', 'D5', 'B4', 'G4', 'E4', 'A4'],
  clinic: ['D4', 'F4', 'A4', 'C5', 'A4', 'F4', 'E4', 'D4'],
  reef: ['C4', 'D4', 'G4', 'A4', 'G4', 'D4', 'C4', 'E4'],
  finale: ['A3', 'C4', 'E4', 'A4', 'G4', 'E4', 'D4', 'C4'],
};

export class AudioManager {
  constructor(settings) {
    this.settings = settings;
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicStep = 0;
    this.musicInterval = null;
    this.theme = 'campus';
    this.unlocked = false;
  }

  async unlock() {
    if (this.unlocked || this.settings.mute) return;
    try {
      this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
      await this.ctx.resume();
      if (!this.master) {
        this.master = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.musicGain.connect(this.master);
        this.sfxGain.connect(this.master);
        this.master.connect(this.ctx.destination);
      }
      this.applySettings(this.settings);
      this.startMusicLoop();
      this.unlocked = true;
    } catch (error) {
      console.warn('Audio unavailable; continuing silently.', error);
    }
  }

  applySettings(settings) {
    this.settings = settings;
    if (!this.master) return;
    const muted = settings.mute ? 0 : 1;
    this.master.gain.value = muted;
    this.musicGain.gain.value = settings.music;
    this.sfxGain.gain.value = settings.sfx;
  }

  setTheme(theme) {
    this.theme = theme in THEMES ? theme : 'campus';
  }

  startMusicLoop() {
    if (this.musicInterval || !this.ctx || this.settings.mute) return;
    this.musicInterval = setInterval(() => {
      this.playThemeStep();
    }, 460);
  }

  stopMusicLoop() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  playThemeStep() {
    if (!this.ctx || this.settings.mute) return;
    const sequence = THEMES[this.theme] || THEMES.campus;
    const note = sequence[this.musicStep % sequence.length];
    this.musicStep += 1;
    const frequency = NOTE_FREQUENCIES[note];
    if (!frequency) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = this.theme === 'reef' ? 'sine' : this.theme === 'finale' ? 'triangle' : 'triangle';
    osc.frequency.setValueAtTime(frequency, now);
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
    osc.connect(env);
    env.connect(this.musicGain);
    osc.start(now);
    osc.stop(now + 0.38);

    if (this.theme === 'home' || this.theme === 'reef') {
      const osc2 = this.ctx.createOscillator();
      const env2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(frequency / 2, now);
      env2.gain.setValueAtTime(0.0001, now);
      env2.gain.exponentialRampToValueAtTime(0.08, now + 0.03);
      env2.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc2.connect(env2);
      env2.connect(this.musicGain);
      osc2.start(now);
      osc2.stop(now + 0.4);
    }
  }

  playSfx(name) {
    if (!this.ctx || this.settings.mute) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    const presets = {
      click: { type: 'square', from: 760, to: 480, dur: 0.08, gain: 0.08 },
      step: { type: 'triangle', from: 180, to: 110, dur: 0.05, gain: 0.03 },
      pickup: { type: 'sine', from: 440, to: 760, dur: 0.15, gain: 0.08 },
      quest: { type: 'triangle', from: 320, to: 880, dur: 0.2, gain: 0.12 },
      repair: { type: 'square', from: 620, to: 520, dur: 0.12, gain: 0.06 },
      fail: { type: 'sawtooth', from: 220, to: 140, dur: 0.24, gain: 0.08 },
      pet: { type: 'sine', from: 520, to: 620, dur: 0.18, gain: 0.07 },
      woosh: { type: 'triangle', from: 180, to: 520, dur: 0.15, gain: 0.05 },
      alarm: { type: 'square', from: 720, to: 500, dur: 0.18, gain: 0.06 },
    };

    const preset = presets[name] || presets.click;
    osc.type = preset.type;
    osc.frequency.setValueAtTime(preset.from, now);
    osc.frequency.exponentialRampToValueAtTime(preset.to, now + preset.dur);
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(preset.gain, now + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, now + preset.dur);
    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + preset.dur + 0.03);
  }
}
