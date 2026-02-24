---
name: Diffusion Model Tutorial
overview: "Add a comprehensive diffusion-model tutorial with narrative sections that build a mental model (forward process, reverse process, training, inference) and a hybrid interactive demo: pre-computed or fast-simulated baselines plus user-tunable training and inference parameters, all running in the browser with no backend."
todos: []
isProject: false
---

# Diffusion Model Tutorial and Interactive Demo

## Goal

Add a single new tutorial page that (1) teaches how diffusion models work via clear narrative sections and (2) provides an interactive demo where students can see and slightly control both training and inference, entirely in the browser.

## Constraints

- **Browser-only**: No backend, no GPU. All logic in TypeScript; optional use of existing deps (React, D3, mathjs). No new heavy ML frameworks (e.g. no TensorFlow.js) to keep bundle small and compatibility high.
- **Hybrid interactivity**: Combine "watch it work" (pre-computed or fast-simulated runs) with "tweak it" (user-adjustable training and inference parameters).
- **Mental model first**: Tutorial text must walk through: what is the forward process, what is the reverse process, what we train (noise prediction), and how inference/sampling works.

---

## 1. Tutorial narrative structure (mental model)

The page will be structured like existing simulations ([KMeansClustering.tsx](ml-simulations/src/pages/KMeansClustering.tsx), [CausalDetective.tsx](ml-simulations/src/pages/CausalDetective.tsx)): scrollable sections with headings and short paragraphs, followed or interleaved with the interactive demo.

**Suggested sections (order preserved for mental model):**

1. **What is a diffusion model?**
  One paragraph: learn to generate data by first learning to destroy it (add noise), then reversing that process.
2. **The forward process (adding noise)**
  Explain: we take data and add Gaussian noise over T steps until it becomes pure noise. Show formula for x_t from x_0 (or simplified "more noise as t increases"). No trainable parameters here.
3. **The reverse process (denoising)**
  Explain: we want to go from noise back to data. We learn a model (e.g. noise predictor) so we can step backwards. Mention that we do not have a closed form; we learn an approximation.
4. **Training**
  Explain: we take real data, pick a random timestep t, add noise to get x_t, and train the network to predict the noise (or x_0). Loss is MSE on that prediction. Optional: one sentence on why predicting noise is equivalent to modeling the reverse process.
5. **Inference (sampling)**
  Explain: start from random noise x_T, then for t = T down to 1 use the model to predict noise (or x_0), then compute x_{t-1} with the chosen schedule (DDPM or simplified step). More steps usually give better quality.
6. **Summary / takeaways**
  Bullet list: forward = add noise; training = learn to predict noise; inference = iterative denoising from noise.

All math can be kept minimal (one or two key equations) with plain-language explanations. No emojis (per [.cursorrules](.cursorrules)).

---

## 2. Interactive demo design (hybrid, in-browser)

**Data domain**: Use **1D signals** (e.g. 64 or 128 points) so that:

- Forward and reverse processes are easy to visualize (single curve or overlaid curves).
- A tiny "noise predictor" (e.g. small MLP: 1D input + timestep embedding, 2–3 hidden layers) can be implemented in vanilla TypeScript and trained in the browser in seconds.
- No extra dependencies; optional use of `mathjs` for array ops if desired.

**Why 1D:** 2D image diffusion in the browser would require either a large pre-trained model (heavy download) or a very small 2D model and long training; 1D keeps the demo fast, understandable, and fully editable by the user.

**Demo layout (one page, tabbed or accordion):**

- **Forward process**  
  - User selects a "source signal" (e.g. preset: sine, step, Gaussian bump).  
  - Slider or dropdown for timestep t (0 to T).  
  - Visualization: curve of x_t (noise level increases as t increases).  
  - No training here; just the closed-form forward equation.
- **Training**  
  - User-tunable parameters: number of steps T (e.g. 50–200), learning rate, number of epochs (or iterations), optionally noise schedule (linear vs cosine).  
  - "Train" button runs training in the browser (same small MLP, MSE loss on noise prediction).  
  - Display: loss over iterations (simple line chart, D3 or SVG).  
  - Optional: show a few x_0 \to x_t and predicted vs true noise for one batch so the "learning to predict noise" is visible.
