#!/bin/bash

# ML Simulations Style Fix Script
# This script removes problematic gradients and ensures consistent styling

echo "🔧 Fixing ML Simulations styles..."

# Find all CSS files in pages directory
CSS_FILES=$(find src/pages -name "*.css" -type f)

echo "📁 Found CSS files:"
echo "$CSS_FILES"

# Fix problematic gradients
echo "🎨 Removing problematic gradients..."

for file in $CSS_FILES; do
    echo "  Processing: $file"
    
    # Replace purple/blue gradients with standard backgrounds
    sed -i '' 's/background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);/background-color: var(--secondary-50);/g' "$file"
    sed -i '' 's/background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);/background-color: var(--primary-50);/g' "$file"
    sed -i '' 's/background: linear-gradient(135deg, #3b82f6, #8b5cf6);/background-color: var(--primary-50);/g' "$file"
    
    # Replace other problematic gradients
    sed -i '' 's/background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);/background-color: var(--secondary-50);/g' "$file"
    sed -i '' 's/background: linear-gradient(135deg, #f8fafc, #f1f5f9);/background-color: var(--secondary-50);/g' "$file"
    
    # Add page-specific selectors to avoid conflicts
    # Extract page name from filename
    PAGE_NAME=$(basename "$file" .css | tr '[:upper:]' '[:lower:]' | sed 's/\([A-Z]\)/-\1/g' | sed 's/^-//')
    
    # Add page-specific prefix to key selectors
    sed -i '' "s/\.visualization-header/\.$PAGE_NAME .visualization-header/g" "$file"
    sed -i '' "s/\.visualization-title/\.$PAGE_NAME .visualization-title/g" "$file"
    sed -i '' "s/\.page-header/\.$PAGE_NAME .page-header/g" "$file"
    sed -i '' "s/\.page-title/\.$PAGE_NAME .page-title/g" "$file"
done

echo "✅ Style fixes completed!"

# Check for remaining problematic patterns
echo "🔍 Checking for remaining issues..."

REMAINING_GRADIENTS=$(grep -r "background.*gradient" src/pages/ | grep -v "linear-gradient(90deg, var(--primary-500), var(--primary-600))" || true)

if [ -n "$REMAINING_GRADIENTS" ]; then
    echo "⚠️  Found remaining gradients:"
    echo "$REMAINING_GRADIENTS"
    echo "Please review these manually."
else
    echo "✅ No problematic gradients found!"
fi

# Check for missing page-specific selectors
echo "🔍 Checking for CSS specificity issues..."

MISSING_PREFIXES=$(grep -r "\.visualization-header" src/pages/ | grep -v "\.page-name\|\.linear-regression\|\.decision-tree\|\.k-means\|\.cosine-similarity" || true)

if [ -n "$MISSING_PREFIXES" ]; then
    echo "⚠️  Found selectors that may need page-specific prefixes:"
    echo "$MISSING_PREFIXES"
else
    echo "✅ All selectors appear to have proper prefixes!"
fi

echo "🎉 Style fix script completed!"
echo ""
echo "📋 Next steps:"
echo "1. Test the application: npm run dev"
echo "2. Check all simulation pages for readability"
echo "3. Verify no purple/blue gradients in headers"
echo "4. Ensure consistent light gray backgrounds"
