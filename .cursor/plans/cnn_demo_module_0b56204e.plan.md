---
name: CNN Demo Module
overview: "Add a Convolutional Neural Network Demo page that teaches how CNNs process images via narrative sections and an interactive demo: preset or drawable input images, selectable convolution filters (edge, blur, sharpen), and live feature-map visualization—all in-browser with no backend."
todos: []
isProject: false
---

# Convolutional Neural Network Demo Module

## Goal

Replace the "Coming Soon" CNN Demo sidebar entry with a full tutorial page that (1) explains convolutions and feature detection in plain language and (2) lets students pick an input image and filters to see the resulting feature maps in real time.

## Scope (aligned with [plan.md](plan.md))

- **Image classification with filter visualization**: Focus on filter visualization and feature maps first; optional minimal "what does this look like?" (edge vs blob) for classification intuition.
- **Show how convolutions detect features**: Narrative + interactive conv layer(s) with preset filters (vertical/horizontal edge, blur, sharpen, identity).

## Constraints

- **Browser-only**: No backend, no GPU. Convolution math in TypeScript; reuse React + D3 (and design system). No new ML frameworks (e.g. no TensorFlow.js).
- **Small images**: Use modest grid sizes (e.g. 8x8 or 16x16 grayscale) so convolution and heatmap rendering stay fast and understandable.
- **No emojis**: Per [.cursorrules](.cursorrules); professional, accessible copy throughout.

---

## 1. Tutorial narrative structure

Mirror the pattern used in [DiffusionModel.tsx](ml-simulations/src/pages/DiffusionModel.tsx): scrollable explanation sections above the demo.

**Suggested sections:**

1. **What is a convolutional layer?**
  One paragraph: slide small filters (kernels) over the image; each filter produces one "feature map" that highlights where that pattern appears (e.g. edges, corners).
2. **Filters and feature maps**
  Explain: a 3x3 kernel is applied at each position; output value = sum of element-wise products. Different kernels detect different features (show names: identity, vertical edge, horizontal edge, blur, sharpen).
3. **Why this matters for vision**
  Early layers often learn edge-like filters; deeper layers combine them into textures and shapes. This demo shows one (or two) conv layers so you can see the transformation.
4. **Summary**
  Bullet list: convolution = sliding kernel over image; each kernel gives one feature map; filters are chosen (or learned) to detect useful patterns.

Keep equations minimal (one formula for one output pixel) with plain-language explanations.

---

## 2. Interactive demo design

**Data domain**: Grayscale 2D images as 2D number arrays (e.g. 8x8 or 16x16). Values in [0, 1] for display and math.

**Input image options:**

- **Presets**: A few built-in small images (e.g. vertical bar, horizontal bar, small square, simple "blob", gradient). Stored as 2D arrays.
- **Optional**: Simple "draw" mode (click to paint on a grid) or file upload that samples down to the chosen grid size (e.g. 16x16) to keep logic simple.

**Filters:**

- **Preset kernels**: Identity, vertical edge (e.g. Sobel-like), horizontal edge, box blur, sharpen (3x3). Stored as 3x3 (or 5x5) number arrays.
- **Optional**: "Custom 3x3" numeric inputs so students can tweak weights and see the effect.

**Visualization:**

- **Input image**: Rendered as a heatmap (grid of cells; color = value). D3 `scaleSequential` + `rect` or canvas fillRect.
- **Kernel(s)**: Show selected kernel(s) as small labeled grids (e.g. 3x3 cells with values).
- **Feature map(s)**: One output heatmap per selected filter; same heatmap style. Compute with stride 1; support "same" (zero-pad) or "valid" (no pad) for clarity.

**Layout:**

- Single main view (no tabs): left or top = input image; center = filter selector + kernel display; right or below = one or more feature maps. Alternatively, a compact "pipeline" view: Input | Filter 1 | Feature map 1 | (optional) Filter 2 | Feature map 2.
- Controls: image preset (dropdown), optional draw toggle; filter preset (dropdown or multi-select); optional padding mode (same/valid). No need for stride control in v1 (stride 1).

**Convolution implementation:**

- Pure TypeScript: for each output pixel (i, j), compute sum over kernel positions (k, l) of `input[i+k, j+l] * kernel[k,l]`. Handle padding (same: pad input with zeros so output size equals input size; valid: no padding, output smaller). Single function, e.g. `convolve2d(input: number[][], kernel: number[][], padding: 'same' | 'valid'): number[][]`.

