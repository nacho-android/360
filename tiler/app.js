const VERSION = '2026JAN17_1331';

// Marzipano's preview.jpg is a vertical strip containing 6 cube faces at 256px each.
// The faces are stacked in the order expected by Marzipano's fallback loader.
const PREVIEW_FACE_SIZE = 256;
const PREVIEW_FACE_STRIP_ORDER = ['b', 'd', 'f', 'l', 'r', 'u'];

const faceOrder = [
  { key: 'f', label: 'Front' },
  { key: 'r', label: 'Right' },
  { key: 'b', label: 'Back' },
  { key: 'l', label: 'Left' },
  { key: 'u', label: 'Up' },
  { key: 'd', label: 'Down' }
];

const logEl = () => document.querySelector('#log');

function log(message) {
  const area = logEl();
  area.value += `${message}\n`;
  area.scrollTop = area.scrollHeight;
}

function canvasToBlob(canvas, type = 'image/jpeg', quality = 0.9) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function buildLevels(maxFaceSize, tileSize) {
  const levels = [
    { tileSize: 256, size: 256, fallbackOnly: true }
  ];
  let size = tileSize;
  while (size < maxFaceSize) {
    levels.push({ tileSize, size });
    const next = size * 2;
    if (next > maxFaceSize) break;
    size = next;
  }

  if (!levels.some((level) => level.size === maxFaceSize)) {
    levels.push({ tileSize, size: maxFaceSize });
  }

  return levels;
}

function faceDirection(face, u, v) {
  switch (face) {
    case 'f':
      return [u, v, -1];
    case 'b':
      return [-u, v, 1];
    case 'l':
      return [-1, v, -u];
    case 'r':
      return [1, v, u];
    case 'u':
      return [u, -1, -v];
    case 'd':
      return [u, 1, v];
    default:
      return [u, v, -1];
  }
}

function highestFaceSize(tileSize, targetFaceSize) {
  let size = tileSize;
  while (size * 2 <= targetFaceSize) {
    size *= 2;
  }
  return size;
}

function buildSourceData(image) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { canvas, data, ctx };
}

function sampleEquirectangular(data, lon, lat) {
  const { data: src, width, height } = data;
  let sx = (lon / (2 * Math.PI) + 0.5) * width;
  let sy = (lat / Math.PI + 0.5) * height;

  sx = ((sx % width) + width) % width;
  sy = Math.min(Math.max(sy, 0), height - 1);

  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const x1 = (x0 + 1) % width;
  const y1 = Math.min(y0 + 1, height - 1);

  const dx = sx - x0;
  const dy = sy - y0;

  const idx = (x, y) => (y * width + x) * 4;
  const c00 = idx(x0, y0);
  const c10 = idx(x1, y0);
  const c01 = idx(x0, y1);
  const c11 = idx(x1, y1);

  const result = [0, 0, 0, 0];
  for (let i = 0; i < 4; i++) {
    const top = src[c00 + i] * (1 - dx) + src[c10 + i] * dx;
    const bottom = src[c01 + i] * (1 - dx) + src[c11 + i] * dx;
    result[i] = top * (1 - dy) + bottom * dy;
  }
  return result;
}

