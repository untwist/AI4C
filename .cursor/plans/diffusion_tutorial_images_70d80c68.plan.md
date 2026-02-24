---
name: Diffusion Tutorial Images
overview: "Replace the current 1D signal diffusion demo with a 32x32 image-based diffusion tutorial: same narrative and tab layout, but forward process shows images getting noisier, training runs on preset 32x32 shapes, and inference generates 32x32 images. All logic stays in-browser with vanilla TypeScript; no new dependencies."
todos: []
isProject: false
---

# Diffusion Model Tutorial: Switch to 32x32 Image Demo

## Goal

Replace the 1D signal implementation in the existing Diffusion Model tutorial with **32x32 grayscale image** diffusion. Keep the same page structure (narrative + Forward / Training / Inference tabs), same mental model, and same constraints: browser-only, hybrid interactivity, user-tunable training and inference. Users will **train** a small model on preset 32x32 shapes in the browser (~1-2 min) and **generate** 32x32 images.

## Scope

- **Images**: 32x32 grayscale (1024-dimensional); display as a scaled-up grid (e.g. 8px per pixel = 256x256 on screen).
- **Training**: In-browser on a small set of procedurally generated 32x32 shapes (circle, square, triangle, etc.); same tunables (T, schedule, LR, epochs); non-blocking loop with loss curve.
- **Inference**: Generate 32x32 images from noise; tunable steps and seed; optional "use default model" (quick train or cached weights).
- **No new dependencies**: Keep vanilla TypeScript; no TensorFlow.js or other ML libs.

## Key File

All changes are in [ml-simulations/src/pages/DiffusionModel.tsx](ml-simulations/src/pages/DiffusionModel.tsx). CSS may need small tweaks for the image grid (e.g. canvas or SVG grid container). No new files; no changes to App.tsx or Sidebar (route and entry stay as-is).

---

## 1. Constants and data representation

- **Image size**: `const IMG_SIZE = 32` and `const IMG_PIXELS = 32 * 32` (1024).
- **Images**: Stored as `number[]` of length 1024, values in [0, 1] (grayscale).
- Keep existing: seeded RNG, `randn`, noise schedule (`getNoiseSchedule`), forward/reverse math (same formulas; operate on 1024-dim vectors).

---

## 2. Preset 32x32 training images

Replace 1D preset generators with **procedural 32x32 shapes** (grayscale, [0,1]):

- **Circle**: center (16,16), radius ~12; inside = 1, outside = 0 (or soft edge).
- **Square**: filled rectangle e.g. (8,8) to (24,24).
- **Triangle**: simple 2D triangle mask.
- **Cross** or **plus**: horizontal and vertical bar.
- **Ring**: circle with hole (inner radius < outer radius).

Return `number[]` of length 1024. Provide 5–8 presets so training has enough variety. Helper to map (x, y) in [0,31] to index `y * 32 + x`.

---

## 3. Model: MLP for 1024-dim in/out

- **Input**: concat(noisy image 1024, timestep embedding 16) = 1040.
- **Hidden**: 2 layers of size 256 (or 512 if training remains fast enough on target devices). ReLU.
- **Output**: 1024 (predicted noise).
- **Weights**: Same pattern as current MLP (arrays of arrays); init with small random; forward pass and SGD backprop in TypeScript. Larger but same structure as current 64-dim MLP.
- **Training**: Sample random preset image as x0, random t, compute x_t and epsilon, forward pass, MSE loss, backward pass, SGD step. Run in chunks (e.g. 10–20 steps per `setTimeout`) so UI stays responsive; update loss history and "Training..." state.

Reduce hidden size (e.g. 256) if one training run exceeds ~2 minutes on a typical laptop.

---

## 4. Forward process tab

- **Data**: One selected preset **image** (32x32), timestep t (0..T).
- **Compute**: `x_t` from x0, t, and fixed epsilon (e.g. seeded) using existing `forward()`.
- **Visualization**: Draw **two 32x32 grids** (or one with a divider): left = original image (x0), right = noisified (x_t). Each pixel = one value in [0,1] drawn as a small filled rect (e.g. 8x8 px) with gray level. Use a single `<canvas>` or SVG `<rect>` grid; scale so the pair fits in the existing visualization area.

