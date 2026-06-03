import { FFmpeg } from "./vendor/ffmpeg/index.js";
import { fetchFile, toBlobURL } from "./vendor/ffmpeg-util/index.js";

const els = {
  fileInput: document.querySelector("#videoFile"),
  exportBtn: document.querySelector("#exportBtn"),
  dropZone: document.querySelector("#dropZone"),
  emptyState: document.querySelector("#emptyState"),
  stageWrap: document.querySelector("#stageWrap"),
  video: document.querySelector("#video"),
  overlay: document.querySelector("#overlay"),
  cropBox: document.querySelector("#cropBox"),
  shadeTop: document.querySelector("#shadeTop"),
  shadeLeft: document.querySelector("#shadeLeft"),
  shadeRight: document.querySelector("#shadeRight"),
  shadeBottom: document.querySelector("#shadeBottom"),
  inputName: document.querySelector("#inputName"),
  inputSize: document.querySelector("#inputSize"),
  nativeSize: document.querySelector("#nativeSize"),
  duration: document.querySelector("#duration"),
  statusText: document.querySelector("#statusText"),
  progressBar: document.querySelector("#progressBar"),
  errorBox: document.querySelector("#errorBox"),
  outputPanel: document.querySelector("#outputPanel"),
  outputVideo: document.querySelector("#outputVideo"),
  outputSummary: document.querySelector("#outputSummary"),
  outputBytes: document.querySelector("#outputBytes"),
  downloadLink: document.querySelector("#downloadLink"),
  presetSelect: document.querySelector("#presetSelect"),
  cropX: document.querySelector("#cropX"),
  cropY: document.querySelector("#cropY"),
  cropW: document.querySelector("#cropW"),
  cropH: document.querySelector("#cropH"),
  fixedSize: document.querySelector("#fixedSize"),
  lockRatio: document.querySelector("#lockRatio"),
  snapEven: document.querySelector("#snapEven"),
  centerBtn: document.querySelector("#centerBtn"),
  codec: document.querySelector("#codec"),
  crf: document.querySelector("#crf"),
  ffPreset: document.querySelector("#ffPreset"),
  pixFmt: document.querySelector("#pixFmt"),
  downloadName: document.querySelector("#downloadName"),
  stripAudio: document.querySelector("#stripAudio"),
  filterTemplate: document.querySelector("#filterTemplate"),
  commandTemplate: document.querySelector("#commandTemplate"),
  renderedCommand: document.querySelector("#renderedCommand"),
  copyCommand: document.querySelector("#copyCommand"),
  resetCommand: document.querySelector("#resetCommand"),
  coreBaseUrl: document.querySelector("#coreBaseUrl"),
  logBox: document.querySelector("#logBox"),
};

const DEFAULT_COMMAND = 'ffmpeg -hide_banner -y -i {input} -vf "{filter}" -map 0:v:0 {audio} -c:v {codec} -crf {crf} -preset {preset} -pix_fmt {pix_fmt} -movflags +faststart {output}';
const DEFAULT_FILTER = "crop={w}:{h}:{x}:{y},setsar=1";

let file = null;
let videoObjectUrl = "";
let outputObjectUrl = "";
let ffmpeg = null;
let ffmpegLoaded = false;
let working = false;
let dragState = null;