function renderFace(data, face, size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, size);
  const dest = imageData.data;

  for (let y = 0; y < size; y++) {
    const v = 2 * ((y + 0.5) / size) - 1;
    for (let x = 0; x < size; x++) {
      const u = 2 * ((x + 0.5) / size) - 1;
      const [vx, vy, vz] = faceDirection(face, u, v);
      const length = Math.sqrt(vx * vx + vy * vy + vz * vz);
      const nx = vx / length;
      const ny = vy / length;
      const nz = vz / length;
      const lon = Math.atan2(nx, -nz);
      const lat = Math.asin(ny);
      const rgba = sampleEquirectangular(data, lon, lat);
      const idx = (y * size + x) * 4;
      dest[idx] = rgba[0];
      dest[idx + 1] = rgba[1];
      dest[idx + 2] = rgba[2];
      dest[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

async function sliceTiles(faceCanvas, levelSize, tileSize, quality, cb) {
  const tilesX = Math.ceil(levelSize / tileSize);
  const tilesY = Math.ceil(levelSize / tileSize);
  const tileCanvas = document.createElement('canvas');
  tileCanvas.width = tileSize;
  tileCanvas.height = tileSize;
  const tileCtx = tileCanvas.getContext('2d');

  for (let y = 0; y < tilesY; y++) {
    for (let x = 0; x < tilesX; x++) {
      tileCtx.clearRect(0, 0, tileSize, tileSize);
      tileCtx.drawImage(
        faceCanvas,
        x * tileSize,
        y * tileSize,
        tileSize,
        tileSize,
        0,
        0,
        tileSize,
        tileSize
      );
      const blob = await canvasToBlob(tileCanvas, 'image/jpeg', quality);
      await cb(x, y, blob);
    }
  }
}

async function generateTiles(image, options) {
  const { tileSize, tileQuality, sceneId, sceneName, tourName, initialView } = options;
  const source = buildSourceData(image);
  const targetFaceSize = Math.round(image.naturalWidth / 4);
  const maxFaceSize = highestFaceSize(tileSize, targetFaceSize);
  const levels = buildLevels(maxFaceSize, tileSize);
  const renderLevels = levels.filter((l) => !l.fallbackOnly);
  const zip = new JSZip();
  const tilesRoot = zip.folder(sceneId);

  log(`Source image: ${image.naturalWidth}x${image.naturalHeight}`);
  log(`Max face size: ${maxFaceSize}`);
  log(`Levels to render: ${renderLevels.map((l) => l.size).join(', ')}`);

  // preview.jpg (Marzipano-compatible)
  // Marzipano uses a 6-face vertical strip (each face is PREVIEW_FACE_SIZE x PREVIEW_FACE_SIZE).
  // This is used as a low-res fallback while higher-resolution tiles load.
  const previewCanvas = document.createElement('canvas');
  previewCanvas.width = PREVIEW_FACE_SIZE;
  previewCanvas.height = PREVIEW_FACE_SIZE * PREVIEW_FACE_STRIP_ORDER.length;
  const previewCtx = previewCanvas.getContext('2d');

  for (let i = 0; i < PREVIEW_FACE_STRIP_ORDER.length; i++) {
    const faceKey = PREVIEW_FACE_STRIP_ORDER[i];
    const faceCanvas = renderFace(source.data, faceKey, PREVIEW_FACE_SIZE);
    previewCtx.drawImage(faceCanvas, 0, i * PREVIEW_FACE_SIZE);
  }

  const previewBlob = await canvasToBlob(previewCanvas, 'image/jpeg', 0.8);
  tilesRoot.file('preview.jpg', previewBlob);

  for (let levelIndex = 0; levelIndex < renderLevels.length; levelIndex++) {
    const level = renderLevels[levelIndex];
    const levelFolder = tilesRoot.folder(String(levelIndex + 1));
    log(`Rendering level ${levelIndex + 1} (size ${level.size})...`);

    for (const face of faceOrder) {
      log(`  Face ${face.label}`);
      const faceCanvas = renderFace(source.data, face.key, level.size);
      const faceFolder = levelFolder.folder(face.key);
      await sliceTiles(faceCanvas, level.size, level.tileSize, tileQuality, async (x, y, blob) => {
        const rowFolder = faceFolder.folder(String(y));
        rowFolder.file(`${x}.jpg`, blob);
      });
    }
  }

  const data = {
    scenes: [
      {
        id: sceneId,
        name: sceneName || sceneId,
        levels,
        faceSize: maxFaceSize,
        initialViewParameters: initialView,
        linkHotspots: [],
        infoHotspots: []
      }
    ],
    name: tourName || 'Generated tour',
    settings: {
      mouseViewMode: 'drag',
      autorotateEnabled: false,
      fullscreenButton: true,
      viewControlButtons: true
    }
  };

  const dataJs = `var APP_DATA = ${JSON.stringify(data, null, 2)};\n`;

  return { zip, dataJs };
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function resetLog() {
  logEl().value = '';
}

function resetOutputs() {
  const tilesLink = document.querySelector('#download-tiles');
  const dataLink = document.querySelector('#download-data');
  const dataOutput = document.querySelector('#datajs-output');

  if (tilesLink) {
    tilesLink.classList.add('hidden');
    tilesLink.removeAttribute('href');
  }

  if (dataLink) {
    dataLink.classList.add('hidden');
    dataLink.removeAttribute('href');
  }

  if (dataOutput) {
    dataOutput.value = '';
  }
}

async function onGenerate(event) {
  event.preventDefault();
  resetLog();
  resetOutputs();
  const fileInput = document.querySelector('#panorama');
  if (!fileInput.files.length) {
    alert('Please choose an equirectangular panorama image.');
    return;
  }
  const file = fileInput.files[0];
  const sceneId = document.querySelector('#scene-id').value || file.name.replace(/\.[^.]+$/, '');
  const sceneName = document.querySelector('#scene-name').value || sceneId;
  const tourName = document.querySelector('#tour-name').value || 'Generated tour';
  const tileSize = parseInt(document.querySelector('#tile-size').value, 10) || 512;
  const tileQualityInput = parseFloat(document.querySelector('#tile-quality').value);
  const tileQuality = Math.min(1, Math.max(0.1, Number.isFinite(tileQualityInput) ? tileQualityInput : 0.85));
  const initialYaw = parseFloat(document.querySelector('#yaw').value) || 0;
  const initialPitch = parseFloat(document.querySelector('#pitch').value) || 0;
  const initialFov = parseFloat(document.querySelector('#fov').value) || 1.3;

  log(`Loading ${file.name}...`);
  const image = await readImageFile(file);
  const { zip, dataJs } = await generateTiles(image, {
    tileSize,
    tileQuality,
    sceneId,
    sceneName,
    tourName,
    initialView: { yaw: initialYaw, pitch: initialPitch, fov: initialFov }
  });

  log('Preparing downloads...');
  const tilesBlob = await zip.generateAsync({ type: 'blob' });
  const tilesLink = document.querySelector('#download-tiles');
  tilesLink.href = URL.createObjectURL(tilesBlob);
  tilesLink.download = `${sceneId}-tiles.zip`;
  tilesLink.classList.remove('hidden');

  const dataLink = document.querySelector('#download-data');
  const dataOutput = document.querySelector('#datajs-output');
  const dataBlob = new Blob([dataJs], { type: 'application/javascript' });
  dataLink.href = URL.createObjectURL(dataBlob);
  dataLink.download = 'data.js';
  dataLink.classList.remove('hidden');
  dataOutput.value = dataJs;

  log('Done.');
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#tiler-form').addEventListener('submit', onGenerate);
  const versionEl = document.querySelector('#version');
  if (versionEl) {
    versionEl.textContent = VERSION;
  }
});
