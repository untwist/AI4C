# ML Simulations - Interactive Learning Platform

A comprehensive collection of web-based interactive simulations and tutorials for teaching machine learning and data science concepts. Built specifically for SVA Continuing Education students in creative industries.

## 🚀 Features

- **Interactive Visualizations**: Real-time D3.js-powered simulations
- **Professional Design**: Clean, accessible interface optimized for learning
- **Responsive Layout**: Works on desktop, tablet, and mobile devices
- **GitHub Pages Ready**: Easy deployment with no backend required

## 📚 Available Simulations

### ✅ Cosine Similarity Simulator
- Interactive vector manipulation with real-time calculations
- Visual angle and magnitude display
- Preset examples (identical, orthogonal, opposite, similar)
- Comprehensive explanation of the mathematics and applications

### 🔄 Coming Soon
- Decision Trees
- K-Means Clustering
- Linear Regression
- Neural Networks
- And many more...

## 🛠️ Technology Stack

- **Frontend**: React 19 + TypeScript
- **Visualization**: D3.js
- **Styling**: Custom CSS with design system
- **Build Tool**: Vite
- **Deployment**: GitHub Pages

## 🚀 Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Deployment to GitHub Pages

1. **Create a GitHub repository** named `ml-simulations`
2. **Push your code** to the repository
3. **Deploy** using the included script:
   ```bash
   npm run deploy
   ```
4. **Enable GitHub Pages** in your repository settings:
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` / `/ (root)`

Your site will be available at: `https://yourusername.github.io/ml-simulations/`

## 🎨 Design System

The project uses a comprehensive design system with:
- **Consistent Color Palette**: Professional blues, grays, and accent colors
- **Typography Scale**: Inter font family with proper sizing
- **Component Library**: Reusable buttons, cards, inputs, and layouts
- **Responsive Grid**: Mobile-first design approach
- **Accessibility**: WCAG compliant color contrasts and interactions

## 📖 Usage for Educators

### For Students
1. **Start with the Home Page**: Overview of available simulations
2. **Try Cosine Similarity**: Interactive introduction to vector similarity
3. **Experiment Freely**: Adjust parameters and see immediate results
4. **Read Explanations**: Understand the mathematics and real-world applications

### For Instructors
- **No Installation Required**: Runs entirely in the browser
- **GitHub Integration**: Easy to fork, modify, and deploy
- **Extensible**: Add new simulations by following the established patterns
- **Professional Quality**: Suitable for academic and professional settings

## 🔧 Adding New Simulations

1. **Create a new page** in `src/pages/`
2. **Add routing** in `src/App.tsx`
3. **Update the sidebar** in `src/components/Sidebar.tsx`
4. **Follow the design system** for consistent styling
5. **Use D3.js** for interactive visualizations

### Example Structure
```
src/pages/NewSimulation/
├── NewSimulation.tsx
├── NewSimulation.css
└── components/
    ├── Visualization.tsx
    └── Controls.tsx
```

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🎓 Educational Context

Built for **School of Visual Arts Continuing Education** students who are working professionals in creative industries. The simulations are designed to:

- **Bridge Theory and Practice**: Connect abstract ML concepts to real-world applications
- **Support Visual Learning**: Leverage visual and interactive elements for better comprehension
- **Respect Time Constraints**: Provide quick, focused learning experiences for busy professionals
- **Encourage Exploration**: Allow safe experimentation without complex setup

## 🔮 Future Enhancements

- **Collaborative Features**: Multi-user exploration
- **Gamification**: Points, badges, progress tracking
- **Export Capabilities**: Save simulation states, generate reports
- **Mobile App**: Native iOS/Android versions
- **API Integration**: Connect to real datasets

---

**Built with ❤️ for the SVA Continuing Education community**