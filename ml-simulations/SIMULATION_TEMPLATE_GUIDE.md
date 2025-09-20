# ML Simulation Template Guide

## Overview

This guide provides a standardized template system for creating consistent ML simulations. The template ensures all simulations follow the same patterns, use the design system correctly, and provide a consistent user experience.

## 🎯 Why This Template System?

### Problems Solved:
- ✅ **Consistent Styling**: All simulations use the same visual patterns
- ✅ **Design System Compliance**: Proper use of CSS variables and components
- ✅ **Standardized Layout**: Same structure across all simulations
- ✅ **Responsive Design**: Consistent mobile/tablet experience
- ✅ **Maintainable Code**: Easy to update and modify
- ✅ **Developer Efficiency**: Faster development with proven patterns

### Before vs After:
- ❌ **Before**: Each simulation had different layouts, inconsistent styling, and custom patterns
- ✅ **After**: All simulations follow the same structure, use design system variables, and provide consistent UX

## 📁 Template Files

### Core Template Files:
```
src/templates/
├── SimulationTemplate.tsx     # React component template
├── SimulationTemplate.css     # CSS styling template
└── README.md                  # This guide
```

### Usage:
1. Copy `SimulationTemplate.tsx` → `YourSimulationName.tsx`
2. Copy `SimulationTemplate.css` → `YourSimulationName.css`
3. Follow the customization guide below

## 🚀 Quick Start Guide

### Step 1: Copy Template Files
```bash
# Copy the template files
cp src/templates/SimulationTemplate.tsx src/pages/YourSimulationName.tsx
cp src/templates/SimulationTemplate.css src/pages/YourSimulationName.css
```

### Step 2: Update Class Names
In your new files, replace all instances of:
- `your-simulation-name` → `your-actual-simulation-name`
- `YourSimulationName` → `YourActualSimulationName`

### Step 3: Customize Your Simulation
Follow the detailed customization guide below.

## 🛠️ Detailed Customization Guide

### 1. Data Interfaces (Lines 15-25)
```typescript
// Replace with your specific data structures
interface YourDataPoint {
    id: string;
    x: number;
    y: number;
    label?: string;
    color?: string;
}

interface YourParameters {
    parameter1: number;
    parameter2: string;
    parameter3: boolean;
}
```

### 2. State Management (Lines 30-50)
```typescript
// Add your specific state variables
const [dataPoints, setDataPoints] = useState<YourDataPoint[]>([]);
const [parameters, setParameters] = useState<YourParameters>({
    parameter1: 0.5,
    parameter2: 'default',
    parameter3: true
});
```

### 3. Algorithm Functions (Lines 55-75)
```typescript
// Implement your specific algorithm
const calculateYourAlgorithm = (data: YourDataPoint[], params: YourParameters) => {
    // Your ML algorithm logic here
    return {
        processedData: data,
        metrics: {
            metric1: Math.random(),
            metric2: Math.random(),
            accuracy: Math.random()
        }
    };
};
```

### 3.1. Data Generation Best Practices
**CRITICAL: Never generate data inside visualization functions!**

```typescript
// ❌ WRONG - Don't do this
const drawVisualization = () => {
    const data = generateRandomData(); // ❌ Creates new data every time!
    // ... visualization code
};

// ✅ CORRECT - Do this instead
const [currentData, setCurrentData] = useState<YourDataPoint[]>([]);

// Generate data only when needed (e.g., dataset changes)
useEffect(() => {
    const newData = generateRandomData();
    setCurrentData(newData);
}, [selectedDataset]);

const drawVisualization = () => {
    const data = currentData; // ✅ Uses stable data
    // ... visualization code
};
```

**Why this matters:**
- Prevents data points from jumping around when parameters change
- Provides stable visualization for parameter exploration
- Improves user experience and learning
- Follows React best practices for state management

### 4. D3 Visualization (Lines 80-150)
```typescript
// Customize your visualization
const drawVisualization = () => {
    // Your D3.js visualization code here
    // Follow the existing patterns for consistency
};
```

