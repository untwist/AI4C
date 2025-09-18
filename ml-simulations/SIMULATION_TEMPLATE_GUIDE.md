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
- [ ] **Explanation Section**: Educational content
- [ ] **Copyright Notice**: Standard footer

### Required Cards in Controls Panel:
- [ ] **Parameter Controls**: Sliders, inputs, dropdowns
- [ ] **Algorithm Controls**: Run, reset, step buttons
- [ ] **Results Display**: Metrics and calculations

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
