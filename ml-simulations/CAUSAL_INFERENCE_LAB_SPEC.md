# Causal Inference Lab - Simulation Specification

## Overview
A comprehensive interactive simulation for teaching causal inference concepts to students in data science, machine learning, and statistics courses. This simulation focuses specifically on establishing causation through controlled experiments and advanced causal inference methods.

## Educational Objectives
- **Understand the difference between correlation and causation**
- **Learn to design controlled experiments** (A/B testing, randomized controlled trials)
- **Identify and control for confounding variables**
- **Master causal inference methods** (instrumental variables, regression discontinuity, etc.)
- **Interpret causal diagrams** and understand causal pathways
- **Recognize common biases** in causal inference

## Core Features

### 1. Experiment Designer
**Interactive A/B Testing Simulator**
- **Random Assignment Tool**: Students assign subjects to treatment/control groups
- **Sample Size Calculator**: Show how sample size affects statistical power
- **Blinding Controls**: Demonstrate single-blind and double-blind studies
- **Placebo Effects**: Show how placebos can create false causation
- **Multiple Treatment Arms**: Compare different interventions

**Visual Elements:**
- Drag-and-drop subject assignment interface
- Real-time statistical power calculations
- Animated randomization process
- Treatment effect visualization

### 2. Confounding Variables Explorer
**Hidden Confounders Simulator**
- **Toggle Confounders**: Add/remove confounding variables to see their impact
- **Mediation Analysis**: Trace causal pathways through intermediate variables
- **Collider Bias**: Demonstrate how conditioning on certain variables creates bias
- **Selection Bias**: Show how non-random sampling affects causal inference

**Interactive Features:**
- Slider controls for confounding strength
- Causal pathway animations
- Bias detection warnings
- Sensitivity analysis tools

### 3. Causal Diagrams (DAGs)
**Directed Acyclic Graph Builder**
- **Node Creation**: Add variables, treatments, outcomes, confounders
- **Edge Drawing**: Create causal relationships between variables
- **Path Highlighting**: Show direct vs indirect causal effects
- **Collision Detection**: Identify colliders and their effects
- **Backdoor Paths**: Visualize confounding through backdoor paths

**Educational Content:**
- Pre-built scenarios (medical trials, policy evaluation, social experiments)
- Step-by-step DAG construction tutorials
- Common causal diagram patterns
- Bias identification exercises

### 4. Advanced Causal Methods
**Instrumental Variables Explorer**
- **Natural Experiments**: Find variables that create random assignment
- **Exclusion Restriction**: Verify instrumental variable assumptions
- **First Stage/Reduced Form**: Show two-stage least squares process
- **Weak Instruments**: Demonstrate problems with weak instruments

**Regression Discontinuity Designer**
- **Sharp Cutoffs**: Create treatment assignment rules
- **Fuzzy RDD**: Handle imperfect compliance
- **Bandwidth Selection**: Choose appropriate analysis windows
- **Placebo Tests**: Verify the design assumptions

**Difference-in-Differences Simulator**
- **Pre/Post Comparison**: Show treatment effects over time
- **Parallel Trends**: Verify the key identifying assumption
- **Multiple Time Periods**: Handle panel data structures
- **Event Studies**: Analyze dynamic treatment effects

### 5. Real-World Scenarios
**Medical Trials Laboratory**
- **Drug Effectiveness**: Test new medications with proper controls
- **Side Effect Analysis**: Identify causal vs spurious relationships
- **Dosage Response**: Explore treatment intensity effects
- **Patient Stratification**: Control for patient characteristics

**Policy Evaluation Center**
- **Education Interventions**: Test educational program effectiveness
- **Economic Policies**: Evaluate policy impacts on outcomes
- **Social Programs**: Analyze welfare and social program effects
- **Environmental Regulations**: Study environmental policy impacts

**Social Experiments Hub**
- **Behavioral Interventions**: Test nudges and behavioral changes
- **Social Network Effects**: Analyze peer influence and contagion
- **Discrimination Studies**: Measure causal effects of bias
- **Market Experiments**: Test economic theory predictions

## Technical Implementation

### User Interface Design
**Main Dashboard Layout:**
- **Experiment Designer Panel**: Left side with controls and parameters
- **Causal Diagram Canvas**: Center for DAG construction and visualization
- **Results Panel**: Right side showing statistical results and interpretations
- **Method Selector**: Top navigation for different causal inference approaches

**Interactive Elements:**
- Drag-and-drop interface for subject assignment
- Click-to-create nodes for causal diagrams
- Slider controls for parameter adjustment
- Real-time statistical calculations
- Animated causal pathway highlighting

### Data Visualization
**Causal Diagrams (DAGs):**
- Node-and-edge graph visualization using D3.js
- Interactive node creation and connection
- Color coding for different variable types
- Path highlighting for causal chains
- Zoom and pan functionality for complex diagrams