### 5. UI Components (Lines 200-400)
```tsx
// Customize the UI components
<div className="your-simulation-name">
    {/* Your specific UI elements */}
</div>
```

### 5.1. Improved 2-Column Layout (Recommended)
**Use this pattern for better readability and proper graph scaling:**

```tsx
{/* IMPROVED 2-COLUMN LAYOUT */}
<div className="improved-simulation-layout">
    {/* MAIN VISUALIZATION PANEL - WIDER */}
    <div className="main-visualization-panel">
        <div className="visualization-header">
            <h2 className="visualization-title">Main Visualization</h2>
            <div className="visualization-controls">
                {/* Visualization controls */}
            </div>
        </div>
        <div className="visualization-container">
            <svg ref={svgRef} className="simulation-svg"></svg>
        </div>
        {/* IMPROVED LEGEND */}
        <div className="improved-legend">
            <div className="legend-items">
                <div className="legend-item">
                    <div className="legend-line" style={{backgroundColor: '#ef4444'}}></div>
                    <span>Item 1</span>
                </div>
                <div className="legend-item">
                    <div className="legend-line" style={{backgroundColor: '#10b981'}}></div>
                    <span>Item 2</span>
                </div>
                <div className="legend-item">
                    <div className="legend-line" style={{backgroundColor: '#f59e0b'}}></div>
                    <span>Item 3</span>
                </div>
                <div className="legend-item">
                    <div className="legend-line" style={{backgroundColor: '#3b82f6'}}></div>
                    <span>Item 4</span>
                </div>
            </div>
        </div>

        {/* COMPACT MODEL PERFORMANCE */}
        <div className="compact-performance">
            <h4>Model Performance</h4>
            <div className="performance-grid">
                <div className="performance-item">
                    <span className="performance-label">Training Score:</span>
                    <span className="performance-value">92.2%</span>
                </div>
                <div className="performance-item">
                    <span className="performance-label">Validation Score:</span>
                    <span className="performance-value">79.8%</span>
                </div>
                <div className="performance-item">
                    <span className="performance-label">Selected Features:</span>
                    <span className="performance-value">2</span>
                </div>
                <div className="performance-item">
                    <span className="performance-label">Overfitting Gap:</span>
                    <span className="performance-value">12.4%</span>
                </div>
            </div>
        </div>
    </div>

    {/* CONTROLS PANEL - NARROW */}
    <div className="controls-panel">
        {/* Dataset selection */}
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Dataset Selection</h3>
            </div>
            <div className="card-body">
                {/* Dataset controls */}
            </div>
        </div>
        
        {/* Parameter controls */}
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Parameters</h3>
            </div>
            <div className="card-body">
                {/* Parameter controls */}
            </div>
        </div>
        
        {/* Algorithm controls */}
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Algorithm Controls</h3>
            </div>
            <div className="card-body">
                {/* Algorithm controls */}
            </div>
        </div>
        
        {/* Performance metrics */}
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Model Performance</h3>
            </div>
            <div className="card-body">
                {/* Performance metrics */}
            </div>
        </div>
    </div>
</div>

{/* ADDITIONAL VISUALIZATIONS SECTION */}
<div className="additional-visualizations">
    <div className="visualization-grid">
        {/* Secondary visualization */}
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Secondary Chart</h3>
            </div>
            <div className="card-body">
                <div className="visualization-container">
                    <svg ref={secondaryRef} className="simulation-svg"></svg>
                </div>
            </div>
        </div>
        
        {/* Tertiary visualization */}
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Another Chart</h3>
            </div>
            <div className="card-body">
                <div className="visualization-container">
                    <svg ref={tertiaryRef} className="simulation-svg"></svg>
                </div>
            </div>
        </div>
    </div>
</div>
```

