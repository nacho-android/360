import { clamp } from '../utils/helpers.js';

export class InputManager {
  constructor() {
    this.move = { x: 0, y: 0 };
    this.keys = new Set();
    this.actionPressed = false;
    this.secondaryPressed = false;
    this.pausePressed = false;
    this.anyInteraction = false;
    this.joystickVector = { x: 0, y: 0 };
    this.pointerActive = false;
    this.center = { x: 0, y: 0 };
    this.radius = 42;

    this.dom = {
      base: document.getElementById('joystickBase'),
      knob: document.getElementById('joystickKnob'),
      action: document.getElementById('actionBtn'),
      secondary: document.getElementById('secondaryBtn'),
      pause: document.getElementById('pauseBtn'),
      fullscreen: document.getElementById('fullscreenBtn'),
    };

    this.bindKeyboard();
    this.bindTouch();
  }

  bindKeyboard() {
    window.addEventListener('keydown', (event) => {
      this.anyInteraction = true;
      this.keys.add(event.key.toLowerCase());
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        this.actionPressed = true;
      }
      if (event.key.toLowerCase() === 'e') this.secondaryPressed = true;
      if (event.key === 'Escape' || event.key.toLowerCase() === 'p') this.pausePressed = true;
    });

    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.key.toLowerCase());
    });
  }

  bindTouch() {
    const base = this.dom.base;
    const knob = this.dom.knob;
    const updateFromEvent = (event) => {
      const rect = base.getBoundingClientRect();
      this.center.x = rect.left + rect.width / 2;
      this.center.y = rect.top + rect.height / 2;
      const touch = event.touches?.[0] || event.changedTouches?.[0];
      if (!touch) return;
      const dx = touch.clientX - this.center.x;
      const dy = touch.clientY - this.center.y;
      const len = Math.hypot(dx, dy) || 1;
      const capped = Math.min(len, this.radius);
      const nx = dx / len;
      const ny = dy / len;
      this.joystickVector.x = clamp((nx * capped) / this.radius, -1, 1);
      this.joystickVector.y = clamp((ny * capped) / this.radius, -1, 1);
      knob.style.transform = `translate(${this.joystickVector.x * 34}px, ${this.joystickVector.y * 34}px)`;
    };

    base.addEventListener('touchstart', (event) => {
      this.anyInteraction = true;
      this.pointerActive = true;
      updateFromEvent(event);
    }, { passive: true });

    base.addEventListener('touchmove', (event) => {
      updateFromEvent(event);
    }, { passive: true });

    const releaseJoystick = () => {
      this.pointerActive = false;
      this.joystickVector.x = 0;
      this.joystickVector.y = 0;
      knob.style.transform = 'translate(0px, 0px)';
    };

    base.addEventListener('touchend', releaseJoystick, { passive: true });
    base.addEventListener('touchcancel', releaseJoystick, { passive: true });

    const bindLatchedButton = (element, field) => {
      const press = (event) => {
        event.preventDefault();
        this.anyInteraction = true;
        this[field] = true;
        element.classList.add('pressed');
      };
      const release = () => {
        element.classList.remove('pressed');
      };
      element.addEventListener('touchstart', press, { passive: false });
      element.addEventListener('mousedown', press);
      window.addEventListener('mouseup', release);
      window.addEventListener('touchend', release, { passive: true });
    };

    const bindHoldButton = (element, field) => {
      const press = (event) => {
        event.preventDefault();
        this.anyInteraction = true;
        this[field] = true;
        element.classList.add('pressed');
      };
      const release = () => {
        this[field] = false;
        element.classList.remove('pressed');
      };
      element.addEventListener('touchstart', press, { passive: false });
      element.addEventListener('mousedown', press);
      window.addEventListener('mouseup', release);
      window.addEventListener('touchend', release, { passive: true });
      window.addEventListener('touchcancel', release, { passive: true });
    };

    bindLatchedButton(this.dom.action, 'actionPressed');
    bindHoldButton(this.dom.secondary, 'secondaryPressed');
    bindLatchedButton(this.dom.pause, 'pausePressed');

    this.dom.fullscreen?.addEventListener('click', async () => {
      this.anyInteraction = true;
      const root = document.documentElement;
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (root.requestFullscreen) {
        await root.requestFullscreen();
      }
    });
  }

  update() {
    const keyboardX = (this.keys.has('d') || this.keys.has('arrowright') ? 1 : 0)
      - (this.keys.has('a') || this.keys.has('arrowleft') ? 1 : 0);
    const keyboardY = (this.keys.has('s') || this.keys.has('arrowdown') ? 1 : 0)
      - (this.keys.has('w') || this.keys.has('arrowup') ? 1 : 0);

    const sourceX = Math.abs(this.joystickVector.x) > 0.08 ? this.joystickVector.x : keyboardX;
    const sourceY = Math.abs(this.joystickVector.y) > 0.08 ? this.joystickVector.y : keyboardY;
    const length = Math.hypot(sourceX, sourceY) || 1;

    this.move.x = clamp(sourceX / length, -1, 1) * Math.min(1, Math.hypot(sourceX, sourceY));
    this.move.y = clamp(sourceY / length, -1, 1) * Math.min(1, Math.hypot(sourceX, sourceY));
  }

  consumeAction() {
    const value = this.actionPressed;
    this.actionPressed = false;
    return value;
  }

  consumeSecondary() {
    const value = this.secondaryPressed;
    this.secondaryPressed = false;
    return value;
  }

  consumePause() {
    const value = this.pausePressed;
    this.pausePressed = false;
    return value;
  }

  isSprinting() {
    return this.keys.has('shift') || this.keys.has('shiftleft') || this.keys.has('shiftright') || this.secondaryPressed;
  }
}
