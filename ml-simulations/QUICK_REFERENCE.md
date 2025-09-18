# Quick Reference - ML Simulations

## **🚨 CRITICAL RULES**

### **1. Header Backgrounds**
```css
/* ✅ ALWAYS use this for visualization headers */
.visualization-header {
    background-color: var(--secondary-50);
}

/* ❌ NEVER use gradients in headers */
.visualization-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### **2. Page-Specific CSS**
```css
/* ✅ ALWAYS prefix with page name to avoid conflicts */
.your-page-name .visualization-header {
    background-color: var(--secondary-50) !important;
}
```

### **3. Color Standards**
- **Headers**: `var(--secondary-50)` (light gray)
- **Text**: `var(--secondary-800)` (dark gray)
- **Borders**: `var(--secondary-200)` (light gray)
- **Accents**: `var(--primary-600)` (blue)

## **🔧 Quick Fixes**

### **Remove All Problematic Gradients**
```bash
# Find all gradients
grep -r "background.*gradient" src/pages/

# Replace with standard backgrounds
sed -i 's/background: linear-gradient.*;/background-color: var(--secondary-50);/g' src/pages/*.css
```

### **Add Page-Specific Selectors**
```bash
# Add page prefix to avoid conflicts
sed -i 's/\.visualization-header/\.page-name .visualization-header/g' src/pages/PageName.css
```

## **📋 Pre-Deployment Checklist**

- [ ] No purple/blue gradients in headers
- [ ] All text is highly readable
- [ ] Page-specific CSS selectors used
- [ ] Consistent spacing with design system
- [ ] Responsive design works
- [ ] No CSS conflicts with other pages

## **🎨 Design System Variables**

```css
/* Spacing */
var(--space-4)    /* Small */
var(--space-6)    /* Medium */
var(--space-8)    /* Large */

/* Colors */
var(--secondary-50)   /* Light backgrounds */
var(--secondary-200) /* Borders */
var(--secondary-800) /* Dark text */
var(--primary-600)   /* Accent color */

/* Typography */
var(--font-size-xl)  /* Large headings */
var(--font-weight-semibold) /* Medium weight */
```

## **🚀 New Simulation Setup**

1. Copy `Template.css` to `YourSimulation.css`
2. Replace `your-simulation-name` with actual page class
3. Follow the template patterns exactly
4. Test for readability and consistency
5. Use page-specific selectors to avoid conflicts

## **⚡ Emergency Override**

If you need to quickly fix a problematic style:

```css
.your-page-name .visualization-header {
    background-color: var(--secondary-50) !important;
}
```

## **🔍 Testing Commands**

```bash
# Check for problematic gradients
grep -r "background.*gradient" src/pages/

# Check for missing page-specific selectors
grep -r "\.visualization-header" src/pages/ | grep -v "\.page-name"

# Validate CSS
npm run build
```