---

## 3. Technical implementation

**Stack**: React + TypeScript, D3 (or SVG/Canvas) for heatmaps. No new dependencies. Reuse design system variables from [design-system.css](ml-simulations/src/styles/design-system.css).

**Files to add:**

- `ml-simulations/src/pages/CNNDemo.tsx` – main page: narrative sections + interactive demo (input selector, filter selector, conv math, heatmap rendering).
- `ml-simulations/src/pages/CNNDemo.css` – styles following [DiffusionModel.css](ml-simulations/src/pages/DiffusionModel.css) and [SimulationTemplate.css](ml-simulations/src/templates/SimulationTemplate.css) (e.g. `.cnn-demo`, `.page-header`, `.simulation-layout`, `.visualization-panel`, `.controls-panel`, `.card`, design tokens).

**Files to modify:**

- [ml-simulations/src/App.tsx](ml-simulations/src/App.tsx) – add route `/cnn-demo` and import `CNNDemo` + `CNNDemo.css`.
- [ml-simulations/src/components/Sidebar.tsx](ml-simulations/src/components/Sidebar.tsx) – set `cnn-demo` entry `status` from `'coming-soon'` to `'available'` (line 128) so the link is active and the "Coming Soon" badge is removed.

**In-page structure:**

- Reuse patterns from existing pages: refs for SVG/container, `useState` for selected image preset, selected filter(s), padding mode, `useEffect` for redraw on dependency change.
- **Conv logic**: Implement in the same file (or a small `cnnUtils.ts` in `src/utils/`) as pure TypeScript: `convolve2d(input, kernel, padding)`. Preset images and kernels as named constants (2D arrays).
- **Heatmaps**: For each 2D array (input, each kernel, each feature map), render a grid of rectangles; color from a sequential scale (e.g. gray or viridis-like). Use one SVG group per heatmap, or canvas, with consistent cell size and labels (e.g. "Input", "Vertical edge", "Feature map").
- **Responsiveness**: Optional `containerRef` + resize handling so the demo layout works on smaller screens (stack or scale heatmaps).

**Accessibility and UX**: Label all controls; ensure sufficient contrast for heatmaps; no emojis; concise copy consistent with other tutorials.

---

## 4. Implementation order (bite-sized)

1. **Conv math and presets** – Add `convolve2d` and preset image + kernel data (e.g. in `CNNDemo.tsx` or `src/utils/cnnUtils.ts`). Unit-test or manually verify one known input/kernel pair.
2. **Page shell** – Create `CNNDemo.tsx` with page header and explanation sections (static copy); add route and Sidebar status; confirm navigation to `/cnn-demo` and layout.
3. **Heatmap component** – Implement a small helper or inline logic to draw a 2D array as a heatmap (D3 or SVG rects); use for one preset image and one kernel to confirm scaling and colors.
4. **Demo state and controls** – Wire image preset dropdown and filter preset dropdown (and optional padding toggle) to state; compute feature map(s) from current input and selected filter(s).
5. **Full demo layout** – Arrange visualization panel (input + kernel(s) + feature map(s)) and controls panel; connect controls to heatmap updates so the demo is fully interactive.
6. **Polish** – CNNDemo.css for layout and design tokens; any labels, tooltips, or short hints; remove "Coming Soon" and verify sidebar link.

---

## 5. Optional enhancements (out of scope for initial plan)

- **Drawable input**: Let users paint on a grid to create a custom input image.
- **File upload**: Load an image, downsample to 16x16 (or 8x8) grayscale, use as input.
- **Multiple filters at once**: Show 2–3 feature maps side by side for different kernels.
- **Second conv layer**: Option to run a second conv on the first feature map (fixed or selected kernel) to illustrate stacking.
- **Minimal "classification"**: Simple rule (e.g. max response of vertical-edge filter) to say "edge-like" vs "blob-like" for one or two presets, to foreshadow classification.

---

## 6. Summary

- **Tutorial**: Short narrative on convolutions, filters, and feature maps; mental model first.
- **Demo**: Small grayscale image (presets; optional draw/upload) + selectable 3x3 (or 5x5) filters; live feature map heatmaps; browser-only TypeScript.
- **Integration**: One new page; route `/cnn-demo`; Sidebar entry set to `available` under Deep Learning.
- **Consistency**: Same layout and styling patterns as Diffusion Model and other simulations; no emojis; design system and accessibility respected.