---

## 5. Training tab

- **Controls**: Unchanged (T, schedule, learning rate, epochs, "Train" button).
- **Data**: Training set = list of preset 32x32 images (all shapes).
- **Loop**: Same chunked, non-blocking training loop; each step samples one preset image and one t, runs one forward/backward pass, updates weights and appends loss.
- **Visualization**: Keep existing loss curve (D3 line chart). Optional: show one example "x0 vs x_t vs predicted noise" as small 32x32 thumbnails if space allows.

---

## 6. Inference tab

- **Controls**: Unchanged (sampling steps, seed, "Use default model", "Generate").
- **Sampling**: Start from x_T = 1024-dim Gaussian noise; run reverse steps using the current model (trained or default); get final 1024-dim sample.
- **Visualization**: Display the generated **image** as a 32x32 grid (same drawing as forward tab), scaled up so it’s clearly visible (e.g. 256x256 px).
- **Default model**: Either (a) run a short training (e.g. 50 epochs) on first "Generate" when "Use default model" is checked, or (b) precompute a small set of weights and embed them (JSON). (a) is simpler and keeps the "no precomputed assets" approach; document that first run may take ~30s.)

---

## 7. Image drawing helper

- **Function**: e.g. `drawImageGrid(canvasOrSvgRef, data: number[], size: number)` where `data` is 1024 entries, `size` is pixel size per cell (e.g. 8). If using canvas: get 2D context, clear, loop over 1024, fillRect with `data[i]` as gray. If using SVG: create 1024 `<rect>` elements with fill = `rgb(v,v,v)`. Prefer one approach (e.g. canvas) for performance and simplicity.
- **Layout**: Forward tab shows two grids (x0, x_t). Inference tab shows one grid (generated image). Reuse the same helper.

---

## 8. Narrative and copy

- **Text**: Keep the same six sections (what is diffusion, forward, reverse, training, inference, summary). Update only where we currently say "signal" or "curve" to say "image" (e.g. "we take an image and add noise", "generated image"). No structural change to the explanation sections.

---

## 9. Implementation order

1. Add constants and preset 32x32 image generators; add `drawImageGrid` and use it in Forward tab (replace 1D curve with x0 and x_t images).
2. Replace MLP and training/sampling logic: 1024-dim in/out, 1040 input with embedding, 256–256 hidden, 1024 output; adapt `trainStepCorrect` and `sample` to use 1024-dim vectors and new presets.
3. Wire Training tab to new model and preset image list; keep loss curve.
4. Wire Inference tab to new sampler and draw single generated image with `drawImageGrid`.
5. Tweak CSS if needed (canvas/svg size, layout for two images in Forward).
6. Short pass: ensure no 1D/signal references remain, and that "Use default model" path works (quick train or document delay).

---

## 10. What to remove

- All 1D-specific code: `SIGNAL_LEN`, 1D presets (sine, step, gaussian), 1D curve drawing in D3 (path/line for signal). Keep: RNG, randn, noise schedule, forward/reverse math, tab layout, narrative DOM, controls structure.

---

## Summary


| Item              | Change                                                           |
| ----------------- | ---------------------------------------------------------------- |
| **Data**          | 1D signal (64) → 32x32 grayscale image (1024)                    |
| **Presets**       | Sine/step/gaussian → Circle, square, triangle, cross, ring, etc. |
| **Model**         | MLP 80→64→64 → MLP 1040→256→256→1024                             |
| **Forward tab**   | Two curves → Two 32x32 image grids (x0, x_t)                     |
| **Inference tab** | One curve → One 32x32 generated image                            |
| **Training**      | Same UX; data = preset images; ~1–2 min in-browser               |
| **Deps**          | No new dependencies                                              |


This yields an image-based diffusion tutorial that still runs entirely in the browser and lets users adjust training and inference as before.