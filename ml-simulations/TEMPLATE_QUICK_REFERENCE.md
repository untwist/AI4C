# 🚀 Template System Quick Reference

## **For New Simulations - ALWAYS Use This**

### **Step 1: Copy Template Files**
```bash
# Copy the template files
cp src/templates/SimulationTemplate.tsx src/pages/YourSimulationName.tsx
cp src/templates/SimulationTemplate.css src/pages/YourSimulationName.css
```

### **Step 2: Update Class Names**
```bash
# Update CSS class names
sed -i 's/your-simulation-name/your-actual-simulation-name/g' src/pages/YourSimulationName.css

# Update React component name
sed -i 's/YourSimulationName/YourActualSimulationName/g' src/pages/YourSimulationName.tsx
```

### **Step 3: Customize Your Simulation**
1. **Update data interfaces** (lines 15-25 in template)
2. **Implement your algorithm** (lines 55-75 in template)
3. **Add your D3.js visualization** (lines 80-150 in template)
4. **Customize UI text** (lines 200-400 in template)

### **Step 3.1: Data Generation Best Practice**
```typescript
// ✅ CORRECT - Generate data in useEffect, store in state
const [currentData, setCurrentData] = useState<YourDataPoint[]>([]);

useEffect(() => {
    const newData = generateRandomData();
    setCurrentData(newData);
}, [selectedDataset]);

const drawVisualization = () => {
    const data = currentData; // ✅ Uses stable data
    // ... visualization code
};
```

### **Step 4: Add to Routing**
1. Add route in `src/App.tsx`
2. Update sidebar in `src/components/Sidebar.tsx`

## **Template System Benefits**

✅ **Consistent Styling** - All simulations look professional  
✅ **Design System Compliance** - Proper use of CSS variables  
✅ **Responsive Design** - Mobile-friendly out of the box  
✅ **Faster Development** - No need to reinvent the wheel  
✅ **Easy Maintenance** - Update template, update all simulations  

## **What the Template Provides**

### **Standardized Components:**
- **Page Header** - Title and description
- **Simulation Layout** - Grid with visualization and controls
- **Visualization Panel** - D3.js visualization with controls
- **Controls Panel** - Parameter controls, algorithm controls, results
- **Explanation Section** - Educational content
- **Copyright Notice** - Standard footer

### **Design System Compliance:**
- All colors use CSS variables (`var(--primary-600)`)
- All spacing uses design system spacing (`var(--space-6)`)
- All typography follows the design system
- Consistent responsive breakpoints

## **Template Structure**

```
src/templates/
├── SimulationTemplate.tsx          # Standardized React component
├── SimulationTemplate.css          # Standardized CSS
├── ExampleLinearRegression.tsx     # Working example
├── ExampleLinearRegression.css     # Example CSS
└── SIMULATION_TEMPLATE_GUIDE.md   # Complete documentation
```

## **Quick Commands**

### **Create New Simulation:**
```bash
# 1. Copy template
cp src/templates/SimulationTemplate.tsx src/pages/MyNewSimulation.tsx
cp src/templates/SimulationTemplate.css src/pages/MyNewSimulation.css

# 2. Update class names
sed -i 's/your-simulation-name/my-new-simulation/g' src/pages/MyNewSimulation.css
sed -i 's/YourSimulationName/MyNewSimulation/g' src/pages/MyNewSimulation.tsx

# 3. Start customizing!
```

### **Check Template Compliance:**
```bash
# Check if simulation uses template system
grep -r "your-simulation-name" src/pages/YourSimulation.css
# Should return no results if properly updated
```

## **Forbidden Patterns**

❌ **Don't create simulations from scratch** - Always use the template system  
❌ **Don't override template CSS** - Customize only the algorithm and visualization  
❌ **Don't use hardcoded colors** - Use CSS variables  
❌ **Don't create custom layouts** - Use the template structure  
❌ **Don't generate data in visualization functions** - Use stable state data  

## **Documentation**

- **Complete Guide**: `SIMULATION_TEMPLATE_GUIDE.md`
- **Working Example**: `src/templates/ExampleLinearRegression.tsx`
- **Style Guide**: `STYLE_GUIDE.md`
- **Main README**: `README.md`

## **Emergency Fixes**

If you accidentally create a simulation without the template system:

1. **Copy template files** to your simulation
2. **Migrate your algorithm logic** to the template structure
3. **Update your D3.js visualization** to follow template patterns
4. **Remove custom CSS** that conflicts with the template

## **Template System Checklist**

Before deploying any new simulation:

- [ ] **Used template system** - Started with `SimulationTemplate.tsx` and `SimulationTemplate.css`
- [ ] **Updated class names** - Replaced `your-simulation-name` with actual class name
- [ ] **Followed template structure** - Used the standardized component layout
- [ ] **Customized algorithm only** - Only modified the algorithm logic and visualization
- [ ] **No manual styling** - Didn't create custom CSS that overrides the template

---

**Remember**: The template system is designed to make development faster and more consistent. Follow the patterns, use the design system, and your simulations will look professional and work reliably.
