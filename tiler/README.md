# Panorama Tiler

This repository recreates the Marzipano tool: drop in an equirectangular panorama and it produces a `data.js`, preview JPEG, and tiled cube faces ready for use on sites like [360worlds.org](https://www.360worlds.org/).

## Web tool (HTML/JS)
1. Open `index.html` in your browser (no server required). The page ships with a bundled `jszip.min.js` so it works offline.
2. Select an equirectangular panorama (any standard 2:1 image).
3. Optionally edit the scene/tour names, tile size, JPEG tile quality, and initial yaw/pitch/fov.
4. Click **Generate tiles & data.js**. When finished, download **tiles (zip)** and **data.js** separately.

The tiles ZIP contains:
```
<scene-id>/
  preview.jpg
  1/      # lowest tiled level (tileSize x tileSize)
    f/0/0.jpg ...
  2/
    f/0/0.jpg ...
  ...
  N/      # top level, aligned to a power-of-two multiple of the tile size
    f/0/0.jpg ...
```
Each tiled folder stores cube faces (`f`, `r`, `b`, `l`, `u`, `d`) split into row/column JPEG tiles. Levels mirror the Marzipano output: a fallback 256px level is declared in `data.js`, and numbered levels start at `1` for the first tiled resolution. The deepest level is sized to the largest power-of-two multiple of the tile size that does not exceed one quarter of the source panorama width; this keeps Marzipano level constraints satisfied while remaining close to 1:1.

`data.js` follows the Marzipano schema (e.g., `levels`, `faceSize`, `initialViewParameters`, etc.) so you can append it to an existing tour or drop it alongside the `tiles/` folder. It is also displayed inline for quick copy/paste.

## Notes
- Higher `--max-face-size` values produce deeper zoom levels but increase processing time and disk usage.
- Tiles are produced as JPEGs using bilinear sampling from the source panorama.
