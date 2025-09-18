# ML Simulations Style Guide

## **Design Principles**

### **1. Consistency First**
- All simulations must follow the same visual design patterns
- Use the established design system variables
- Maintain consistent spacing, typography, and color schemes

### **2. Readability Priority**
- Text must be highly readable against backgrounds
- Avoid gradients that reduce text contrast
- Use high contrast ratios for accessibility

## **Color Standards**

### **Header Backgrounds**
```css
/* ✅ CORRECT - Use light gray backgrounds */
.visualization-header {
    background-color: var(--secondary-50);
}

/* ❌ AVOID - Don't use gradients for headers */
.visualization-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### **Page Backgrounds**
```css
/* ✅ CORRECT - Use subtle gradients or solid colors */
.page-header {
    background-color: var(--secondary-50);
}

/* ✅ ACCEPTABLE - Very subtle gradients only */
.page-header {
    background: linear-gradient(135deg, var(--primary-50) 0%, var(--secondary-50) 100%);
}
```

### **Card Backgrounds**
```css
/* ✅ CORRECT - Use standard card backgrounds */
.card {
    background-color: white;
    border: 1px solid var(--secondary-200);
}
```

## **Component Templates**

### **Visualization Header Template**
```css
.visualization-header {
    padding: var(--space-6);
    border-bottom: 1px solid var(--secondary-200);
    background-color: var(--secondary-50);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.visualization-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--secondary-800);
    margin: 0;
}
```

### **Page Header Template**
```css
.page-header {
    text-align: center;
    margin-bottom: var(--space-8);
}

.page-title {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--secondary-800);
    margin: 0 0 var(--space-4) 0;
}

.page-description {
    font-size: var(--font-size-lg);
    color: var(--secondary-600);
    max-width: 800px;
    margin: 0 auto;
    line-height: var(--line-height-relaxed);
}
```

### **Simulation Layout Template**
```css
.simulation-layout {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: var(--space-8);
    margin-bottom: var(--space-8);
}

.visualization-panel {
    background-color: white;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--secondary-200);
    overflow: hidden;
}

.controls-panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
}
```

## **Forbidden Patterns**

### **❌ NEVER USE:**
- Purple/blue gradients for headers
- Dark backgrounds with light text (unless specifically designed)
- High contrast gradients that reduce readability
- Inline styles that override the design system

### **❌ AVOID:**
- Complex gradients in headers
- Bright, saturated colors for backgrounds
- Text colors that don't meet accessibility standards

## **CSS Specificity Rules**

### **Use Page-Specific Selectors**
```css
/* ✅ CORRECT - Use page-specific selectors to avoid conflicts */
.linear-regression .visualization-header {
    background-color: var(--secondary-50) !important;
}

/* ❌ AVOID - Global selectors that can conflict */
.visualization-header {
    background-color: var(--secondary-50);
}
```

### **Import Order**
1. Design system CSS
2. Component CSS (Header, Sidebar)
3. Page-specific CSS (in alphabetical order)
4. App CSS

## **Testing Checklist**

Before deploying any simulation:

- [ ] Header has light gray background (`var(--secondary-50)`)
- [ ] Text is highly readable against all backgrounds
- [ ] No purple/blue gradients in headers
- [ ] Consistent spacing using design system variables
- [ ] Responsive design works on mobile
- [ ] No CSS conflicts with other simulations
- [ ] All interactive elements are accessible

## **Quick Fix Commands**

### **Remove Problematic Gradients**
```bash
# Find all gradient backgrounds
grep -r "background.*gradient" src/pages/

# Replace purple gradients with standard backgrounds
sed -i 's/background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);/background-color: var(--secondary-50);/g' src/pages/*.css
```

### **Add Page-Specific Selectors**
```bash
# Add page-specific prefix to avoid conflicts
sed -i 's/\.visualization-header/\.page-name .visualization-header/g' src/pages/PageName.css
```

## **Design System Variables**

Use these variables consistently:

```css
/* Colors */
var(--secondary-50)    /* Light gray backgrounds */
var(--secondary-200)    /* Borders */
var(--secondary-600)    /* Secondary text */
var(--secondary-800)    /* Primary text */
var(--primary-50)      /* Accent backgrounds */
var(--primary-600)     /* Accent text */

/* Spacing */
var(--space-4)         /* Small spacing */
var(--space-6)         /* Medium spacing */
var(--space-8)         /* Large spacing */

/* Typography */
var(--font-size-xl)    /* Large headings */
var(--font-size-lg)    /* Descriptions */
var(--font-weight-semibold) /* Medium weight */
```

## **Emergency Fixes**

If you accidentally introduce problematic styles:

1. **Immediate Fix**: Add `!important` to override
2. **Proper Fix**: Use page-specific selectors
3. **Prevention**: Follow this style guide

```css
/* Emergency override */
.page-name .visualization-header {
    background-color: var(--secondary-50) !important;
}
```