**CSS for Improved Layout:**
```css
/* Improved 2-column layout */
.your-simulation-name .improved-simulation-layout {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: var(--space-6);
    margin-bottom: var(--space-6);
}

/* Horizontal visualization controls */
.your-simulation-name .visualization-controls {
    display: flex;
    flex-direction: row;
    gap: var(--space-4);
    align-items: center;
    flex-wrap: wrap;
}

.your-simulation-name .main-visualization-panel {
    background-color: white;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--secondary-200);
    overflow: hidden;
}

.your-simulation-name .controls-panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
}

/* Improved legend styling */
.your-simulation-name .improved-legend {
    padding: var(--space-4);
    background-color: var(--secondary-50);
    border-top: 1px solid var(--secondary-200);
}

.your-simulation-name .improved-legend .legend-items {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
}

/* Compact performance section */
.your-simulation-name .compact-performance {
    padding: var(--space-4);
    background-color: var(--secondary-50);
    border-top: 1px solid var(--secondary-200);
}

.your-simulation-name .compact-performance h4 {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--secondary-800);
    margin: 0 0 var(--space-3) 0;
}

.your-simulation-name .performance-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-2);
}

.your-simulation-name .performance-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: var(--font-size-xs);
}

.your-simulation-name .performance-label {
    color: var(--secondary-600);
    font-weight: var(--font-weight-medium);
}

.your-simulation-name .performance-value {
    color: var(--primary-600);
    font-weight: var(--font-weight-semibold);
}

.your-simulation-name .legend-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--font-size-xs);
    color: var(--secondary-700);
}

.your-simulation-name .legend-line {
    width: 20px;
    height: 3px;
    border-radius: var(--radius-sm);
}

/* Additional visualizations section */
.your-simulation-name .additional-visualizations {
    margin-top: var(--space-6);
}

.your-simulation-name .visualization-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-6);
    margin-bottom: var(--space-6);
}

/* Compact additional visualizations */
.your-simulation-name .compact-additional-visualizations {
    margin-top: var(--space-6);
}

.your-simulation-name .compact-visualization-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-6);
    margin-bottom: var(--space-6);
}

/* Responsive design for improved layout */
@media (max-width: 1200px) {
    .your-simulation-name .improved-simulation-layout {
        grid-template-columns: 1fr;
    }
    
    .your-simulation-name .controls-panel {
        order: -1;
    }
    
    .your-simulation-name .improved-legend .legend-items {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .your-simulation-name .visualization-grid {
        grid-template-columns: 1fr;
    }
}
```

**When to use the improved layout pattern:**
- **Better readability**: 2-column layout is easier to read and navigate
- **Proper graph scaling**: Main visualization gets adequate space
- **Multiple visualizations**: When you have 2+ supporting charts
- **Performance metrics**: When metrics need to be visible alongside the main chart
- **Complex algorithms**: When you need legend explanations for the main visualization
- **Educational focus**: When students need to see all information clearly
- **All screen sizes**: Works well on desktop, tablet, and mobile

**Benefits:**
- **Better readability**: 2:1 ratio provides optimal space for main chart
- **Proper scaling**: Graphs are not clipped and display fully
- **Clear legend**: 2-column legend is easy to read and understand
- **Reduced scrolling**: Additional visualizations below in organized grid
- **Responsive design**: Adapts gracefully to different screen sizes
- **Professional appearance**: Clean, organized, and easy to understand
- **Educational focus**: Students can see all related information clearly

## 📚 Enhanced Educational Content

### 6.1. Comprehensive Usage Instructions
**Include step-by-step guidance for students:**

```tsx
<div className="card">
    <div className="card-header">
        <h3 className="card-title">How to Use This Simulation</h3>
    </div>
    <div className="card-body">
        <div className="explanation-content">
            <h4>Step-by-Step Instructions</h4>
            <ol className="instruction-list">
                <li><strong>Start with the main graph:</strong> Observe how different parameters affect the visualization</li>
                <li><strong>Adjust parameters:</strong> Use sliders to change values and watch the effects</li>
                <li><strong>Try different datasets:</strong> Switch between different data scenarios</li>
                <li><strong>Experiment with settings:</strong> Compare different algorithm types</li>
                <li><strong>Watch supporting charts:</strong> See how parameters affect related visualizations</li>
                <li><strong>Analyze results:</strong> Find optimal parameter values</li>
            </ol>
        </div>
    </div>
</div>
```

