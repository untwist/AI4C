---
name: Multi-layer Perceptron Explorer
overview: "Build the Multi-layer Perceptron Explorer page: a 2-layer MLP (input -> hidden -> output) with 2D datasets (AND, OR, XOR), decision-boundary visualization, optional forward/backward propagation views, and training controls. The module follows existing Perceptron Learning and Perceptron Anatomy patterns and integrates with the current routing and sidebar."
todos: []
isProject: false
---

# Multi-layer Perceptron Explorer – Implementation Plan

**Goal:** Add a full "Multi-layer Perceptron Explorer" module so the sidebar link works and students can explore how multiple layers create non-linear decision boundaries (e.g. XOR), with forward and backward propagation visibility.

**Architecture:** Single page component (`[MultilayerPerceptron.tsx](ml-simulations/src/pages/MultilayerPerceptron.tsx)`) with local state for MLP weights, dataset, training params, and UI toggles. Pure TypeScript for MLP math (no external ML lib). D3 for 2D scatter + decision-boundary grid and optional network diagram. Same layout pattern as [PerceptronLearning.tsx](ml-simulations/src/pages/PerceptronLearning.tsx): `page-header`, `simulation-layout`, `visualization-panel`, control panel, and educational content sections.

**Tech stack:** React + TypeScript, D3.js, design-system CSS variables (`[design-system.css](ml-simulations/src/styles/design-system.css)`), existing Sidebar/App routing.

---

1. Create a new feature branch for this implementation

## 1. Scope (from [plan.md](plan.md) and sidebar)

- **2-layer MLP:** Input (2) -> Hidden (configurable, e.g. 2–6) -> Output (1), binary classification.
- **Forward propagation:** Compute and optionally display activations layer-by-layer.
- **Backward propagation:** Train with backprop; optionally show weight updates or gradients.
- **Decision boundaries:** Non-linear boundary via grid sampling (XOR solvable).
- **Datasets:** Reuse AND, OR, XOR (and optionally custom) as in [PerceptronLearning.tsx](ml-simulations/src/pages/PerceptronLearning.tsx) (lines 84–132).

---

## 2. Key files to add or touch


| Purpose      | File                                                | Action                                                           |
| ------------ | --------------------------------------------------- | ---------------------------------------------------------------- |
| Page + logic | `ml-simulations/src/pages/MultilayerPerceptron.tsx` | Create                                                           |
| Page styles  | `ml-simulations/src/pages/MultilayerPerceptron.css` | Create                                                           |
| Routing      | `ml-simulations/src/App.tsx`                        | Add route + import                                               |
| Sidebar      | `ml-simulations/src/components/Sidebar.tsx`         | Change `multilayer-perceptron` from `coming-soon` to `available` |


---

## 3. Implementation plan

### 3.1 Route and sidebar

- **App.tsx:** Add `import MultilayerPerceptron from './pages/MultilayerPerceptron'` and `import './pages/MultilayerPerceptron.css'`. Add `<Route path="/multilayer-perceptron" element={<MultilayerPerceptron />} />`.
- **Sidebar.tsx:** In `simulations`, set the entry with `id: 'multilayer-perceptron'` to `status: 'available'` (remove "Coming Soon").

### 3.2 Data and types

- Reuse or mirror **data interfaces** from PerceptronLearning: `DataPoint` (x, y, label 0/1, id, color), **Dataset** (name, description, data, color0, color1). Use same AND, OR, XOR (and optionally custom) dataset definitions.
- Define **MLP types**: e.g. `MLPWeights` (hidden weights matrix, hidden bias, output weights, output bias), `MLPConfig` (inputSize: 2, hiddenSize: number, outputSize: 1), and optionally `ActivationTrace` for forward-pass display (layer activations).

### 3.3 MLP math (in-page or small util)

- **Activation:** Sigmoid for hidden and output (or match PerceptronAnatomy options later). Helper: `sigmoid(z) = 1 / (1 + Math.exp(-z))`.
- **Forward pass:** For each sample `[x, y]`: compute hidden = sigmoid(W_h * input + b_h), then output = sigmoid(W_o * hidden + b_o). Return prediction and, if needed, hidden activations for visualization.
- **Loss:** Binary cross-entropy or MSE. **Backprop:** Implement gradients for W_h, b_h, W_o, b_o and update weights with a learning rate (no external lib).
- **Initialization:** Small random weights (e.g. scaled by 0.5 or 1/sqrt(fan_in)) so training behaves reasonably.