**Statistical Results:**
- Treatment effect estimates with confidence intervals
- Statistical power calculations
- Bias detection warnings
- Sensitivity analysis plots
- Forest plots for multiple studies

**Experiment Visualization:**
- Subject assignment visualization
- Treatment group comparisons
- Outcome distribution plots
- Time series for longitudinal studies
- Heat maps for complex experimental designs

### Educational Content Structure
**Progressive Learning Path:**
1. **Basic Concepts**: Correlation vs causation, confounding
2. **Simple Experiments**: A/B testing, randomization
3. **Advanced Methods**: IV, RDD, DiD
4. **Real Applications**: Medical, policy, social experiments
5. **Bias Recognition**: Common pitfalls and solutions

**Interactive Tutorials:**
- Step-by-step experiment design
- Causal diagram construction guides
- Method selection decision trees
- Bias identification exercises
- Interpretation practice problems

## Sample Datasets and Scenarios

### Medical Trials
- **Drug Effectiveness**: Placebo-controlled drug trials
- **Surgical Procedures**: Treatment vs control group comparisons
- **Preventive Measures**: Vaccination and screening programs
- **Behavioral Interventions**: Lifestyle change programs

### Policy Evaluation
- **Education**: Class size reduction, teacher training, curriculum changes
- **Economic**: Minimum wage, tax policy, unemployment benefits
- **Environmental**: Pollution regulations, carbon pricing
- **Social**: Welfare programs, housing assistance

### Social Experiments
- **Behavioral**: Nudges, incentives, information provision
- **Network Effects**: Peer influence, social contagion
- **Discrimination**: Audit studies, hiring experiments
- **Market**: Price discrimination, auction mechanisms

## Assessment and Learning Outcomes

### Knowledge Checks
- **Concept Identification**: Recognize causal vs correlational relationships
- **Method Selection**: Choose appropriate causal inference methods
- **Bias Detection**: Identify potential sources of bias
- **Interpretation**: Correctly interpret causal estimates

### Practical Skills
- **Experiment Design**: Create valid controlled experiments
- **Causal Diagramming**: Construct accurate DAGs
- **Statistical Analysis**: Perform causal inference calculations
- **Critical Thinking**: Evaluate causal claims in research

### Real-World Application
- **Research Evaluation**: Critically assess published studies
- **Policy Analysis**: Evaluate policy effectiveness
- **Business Decisions**: Make data-driven causal inferences
- **Scientific Communication**: Present causal findings clearly

## Technical Requirements

### Frontend Technologies
- **React.js with TypeScript**: Component-based architecture
- **D3.js**: Interactive causal diagrams and statistical visualizations
- **Math.js**: Statistical calculations and causal inference methods
- **React Router**: Navigation between different causal methods

### Data Management
- **Sample Datasets**: Pre-loaded scenarios for different domains
- **User Experiments**: Save and load custom experimental designs
- **Results Export**: Download statistical results and diagrams
- **Progress Tracking**: Monitor learning progress through exercises

### Performance Considerations
- **Real-time Calculations**: Fast statistical computations
- **Smooth Animations**: Fluid causal pathway highlighting
- **Responsive Design**: Mobile-friendly interface
- **Accessibility**: Screen reader support and keyboard navigation

## Success Metrics
- **Student Engagement**: Time spent exploring different causal methods
- **Learning Outcomes**: Pre/post assessment of causal inference knowledge
- **Practical Skills**: Ability to design valid experiments
- **Critical Thinking**: Recognition of causal vs correlational relationships

## Future Enhancements
- **Collaborative Features**: Multi-user experiment design
- **Real Data Integration**: Connect to actual research datasets
- **Advanced Methods**: Machine learning for causal inference
- **Publication Tools**: Generate research-ready causal diagrams
- **API Integration**: Connect to statistical software (R, Python)

## Development Timeline
- **Phase 1 (Weeks 1-2)**: Basic experiment designer and A/B testing
- **Phase 2 (Weeks 3-4)**: Causal diagrams and confounding variables
- **Phase 3 (Weeks 5-6)**: Advanced methods (IV, RDD, DiD)
- **Phase 4 (Weeks 7-8)**: Real-world scenarios and educational content
- **Phase 5 (Weeks 9-10)**: Polish, testing, and deployment

## Integration with Existing Simulations
- **Correlation Simulation**: Builds on correlation concepts
- **Bayes Theorem**: Connects to Bayesian causal inference
- **Decision Trees**: Links to causal tree methods
- **K-Means Clustering**: Relates to causal clustering approaches

This Causal Inference Lab will provide students with a comprehensive, hands-on understanding of causal inference methods, preparing them for advanced data science and research applications.