### 6.2. Parameter Explanation Guide
**Provide clear explanations of what each parameter does:**

```tsx
<div className="parameter-guide">
    <div className="parameter-item">
        <h5>Parameter Name - What It Does</h5>
        <p><strong>What it does:</strong> Clear explanation of the parameter's purpose</p>
        <ul>
            <li><strong>Value 1:</strong> What happens at this value</li>
            <li><strong>Value 2:</strong> What happens at this value</li>
            <li><strong>Value 3:</strong> What happens at this value</li>
        </ul>
        <p><strong>What to look for:</strong> What students should observe</p>
    </div>
</div>
```

### 6.3. Visualization Interpretation Guide
**Help students understand what they're seeing:**

```tsx
<div className="visualization-guide">
    <div className="viz-explanation">
        <h5>Graph Name - What You're Seeing</h5>
        <p><strong>What you're seeing:</strong> Clear description of the visualization</p>
        <ul>
            <li><strong>X-axis:</strong> What the horizontal axis represents</li>
            <li><strong>Y-axis:</strong> What the vertical axis represents</li>
            <li><strong>Lines/Points:</strong> What different elements mean</li>
        </ul>
        <p><strong>What to look for:</strong></p>
        <ul>
            <li><strong>Pattern 1:</strong> What this pattern indicates</li>
            <li><strong>Pattern 2:</strong> What this pattern indicates</li>
            <li><strong>Optimal values:</strong> How to identify the best settings</li>
        </ul>
    </div>
</div>
```

**CSS for Enhanced Educational Content:**
```css
/* Enhanced educational content styling */
.your-simulation-name .instruction-list {
    counter-reset: step-counter;
    list-style: none;
    padding-left: 0;
}

.your-simulation-name .instruction-list li {
    counter-increment: step-counter;
    margin-bottom: var(--space-4);
    padding-left: var(--space-8);
    position: relative;
}

.your-simulation-name .instruction-list li::before {
    content: counter(step-counter);
    position: absolute;
    left: 0;
    top: 0;
    background-color: var(--primary-600);
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
}

.your-simulation-name .parameter-guide {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-6);
    margin: var(--space-6) 0;
}

.your-simulation-name .parameter-item {
    background-color: var(--secondary-50);
    padding: var(--space-4);
    border-radius: var(--radius-md);
    border-left: 4px solid var(--primary-500);
}

.your-simulation-name .visualization-guide {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-6);
    margin: var(--space-6) 0;
}

.your-simulation-name .viz-explanation {
    background-color: var(--secondary-50);
    padding: var(--space-4);
    border-radius: var(--radius-md);
    border-left: 4px solid var(--secondary-500);
}

/* Responsive design for educational content */
@media (max-width: 768px) {
    .your-simulation-name .parameter-guide {
        grid-template-columns: 1fr;
    }
}
```

**Benefits of Enhanced Educational Content:**
- **Clear instructions**: Students know exactly how to use the simulation
- **Parameter understanding**: Clear explanations of what each control does
- **Graph interpretation**: Students learn to read and understand visualizations
- **Learning objectives**: Clear goals for what students should achieve
- **Professional appearance**: Well-organized, visually appealing educational content

## 🎨 CSS Customization Guide

### Required Changes:
1. **Update class name**: Replace `your-simulation-name` with your actual class name
2. **Keep all design system variables**: Never hardcode colors or spacing
3. **Follow the established patterns**: Don't create new layout structures

### Allowed Customizations:
```css
/* ✅ GOOD: Custom simulation-specific styles */
.your-simulation-name .custom-element {
    /* Your custom styles here */
}

/* ✅ GOOD: Custom animations */
.your-simulation-name .custom-animation {
    /* Your custom animations here */
}
```