- **Inference**  
  - User-tunable: number of sampling steps (e.g. 10–T), optional seed for reproducibility.  
  - "Generate" or "Sample" button: start from x_T \sim \mathcal{N}(0, I), run the learned reverse process step by step.  
  - Visualization: either (a) final curve only, or (b) step-by-step animation (e.g. one curve per step or key steps).  
  - Pre-computed baseline: if we store a small set of pre-trained weights (or a fast default training), "Generate" works immediately without requiring the user to train first; "minor changes" = change steps/seed and re-run.

**Hybrid in practice:**

- **Pre-computed / fast baseline**: Ship with a default T and a small set of weights (or run a short training on load) so "Inference" works out of the box. Optionally show a "Use default model" vs "Use my trained model" toggle.
- **User changes**: Training: T, learning rate, epochs, schedule. Inference: sampling steps, seed. No need to support full architecture editing.

---

## 3. Technical implementation

**Stack**: React + TypeScript, D3 (or plain SVG) for all visualizations (1D curves, loss curve, optional step-by-step curves). No new dependencies required; optional `mathjs` for clarity.

**Files to add:**

- `ml-simulations/src/pages/DiffusionModel.tsx` – main page: narrative sections + interactive demo (forward, training, inference).
- `ml-simulations/src/pages/DiffusionModel.css` – styles (follow [SimulationTemplate.css](ml-simulations/src/templates/SimulationTemplate.css) and design system).

**Files to modify:**

- [ml-simulations/src/App.tsx](ml-simulations/src/App.tsx) – add route for `/diffusion-model` and import page + CSS.
- [ml-simulations/src/components/Sidebar.tsx](ml-simulations/src/components/Sidebar.tsx) – add entry under "Deep Learning" (or a new "Generative Models" category): "Diffusion Model Tutorial", path `/diffusion-model`, status `available`.

**In-page structure:**

- Reuse existing patterns: refs for SVG containers, `useState` for parameters and results, `useEffect` for redraw on resize/deps.
- **Diffusion logic**: Implement in the same file (or a small `diffusionUtils.ts` in `src/utils/`) as pure TypeScript:
  - Forward: given x_0, t, and schedule, compute x_t and the noise used (for training).
  - Noise schedule: e.g. linear \bar{\alpha}_t or cosine, with a fixed T max.
  - Tiny MLP: input = concatenate(x_t, embedding(t)) or similar; output = predicted noise; 2–3 hidden layers, ReLU; weights as arrays (no graph engine). Forward pass and gradient updates (SGD) by hand for a small batch (e.g. one or a few 1D samples per step).
  - Reverse step: given x_t and predicted noise, compute x_{t-1} with the chosen rule (DDPM-style or simplified).
- **Training loop**: Run in a non-blocking way (e.g. `requestAnimationFrame` or chunked `setTimeout`) so the UI stays responsive; show a "Training..." state and loss curve update as it runs.
- **Inference**: Same loop pattern; optionally animate steps (e.g. update state every N steps or every 50ms) so the reverse process is visible.

**Accessibility and UX**: Labels for all controls; avoid emojis; keep copy concise and consistent with other tutorials.

---

## 4. Optional enhancements (out of scope for initial plan)

- **2D tiny images (e.g. 8x8)**: Possible follow-up with a small MLP on flattened 64-dim input; same training/inference pattern, with a heatmap or grid visualization.
- **Pre-trained weights**: Export a small JSON of weights after training and bundle it so users can run inference without training (or use it as "default model").
- **Comparison**: Side-by-side "more steps" vs "fewer steps" at inference to illustrate quality vs speed.

---

## 5. Summary

- **Tutorial**: Narrative sections for forward, reverse, training, inference; mental model first.
- **Demo**: 1D signal diffusion; forward slider; train with tunable T, LR, epochs, schedule; infer with tunable steps and seed.
- **Hybrid**: Default/fast model so inference works immediately; user changes = training and inference parameters.
- **Browser**: Pure TypeScript (tiny MLP + diffusion math), D3/SVG, no backend, no new ML libs.
- **Placement**: One new page; route and sidebar under Deep Learning (or Generative Models).

This gives a single, self-contained tutorial that builds a clear mental model and lets students both see and slightly control training and inference in the browser.