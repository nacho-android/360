import { clamp, distance, randomRange, secondsToClock } from '../utils/helpers.js';

export class MiniGameManager {
  constructor(game) {
    this.game = game;
    this.current = null;
  }

  isActive() {
    return Boolean(this.current);
  }

  start(type, config = {}) {
    if (type === 'repair' || type === 'pulse') {
      this.current = {
        type,
        label: type === 'pulse' ? 'Pulse Rig Calibration' : 'Imaging Repair',
        hint: type === 'pulse'
          ? 'Tap REPAIR when the pulse cursor lands inside the highlighted beats.'
          : 'Tap REPAIR when the cursor lands inside the repair windows.',
        progress: 0,
        mistakes: 0,
        timer: 16,
        cursor: 0,
        direction: 1,
        targets: [0.17, 0.42, 0.68, 0.86],
        width: type === 'pulse' ? 0.08 : 0.1,
        speed: type === 'pulse' ? 0.75 : 0.95,
        onSuccess: config.onSuccess,
        onFail: config.onFail,
      };
    }

    if (type === 'drone') {
      this.current = {
        type,
        label: 'Rooftop Drone Check',
        hint: 'Guide the drone through 5 rings. Avoid gust clouds. Joystick moves, REPAIR dashes.',
        timer: 30,
        player: { x: 0, y: 0, radius: 16, dash: 0 },
        rings: Array.from({ length: 5 }, (_, index) => ({ x: randomRange(-190, 190), y: randomRange(-100, 110), radius: 22 + index * 1.5, taken: false })),
        gusts: Array.from({ length: 4 }, () => ({ x: randomRange(-180, 190), y: randomRange(-100, 110), radius: 18, vx: randomRange(-20, 20), vy: randomRange(-18, 18) })),
        onSuccess: config.onSuccess,
        onFail: config.onFail,
      };
    }

    if (type === 'dash') {
      this.current = {
        type,
        label: 'Coffee Cart Chaos Control',
        hint: 'Push the cart to three checkpoints without hitting rogue spill blobs.',
        timer: 28,
        player: { x: -180, y: 0, radius: 18 },
        checkpoints: [
          { x: -60, y: -80, hit: false },
          { x: 40, y: 70, hit: false },
          { x: 170, y: 0, hit: false },
        ],
        hazards: Array.from({ length: 5 }, (_, index) => ({
          x: randomRange(-160, 160),
          y: randomRange(-100, 100),
          radius: 20,
          vx: index % 2 === 0 ? randomRange(45, 80) : randomRange(-80, -45),
          vy: randomRange(-60, 60),
        })),
        hits: 0,
        onSuccess: config.onSuccess,
        onFail: config.onFail,
      };
    }

    this.game.ui.setMinigameHint(this.current.hint, true);
    this.game.audio.playSfx('woosh');
  }

  cancel() {
    this.current = null;
    this.game.ui.setMinigameHint('', false);
  }

  success() {
    const callback = this.current?.onSuccess;
    this.game.audio.playSfx('quest');
    this.cancel();
    if (callback) callback();
  }

  fail() {
    const callback = this.current?.onFail;
    this.game.audio.playSfx('fail');
    this.cancel();
    if (callback) callback();
  }

  update(dt) {
    if (!this.current) return;

    if (this.current.type === 'repair' || this.current.type === 'pulse') {
      this.current.timer -= dt;
      this.current.cursor += this.current.direction * this.current.speed * dt;
      if (this.current.cursor >= 1) {
        this.current.cursor = 1;
        this.current.direction = -1;
      }
      if (this.current.cursor <= 0) {
        this.current.cursor = 0;
        this.current.direction = 1;
      }
      if (this.game.input.consumeAction()) {
        const target = this.current.targets[this.current.progress];
        if (Math.abs(this.current.cursor - target) <= this.current.width) {
          this.current.progress += 1;
          this.game.audio.playSfx('repair');
          if (this.current.progress >= this.current.targets.length) {
            this.game.state.stats.perfectRepairs += 1;
            this.success();
            return;
          }
        } else {
          this.current.mistakes += 1;
          this.current.timer -= 1.2;
          this.game.audio.playSfx('fail');
        }
      }
      if (this.current.timer <= 0) this.fail();
    }

    if (this.current.type === 'drone') {
      this.current.timer -= dt;
      const move = this.game.input.move;
      const dash = this.game.input.consumeAction();
      const speed = dash ? 180 : 120;
      if (dash) this.game.audio.playSfx('woosh');
      this.current.player.x = clamp(this.current.player.x + move.x * speed * dt, -220, 220);
      this.current.player.y = clamp(this.current.player.y + move.y * speed * dt, -130, 130);
      this.current.gusts.forEach((gust) => {
        gust.x += gust.vx * dt;
        gust.y += gust.vy * dt;
        if (gust.x < -220 || gust.x > 220) gust.vx *= -1;
        if (gust.y < -130 || gust.y > 130) gust.vy *= -1;
        if (distance(gust.x, gust.y, this.current.player.x, this.current.player.y) < gust.radius + this.current.player.radius) {
          this.current.timer -= 0.5;
          this.current.player.x -= gust.vx * dt * 0.6;
          this.current.player.y -= gust.vy * dt * 0.6;
        }
      });
      this.current.rings.forEach((ring) => {
        if (!ring.taken && distance(ring.x, ring.y, this.current.player.x, this.current.player.y) < ring.radius + 4) {
          ring.taken = true;
          this.game.audio.playSfx('pickup');
        }
      });
      if (this.current.rings.every((ring) => ring.taken)) {
        this.success();
        return;
      }
      if (this.current.timer <= 0) this.fail();
    }

    if (this.current.type === 'dash') {
      this.current.timer -= dt;
      const move = this.game.input.move;
      this.current.player.x = clamp(this.current.player.x + move.x * 130 * dt, -220, 220);
      this.current.player.y = clamp(this.current.player.y + move.y * 130 * dt, -130, 130);
      this.current.hazards.forEach((hazard) => {
        hazard.x += hazard.vx * dt;
        hazard.y += hazard.vy * dt;
        if (hazard.x < -220 || hazard.x > 220) hazard.vx *= -1;
        if (hazard.y < -130 || hazard.y > 130) hazard.vy *= -1;
        if (distance(hazard.x, hazard.y, this.current.player.x, this.current.player.y) < hazard.radius + this.current.player.radius) {
          this.current.hits += 1;
          this.current.player.x -= hazard.vx * dt * 1.4;
          this.current.player.y -= hazard.vy * dt * 1.4;
          this.current.timer -= 1;
          this.game.audio.playSfx('fail');
        }
      });
      this.current.checkpoints.forEach((node) => {
        if (!node.hit && distance(node.x, node.y, this.current.player.x, this.current.player.y) < 28) {
          node.hit = true;
          this.game.audio.playSfx('pickup');
        }
      });
      if (this.current.checkpoints.every((node) => node.hit)) {
        this.success();
        return;
      }
      if (this.current.timer <= 0) this.fail();
    }

    if (this.game.input.consumeSecondary()) this.fail();
  }