### Forbidden Patterns:
```css
/* ❌ BAD: Don't override core layout */
.your-simulation-name .simulation-layout {
    grid-template-columns: 1fr; /* ❌ Don't change the grid */
}

/* ❌ BAD: Don't use hardcoded colors */
.your-simulation-name .custom-element {
    color: #ff0000; /* ❌ Use CSS variables instead */
    background: blue; /* ❌ Use var(--primary-600) instead */
}

/* ❌ BAD: Don't change header backgrounds */
.your-simulation-name .visualization-header {
    background-color: var(--primary-50); /* ❌ Always use var(--secondary-50) */
}
```

## 📋 Component Structure Checklist

### Required Sections (in order):
- [ ] **Page Header**: Title and description
- [ ] **Simulation Layout**: Grid with visualization and controls
- [ ] **Visualization Panel**: D3.js visualization with controls
- [ ] **Controls Panel**: Parameter controls, algorithm controls, results
- [ ] **Additional Visualizations** (Optional): Performance metrics, secondary charts
- [ ] **Explanation Section**: Educational content
- [ ] **Copyright Notice**: Standard footer

### Required Cards in Controls Panel:
- [ ] **Parameter Controls**: Sliders, inputs, dropdowns
- [ ] **Algorithm Controls**: Run, reset, step buttons
- [ ] **Results Display**: Metrics and calculations

### Optional Additional Visualizations Section:
- [ ] **Performance Metrics**: Training/validation scores, overfitting gap
- [ ] **Secondary Charts**: Coefficient paths, validation curves, confusion matrices
- [ ] **Responsive Grid**: 3 columns on desktop, 2 on tablet, 1 on mobile

## 🎯 Design System Compliance

### CSS Variables (Always Use These):
```css
/* Colors */
var(--primary-600)     /* Primary blue */
var(--secondary-800)   /* Dark text */
var(--secondary-50)    /* Light gray backgrounds */

/* Spacing */
var(--space-4)         /* 16px */
var(--space-6)         /* 24px */
var(--space-8)         /* 32px */

/* Typography */
var(--font-size-lg)    /* 18px */
var(--font-weight-semibold) /* 600 */

/* Border Radius */
var(--radius-lg)       /* 8px */
var(--radius-md)       /* 6px */
```

### Required Patterns:
```css
/* ✅ Header backgrounds (ALWAYS light gray) */
.your-simulation-name .visualization-header {
    background-color: var(--secondary-50);
}

/* ✅ Card structure */
.your-simulation-name .card {
    background-color: white;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--secondary-200);
}
```

## 📱 Responsive Design

### Standard Breakpoints:
- **Desktop**: 1024px+ (Grid layout with sidebar)
- **Tablet**: 768px-1024px (Stacked layout)
- **Mobile**: <768px (Single column, optimized controls)

### Required Responsive Patterns:
```css
@media (max-width: 1024px) {
    .your-simulation-name .simulation-layout {
        grid-template-columns: 1fr;
    }
    .your-simulation-name .controls-panel {
        order: -1;
    }
}
```

## 🧪 Testing Your Simulation

### Visual Checklist:
- [ ] Header has light gray background (`var(--secondary-50)`)
- [ ] All cards use consistent styling
- [ ] Controls are properly aligned
- [ ] Visualization is centered and responsive
- [ ] Mobile layout works correctly
- [ ] All text is readable and properly sized

### Functionality Checklist:
- [ ] Parameters update the visualization
- [ ] Algorithm controls work correctly
- [ ] Results display updates properly
- [ ] Reset functionality works
- [ ] No console errors

## 🚨 Common Mistakes to Avoid

### 1. Layout Mistakes:
```css
/* ❌ Don't change the grid structure */
.your-simulation-name .simulation-layout {
    display: flex; /* ❌ Wrong */
}

/* ✅ Keep the standard grid */
.your-simulation-name .simulation-layout {
    display: grid;
    grid-template-columns: 1fr 400px;
}
```

