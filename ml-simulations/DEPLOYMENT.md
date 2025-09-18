# Deployment Guide

## Quick Deployment to GitHub Pages

### Step 1: Create GitHub Repository
1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `ml-simulations` (or update the base path in `vite.config.ts`)
3. Make it public so GitHub Pages can serve it

### Step 2: Push Your Code
```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: ML Simulations platform"

# Add your GitHub repository as origin
git remote add origin https://github.com/YOUR_USERNAME/ml-simulations.git

# Push to main branch
git push -u origin main
```

### Step 3: Deploy to GitHub Pages
```bash
# Deploy using the npm script
npm run deploy
```

This will:
- Build the production version
- Create a `gh-pages` branch
- Push the built files to GitHub Pages

### Step 4: Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select **Deploy from a branch**
4. Select **gh-pages** branch and **/ (root)** folder
5. Click **Save**

### Step 5: Access Your Site
Your site will be available at:
`https://YOUR_USERNAME.github.io/ml-simulations/`

## Updating Your Site

After making changes:
```bash
# Make your changes
# ... edit files ...

# Commit changes
git add .
git commit -m "Update: description of changes"
git push origin main

# Deploy updates
npm run deploy
```

## Troubleshooting

### Common Issues

1. **404 Error on Direct URLs**: This is fixed with the included `404.html` file that handles SPA routing
2. **Repository Name Mismatch**: Make sure the repository name matches the base path in `vite.config.ts`
3. **Build Fails**: Check for TypeScript errors with `npm run build`
4. **Styling Issues**: Ensure all CSS files are properly imported
5. **Routing Issues**: The `404.html` and updated `index.html` handle client-side routing for GitHub Pages

### SPA Routing Fix

The project includes a `404.html` file that redirects all 404 errors back to the main `index.html`, allowing React Router to handle the routing. This enables direct linking to simulation pages like:
- `https://untwist.github.io/AI4C/kmeans-clustering`
- `https://untwist.github.io/AI4C/cosine-similarity`
- `https://untwist.github.io/AI4C/decision-trees`

### Custom Domain (Optional)

To use a custom domain:
1. Add a `CNAME` file to the `public` folder with your domain
2. Configure DNS settings with your domain provider
3. Update GitHub Pages settings to use your custom domain

## Local Testing

Before deploying, test locally:
```bash
# Build the project
npm run build

# Preview the production build
npm run preview
```

This will show you exactly what will be deployed to GitHub Pages.