### 3.4 Decision boundary

- **Grid:** Over the same (x, y) domain as the data (e.g. [-0.5, 1.5] for AND/OR/XOR), sample a grid (e.g. 50x50). For each cell run the current MLP forward pass and get class 0 or 1.
- **Visualization:** Use D3 to draw a filled contour or a dense grid of small rectangles colored by predicted class (e.g. class 0 = one color, class 1 = another, with opacity). Draw data points on top (circles with stroke, as in PerceptronLearning).

### 3.5 Training and controls

- **State:** Selected dataset, learning rate, number of epochs, hidden layer size, “step by step” vs “run all”, and current MLP weights + history (if step-by-step).
- **Train button:** Run backprop for the chosen number of epochs over the current dataset, then update state so the decision boundary and optional network view refresh.
- **Step-by-step (optional):** If “step by step” is on, run one epoch (or one sample) per click and show current boundary; consider showing which point was used and weight deltas (simplified backward view).

### 3.6 Forward / backward propagation “views”

- **Forward:** For a selected point (e.g. click on scatter or “selected index”), show activations: input -> hidden -> output. Can be a small panel with numbers or a minimal diagram (input nodes, hidden nodes, output node with values).
- **Backward:** During or after training, optionally show “last step” gradients or weight updates (e.g. one row of numbers or a simple list). Keep wording educational (“how much each weight changed”).

### 3.7 Network diagram (optional but recommended)

- **Diagram:** Draw input (2 nodes), hidden (N nodes), output (1 node). Edges = weights; color or thickness by value (positive/negative). Update after each training run. Can be a second D3 SVG or a small Canvas, consistent with [PerceptronAnatomy.tsx](ml-simulations/src/pages/PerceptronAnatomy.tsx) diagram style.

### 3.8 Layout and UX

- **Structure:** Reuse classes from existing pages: `page-header`, `page-title`, `page-description`, `simulation-layout`, `visualization-panel`, `visualization-header`, `visualization-controls`, `control-panel`, etc. Use design-system variables for colors and spacing (no emojis; project rule).
- **Sections:** Short intro (“Why multiple layers?”), “Decision boundary” (scatter + grid), “Network” (diagram), “Forward pass” (for selected point), “Backward pass” (weight updates / gradients), and “Try it” (dataset + train + step). Match tone of PerceptronLearning and PerceptronAnatomy.

### 3.9 Testing and polish

- **Build:** Run `npm run build` from `ml-simulations` and fix any TypeScript or lint errors.
- **Smoke test:** Open `/AI4C/multilayer-perceptron`, select XOR, train for a few hundred epochs, confirm non-linear boundary and that the link in the sidebar is active (no “Coming Soon”).

---

## 4. Dependencies and risks

- **No new npm packages** required if MLP and backprop are implemented in TypeScript.
- **Risk:** Backprop and initialization details can be fiddly; start with a small hidden size (2–4) and a known learning rate (e.g. 0.1–0.5) so XOR converges reliably. If time is short, defer “step-by-step backward” and show only “Run training” plus optional “show last gradients.”

---

## 5. Order of implementation

1. Add route and sidebar status so the page is reachable and not “Coming Soon.”
2. Create `MultilayerPerceptron.tsx` and `MultilayerPerceptron.css` with minimal UI (title, placeholder viz).
3. Implement data types and AND/OR/XOR datasets (copy/adapt from PerceptronLearning).
4. Implement MLP forward + backprop + training loop and wire “Train” to state.
5. Add D3 decision-boundary grid + scatter plot.
6. Add controls (dataset, learning rate, epochs, hidden size, Train).
7. Add optional network diagram and forward-pass display for selected point.
8. Add optional backward-pass display (gradients or last update).
9. Add educational copy and finalize styles; run build and smoke test.

---

## 6. Out of scope (later)

- Convolutional or other architectures.
- Multi-class (softmax); keep binary for this module.
- Loading/saving weights or datasets.
- 3D or multiple input dimensions beyond 2D for the main viz.

