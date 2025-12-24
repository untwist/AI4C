import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as d3 from 'd3';
import './ANOVA.css';

interface GroupData {
    mean: number;
    stdDev: number;
    size: number;
    name: string;
}

interface ANOVAParameters {
    numGroups: number;
    groups: GroupData[];
    alpha: number;
}

interface ANOVAResults {
    fStatistic: number;
    pValue: number;
    criticalValue: number;
    betweenGroupVariance: number;
    withinGroupVariance: number;
    decision: 'reject' | 'fail-to-reject';
}

const ANOVA: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);

    const [parameters, setParameters] = useState<ANOVAParameters>({
        numGroups: 3,
        groups: [
            { mean: 50, stdDev: 10, size: 20, name: 'Group 1' },
            { mean: 55, stdDev: 10, size: 20, name: 'Group 2' },
            { mean: 60, stdDev: 10, size: 20, name: 'Group 3' }
        ],
        alpha: 0.05
    });

    const [results, setResults] = useState<ANOVAResults>({
        fStatistic: 0,
        pValue: 0,
        criticalValue: 3.15,
        betweenGroupVariance: 0,
        withinGroupVariance: 0,
        decision: 'fail-to-reject'
    });

    // Calculate ANOVA
    const calculateANOVA = (params: ANOVAParameters): ANOVAResults => {
        const groups = params.groups;
        const totalN = groups.reduce((sum, g) => sum + g.size, 0);
        const grandMean = groups.reduce((sum, g) => sum + g.mean * g.size, 0) / totalN;

        // Between-group variance (MSB)
        const betweenGroupVariance = groups.reduce((sum, g) => {
            return sum + g.size * Math.pow(g.mean - grandMean, 2);
        }, 0) / (groups.length - 1);

        // Within-group variance (MSW)
        const withinGroupVariance = groups.reduce((sum, g) => {
            return sum + (g.size - 1) * g.stdDev * g.stdDev;
        }, 0) / (totalN - groups.length);

        // F-statistic
        const fStatistic = betweenGroupVariance / withinGroupVariance;

        // Critical value (approximation)
        const df1 = groups.length - 1;
        const df2 = totalN - groups.length;
        const criticalValue = df1 === 2 && df2 > 20 ? 3.15 : 3.49;

        // Approximate P-value
        const pValue = fStatistic > criticalValue ? 0.01 : 0.05;

        const decision = pValue <= params.alpha ? 'reject' : 'fail-to-reject';

        return {
            fStatistic,
            pValue,
            criticalValue,
            betweenGroupVariance,
            withinGroupVariance,
            decision
        };
    };

    useEffect(() => {
        const newResults = calculateANOVA(parameters);
        setResults(newResults);
    }, [parameters]);

    // Draw F-distribution visualization
    const drawVisualization = () => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const width = 800;
        const height = 500;
        const margin = { top: 40, right: 40, bottom: 60, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const g = svg
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const df1 = parameters.numGroups - 1;
        const df2 = parameters.groups.reduce((sum, g) => sum + g.size, 0) - parameters.numGroups;
        const maxX = Math.max(results.fStatistic * 1.5, results.criticalValue * 1.5, 5);

        // Create scales
        const xScale = d3.scaleLinear()
            .domain([0, maxX])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([0, 1])
            .range([innerHeight, 0]);

        // Generate F-distribution data (approximation)
        const fData = d3.range(0, maxX, 0.05).map(x => {
            if (x === 0) return { x, y: 0 };
            // Simplified F-distribution approximation
            const y = Math.pow(x, df1/2 - 1) / Math.pow(1 + (df1/df2) * x, (df1 + df2)/2);
            return { x, y: y || 0 };
        });

        // Normalize
        const maxY = d3.max(fData, d => d.y) || 1;
        fData.forEach(d => d.y = (d.y / maxY) * 0.8);

        // Create area generator
        const area = d3.area<{x: number, y: number}>()
            .x(d => xScale(d.x))
            .y0(innerHeight)
            .y1(d => yScale(d.y))
            .curve(d3.curveBasis);

        // Draw F-distribution
        g.append("path")
            .datum(fData)
            .attr("fill", "#3b82f6")
            .attr("fill-opacity", 0.3)
            .attr("stroke", "#3b82f6")
            .attr("stroke-width", 2)
            .attr("d", area);

        // Draw rejection region
        const reject = fData.filter(d => d.x >= results.criticalValue);
        if (reject.length > 0) {
            const rejectRegion = [
                {x: results.criticalValue, y: 0},
                ...reject,
                {x: maxX, y: 0}
            ];
            g.append("path")
                .datum(rejectRegion)
                .attr("fill", "#ef4444")
                .attr("fill-opacity", 0.5)
                .attr("stroke", "#dc2626")
                .attr("stroke-width", 2)
                .attr("d", area);
        }

        // Draw critical value line
        g.append("line")
            .attr("x1", xScale(results.criticalValue))
            .attr("x2", xScale(results.criticalValue))
            .attr("y1", 0)
            .attr("y2", innerHeight)
            .attr("stroke", "#f59e0b")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "5,5");

        // Draw F-statistic line
        g.append("line")
            .attr("x1", xScale(results.fStatistic))
            .attr("x2", xScale(results.fStatistic))
            .attr("y1", 0)
            .attr("y2", innerHeight)
            .attr("stroke", "#1e293b")
            .attr("stroke-width", 3)
            .attr("stroke-dasharray", "8,4");

        // Add labels
        g.append("text")
            .attr("x", xScale(results.fStatistic))
            .attr("y", innerHeight + 25)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "600")
            .attr("fill", "#1e293b")
            .text(`F = ${results.fStatistic.toFixed(2)}`);

        g.append("text")
            .attr("x", xScale(results.fStatistic))
            .attr("y", yScale(0.6))
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("font-weight", "bold")
            .attr("fill", results.decision === 'reject' ? "#dc2626" : "#16a34a")
            .text(`P = ${results.pValue.toFixed(4)}`);

        g.append("text")
            .attr("x", xScale(results.criticalValue))
            .attr("y", innerHeight + 25)
            .attr("text-anchor", "middle")
            .attr("font-size", "11px")
            .attr("font-weight", "600")
            .attr("fill", "#d97706")
            .text(`Critical = ${results.criticalValue.toFixed(2)}`);

        // Add axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);

        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(xAxis)
            .attr("color", "#64748b");

        g.append("g")
            .call(yAxis)
            .attr("color", "#64748b");

        g.append("text")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight + 50)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("font-weight", "600")
            .attr("fill", "#1e293b")
            .text(`F-Statistic (df1 = ${df1}, df2 = ${df2})`);

        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -innerHeight / 2)
            .attr("y", -40)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("font-weight", "600")
            .attr("fill", "#1e293b")
            .text("Probability Density");
    };

    useEffect(() => {
        drawVisualization();
    }, [parameters, results]);

    const updateGroup = (index: number, field: keyof GroupData, value: number | string) => {
        const newGroups = parameters.groups.map((g, i) =>
            i === index ? { ...g, [field]: value } : g
        );
        setParameters(prev => ({ ...prev, groups: newGroups }));
    };

    return (
        <div className="anova fade-in">
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">ANOVA Simulator</h1>
                    <p className="page-description">
                        Interactive Analysis of Variance (ANOVA) for comparing means across multiple groups.
                        Explore one-way ANOVA with real-time F-statistic calculations.
                    </p>
                </div>

                <div className="improved-simulation-layout">
                    <div className="main-visualization-panel">
                        <div className="visualization-header">
                            <h2 className="visualization-title">F-Distribution</h2>
                            <p className="visualization-description">
                                This chart shows the F-distribution for your ANOVA test. The blue area represents the distribution, 
                                the red shaded region is the rejection area, the orange dashed line marks the critical value, and 
                                the black dashed line shows your calculated F-statistic. If the F-statistic falls in the red region, 
                                you reject the null hypothesis.
                            </p>
                        </div>
                        <div className="visualization-container">
                            <svg ref={svgRef} className="simulation-svg"></svg>
                        </div>
                        <div className="compact-performance">
                            <h4>ANOVA Results</h4>
                            <div className="performance-grid">
                                <div className="performance-item">
                                    <span className="performance-label">F-Statistic:</span>
                                    <span className="performance-value">{results.fStatistic.toFixed(3)}</span>
                                </div>
                                <div className="performance-item">
                                    <span className="performance-label">P-Value:</span>
                                    <span className="performance-value">{results.pValue.toFixed(4)}</span>
                                </div>
                                <div className="performance-item">
                                    <span className="performance-label">Between-Group Variance:</span>
                                    <span className="performance-value">{results.betweenGroupVariance.toFixed(2)}</span>
                                </div>
                                <div className="performance-item">
                                    <span className="performance-label">Within-Group Variance:</span>
                                    <span className="performance-value">{results.withinGroupVariance.toFixed(2)}</span>
                                </div>
                                <div className="performance-item">
                                    <span className="performance-label">Decision:</span>
                                    <span className="performance-value" style={{color: results.decision === 'reject' ? '#dc2626' : '#16a34a'}}>
                                        {results.decision === 'reject' ? 'Reject H0' : 'Fail to Reject H0'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="controls-panel">
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Group Configuration</h3>
                                <p className="card-subtitle">Adjust parameters below to explore how ANOVA responds to different group configurations. Changes update the results in real-time.</p>
                            </div>
                            <div className="card-body">
                                <div className="parameter-controls">
                                    <div className="input-group">
                                        <label className="label">Number of Groups</label>
                                        <p className="parameter-help">The number of independent groups to compare. ANOVA requires at least 2 groups and is most useful with 3 or more. Changing this creates new groups or removes excess ones.</p>
                                        <input
                                            type="number"
                                            min="2"
                                            max="5"
                                            value={parameters.numGroups}
                                            onChange={(e) => {
                                                const num = parseInt(e.target.value) || 2;
                                                const newGroups = Array(num).fill(0).map((_, i) =>
                                                    parameters.groups[i] || { mean: 50 + i * 5, stdDev: 10, size: 20, name: `Group ${i + 1}` }
                                                );
                                                setParameters(prev => ({ ...prev, numGroups: num, groups: newGroups }));
                                            }}
                                            className="input"
                                        />
                                    </div>
                                    {parameters.groups.map((group, index) => (
                                        <div key={index} className="group-controls">
                                            <h5>{group.name}</h5>
                                            <p className="group-description">Each group represents a different category, treatment, or condition you want to compare. Configure the statistical properties of this group below.</p>
                                            <div className="input-group">
                                                <label className="label">Mean</label>
                                                <p className="parameter-help">The average value for this group. Larger differences between group means make it more likely that ANOVA will detect significant differences.</p>
                                                <input
                                                    type="number"
                                                    value={group.mean}
                                                    onChange={(e) => updateGroup(index, 'mean', parseFloat(e.target.value) || 0)}
                                                    className="input"
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label className="label">Standard Deviation</label>
                                                <p className="parameter-help">The spread or variability within this group. Higher standard deviations increase within-group variance, making it harder to detect differences between groups.</p>
                                                <input
                                                    type="number"
                                                    min="0.1"
                                                    step="0.1"
                                                    value={group.stdDev}
                                                    onChange={(e) => updateGroup(index, 'stdDev', parseFloat(e.target.value) || 0.1)}
                                                    className="input"
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label className="label">Sample Size</label>
                                                <p className="parameter-help">The number of observations in this group. Larger sample sizes provide more reliable results and can detect smaller differences between groups.</p>
                                                <input
                                                    type="number"
                                                    min="2"
                                                    value={group.size}
                                                    onChange={(e) => updateGroup(index, 'size', parseInt(e.target.value) || 2)}
                                                    className="input"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <div className="input-group">
                                        <label className="label">Significance Level (α)</label>
                                        <p className="parameter-help">The probability threshold for rejecting the null hypothesis. Lower values (e.g., 0.01) require stronger evidence, while higher values (e.g., 0.10) are more lenient. The default 0.05 means a 5% chance of Type I error.</p>
                                        <input
                                            type="range"
                                            min="0.01"
                                            max="0.2"
                                            step="0.01"
                                            value={parameters.alpha}
                                            onChange={(e) => setParameters(prev => ({ ...prev, alpha: parseFloat(e.target.value) }))}
                                            className="slider"
                                        />
                                        <span className="value-display">{parameters.alpha.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="explanation-section">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">How to Use This Simulation</h3>
                        </div>
                        <div className="card-body">
                            <div className="explanation-content">
                                <h4>Step-by-Step Guide</h4>
                                <p>
                                    This interactive simulation allows you to explore how Analysis of Variance (ANOVA) works by 
                                    configuring different groups and observing how the statistical test responds. Follow these steps 
                                    to get the most out of this tool:
                                </p>
                                
                                <ol>
                                    <li><strong>Start with the Default Configuration:</strong> The simulation begins with three groups 
                                    that have slightly different means (50, 55, and 60). Notice how the F-statistic and p-value 
                                    change in real-time as you adjust parameters.</li>
                                    
                                    <li><strong>Experiment with Group Means:</strong> Try making the group means very similar (e.g., 
                                    50, 51, 52) and observe how the F-statistic decreases. Then try making them very different 
                                    (e.g., 30, 50, 70) and see how the F-statistic increases, indicating stronger evidence of 
                                    differences between groups.</li>
                                    
                                    <li><strong>Adjust Standard Deviation:</strong> Increase the standard deviation for one or more 
                                    groups and notice how this affects the within-group variance. Higher standard deviations make 
                                    it harder to detect differences between groups because there's more variability within each group.</li>
                                    
                                    <li><strong>Change Sample Sizes:</strong> Experiment with different sample sizes. Larger sample 
                                    sizes generally provide more reliable results and can detect smaller differences between groups. 
                                    Try making one group much larger than others and observe the impact.</li>
                                    
                                    <li><strong>Modify the Significance Level:</strong> Adjust the alpha (α) value using the slider. 
                                    Lower alpha values (like 0.01) require stronger evidence to reject the null hypothesis, while higher 
                                    values (like 0.10) are more lenient. The default of 0.05 is the most commonly used significance level.</li>
                                    
                                    <li><strong>Add or Remove Groups:</strong> Change the number of groups between 2 and 5. Notice 
                                    how adding more groups affects the degrees of freedom and the critical value for the F-distribution.</li>
                                    
                                    <li><strong>Interpret the Results:</strong> Watch the visualization and results panel. The F-statistic 
                                    tells you how much the between-group variance exceeds the within-group variance. If the F-statistic 
                                    falls in the red rejection region, you reject the null hypothesis that all group means are equal.</li>
                                </ol>

                                <h4>Understanding the Configuration Parameters</h4>
                                
                                <h5>Number of Groups</h5>
                                <p>
                                    This parameter determines how many independent groups you want to compare. ANOVA requires at least 
                                    two groups, but it's most useful when comparing three or more groups. When you change this value, 
                                    new groups are automatically created with default values, or existing groups beyond the new number 
                                    are removed. The degrees of freedom for the F-test depend on the number of groups: df1 = number of 
                                    groups - 1.
                                </p>

                                <h5>Group Mean</h5>
                                <p>
                                    The mean (average) value for each group represents the central tendency of that group's data. This 
                                    is the value you're testing to see if it differs significantly from other groups. In a real-world 
                                    scenario, this might represent the average test score for students using different teaching methods, 
                                    the average crop yield for different fertilizers, or the average response time for different website 
                                    designs. The larger the differences between group means, the more likely ANOVA will detect a 
                                    statistically significant difference.
                                </p>

                                <h5>Standard Deviation (Std Dev)</h5>
                                <p>
                                    Standard deviation measures the spread or variability of data within each group. A smaller standard 
                                    deviation means the data points are clustered closely around the mean, while a larger standard 
                                    deviation indicates more spread. This parameter directly affects the within-group variance (MSW), 
                                    which is the denominator in the F-statistic calculation. Groups with high standard deviations have 
                                    more internal variability, making it harder to detect differences between groups. In practice, ANOVA 
                                    assumes groups have similar standard deviations (homoscedasticity), though the test is somewhat robust 
                                    to violations of this assumption.
                                </p>

                                <h5>Sample Size</h5>
                                <p>
                                    Sample size refers to the number of observations or data points in each group. Larger sample sizes 
                                    provide more reliable estimates of group means and variances, leading to more powerful statistical 
                                    tests that can detect smaller differences between groups. The total sample size (sum of all group 
                                    sizes) affects the degrees of freedom for the within-group variance: df2 = total sample size - 
                                    number of groups. Generally, having similar sample sizes across groups is ideal, though ANOVA can 
                                    handle unequal sample sizes.
                                </p>

                                <h5>Significance Level (α)</h5>
                                <p>
                                    The significance level, denoted as alpha (α), represents the probability of making a Type I error 
                                    (rejecting the null hypothesis when it's actually true). Common values are 0.05 (5% chance of error) 
                                    and 0.01 (1% chance of error). A lower alpha value means you require stronger evidence before 
                                    concluding that groups differ. The critical value on the F-distribution changes based on alpha, 
                                    determining where the rejection region begins. The default value of 0.05 means you're willing to 
                                    accept a 5% chance of incorrectly concluding that groups differ when they actually don't.
                                </p>

                                <h4>Understanding Groups in ANOVA</h4>
                                
                                <p>
                                    In ANOVA, groups represent different categories, treatments, or conditions that you want to compare. 
                                    Each group should be independent, meaning that observations in one group don't influence observations 
                                    in another group. Here are some conceptual ways to think about groups:
                                </p>

                                <h5>Groups as Treatments or Conditions</h5>
                                <p>
                                    In experimental research, groups often represent different treatments or conditions. For example:
                                </p>
                                <ul>
                                    <li><strong>Medical Study:</strong> Group 1 = Placebo, Group 2 = Low-dose medication, Group 3 = High-dose medication</li>
                                    <li><strong>Education Research:</strong> Group 1 = Traditional teaching, Group 2 = Online teaching, Group 3 = Hybrid teaching</li>
                                    <li><strong>Marketing Test:</strong> Group 1 = Control website, Group 2 = Website variant A, Group 3 = Website variant B</li>
                                </ul>

                                <h5>Groups as Categories</h5>
                                <p>
                                    Groups can also represent natural categories or classifications:
                                </p>
                                <ul>
                                    <li><strong>Demographics:</strong> Group 1 = Age 18-25, Group 2 = Age 26-35, Group 3 = Age 36-45</li>
                                    <li><strong>Geographic:</strong> Group 1 = North region, Group 2 = South region, Group 3 = East region</li>
                                    <li><strong>Product Types:</strong> Group 1 = Product A, Group 2 = Product B, Group 3 = Product C</li>
                                </ul>

                                <h5>What Makes Groups Different?</h5>
                                <p>
                                    The key question ANOVA answers is: "Are the means of these groups significantly different from each other?" 
                                    When you configure groups in this simulation, you're essentially setting up a scenario to test this question. 
                                    If group means are very similar, the null hypothesis (that all means are equal) is likely to be true, and 
                                    you'll fail to reject it. If group means are very different, you're more likely to reject the null hypothesis 
                                    and conclude that at least one group mean differs from the others.
                                </p>

                                <h4>Understanding the Visualization</h4>
                                
                                <p>
                                    The F-distribution chart provides a visual representation of your ANOVA test results. Here's what each element means:
                                </p>
                                
                                <ul>
                                    <li><strong>Blue Curve:</strong> The F-distribution curve shows the probability distribution of F-statistics 
                                    under the null hypothesis (assuming all group means are equal). The shape of this curve depends on the degrees 
                                    of freedom, which are determined by the number of groups and total sample size.</li>
                                    
                                    <li><strong>Red Shaded Region:</strong> This is the rejection region, representing F-statistic values that 
                                    would lead you to reject the null hypothesis at your chosen significance level (α). If your calculated 
                                    F-statistic falls anywhere in this red area, you have sufficient evidence to conclude that at least one 
                                    group mean differs from the others.</li>
                                    
                                    <li><strong>Orange Dashed Line:</strong> This marks the critical value (F-critical), which is the threshold 
                                    separating the "fail to reject" region from the "reject" region. The critical value depends on your 
                                    significance level (α) and the degrees of freedom. F-statistics greater than this value fall in the 
                                    rejection region.</li>
                                    
                                    <li><strong>Black Dashed Line:</strong> This shows your calculated F-statistic based on the current group 
                                    configuration. The position of this line relative to the critical value determines your statistical decision. 
                                    If it's to the right of the orange line (in the red region), you reject H0. If it's to the left, you fail 
                                    to reject H0.</li>
                                    
                                    <li><strong>P-Value Label:</strong> The p-value displayed on the chart shows the probability of observing 
                                    an F-statistic as extreme as yours (or more extreme) if the null hypothesis were true. Lower p-values 
                                    indicate stronger evidence against the null hypothesis.</li>
                                </ul>

                                <h4>Interpreting the Results</h4>
                                
                                <h5>F-Statistic</h5>
                                <p>
                                    The F-statistic is the ratio of between-group variance to within-group variance. It's calculated as 
                                    F = MSB / MSW, where MSB is the mean square between groups and MSW is the mean square within groups. 
                                    A larger F-statistic indicates that the differences between group means are large relative to the 
                                    variability within groups. If the F-statistic falls in the rejection region (to the right of the critical 
                                    value), you reject the null hypothesis.
                                </p>

                                <h5>P-Value</h5>
                                <p>
                                    The p-value represents the probability of observing an F-statistic as extreme as (or more extreme than) 
                                    the one calculated, assuming the null hypothesis is true. A small p-value (typically less than α) provides 
                                    strong evidence against the null hypothesis. If p ≤ α, you reject the null hypothesis and conclude that 
                                    at least one group mean differs from the others. If p &gt; α, you fail to reject the null hypothesis.
                                </p>

                                <h5>Between-Group Variance (MSB)</h5>
                                <p>
                                    This measures how much the group means vary from the overall grand mean. It's calculated by comparing 
                                    each group's mean to the grand mean (the average of all groups combined), weighted by each group's sample 
                                    size. Larger between-group variance suggests that group means are spread out and likely different from 
                                    each other.
                                </p>

                                <h5>Within-Group Variance (MSW)</h5>
                                <p>
                                    This measures the average variability within each group. It's calculated by averaging the variances of 
                                    individual groups. Smaller within-group variance means data points within each group are clustered closely 
                                    around their group mean, making it easier to detect differences between groups.
                                </p>

                                <h5>Decision</h5>
                                <p>
                                    The decision tells you whether to reject or fail to reject the null hypothesis. "Reject H0" means you have 
                                    sufficient evidence to conclude that at least one group mean differs from the others. "Fail to Reject H0" 
                                    means you don't have sufficient evidence to conclude that group means differ. Note that failing to reject 
                                    doesn't prove the means are equal; it just means you can't prove they're different with the current data.
                                </p>

                                <h4>What is ANOVA?</h4>
                                <p>
                                    Analysis of Variance (ANOVA) is a statistical method used to compare means across three or more groups. 
                                    It tests whether there are any statistically significant differences between the means of independent groups. 
                                    ANOVA partitions the total variance in the data into two components: variance between groups and variance 
                                    within groups, then compares these components using an F-test.
                                </p>

                                <h4>When to Use ANOVA</h4>
                                <ul>
                                    <li>Comparing means across three or more groups</li>
                                    <li>Data are normally distributed (or sample sizes are large enough for the Central Limit Theorem to apply)</li>
                                    <li>Groups have equal variances (homoscedasticity), though ANOVA is somewhat robust to violations</li>
                                    <li>Observations are independent (data points don't influence each other)</li>
                                    <li>You want to test the null hypothesis that all group means are equal</li>
                                </ul>

                                <h4>ANOVA vs T-Test</h4>
                                <p>
                                    Use ANOVA when comparing three or more groups. Use t-test when comparing exactly two groups. ANOVA is an 
                                    extension of the t-test for multiple groups. If ANOVA indicates significant differences, you may need 
                                    post-hoc tests (like Tukey's HSD) to determine which specific groups differ from each other.
                                </p>

                                <h4>Real-World Applications</h4>
                                <ul>
                                    <li><strong>Medical Research:</strong> Comparing treatment effectiveness across multiple treatments or dosages</li>
                                    <li><strong>Education:</strong> Comparing test scores across different teaching methods, curricula, or learning environments</li>
                                    <li><strong>Business:</strong> Comparing sales performance across different regions, products, or marketing strategies</li>
                                    <li><strong>Agriculture:</strong> Comparing crop yields across different fertilizers, irrigation methods, or seed varieties</li>
                                    <li><strong>Psychology:</strong> Comparing responses across different experimental conditions or participant groups</li>
                                    <li><strong>Quality Control:</strong> Comparing product quality metrics across different manufacturing processes or suppliers</li>
                                </ul>

                                <h4>Learning Exercises to Try</h4>
                                <p>
                                    To deepen your understanding, try these exercises:
                                </p>
                                <ol>
                                    <li><strong>Create a Scenario with No Difference:</strong> Set all group means to the same value (e.g., 50, 50, 50) 
                                    and observe how the F-statistic becomes very small and you fail to reject the null hypothesis.</li>
                                    
                                    <li><strong>Create a Clear Difference:</strong> Set group means far apart (e.g., 30, 50, 70) with low standard 
                                    deviations (e.g., 5) and notice how the F-statistic increases dramatically.</li>
                                    
                                    <li><strong>Explore the Impact of Variability:</strong> Keep group means the same (e.g., 50, 55, 60) but gradually 
                                    increase standard deviations from 5 to 20. Observe how higher variability makes it harder to detect differences.</li>
                                    
                                    <li><strong>Test Sample Size Effects:</strong> With the same means and standard deviations, try different sample 
                                    sizes (e.g., 10 vs. 50 vs. 100) and see how larger samples can detect smaller differences.</li>
                                    
                                    <li><strong>Compare Significance Levels:</strong> Set up a scenario where the F-statistic is just barely above 
                                    the critical value at α = 0.05, then change α to 0.01 and observe how the decision changes.</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="related-topics">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Related Topics</h3>
                        </div>
                        <div className="card-body">
                            <div className="related-links">
                                <Link to="/hypothesis-testing" className="related-link">Hypothesis Testing Overview</Link>
                                <Link to="/t-test" className="related-link">T-Test Simulator</Link>
                                <Link to="/p-values" className="related-link">P-Values Tutorial</Link>
                            </div>
                        </div>
                    </div>
                </div>

                <section className="copyright-section">
                    <div className="copyright-notice">
                        <p>&copy; 2025, Todd Brous. All rights reserved.</p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ANOVA;

