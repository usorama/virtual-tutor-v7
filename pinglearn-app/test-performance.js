/**
 * Performance Analysis Script for PingLearn Transcription System
 * Measures key performance metrics and identifies bottlenecks
 */

const fs = require('fs');
const puppeteer = require('puppeteer');
const { performance } = require('perf_hooks');

class PerformanceAnalyzer {
  constructor() {
    this.metrics = {
      memoryUsage: [],
      renderTimes: [],
      updateFrequency: [],
      mathRenderTimes: [],
      scrollPerformance: [],
      bufferOperations: []
    };
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    console.log('🚀 Starting Performance Analysis...');
    
    this.browser = await puppeteer.launch({ 
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Monitor console logs and performance
    this.page.on('console', msg => {
      if (msg.text().includes('PERF:')) {
        console.log('📊', msg.text());
      }
    });
    
    // Enable performance monitoring
    await this.page.setCacheEnabled(false);
    await this.page.goto('http://localhost:3001/test-transcription', {
      waitUntil: 'networkidle0'
    });
    
    console.log('✅ Page loaded successfully');
  }

  async measurePollingPerformance() {
    console.log('\n📊 Measuring Polling Performance (100ms intervals)...');
    
    // Inject performance monitoring script
    await this.page.evaluate(() => {
      window.perfMetrics = {
        updateCount: 0,
        totalUpdateTime: 0,
        memorySnapshots: [],
        renderTimes: []
      };
      
      // Override setInterval to monitor update frequency
      const originalSetInterval = window.setInterval;
      window.setInterval = function(callback, delay) {
        if (delay === 100) {
          console.log('PERF: Detected 100ms polling interval');
          
          const wrappedCallback = function() {
            const start = performance.now();
            
            // Monitor memory before update
            if (performance.memory) {
              window.perfMetrics.memorySnapshots.push({
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                timestamp: Date.now()
              });
            }
            
            callback();
            
            const end = performance.now();
            const updateTime = end - start;
            
            window.perfMetrics.updateCount++;
            window.perfMetrics.totalUpdateTime += updateTime;
            window.perfMetrics.renderTimes.push(updateTime);
            
            if (window.perfMetrics.updateCount % 50 === 0) {
              console.log(`PERF: Update #${window.perfMetrics.updateCount}, Time: ${updateTime.toFixed(2)}ms`);
            }
          };
          
          return originalSetInterval.call(this, wrappedCallback, delay);
        }
        return originalSetInterval.call(this, callback, delay);
      };
    });
    
    // Trigger simulation
    await this.page.click('button:contains("Simulate AI Teacher")');
    
    // Wait for simulation to complete and collect more data
    await this.page.waitForTimeout(15000);
    
    const pollingMetrics = await this.page.evaluate(() => {
      return window.perfMetrics;
    });
    
    this.metrics.updateFrequency = pollingMetrics.renderTimes;
    this.metrics.memoryUsage = pollingMetrics.memorySnapshots;
    
    console.log(`📈 Polling Analysis:`);
    console.log(`   Updates: ${pollingMetrics.updateCount}`);
    console.log(`   Average update time: ${(pollingMetrics.totalUpdateTime / pollingMetrics.updateCount).toFixed(2)}ms`);
    console.log(`   Max update time: ${Math.max(...pollingMetrics.renderTimes).toFixed(2)}ms`);
    console.log(`   Memory growth: ${this.calculateMemoryGrowth(pollingMetrics.memorySnapshots)}MB`);
  }

  async measureMathRenderingPerformance() {
    console.log('\n🧮 Measuring Math Rendering Performance...');
    
    // Inject math rendering performance monitoring
    await this.page.evaluate(() => {
      window.mathPerfMetrics = {
        renderTimes: [],
        totalEquations: 0,
        errorCount: 0
      };
      
      // Override KaTeX rendering to measure performance
      const originalImport = window.import || (() => Promise.resolve());
      
      // Monitor dynamic imports for KaTeX
      if (typeof window.import === 'function') {
        window.import = async function(module) {
          if (module === 'katex') {
            const katex = await originalImport.call(this, module);
            
            // Wrap renderToString method
            const originalRenderToString = katex.default.renderToString;
            katex.default.renderToString = function(latex, options) {
              const start = performance.now();
              
              try {
                const result = originalRenderToString.call(this, latex, options);
                const end = performance.now();
                const renderTime = end - start;
                
                window.mathPerfMetrics.renderTimes.push(renderTime);
                window.mathPerfMetrics.totalEquations++;
                
                console.log(`PERF: Math render - ${latex.substring(0, 20)}... took ${renderTime.toFixed(2)}ms`);
                
                return result;
              } catch (error) {
                window.mathPerfMetrics.errorCount++;
                console.log(`PERF: Math render ERROR - ${latex.substring(0, 20)}...`);
                throw error;
              }
            };
            
            return katex;
          }
          return originalImport.call(this, module);
        };
      }
    });
    
    // Clear and re-trigger simulation to measure math rendering
    await this.page.click('button:contains("Clear Transcription")');
    await this.page.waitForTimeout(1000);
    await this.page.click('button:contains("Simulate AI Teacher")');
    
    // Wait for all math to render
    await this.page.waitForTimeout(12000);
    
    const mathMetrics = await this.page.evaluate(() => {
      return window.mathPerfMetrics || {
        renderTimes: [],
        totalEquations: 0,
        errorCount: 0
      };
    });
    
    this.metrics.mathRenderTimes = mathMetrics.renderTimes;
    
    console.log(`🧮 Math Rendering Analysis:`);
    console.log(`   Equations rendered: ${mathMetrics.totalEquations}`);
    console.log(`   Errors: ${mathMetrics.errorCount}`);
    if (mathMetrics.renderTimes.length > 0) {
      console.log(`   Average render time: ${(mathMetrics.renderTimes.reduce((a, b) => a + b, 0) / mathMetrics.renderTimes.length).toFixed(2)}ms`);
      console.log(`   Max render time: ${Math.max(...mathMetrics.renderTimes).toFixed(2)}ms`);
      console.log(`   Min render time: ${Math.min(...mathMetrics.renderTimes).toFixed(2)}ms`);
    }
  }

  async measureScrollPerformance() {
    console.log('\n📜 Measuring Scroll Performance...');
    
    const scrollMetrics = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const container = document.querySelector('.overflow-y-auto');
        if (!container) {
          resolve({ error: 'Scroll container not found' });
          return;
        }
        
        const scrollTimes = [];
        let scrollCount = 0;
        
        const measureScroll = () => {
          const start = performance.now();
          
          container.scrollTop = container.scrollHeight;
          
          // Use requestAnimationFrame to measure when scroll is complete
          requestAnimationFrame(() => {
            const end = performance.now();
            scrollTimes.push(end - start);
            scrollCount++;
            
            if (scrollCount < 20) {
              setTimeout(measureScroll, 100);
            } else {
              resolve({
                scrollTimes,
                averageScrollTime: scrollTimes.reduce((a, b) => a + b, 0) / scrollTimes.length,
                maxScrollTime: Math.max(...scrollTimes)
              });
            }
          });
        };
        
        measureScroll();
      });
    });
    
    this.metrics.scrollPerformance = scrollMetrics.scrollTimes || [];
    
    console.log(`📜 Scroll Performance Analysis:`);
    if (scrollMetrics.error) {
      console.log(`   Error: ${scrollMetrics.error}`);
    } else {
      console.log(`   Average scroll time: ${scrollMetrics.averageScrollTime?.toFixed(2)}ms`);
      console.log(`   Max scroll time: ${scrollMetrics.maxScrollTime?.toFixed(2)}ms`);
    }
  }

  async measureBufferOperations() {
    console.log('\n🗄️ Measuring Display Buffer Operations...');
    
    // Test heavy buffer operations
    const bufferMetrics = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        // Simulate heavy buffer usage
        const displayBuffer = window.__displayBuffer || {};
        
        if (!displayBuffer.getItems) {
          resolve({ error: 'Display buffer not accessible' });
          return;
        }
        
        const operationTimes = [];
        const itemCounts = [];
        
        // Measure getItems() performance with different item counts
        for (let i = 0; i < 100; i++) {
          const start = performance.now();
          const items = displayBuffer.getItems();
          const end = performance.now();
          
          operationTimes.push(end - start);
          itemCounts.push(items.length);
        }
        
        resolve({
          operationTimes,
          averageOperationTime: operationTimes.reduce((a, b) => a + b, 0) / operationTimes.length,
          maxOperationTime: Math.max(...operationTimes),
          averageItemCount: itemCounts.reduce((a, b) => a + b, 0) / itemCounts.length
        });
      });
    });
    
    this.metrics.bufferOperations = bufferMetrics.operationTimes || [];
    
    console.log(`🗄️ Buffer Operations Analysis:`);
    if (bufferMetrics.error) {
      console.log(`   Error: ${bufferMetrics.error}`);
    } else {
      console.log(`   Average operation time: ${bufferMetrics.averageOperationTime?.toFixed(2)}ms`);
      console.log(`   Max operation time: ${bufferMetrics.maxOperationTime?.toFixed(2)}ms`);
      console.log(`   Average item count: ${bufferMetrics.averageItemCount?.toFixed(0)}`);
    }
  }

  calculateMemoryGrowth(snapshots) {
    if (snapshots.length < 2) return 0;
    const first = snapshots[0].used;
    const last = snapshots[snapshots.length - 1].used;
    return ((last - first) / 1024 / 1024).toFixed(2);
  }

  async generateHeavyLoadTest() {
    console.log('\n🚨 Heavy Load Test - Adding 100 Math Equations...');
    
    await this.page.click('button:contains("Clear Transcription")');
    await this.page.waitForTimeout(1000);
    
    // Inject heavy math content
    await this.page.evaluate(() => {
      const displayBuffer = window.__getDisplayBuffer ? window.__getDisplayBuffer() : null;
      if (!displayBuffer) {
        console.error('Could not access display buffer');
        return;
      }
      
      const heavyMathEquations = [
        'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
        '\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}',
        '\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}',
        '\\lim_{n \\to \\infty} \\left(1 + \\frac{1}{n}\\right)^n = e',
        'F(x) = \\int_{-\\infty}^{x} f(t) dt',
        '\\nabla \\cdot \\vec{E} = \\frac{\\rho}{\\epsilon_0}',
        '\\frac{\\partial^2 u}{\\partial t^2} = c^2 \\nabla^2 u',
        'H = -\\sum_{i} p_i \\log_2 p_i',
        '\\det(A) = \\sum_{\\sigma \\in S_n} \\text{sgn}(\\sigma) \\prod_{i=1}^{n} a_{i,\\sigma(i)}',
        'e^{i\\pi} + 1 = 0'
      ];
      
      // Add 100 equations rapidly
      for (let i = 0; i < 100; i++) {
        const equation = heavyMathEquations[i % heavyMathEquations.length];
        displayBuffer.addItem({
          type: 'math',
          content: equation + ` \\\\ \\text{Equation ${i + 1}}`,
          speaker: 'teacher',
          confidence: 0.99
        });
        
        // Add some text too
        if (i % 3 === 0) {
          displayBuffer.addItem({
            type: 'text',
            content: `This is explanation ${i + 1} with some additional context about the mathematical concept.`,
            speaker: 'teacher',
            confidence: 0.95
          });
        }
      }
    });
    
    // Wait for all rendering to complete and measure performance impact
    await this.page.waitForTimeout(10000);
    
    const finalMetrics = await this.page.evaluate(() => {
      return {
        memory: performance.memory ? {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize
        } : null,
        itemCount: document.querySelectorAll('.math-renderer').length
      };
    });
    
    console.log(`🚨 Heavy Load Test Results:`);
    console.log(`   Math elements rendered: ${finalMetrics.itemCount}`);
    if (finalMetrics.memory) {
      console.log(`   Memory usage: ${(finalMetrics.memory.used / 1024 / 1024).toFixed(2)}MB`);
    }
  }

  async generatePerformanceReport() {
    console.log('\n📊 Generating Performance Report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        pollingFrequency: '100ms (10 updates/second)',
        averageUpdateTime: this.metrics.updateFrequency.length > 0 ? 
          (this.metrics.updateFrequency.reduce((a, b) => a + b, 0) / this.metrics.updateFrequency.length).toFixed(2) + 'ms' : 'N/A',
        maxUpdateTime: this.metrics.updateFrequency.length > 0 ? 
          Math.max(...this.metrics.updateFrequency).toFixed(2) + 'ms' : 'N/A',
        averageMathRenderTime: this.metrics.mathRenderTimes.length > 0 ? 
          (this.metrics.mathRenderTimes.reduce((a, b) => a + b, 0) / this.metrics.mathRenderTimes.length).toFixed(2) + 'ms' : 'N/A',
        maxMathRenderTime: this.metrics.mathRenderTimes.length > 0 ? 
          Math.max(...this.metrics.mathRenderTimes).toFixed(2) + 'ms' : 'N/A',
        memoryGrowth: this.calculateMemoryGrowth(this.metrics.memoryUsage) + 'MB'
      },
      bottlenecks: this.identifyBottlenecks(),
      recommendations: this.generateRecommendations(),
      rawMetrics: this.metrics
    };
    
    // Save report to file
    const reportJson = JSON.stringify(report, null, 2);
    fs.writeFileSync('performance-report.json', reportJson);
    
    console.log('\n📋 PERFORMANCE ANALYSIS SUMMARY');
    console.log('=' .repeat(50));
    console.log(`Polling Frequency: ${report.summary.pollingFrequency}`);
    console.log(`Average Update Time: ${report.summary.averageUpdateTime}`);
    console.log(`Max Update Time: ${report.summary.maxUpdateTime}`);
    console.log(`Average Math Render: ${report.summary.averageMathRenderTime}`);
    console.log(`Max Math Render: ${report.summary.maxMathRenderTime}`);
    console.log(`Memory Growth: ${report.summary.memoryGrowth}`);
    console.log('\n🚨 BOTTLENECKS IDENTIFIED:');
    report.bottlenecks.forEach((bottleneck, index) => {
      console.log(`${index + 1}. ${bottleneck}`);
    });
    console.log('\n💡 OPTIMIZATION RECOMMENDATIONS:');
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    console.log('\n📄 Full report saved to: performance-report.json');
    
    return report;
  }

  identifyBottlenecks() {
    const bottlenecks = [];
    
    // Check update frequency
    if (this.metrics.updateFrequency.length > 0) {
      const avgUpdate = this.metrics.updateFrequency.reduce((a, b) => a + b, 0) / this.metrics.updateFrequency.length;
      if (avgUpdate > 5) {
        bottlenecks.push(`High polling overhead: ${avgUpdate.toFixed(2)}ms average (target: <2ms)`);
      }
      
      const maxUpdate = Math.max(...this.metrics.updateFrequency);
      if (maxUpdate > 16) {
        bottlenecks.push(`Update spikes causing frame drops: ${maxUpdate.toFixed(2)}ms max (target: <16ms for 60fps)`);
      }
    }
    
    // Check math rendering
    if (this.metrics.mathRenderTimes.length > 0) {
      const avgMath = this.metrics.mathRenderTimes.reduce((a, b) => a + b, 0) / this.metrics.mathRenderTimes.length;
      if (avgMath > 50) {
        bottlenecks.push(`Slow math rendering: ${avgMath.toFixed(2)}ms average (target: <50ms)`);
      }
      
      const maxMath = Math.max(...this.metrics.mathRenderTimes);
      if (maxMath > 100) {
        bottlenecks.push(`Math rendering spikes: ${maxMath.toFixed(2)}ms max (target: <100ms)`);
      }
    }
    
    // Check memory growth
    const memoryGrowth = parseFloat(this.calculateMemoryGrowth(this.metrics.memoryUsage));
    if (memoryGrowth > 10) {
      bottlenecks.push(`High memory growth: ${memoryGrowth}MB (potential memory leak)`);
    }
    
    // Check polling frequency
    bottlenecks.push('100ms polling interval creates unnecessary updates (10 updates/second)');
    
    // Check buffer operations
    if (this.metrics.bufferOperations.length > 0) {
      const avgBuffer = this.metrics.bufferOperations.reduce((a, b) => a + b, 0) / this.metrics.bufferOperations.length;
      if (avgBuffer > 1) {
        bottlenecks.push(`Slow buffer operations: ${avgBuffer.toFixed(2)}ms (array spreading overhead)`);
      }
    }
    
    return bottlenecks;
  }

  generateRecommendations() {
    return [
      'Replace 100ms polling with event-driven updates using buffer.subscribe()',
      'Implement React.memo() for TranscriptionItem to prevent unnecessary re-renders',
      'Add virtual scrolling for large transcription lists (>50 items)',
      'Cache KaTeX rendered equations to avoid re-rendering identical math',
      'Use IntersectionObserver to only render visible math equations',
      'Implement incremental buffer updates instead of full array copying',
      'Add requestIdleCallback for non-critical rendering operations',
      'Debounce scroll-to-bottom operations to reduce layout thrashing',
      'Use Web Workers for heavy math equation pre-processing',
      'Implement progressive loading for complex equations'
    ];
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main execution
async function runPerformanceAnalysis() {
  const analyzer = new PerformanceAnalyzer();
  
  try {
    await analyzer.initialize();
    await analyzer.measurePollingPerformance();
    await analyzer.measureMathRenderingPerformance();
    await analyzer.measureScrollPerformance();
    await analyzer.measureBufferOperations();
    await analyzer.generateHeavyLoadTest();
    await analyzer.generatePerformanceReport();
  } catch (error) {
    console.error('❌ Performance analysis failed:', error);
  } finally {
    await analyzer.cleanup();
  }
}

// Check if running directly
if (require.main === module) {
  runPerformanceAnalysis();
}

module.exports = { PerformanceAnalyzer };