import { clamp, distance } from '../utils/helpers.js';

export class Player {
  constructor(game) {
    this.game = game;
    this.radius = 0.34;
    this.bob = 0;
    this.lastStepAt = 0;
  }

  get state() {
    return this.game.state.player;
  }

  setPosition(x, y) {
    this.state.x = x;
    this.state.y = y;
  }

  update(dt, world) {
    const input = this.game.input;
    const move = input.move;
    const moving = Math.hypot(move.x, move.y) > 0.08;
    const sprinting = input.isSprinting() && this.state.energy > 0.5;
    const speedMultiplier = sprinting ? this.state.sprintMultiplier : 1;
    const effectiveSpeed = this.state.moveSpeed * speedMultiplier * (this.game.state.progress.hardMode ? 1.06 : 1);
    const dx = move.x * effectiveSpeed * dt;
    const dy = move.y * effectiveSpeed * dt;

    if (moving) {
      this.moveAndCollide(world, this.state.x + dx, this.state.y);
      this.moveAndCollide(world, this.state.x, this.state.y + dy);
      this.bob += dt * 8;
      this.lastStepAt += dt;
      if (this.lastStepAt > 0.34 / speedMultiplier) {
        this.lastStepAt = 0;
        this.game.audio.playSfx('step');
      }
      if (sprinting) {
        this.state.energy = clamp(this.state.energy - dt * 16, 0, this.state.maxEnergy);
      } else {
        const recover = this.game.state.upgrades.snackPouch ? 8.5 : 6.5;
        this.state.energy = clamp(this.state.energy + dt * recover, 0, this.state.maxEnergy);
      }
    } else {
      this.bob += dt * 2;
      const recover = this.game.state.upgrades.snackPouch ? 10 : 7;
      this.state.energy = clamp(this.state.energy + dt * recover, 0, this.state.maxEnergy);
    }
  }

  moveAndCollide(world, newX, newY) {
    if (!world.isBlocked(newX, newY, this.radius)) {
      this.state.x = newX;
      this.state.y = newY;
    }
  }
}

export class NPCActor {
  constructor(def) {
    this.def = def;
    this.bobSeed = Math.random() * Math.PI * 2;
  }

  get x() { return this.def.x; }
  get y() { return this.def.y; }

  isNear(px, py, radius = 0.95) {
    return distance(this.def.x, this.def.y, px, py) <= radius;
  }
}
