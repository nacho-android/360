import {
  ROOM_W,
  ROOM_H,
  DIRECTIONS,
  ROOMS,
  HOTSPOTS,
  createInitialState,
  getRoom,
  currentRoomCollectibles,
  currentRoomHotspots,
  nearestHotspot,
  missingFlags,
  flagsSummary,
  collectNearby,
  solveHotspot,
  movePlayer,
  transitionIfNeeded,
  progressPercent,
  inventoryLabels,
  exitRequirementMessage,
} from './game-core.js';

const canvas = document.querySelector('#game');
const stageWrap = document.querySelector('#stageWrap');
const ctx = canvas.getContext('2d');
const hudRoom = document.querySelector('#hudRoom');
const hudInventory = document.querySelector('#hudInventory');
const hudProgress = document.querySelector('#hudProgress');
const hudMessage = document.querySelector('#hudMessage');
const hintPill = document.querySelector('#hintPill');
const modal = document.querySelector('#modal');
const modalTitle = document.querySelector('#modalTitle');
const modalQuestion = document.querySelector('#modalQuestion');
const modalChoices = document.querySelector('#modalChoices');
const modalFeedback = document.querySelector('#modalFeedback');
const modalClose = document.querySelector('#modalClose');
const startOverlay = document.querySelector('#startOverlay');
const startButton = document.querySelector('#startButton');
const muteButton = document.querySelector('#muteButton');
const interactButton = document.querySelector('#interactButton');
const restartButton = document.querySelector('#restartButton');

function isPortraitLayout() {
  return window.matchMedia?.('(orientation: portrait)').matches || window.innerHeight > window.innerWidth;
}

const state = createInitialState();
let manifest = null;
const images = new Map();
const keys = new Set();
const virtualKeys = new Set();
let lastT = 0;
let previousInteract = false;
let frozen = true;
let modalOpen = false;
let messageTimer = 0;
let spriteFlashUntil = 0;
let lastCollectAnimation = [];
let muted = false;
let partyParticles = [];
let partyUntil = 0;
let nextPartyBurst = 0;

const HOME_CAKE_POINT = { x: 646, y: 314 };


function updateViewportHeight() {
  const height = window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight;
  document.documentElement.style.setProperty('--app-height', `${height}px`);
}

function updateStageMetrics() {
  const rect = stageWrap.getBoundingClientRect();
  const root = document.documentElement;
  root.style.setProperty('--stage-left', `${rect.left}px`);
  root.style.setProperty('--stage-top', `${rect.top}px`);
  root.style.setProperty('--stage-right', `${rect.right}px`);
  root.style.setProperty('--stage-bottom', `${rect.bottom}px`);
  root.style.setProperty('--stage-width', `${rect.width}px`);
  root.style.setProperty('--stage-height', `${rect.height}px`);
  root.style.setProperty('--side-left-space', `${Math.max(0, rect.left)}px`);
  root.style.setProperty('--side-right-space', `${Math.max(0, window.innerWidth - rect.right)}px`);
}

const keyMap = new Map([
  ['ArrowUp', 'up'], ['KeyW', 'up'],
  ['ArrowDown', 'down'], ['KeyS', 'down'],
  ['ArrowLeft', 'left'], ['KeyA', 'left'],
  ['ArrowRight', 'right'], ['KeyD', 'right'],
  ['Space', 'interact'], ['Enter', 'interact'], ['KeyE', 'interact'],
]);

function allAssetPaths(manifestObject) {
  const paths = [];
  for (const ref of Object.values(manifestObject.backgrounds)) paths.push(ref);
  for (const ref of Object.values(manifestObject.sprites)) paths.push(ref.file);
  for (const ref of Object.values(manifestObject.props)) paths.push(ref.file);
  return [...new Set(paths)];
}

async function loadImage(path) {
  const img = new Image();
  img.decoding = 'async';
  img.src = path;
  await img.decode();
  return img;
}