  render(ctx, width, height) {
    if (!this.current) return;
    ctx.save();
    ctx.fillStyle = 'rgba(8, 10, 18, 0.75)';
    ctx.fillRect(0, 0, width, height);

    ctx.translate(width / 2, height / 2);
    ctx.fillStyle = '#f5f7ff';
    ctx.textAlign = 'center';
    ctx.font = '600 24px system-ui';
    ctx.fillText(this.current.label, 0, -170);
    ctx.font = '500 16px system-ui';
    ctx.fillStyle = '#b8c5e6';
    ctx.fillText(secondsToClock(this.current.timer), 0, -145);

    if (this.current.type === 'repair' || this.current.type === 'pulse') {
      ctx.fillStyle = '#16223a';
      ctx.beginPath();
      ctx.roundRect(-180, -20, 360, 40, 20);
      ctx.fill();

      ctx.fillStyle = '#2d4f7b';
      ctx.beginPath();
      ctx.roundRect(-170, -10, 340, 20, 10);
      ctx.fill();

      this.current.targets.forEach((target, index) => {
        const x = -170 + target * 340;
        ctx.fillStyle = index < this.current.progress ? '#79f2a8' : '#ffd77a';
        ctx.beginPath();
        ctx.roundRect(x - this.current.width * 170, -14, this.current.width * 340, 28, 10);
        ctx.fill();
      });

      const cursorX = -170 + this.current.cursor * 340;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cursorX, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#4a7bff';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#cfd8f9';
      ctx.fillText(`Hits: ${this.current.progress} / ${this.current.targets.length}`, 0, 65);
      ctx.fillText(`Mistakes: ${this.current.mistakes}`, 0, 90);
    }

    if (this.current.type === 'drone' || this.current.type === 'dash') {
      ctx.strokeStyle = '#87aef9';
      ctx.lineWidth = 3;
      ctx.strokeRect(-220, -130, 440, 260);
      ctx.fillStyle = 'rgba(30, 44, 68, 0.7)';
      ctx.fillRect(-220, -130, 440, 260);

      if (this.current.type === 'drone') {
        this.current.rings.forEach((ring) => {
          if (ring.taken) return;
          ctx.strokeStyle = '#f1d36a';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
          ctx.stroke();
        });
        this.current.gusts.forEach((gust) => {
          ctx.fillStyle = 'rgba(179, 221, 255, 0.4)';
          ctx.beginPath();
          ctx.arc(gust.x, gust.y, gust.radius, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      if (this.current.type === 'dash') {
        this.current.checkpoints.forEach((node) => {
          ctx.fillStyle = node.hit ? '#7cf5a7' : '#ffe08a';
          ctx.beginPath();
          ctx.arc(node.x, node.y, 18, 0, Math.PI * 2);
          ctx.fill();
        });
        this.current.hazards.forEach((hazard) => {
          ctx.fillStyle = '#6d4125';
          ctx.beginPath();
          ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.beginPath();
          ctx.arc(hazard.x - 6, hazard.y - 6, hazard.radius * 0.45, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.fillStyle = '#cfd8f9';
        ctx.fillText(`Checkpoints: ${this.current.checkpoints.filter((n) => n.hit).length} / 3`, 0, 150);
      }

      ctx.fillStyle = '#9de9ff';
      ctx.beginPath();
      ctx.arc(this.current.player.x, this.current.player.y, this.current.player.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0b1d38';
      ctx.fillRect(this.current.player.x - 3, this.current.player.y - 2, 6, 20);
    }

    ctx.restore();
  }
}