### 2. Color Mistakes:
```css
/* ❌ Don't use hardcoded colors */
.custom-element {
    color: #333333; /* ❌ Wrong */
}

/* ✅ Use design system variables */
.custom-element {
    color: var(--secondary-800); /* ✅ Correct */
}
```

### 3. Spacing Mistakes:
```css
/* ❌ Don't use hardcoded spacing */
.custom-element {
    margin: 20px; /* ❌ Wrong */
}

/* ✅ Use design system spacing */
.custom-element {
    margin: var(--space-5); /* ✅ Correct */
}
```

### 4. Data Generation Mistakes:
```typescript
/* ❌ Don't generate data inside visualization functions */
const drawVisualization = () => {
    const data = generateRandomData(); // ❌ Wrong - creates new data every time
    // ... visualization code
};

/* ✅ Generate data in useEffect and store in state */
const [currentData, setCurrentData] = useState<YourDataPoint[]>([]);

useEffect(() => {
    const newData = generateRandomData();
    setCurrentData(newData);
}, [selectedDataset]);

const drawVisualization = () => {
    const data = currentData; // ✅ Correct - uses stable data
    // ... visualization code
};
```

**Why avoid data generation in visualization:**
- Data points jump around when parameters change
- Poor user experience for parameter exploration
- Breaks the learning flow
- Violates React state management principles

### 5. Tips Overlay Mistakes:
```tsx
/* ❌ Don't add tips overlays that cover the visualization */
<div className="visualization-container">
    <div className="visualization-instructions">
        <strong>Tips:</strong> Hover over points... {/* ❌ Wrong - covers graph */}
    </div>
    <svg ref={svgRef}></svg>
</div>

/* ✅ Keep visualization clean and unobstructed */
<div className="visualization-container">
    <svg ref={svgRef}></svg>
</div>
```

**Why avoid tips overlays:**
- They cover important parts of the visualization
- Users can't see the full graph clearly
- They create accessibility issues
- They're not dismissible in a user-friendly way
- They break the clean, professional design

## 📚 Best Practices

### 1. Code Organization:
- Keep algorithm logic separate from UI logic
- Use TypeScript interfaces for all data structures
- Follow the established component structure

### 2. Performance:
- Use `useEffect` for visualization updates
- Debounce parameter changes if needed
- Clean up D3 selections properly

### 3. Accessibility:
- Use semantic HTML elements
- Provide proper labels for form controls
- Ensure sufficient color contrast

### 4. Educational Value:
- Include clear explanations
- Provide real-world examples
- Use progressive complexity

## 🔧 Advanced Customization

### Custom Visualization Elements:
```typescript
// Add custom D3 elements while following patterns
g.selectAll('.custom-element')
    .data(data)
    .enter()
    .append('circle')
    .attr('class', 'custom-element')
    .style('fill', d => d.color || var(--primary-600))
    .style('stroke', var(--secondary-400));
```

### Custom Animations:
```css
.your-simulation-name .custom-animation {
    transition: all var(--transition-normal);
}

.your-simulation-name .custom-animation:hover {
    transform: scale(1.05);
}
```

## 📖 Example Implementation

See the existing simulations for examples:
- `CosineSimilarity.tsx` - Vector visualization
- `DecisionTree.tsx` - Tree structure
- `KMeansClustering.tsx` - Scatter plot with clustering

## 🆘 Troubleshooting

### Common Issues:

**Q: My visualization isn't showing up**
A: Check that you're using the correct ref and calling `drawVisualization()` in useEffect

**Q: Styling looks inconsistent**
A: Make sure you're using the design system variables and following the CSS patterns

**Q: Mobile layout is broken**
A: Check that you're using the responsive patterns and not overriding the grid system

**Q: Controls aren't working**
A: Verify that your event handlers are properly connected to state updates

## 📞 Support

If you need help with the template system:
1. Check this guide first
2. Look at existing simulations for examples
3. Follow the established patterns
4. Test thoroughly before deploying

---

**Remember**: The template system is designed to make development faster and more consistent. Follow the patterns, use the design system, and your simulations will look professional and work reliably.