async function loadAssets() {
  const response = await fetch('assets/asset-manifest.json', { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Could not load asset manifest: ${response.status}`);
  manifest = await response.json();
  await Promise.all(allAssetPaths(manifest).map(async (path) => {
    images.set(path, await loadImage(path));
  }));
}

function imageForBackground(key) {
  return images.get(manifest.backgrounds[key]);
}

function imageForSprite(key) {
  return images.get(manifest.sprites[key].file);
}

function imageForProp(key) {
  return images.get(manifest.props[key].file);
}

function setupCanvas() {
  const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
  canvas.width = Math.round(ROOM_W * dpr);
  canvas.height = Math.round(ROOM_H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  updateStageMetrics();
}

class MusicEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.step = 0;
    this.interval = null;
    this.enabled = true;
  }

  async start() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.33;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    if (!this.interval) {
      this.interval = window.setInterval(() => this.tick(), 115);
    }
  }

  setMuted(value) {
    this.enabled = !value;
    if (this.master) this.master.gain.setTargetAtTime(value ? 0 : 0.33, this.ctx.currentTime, 0.04);
  }

  note(freq, duration = 0.12, type = 'square', gain = 0.05, when = 0, glideTo = null) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t + duration);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + duration + 0.03);
  }

  noise(duration = 0.05, gain = 0.04, when = 0, lowpass = 9000) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime + when;
    const bufferSize = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.buffer = buffer;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(t);
  }

  kick() {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.15);
    g.gain.setValueAtTime(0.09, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  tick() {
    if (!this.ctx || !this.enabled || document.hidden) return;
    const step = this.step++ % 64;
    const scale = [0, 3, 5, 7, 10, 12, 15, 17];
    const root = [220, 196, 247, 165][Math.floor(step / 16) % 4];
    const arpDegree = scale[(step * 3 + Math.floor(step / 8)) % scale.length];
    const freq = root * Math.pow(2, arpDegree / 12);
    if (step % 2 === 0) this.note(freq, 0.09, 'square', 0.026);
    if (step % 4 === 0) this.note(root / 2, 0.16, 'triangle', 0.045);
    if (step % 8 === 0) this.kick();
    if (step % 8 === 4) this.noise(0.07, 0.035, 0, 2800);
    if (step % 2 === 1) this.noise(0.025, 0.014, 0, 11000);
    if (step % 16 === 12) this.note(root * 2.5, 0.18, 'sawtooth', 0.02, 0.02, root * 3);
  }

  pickup() {
    this.note(659, 0.06, 'square', 0.055, 0);
    this.note(988, 0.09, 'square', 0.045, 0.055);
  }

  door() {
    this.note(196, 0.2, 'triangle', 0.07, 0, 130);
    this.noise(0.18, 0.04, 0, 1800);
  }

  correct() {
    this.note(523, 0.08, 'square', 0.055, 0);
    this.note(659, 0.08, 'square', 0.055, 0.07);
    this.note(784, 0.18, 'square', 0.06, 0.14);
  }

  wrong() {
    this.note(220, 0.16, 'sawtooth', 0.05, 0, 146);
  }

  victory() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => this.note(f, 0.18, i % 2 ? 'square' : 'triangle', 0.06, i * 0.08));
    this.noise(0.35, 0.055, 0.12, 6000);
  }

  firework() {
    this.note(392, 0.06, 'triangle', 0.035, 0);
    this.note(784, 0.08, 'square', 0.04, 0.045);
    this.note(1174, 0.14, 'square', 0.03, 0.08);
    this.noise(0.24, 0.06, 0.06, 7500);
  }
}

const music = new MusicEngine();

function inputState() {
  const pressed = (name) => keys.has(name) || virtualKeys.has(name);
  return {
    up: pressed('up'), down: pressed('down'), left: pressed('left'), right: pressed('right'), interact: pressed('interact'),
  };
}

function showMessage(text, seconds = 4) {
  state.messages.push(text);
  if (state.messages.length > 6) state.messages.shift();
  messageTimer = seconds;
  updateHud();
}

function updateHud() {
  const room = getRoom(state);
  hudRoom.textContent = isPortraitLayout() ? room.title.replace(' · The ', ' · ') : room.title;
  const inv = inventoryLabels(state);
  hudInventory.textContent = inv.length ? inv.join(' · ') : 'Inventory: microscopic optimism';
  hudProgress.style.width = `${progressPercent(state)}%`;
  hudMessage.textContent = state.messages[state.messages.length - 1] || room.intro;
  const spot = nearestHotspot(state);
  if (spot && !modalOpen) {
    hintPill.textContent = `Press E / tap ✦ to use ${spot.label}`;
  } else if (room.id === 'home') {
    hintPill.textContent = 'Victory — Beck made it home for birthday treats!';
  } else {
    hintPill.textContent = room.exitHint;
  }
}

function drawCover(img) {
  const imgRatio = img.width / img.height;
  const canvasRatio = ROOM_W / ROOM_H;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (imgRatio > canvasRatio) {
    sw = img.height * canvasRatio;
    sx = (img.width - sw) / 2;
  } else if (imgRatio < canvasRatio) {
    sh = img.width / canvasRatio;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, ROOM_W, ROOM_H);
}

function drawProp(propName, x, y, height = 44, alpha = 1, pulse = 0) {
  const img = imageForProp(propName);
  if (!img) return;
  const ratio = img.width / img.height;
  const h = height * (1 + pulse * 0.08);
  const w = h * ratio;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, x - w / 2, y - h, w, h);
  ctx.restore();
}

function drawGlow(x, y, radius, color = 'rgba(255, 220, 105, 0.45)') {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'rgba(255, 220, 105, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawLabel(text, x, y) {
  ctx.save();
  ctx.font = '700 13px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const metrics = ctx.measureText(text);
  const pad = 10;
  const w = metrics.width + pad * 2;
  const h = 24;
  ctx.fillStyle = 'rgba(22, 18, 35, 0.78)';
  roundRect(ctx, x - w / 2, y - h / 2, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 225, 130, 0.75)';
  ctx.stroke();
  ctx.fillStyle = '#fff4bd';
  ctx.fillText(text, x, y + 1);
  ctx.restore();
}

function roundRect(context, x, y, w, h, r) {
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + w, y, x + w, y + h, r);
  context.arcTo(x + w, y + h, x, y + h, r);
  context.arcTo(x, y + h, x, y, r);
  context.arcTo(x, y, x + w, y, r);
  context.closePath();
}

function drawCollectibles() {
  const bob = Math.sin(state.time * 4) * 5;
  for (const item of currentRoomCollectibles(state)) {
    drawGlow(item.x, item.y - 22 + bob * 0.2, 34, 'rgba(255, 230, 120, 0.25)');
    drawProp(item.prop, item.x, item.y + bob, item.prop === 'licorice_bowl' ? 50 : 42, 0.96, Math.sin(state.time * 5) * 0.3);
  }
  const now = state.time;
  lastCollectAnimation = lastCollectAnimation.filter((p) => now - p.t < 0.8);
  for (const p of lastCollectAnimation) {
    const age = now - p.t;
    drawGlow(p.x, p.y - 30 - age * 40, 40 * (1 - age / 0.8), 'rgba(255, 255, 200, 0.35)');
    ctx.save();
    ctx.globalAlpha = 1 - age / 0.8;
    drawLabel(`+ ${p.label}`, p.x, p.y - 74 - age * 25);
    ctx.restore();
  }
}

function drawHotspots() {
  const near = nearestHotspot(state);
  for (const spot of currentRoomHotspots(state)) {
    const reqMissing = missingFlags(state, spot.requires);
    const ready = reqMissing.length === 0;
    const d = Math.min(1, Math.max(0, 1 - Math.hypot(state.player.x - spot.x, state.player.y - spot.y) / spot.radius));
    const pulse = 0.5 + Math.sin(state.time * 4) * 0.5;
    drawGlow(spot.x, spot.y - 24, ready ? 48 + pulse * 8 : 34, ready ? 'rgba(180, 255, 170, 0.22)' : 'rgba(255, 160, 120, 0.14)');
    drawProp(spot.prop, spot.x, spot.y + Math.sin(state.time * 3) * 4, spot.prop === 'key_glow' ? 62 : 50, ready ? 0.96 : 0.48, pulse * 0.3);
    if (spot === near) {
      drawLabel(ready ? spot.label : `Need ${flagsSummary(reqMissing)}`, spot.x, spot.y - 82 - d * 5);
    }
  }
}


function shouldFlipSprite(spriteKey) {
  const faceX = state.player.faceX || 1;
  const isLeftFacingArt = /^walk_(se|sw)_/.test(spriteKey);
  const isRightFacingArt = /^walk_(ne|nw)_/.test(spriteKey);
  return (faceX > 0 && isLeftFacingArt) || (faceX < 0 && isRightFacingArt);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function spawnFireworkBurst(x, y, spread = 1) {
  const palette = ['#ffe89c', '#ff7ecb', '#9a7cff', '#7cffbe', '#ffb36b', '#fff5dd'];
  const count = Math.round(22 + Math.random() * 10);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + randomBetween(-0.18, 0.18);
    const speed = randomBetween(70, 165) * spread;
    partyParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: randomBetween(0.65, 1.2),
      age: 0,
      size: randomBetween(2.2, 4.5),
      color: palette[Math.floor(Math.random() * palette.length)],
    });
  }
  music.firework();
}

function triggerHomeCelebration() {
  partyUntil = Math.max(partyUntil, state.time + 4.2);
  nextPartyBurst = Math.min(nextPartyBurst || state.time, state.time);
  spriteFlashUntil = state.time + 1.25;
  spawnFireworkBurst(HOME_CAKE_POINT.x, HOME_CAKE_POINT.y - 80, 0.9);
  spawnFireworkBurst(randomBetween(180, ROOM_W - 180), randomBetween(90, 210), 1.1);
  showMessage('Happy Birthday, Beck! Fireworks, sparkle bursts, and cake-time cheers!', 4.2);
}

function updateCelebration(dt) {
  for (const particle of partyParticles) {
    particle.age += dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= 0.987;
    particle.vy = particle.vy * 0.987 + 26 * dt;
  }
  partyParticles = partyParticles.filter((particle) => particle.age < particle.life);

  if (getRoom(state).id !== 'home' || state.time >= partyUntil) return;
  if (state.time >= nextPartyBurst) {
    if (Math.random() < 0.55) {
      spawnFireworkBurst(randomBetween(160, ROOM_W - 160), randomBetween(80, 210), 1.08);
    } else {
      spawnFireworkBurst(HOME_CAKE_POINT.x + randomBetween(-44, 44), HOME_CAKE_POINT.y - randomBetween(50, 92), 0.82);
    }
    nextPartyBurst = state.time + randomBetween(0.25, 0.42);
  }
}

function drawCelebrationEffects() {
  if (!partyParticles.length) return;
  ctx.save();
  for (const particle of partyParticles) {
    const alpha = Math.max(0, 1 - particle.age / particle.life);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = alpha * 0.28;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  if (state.time < partyUntil) {
    const pulse = 0.78 + Math.sin(state.time * 8) * 0.12;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#fff7d7';
    ctx.font = '900 24px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('HAPPY BIRTHDAY, BECK!', ROOM_W / 2, 64);
  }
  ctx.restore();
}

function selectedSpriteKey() {
  if (state.won && getRoom(state).id === 'home') return 'celebrate';
  if (spriteFlashUntil > state.time) return state.flags.key ? 'key_victory' : 'celebrate';
  const dir = state.player.moving ? state.player.dir : 'idle';
  const frames = DIRECTIONS[dir] || DIRECTIONS.idle;
  if (frames.length === 1) return frames[0];
  const frameIndex = Math.floor(state.time * 8) % frames.length;
  return frames[frameIndex];
}

function drawPlayer() {
  const spriteKey = selectedSpriteKey();
  const img = imageForSprite(spriteKey);
  const p = state.player;
  const shadowScale = 1 + Math.sin(state.time * 4) * 0.02;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y - 6, 26 * shadowScale, 10 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();
  const h = spriteFlashUntil > state.time || state.won ? 118 : 96;
  const w = h * (img.width / img.height);
  const drawX = p.x - w / 2;
  const drawY = p.y - h;
  if (shouldFlipSprite(spriteKey)) {
    ctx.translate(p.x, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, -w / 2, drawY, w, h);
  } else {
    ctx.drawImage(img, drawX, drawY, w, h);
  }
  ctx.restore();
}

function drawRoomTitleCard() {
  if (messageTimer <= 0 || isPortraitLayout()) return;
  ctx.save();
  const alpha = Math.min(0.86, messageTimer / 2);
  ctx.globalAlpha = alpha;
  const text = state.messages[state.messages.length - 1] || '';
  ctx.font = '700 16px "Courier New", monospace';
  const lines = wrapText(text, 68);
  const w = Math.min(860, ROOM_W - 44);
  const h = 34 + lines.length * 20;
  const x = (ROOM_W - w) / 2;
  const y = ROOM_H - h - 18;
  ctx.fillStyle = 'rgba(18, 14, 32, 0.82)';
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 220, 125, 0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff5c4';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  lines.forEach((line, idx) => ctx.fillText(line, ROOM_W / 2, y + 17 + idx * 20));
  ctx.restore();
}

function wrapText(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (attempt.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else current = attempt;
  }
  if (current) lines.push(current);
  return lines.slice(0, 4);
}

function drawVignetteAndScanlines() {
  const grad = ctx.createRadialGradient(ROOM_W / 2, ROOM_H / 2, 140, ROOM_W / 2, ROOM_H / 2, 620);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(5,0,20,0.38)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, ROOM_W, ROOM_H);
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#000';
  for (let y = 0; y < ROOM_H; y += 4) ctx.fillRect(0, y, ROOM_W, 1);
  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, ROOM_W, ROOM_H);
  const room = getRoom(state);
  drawCover(imageForBackground(room.background));
  drawHotspots();
  drawCollectibles();
  drawPlayer();
  drawCelebrationEffects();
  drawRoomTitleCard();
  drawVignetteAndScanlines();
}

function tryInteract() {
  if (modalOpen) return;
  if (getRoom(state).id === 'home' && state.won) {
    triggerHomeCelebration();
    return;
  }
  const spot = nearestHotspot(state);
  if (!spot) {
    showMessage(getRoom(state).prompt, 2.8);
    music.wrong();
    return;
  }
  const missing = missingFlags(state, spot.requires);
  if (missing.length) {
    showMessage(`Not yet: ${flagsSummary(missing)} required.`, 3.4);
    music.wrong();
    return;
  }
  openQuiz(spot);
}

function openQuiz(spot) {
  modalOpen = true;
  modal.classList.remove('hidden');
  modalTitle.textContent = spot.label;
  modalQuestion.textContent = spot.quiz.question;
  modalFeedback.textContent = '';
  modalChoices.innerHTML = '';
  spot.quiz.choices.forEach((choice, index) => {
    const button = document.createElement('button');
    button.className = 'choiceButton';
    button.type = 'button';
    button.textContent = choice;
    button.addEventListener('click', () => {
      if (index === spot.quiz.answer) {
        const result = solveHotspot(state, spot.id);
        music.correct();
        if (spot.id === 'final_protocol') music.victory();
        spriteFlashUntil = state.time + 1.5;
        modalFeedback.textContent = result.message;
        modalFeedback.className = 'modalFeedback good';
        for (const child of modalChoices.children) child.disabled = true;
        showMessage(result.message, 5);
        if (spot.id === 'final_protocol') {
          setTimeout(() => {
            closeQuiz();
            showMessage('Walk through the right exit to get home!', 5);
          }, 1000);
        } else {
          setTimeout(closeQuiz, 900);
        }
      } else {
        music.wrong();
        modalFeedback.textContent = spot.quiz.failure;
        modalFeedback.className = 'modalFeedback bad';
      }
    });
    modalChoices.appendChild(button);
  });
}

function closeQuiz() {
  modalOpen = false;
  modal.classList.add('hidden');
  modalChoices.innerHTML = '';
  modalFeedback.textContent = '';
  updateHud();
}

function update(dt) {
  if (frozen || modalOpen) return;
  state.time += dt;
  messageTimer = Math.max(0, messageTimer - dt);
  movePlayer(state, inputState(), dt);
  updateCelebration(dt);
  const found = collectNearby(state);
  if (found.length) {
    found.forEach((item) => {
      music.pickup();
      lastCollectAnimation.push({ x: item.x, y: item.y, label: item.label, t: state.time });
      showMessage(`Collected ${item.label}.`, 2.8);
    });
  }
  const transition = transitionIfNeeded(state);
  if (transition) {
    if (transition.type === 'room') {
      music.door();
      showMessage(transition.message, 4.6);
      spriteFlashUntil = state.time + 0.35;
      if (getRoom(state).id === 'home') {
        music.victory();
        triggerHomeCelebration();
      }
    } else if (transition.type === 'blocked') {
      showMessage(transition.message || exitRequirementMessage(state), 3.4);
      music.wrong();
    }
  }
  updateHud();
}

function loop(t) {
  const dt = Math.min(0.05, Math.max(0, (t - lastT) / 1000 || 0));
  lastT = t;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

function bindInput() {
  window.addEventListener('keydown', (event) => {
    const mapped = keyMap.get(event.code);
    if (!mapped) return;
    keys.add(mapped);
    if (mapped === 'interact') event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    const mapped = keyMap.get(event.code);
    if (!mapped) return;
    keys.delete(mapped);
  });

  const buttons = document.querySelectorAll('[data-key]');
  buttons.forEach((button) => {
    const key = button.dataset.key;
    const down = (event) => {
      event.preventDefault();
      virtualKeys.add(key);
      button.classList.add('pressed');
    };
    const up = (event) => {
      event.preventDefault();
      virtualKeys.delete(key);
      button.classList.remove('pressed');
    };
    button.addEventListener('pointerdown', down);
    button.addEventListener('pointerup', up);
    button.addEventListener('pointercancel', up);
    button.addEventListener('pointerleave', up);
  });

  modalClose.addEventListener('click', closeQuiz);
  restartButton.addEventListener('click', () => window.location.reload());
  muteButton.addEventListener('click', () => {
    muted = !muted;
    music.setMuted(muted);
    muteButton.textContent = muted ? '🔇 Music Off' : '🔊 Music On';
  });
}

function pollEdgeInput() {
  const now = inputState().interact;
  if (now && !previousInteract) tryInteract();
  previousInteract = now;
  requestAnimationFrame(pollEdgeInput);
}

async function boot() {
  updateViewportHeight();
  setupCanvas();
  window.addEventListener('resize', () => {
    updateViewportHeight();
    setupCanvas();
  });
  window.visualViewport?.addEventListener('resize', () => {
    updateViewportHeight();
    setupCanvas();
  });
  window.visualViewport?.addEventListener('scroll', () => {
    updateViewportHeight();
    updateStageMetrics();
  });
  bindInput();
  try {
    await loadAssets();
    updateHud();
    render();
    startButton.disabled = false;
    startButton.textContent = 'Start Beck’s Micro-Adventure';
  } catch (error) {
    startButton.textContent = 'Asset load failed';
    hudMessage.textContent = error.message;
    console.error(error);
  }
  startButton.addEventListener('click', async () => {
    await music.start();
    startOverlay.classList.add('hidden');
    frozen = false;
    messageTimer = 5;
    showMessage(getRoom(state).intro, 5);
  });
  requestAnimationFrame(loop);
  requestAnimationFrame(pollEdgeInput);
}

boot();
