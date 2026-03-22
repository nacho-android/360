export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const distance = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const isoProject = (x, y, tileW, tileH, offsetX, offsetY) => ({
  x: (x - y) * tileW * 0.5 + offsetX,
  y: (x + y) * tileH * 0.5 + offsetY,
});
export const randomRange = (min, max) => min + Math.random() * (max - min);
export const randomInt = (min, max) => Math.floor(randomRange(min, max + 1));
export const pick = (array) => array[Math.floor(Math.random() * array.length)];
export const deepClone = (value) => JSON.parse(JSON.stringify(value));
export const secondsToClock = (value) => {
  const whole = Math.max(0, Math.ceil(value));
  const minutes = Math.floor(whole / 60);
  const seconds = `${whole % 60}`.padStart(2, '0');
  return `${minutes}:${seconds}`;
};
export const wrapText = (ctx, text, maxWidth) => {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (let i = 0; i < words.length; i += 1) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = words[i];
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
};
export const directionLabel = (dx, dy) => {
  const angle = Math.atan2(dy, dx);
  const dirs = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
  const idx = Math.round(((angle + Math.PI) / (Math.PI * 2)) * 8) % 8;
  return dirs[idx];
};