const state = {
  meta: { width: 0, height: 0, duration: 0 },
  rect: { x: 0, y: 0, w: 1000, h: 1000 },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function floorEven(value) {
  return Math.max(0, Math.floor(value / 2) * 2);
}

function fileExtension(name) {
  const match = String(name || "").toLowerCase().match(/\.([a-z0-9]+)$/i);
  return match ? match[1] : "mp4";
}

function safeFileName(name, fallback = "output.mp4") {
  const cleaned = String(name || "")
    .trim()
    .replace(/[^a-z0-9._-]+/gi, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned || fallback;
}

function quoteForDisplay(path) {
  const text = String(path || "");
  if (!text) return '""';
  if (/^[A-Za-z0-9._/:\\-]+$/.test(text)) return text;
  return `"${text.replace(/"/g, '\\"')}"`;
}

function croppedDefaultName(inputName) {
  const original = String(inputName || "video.mp4");
  const dot = original.lastIndexOf(".");
  const base = dot > 0 ? original.slice(0, dot) : original;
  return `${base}_cropped.mp4`;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function setStatus(text) {
  els.statusText.textContent = text;
}

function setProgress(percent) {
  els.progressBar.style.width = `${clamp(percent, 0, 100)}%`;
}

function showError(message) {
  if (!message) {
    els.errorBox.classList.add("hidden");
    els.errorBox.textContent = "";
    return;
  }
  els.errorBox.textContent = message;
  els.errorBox.classList.remove("hidden");
}

function appendLog(line) {
  const current = els.logBox.textContent === "Logs will appear here during export." ? "" : els.logBox.textContent;
  const next = `${current}${current ? "\n" : ""}${line}`.split("\n").slice(-140).join("\n");
  els.logBox.textContent = next;
  els.logBox.scrollTop = els.logBox.scrollHeight;
}

function replaceTemplate(template, values) {
  return String(template).replace(/\{([a-z_]+)\}/gi, (_, key) => String(values[key] ?? ""));
}

function splitCommand(command) {
  const args = [];
  let current = "";
  let quote = null;
  let escaped = false;

  for (const char of String(command).trim()) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (quote) {
      if (char === quote) quote = null;
      else current += char;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (/\s/.test(char)) {
      if (current.length) {
        args.push(current);
        current = "";
      }
      continue;
    }
    current += char;
  }

  if (current.length) args.push(current);
  return args;
}

function normalizeRect(raw) {
  const { width, height } = state.meta;
  const snapEven = els.snapEven.checked;
  const lockSquare = els.lockRatio.checked;
  const widthLimit = Math.max(2, width || 2);
  const heightLimit = Math.max(2, height || 2);

  let w = Math.round(Number(raw.w) || 2);
  let h = Math.round(Number(raw.h) || 2);

  w = Math.max(2, w);
  h = Math.max(2, h);

  if (lockSquare) {
    const size = Math.min(w, h, widthLimit, heightLimit);
    w = size;
    h = size;
  }

  w = clamp(w, 2, widthLimit);
  h = clamp(h, 2, heightLimit);

  let x = Math.round(Number(raw.x) || 0);
  let y = Math.round(Number(raw.y) || 0);
  x = clamp(x, 0, widthLimit - w);
  y = clamp(y, 0, heightLimit - h);

  if (snapEven) {
    w = Math.max(2, floorEven(w));
    h = Math.max(2, floorEven(h));
    x = floorEven(x);
    y = floorEven(y);
    if (x + w > widthLimit) x = Math.max(0, floorEven(widthLimit - w));
    if (y + h > heightLimit) y = Math.max(0, floorEven(heightLimit - h));
  }

  return { x, y, w, h };
}

function centerRect(width = state.rect.w, height = state.rect.h) {
  const meta = state.meta;
  const w = Math.min(width, meta.width || width);
  const h = Math.min(height, meta.height || height);
  return normalizeRect({
    x: ((meta.width || w) - w) / 2,
    y: ((meta.height || h) - h) / 2,
    w,
    h,
  });
}

function stageScale() {
  const bounds = els.video.getBoundingClientRect();
  return {
    x: bounds.width / Math.max(1, state.meta.width),
    y: bounds.height / Math.max(1, state.meta.height),
    bounds,
  };
}

function setRect(next) {
  state.rect = normalizeRect(next);
  syncUI();
}

function templateValues({ display = false } = {}) {
  const internalInput = file ? `input.${fileExtension(file.name)}` : "input.mp4";
  const downloadName = String(els.downloadName.value || "").trim() || "cropped.mp4";
  const internalOutput = safeFileName(downloadName, "output.mp4");

  const filter = replaceTemplate(els.filterTemplate.value, {
    x: state.rect.x,
    y: state.rect.y,
    w: state.rect.w,
    h: state.rect.h,
  });

  return {
    input: display ? quoteForDisplay(file?.name || "input.mp4") : internalInput,
    output: display ? quoteForDisplay(downloadName) : internalOutput,
    filter,
    x: state.rect.x,
    y: state.rect.y,
    w: state.rect.w,
    h: state.rect.h,
    audio: els.stripAudio.checked ? "-an" : "-map 0:a? -c:a copy",
    codec: els.codec.value.trim() || "libx264",
    crf: els.crf.value || "18",
    preset: els.ffPreset.value || "medium",
    pix_fmt: els.pixFmt.value.trim() || "yuv420p",
  };
}

function renderedCommand(options = {}) {
  return replaceTemplate(els.commandTemplate.value, templateValues(options));
}

function setCopyButtonText(text) {
  els.copyCommand.textContent = text;
  window.clearTimeout(setCopyButtonText.timeoutId);
  if (text !== "Copy command") {
    setCopyButtonText.timeoutId = window.setTimeout(() => {
      els.copyCommand.textContent = "Copy command";
    }, 1600);
  }
}

async function copyRenderedCommand() {
  const text = renderedCommand({ display: true });
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopyButtonText("Copied");
  } catch (error) {
    appendLog(`Clipboard copy failed: ${error instanceof Error ? error.message : String(error)}`);
    setCopyButtonText("Copy failed");
  }
}

function ffmpegArgs() {
  const args = splitCommand(renderedCommand({ display: false }));
  return args[0]?.toLowerCase() === "ffmpeg" ? args.slice(1) : args;
}

function syncUI() {
  const rect = state.rect;
  const meta = state.meta;
  els.cropX.value = rect.x;
  els.cropY.value = rect.y;
  els.cropW.value = rect.w;
  els.cropH.value = rect.h;
  els.cropX.max = Math.max(0, meta.width - rect.w);
  els.cropY.max = Math.max(0, meta.height - rect.h);
  els.cropW.max = meta.width || "";
  els.cropH.max = meta.height || "";

  const { x: sx, y: sy, bounds } = stageScale();
  const left = rect.x * sx;
  const top = rect.y * sy;
  const width = rect.w * sx;
  const height = rect.h * sy;

  els.cropBox.style.left = `${left}px`;
  els.cropBox.style.top = `${top}px`;
  els.cropBox.style.width = `${width}px`;
  els.cropBox.style.height = `${height}px`;
  els.cropBox.classList.toggle("fixed", els.fixedSize.checked);

  els.shadeTop.style.left = "0px";
  els.shadeTop.style.top = "0px";
  els.shadeTop.style.width = `${bounds.width}px`;
  els.shadeTop.style.height = `${top}px`;

  els.shadeLeft.style.left = "0px";
  els.shadeLeft.style.top = `${top}px`;
  els.shadeLeft.style.width = `${left}px`;
  els.shadeLeft.style.height = `${height}px`;

  els.shadeRight.style.left = `${left + width}px`;
  els.shadeRight.style.top = `${top}px`;
  els.shadeRight.style.width = `${Math.max(0, bounds.width - left - width)}px`;
  els.shadeRight.style.height = `${height}px`;

  els.shadeBottom.style.left = "0px";
  els.shadeBottom.style.top = `${top + height}px`;
  els.shadeBottom.style.width = `${bounds.width}px`;
  els.shadeBottom.style.height = `${Math.max(0, bounds.height - top - height)}px`;

  els.renderedCommand.textContent = renderedCommand({ display: true });
}

function enableControls(enabled) {
  els.exportBtn.disabled = !enabled || working;
}

function handleFile(nextFile) {
  if (!nextFile) return;
  file = nextFile;
  showError("");
  setProgress(0);
  els.logBox.textContent = "Logs will appear here during export.";

  if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
  if (outputObjectUrl) URL.revokeObjectURL(outputObjectUrl);
  outputObjectUrl = "";
  els.outputPanel.classList.add("hidden");

  videoObjectUrl = URL.createObjectURL(file);
  els.video.src = videoObjectUrl;
  els.emptyState.classList.add("hidden");
  els.stageWrap.classList.remove("hidden");
  els.overlay.classList.add("hidden");

  els.inputName.textContent = file.name;
  els.inputSize.textContent = formatBytes(file.size);
  const defaultDownloadName = croppedDefaultName(file.name);
  els.downloadName.value = defaultDownloadName;
  setStatus("Video loaded. Waiting for metadata…");
  syncUI();
}

function onMetadata() {
  state.meta = {
    width: els.video.videoWidth,
    height: els.video.videoHeight,
    duration: Number.isFinite(els.video.duration) ? els.video.duration : 0,
  };
  els.nativeSize.textContent = `${state.meta.width} × ${state.meta.height}`;
  els.duration.textContent = state.meta.duration ? `${state.meta.duration.toFixed(1)} seconds` : "—";
  state.rect = centerRect(1000, 1000);
  els.overlay.classList.remove("hidden");
  setStatus("Adjust the crop box, then export.");
  enableControls(true);
  requestAnimationFrame(syncUI);
}

function beginDrag(event, mode) {
  if (!state.meta.width || !state.meta.height) return;
  event.preventDefault();
  event.stopPropagation();
  const scale = stageScale();
  dragState = {
    mode,
    startX: event.clientX,
    startY: event.clientY,
    startRect: { ...state.rect },
    scaleX: scale.x,
    scaleY: scale.y,
  };
  document.body.style.userSelect = "none";
}

function updateDrag(event) {
  if (!dragState) return;
  event.preventDefault();
  const dx = (event.clientX - dragState.startX) / dragState.scaleX;
  const dy = (event.clientY - dragState.startY) / dragState.scaleY;
  const start = dragState.startRect;
  let next = { ...start };

  if (dragState.mode === "move") {
    next.x = start.x + dx;
    next.y = start.y + dy;
  } else if (!els.fixedSize.checked) {
    const handle = dragState.mode;
    const minSize = 24;
    if (handle.includes("e")) next.w = Math.max(minSize, start.w + dx);
    if (handle.includes("s")) next.h = Math.max(minSize, start.h + dy);
    if (handle.includes("w")) {
      next.x = start.x + dx;
      next.w = Math.max(minSize, start.w - dx);
    }
    if (handle.includes("n")) {
      next.y = start.y + dy;
      next.h = Math.max(minSize, start.h - dy);
    }

    if (els.lockRatio.checked) {
      const size = Math.max(minSize, Math.min(next.w, next.h));
      if (handle.includes("w")) next.x = start.x + start.w - size;
      if (handle.includes("n")) next.y = start.y + start.h - size;
      next.w = size;
      next.h = size;
    }
  }

  setRect(next);
}

function endDrag() {
  dragState = null;
  document.body.style.userSelect = "";
}

async function loadFFmpeg() {
  if (!ffmpeg) ffmpeg = new FFmpeg();
  if (ffmpegLoaded) return ffmpeg;

  setStatus("Loading FFmpeg core in the browser…");
  appendLog("Loading ffmpeg.wasm core. This happens once per page load.");

  ffmpeg.on("log", ({ message }) => appendLog(message));
  ffmpeg.on("progress", ({ progress }) => {
    if (Number.isFinite(progress)) setProgress(Math.round(progress * 100));
  });

  const baseURL = els.coreBaseUrl.value.trim().replace(/\/$/, "");

  // The FFmpeg wrapper's web worker must be same-origin. Keeping these
  // package files local avoids the common CDN/CORS error:
  // "Failed to construct 'Worker' ... cannot be accessed from origin ..."
  await ffmpeg.load({
    classWorkerURL: new URL("./vendor/ffmpeg/worker.js", window.location.href).href,
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  ffmpegLoaded = true;
  setStatus("FFmpeg loaded. Encoding can start.");
  return ffmpeg;
}

async function exportVideo() {
  if (!file) {
    showError("Choose a video file first.");
    return;
  }

  working = true;
  enableControls(true);
  showError("");
  setProgress(0);
  if (outputObjectUrl) URL.revokeObjectURL(outputObjectUrl);
  outputObjectUrl = "";
  els.outputPanel.classList.add("hidden");

  try {
    const ff = await loadFFmpeg();
    const values = templateValues();
    const args = ffmpegArgs();

    setStatus("Writing input video into FFmpeg’s in-browser filesystem…");
    appendLog(`Input: ${file.name} (${formatBytes(file.size)})`);
    await ff.writeFile(values.input, await fetchFile(file));

    setStatus("Encoding cropped video…");
    appendLog(`Displayed command: ${renderedCommand({ display: true })}`);
    appendLog(`Internal ffmpeg.wasm command: ffmpeg ${args.join(" ")}`);

    let execError = null;
    try {
      await ff.exec(args);
    } catch (error) {
      execError = error;
      const message = error instanceof Error ? error.message : String(error);
      appendLog(`WARNING: ffmpeg.wasm reported: ${message}`);
      appendLog("Trying to read the output anyway; some browsers/builds emit Aborted() after writing the file.");
    }

    setStatus("Reading output video…");
    let data;
    try {
      data = await ff.readFile(values.output);
    } catch (readError) {
      if (execError) throw execError;
      throw readError;
    }

    if (execError) {
      showError("FFmpeg.wasm reported an abort, but an output file was still produced. Preview the result carefully before relying on it.");
    }

    const mime = values.output.toLowerCase().endsWith(".webm") ? "video/webm" : "video/mp4";
    const blob = new Blob([data], { type: mime });
    outputObjectUrl = URL.createObjectURL(blob);

    const downloadName = String(els.downloadName.value || "").trim() || "cropped.mp4";
    els.outputVideo.src = outputObjectUrl;
    els.downloadLink.href = outputObjectUrl;
    els.downloadLink.download = downloadName;
    els.outputSummary.textContent = downloadName;
    els.outputBytes.textContent = formatBytes(blob.size);
    els.outputPanel.classList.remove("hidden");
    setProgress(100);
    setStatus("Done. Preview or download the cropped file.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    showError(`Export failed.\n\n${message}\n\nCheck the rendered command and run log. If you opened this file directly as file://, serve the folder over HTTP instead.`);
    setStatus("Export failed.");
    appendLog(`ERROR: ${message}`);
  } finally {
    working = false;
    enableControls(Boolean(file));
  }
}

function applyPreset(value) {
  if (!state.meta.width) return;
  if (value === "free") {
    els.fixedSize.checked = false;
    syncUI();
    return;
  }

  const [w, h] = value.split("x").map(Number);
  els.fixedSize.checked = true;
  els.lockRatio.checked = w === h;
  state.rect = centerRect(w, h);
  syncUI();
}

function wireEvents() {
  els.fileInput.addEventListener("change", (event) => handleFile(event.target.files?.[0]));
  els.video.addEventListener("loadedmetadata", onMetadata);
  els.video.addEventListener("loadeddata", syncUI);
  window.addEventListener("resize", syncUI);

  els.dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    els.dropZone.classList.add("dragover");
  });
  els.dropZone.addEventListener("dragleave", () => els.dropZone.classList.remove("dragover"));
  els.dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    els.dropZone.classList.remove("dragover");
    handleFile(event.dataTransfer.files?.[0]);
  });

  els.exportBtn.addEventListener("click", exportVideo);
  els.cropBox.addEventListener("pointerdown", (event) => beginDrag(event, "move"));
  document.querySelectorAll(".handle").forEach((handle) => {
    handle.addEventListener("pointerdown", (event) => beginDrag(event, handle.dataset.handle));
  });
  window.addEventListener("pointermove", updateDrag);
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

  els.overlay.addEventListener("pointerdown", (event) => {
    if (event.target !== els.overlay) return;
    const { bounds, x: sx, y: sy } = stageScale();
    const nativeX = (event.clientX - bounds.left) / sx;
    const nativeY = (event.clientY - bounds.top) / sy;
    setRect({ ...state.rect, x: nativeX - state.rect.w / 2, y: nativeY - state.rect.h / 2 });
  });

  [els.cropX, els.cropY, els.cropW, els.cropH].forEach((input) => {
    input.addEventListener("input", () => {
      setRect({
        x: Number(els.cropX.value),
        y: Number(els.cropY.value),
        w: Number(els.cropW.value),
        h: Number(els.cropH.value),
      });
    });
  });

  els.presetSelect.addEventListener("change", () => applyPreset(els.presetSelect.value));
  els.centerBtn.addEventListener("click", () => setRect(centerRect(state.rect.w, state.rect.h)));
  document.querySelectorAll("[data-nudge]").forEach((button) => {
    button.addEventListener("click", () => {
      const [dx, dy] = button.dataset.nudge.split(",").map(Number);
      setRect({ ...state.rect, x: state.rect.x + dx, y: state.rect.y + dy });
    });
  });

  els.downloadName.addEventListener("input", syncUI);

  [
    els.fixedSize,
    els.lockRatio,
    els.snapEven,
    els.codec,
    els.crf,
    els.ffPreset,
    els.pixFmt,
    els.stripAudio,
    els.filterTemplate,
    els.commandTemplate,
    els.coreBaseUrl,
  ].forEach((control) => control.addEventListener("input", syncUI));

  els.lockRatio.addEventListener("change", () => setRect(state.rect));
  els.snapEven.addEventListener("change", () => setRect(state.rect));
  els.fixedSize.addEventListener("change", syncUI);
  els.copyCommand.addEventListener("click", copyRenderedCommand);
  els.resetCommand.addEventListener("click", () => {
    els.commandTemplate.value = DEFAULT_COMMAND;
    els.filterTemplate.value = DEFAULT_FILTER;
    syncUI();
  });
}

wireEvents();
syncUI();
