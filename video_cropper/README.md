# Browser Video Cropper

A static HTML/CSS/JavaScript video cropper that runs FFmpeg in the browser using `ffmpeg.wasm`.

## Files

- `index.html` — the page
- `styles.css` — styling
- `app.js` — crop UI and FFmpeg export logic
- `vendor/ffmpeg/` — local `@ffmpeg/ffmpeg` wrapper files, including the same-origin worker
- `vendor/ffmpeg-util/` — local `@ffmpeg/util` helper files
- `vendor/core/` — local FFmpeg WebAssembly core files

The `vendor` folder is intentionally included. It prevents the browser worker from being loaded directly from a CDN, which can trigger a same-origin/CORS error.

## How to run locally

Do not open `index.html` directly as `file://`. Serve the folder over HTTP.

From this folder, run either:

```bash
python3 -m http.server 8000
```

or, on Windows if `python3` is unavailable:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## How to use

1. Click **Choose video** or drag a video onto the workspace.
2. Drag the crop rectangle to move it.
3. Resize it using the handles, or choose a preset such as `1000 × 1000`.
4. Edit coordinates, dimensions, CRF, codec, FFmpeg filter, or full command if needed.
5. Click **Export crop**.
6. Preview and download the cropped video.

Audio is stripped by default via `-an`. The download name defaults to the input basename plus `_cropped.mp4`, for example `holiday.mov` becomes `holiday_cropped.mp4`.

## GitHub Pages

This is a static site, so GitHub Pages can host it directly.

Simple approach:

1. Create a GitHub repository.
2. Upload **all** files and folders to the repository root, including `vendor/`.
3. Go to **Settings → Pages**.
4. Set source to your branch, usually `main`, and folder to `/root`.
5. Save.

Do not upload only `index.html`, `styles.css`, and `app.js`; the `vendor/` folder is required for FFmpeg export.

## Notes

- Processing is local in the browser; videos are not uploaded to a server by this app.
- Large videos can be slow or memory-heavy because WebAssembly runs inside the browser. If ffmpeg.wasm prints `Aborted()` after encoding, the app now tries to read the output file anyway and shows a warning if a playable result was produced.
- Cropping requires re-encoding. The default command uses H.264, CRF 18, `yuv420p`, and strips audio.
- The included FFmpeg core is the single-thread core, which is more compatible with static hosts such as GitHub Pages.


## Crop display accuracy

The default crop filter is `crop={w}:{h}:{x}:{y},setsar=1`. The `setsar=1` part resets the sample aspect ratio to square pixels, which prevents cropped outputs from appearing squeezed or much narrower than the rectangle selected in the workspace when the source video uses non-square pixels.
