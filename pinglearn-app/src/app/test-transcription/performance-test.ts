/**
 * Local Performance Testing Utilities
 * Validates performance analysis findings
 */

import { DisplayBufferItem } from '@/types/performance';

// Performance testing utilities that can be run in browser console
export const PerformanceTestSuite = {
  // Test 1: Measure buffer operation overhead
  testBufferOperations() {
    console.log('🧪 Testing Buffer Operations Performance...');
    
    // Mock display buffer for testing
    class MockDisplayBuffer {
      private items: DisplayBufferItem[] = [];
      
      constructor() {
        // Fill with test items
        for (let i = 0; i < 1000; i++) {
          this.items.push({
            id: `item_${i}`,
            type: 'text',
            content: `Test content ${i}`,
            timestamp: Date.now() + i
          });
        }
      }
      
      // Current implementation (inefficient)
      getItems() {
        return [...this.items]; // Spreads entire array
      }
      
      // Optimized implementation
      getItemsOptimized(lastChangeId = 0) {
        // Only return if changes detected
        if (lastChangeId >= this.items.length) {
          return { items: [], changeId: this.items.length };
        }
        return { items: [...this.items], changeId: this.items.length };
      }
    }
    
    const buffer = new MockDisplayBuffer();
    const iterations = 100;
    
    // Test current implementation
    console.time('Current getItems() (inefficient)');
    for (let i = 0; i < iterations; i++) {
      buffer.getItems();
    }
    console.timeEnd('Current getItems() (inefficient)');
    
    // Test optimized implementation
    let lastChangeId = 0;
    console.time('Optimized getItems() (with change detection)');
    for (let i = 0; i < iterations; i++) {
      const result = buffer.getItemsOptimized(lastChangeId);
      if (result.items.length > 0) {
        lastChangeId = result.changeId;
      }
    }
    console.timeEnd('Optimized getItems() (with change detection)');
    
    console.log('✅ Buffer operations test complete');
  },
  
  // Test 2: Measure math rendering performance
  async testMathRenderingPerformance() {
    console.log('🧮 Testing Math Rendering Performance...');
    
    const testEquations = [
      'x^2 + 5x + 6 = 0', // Simple
      '\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', // Medium
      '\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}', // Complex
      '\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}', // Complex
      '\\det\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc' // Matrix
    ];
    
    try {
      const katex = await import('katex');
      const renderTimes: number[] = [];
      
      for (const equation of testEquations) {
        const start = performance.now();
        
        try {
          katex.default.renderToString(equation, {
            displayMode: true,
            throwOnError: false
          });
        } catch (error) {
          console.warn(`Failed to render: ${equation}`);
        }
        
        const end = performance.now();
        const renderTime = end - start;
        renderTimes.push(renderTime);
        
        console.log(`📐 ${equation.substring(0, 30)}... → ${renderTime.toFixed(2)}ms`);
      }
      
      const avgTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
      const maxTime = Math.max(...renderTimes);
      
      console.log(`📊 Average render time: ${avgTime.toFixed(2)}ms`);
      console.log(`📊 Max render time: ${maxTime.toFixed(2)}ms`);
      console.log(`📊 Target: <50ms average, <100ms max`);
      
      if (avgTime > 50) {
        console.warn('⚠️ Average render time exceeds target!');
      }
      if (maxTime > 100) {
        console.warn('⚠️ Max render time exceeds target!');
      }
      
    } catch (error) {
      console.error('❌ Failed to load KaTeX:', error);
    }
    
    console.log('✅ Math rendering test complete');
  },
  
  // Test 3: Measure memory usage patterns
  testMemoryUsage() {
    console.log('💾 Testing Memory Usage Patterns...');
    
    const perfMemory = (performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    if (!perfMemory) {
      console.warn('⚠️ Performance.memory not available in this browser');
      return;
    }

    const initialMemory = perfMemory.usedJSHeapSize;
    console.log(`📊 Initial memory: ${(initialMemory / 1024 / 1024).toFixed(2)}MB`);
    
    // Simulate polling overhead
    const largeArray = [];
    for (let i = 0; i < 1000; i++) {
      largeArray.push({
        id: `item_${i}`,
        type: 'text',
        content: `Test content ${i} with some additional text to simulate real content`,
        timestamp: Date.now() + i
      });
    }
    
    // Simulate 100 polling operations (like current implementation)
    console.time('Polling simulation (100 iterations)');
    for (let i = 0; i < 100; i++) {
      const copy = [...largeArray]; // Simulates current getItems() behavior
      // Force some processing
      copy.forEach(item => item.id.length);
    }
    console.timeEnd('Polling simulation (100 iterations)');
    
    const finalMemory = perfMemory.usedJSHeapSize;
    const memoryGrowth = finalMemory - initialMemory;
    
    console.log(`📊 Final memory: ${(finalMemory / 1024 / 1024).toFixed(2)}MB`);
    console.log(`📊 Memory growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
    console.log(`📊 Target: <10MB growth for test`);
    
    if (memoryGrowth > 10 * 1024 * 1024) {
      console.warn('⚠️ High memory growth detected!');
    }
    
    console.log('✅ Memory usage test complete');
  },
  
  // Test 4: Measure update frequency impact
  testUpdateFrequency() {
    console.log('⏱️ Testing Update Frequency Impact...');
    
    let updateCount = 0;
    let totalUpdateTime = 0;
    const updateTimes: number[] = [];
    
    const simulateUpdate = () => {
      const start = performance.now();
      
      // Simulate current update logic
      const items = Array(1000).fill(null).map((_, i) => ({
        id: `item_${i}`,
        content: `Content ${i}`,
        timestamp: Date.now()
      }));
      
      // Simulate React state update and comparison
      const hasChanges = items.length > 0;
      if (hasChanges) {
        // Simulate scroll operation
        const scrollTime = Math.random() * 2; // 0-2ms scroll simulation
      }
      
      const end = performance.now();
      const updateTime = end - start;
      
      updateCount++;
      totalUpdateTime += updateTime;
      updateTimes.push(updateTime);
      
      if (updateCount % 20 === 0) {
        const avgTime = totalUpdateTime / updateCount;
        const maxTime = Math.max(...updateTimes);
        console.log(`📊 Update #${updateCount}: avg ${avgTime.toFixed(2)}ms, max ${maxTime.toFixed(2)}ms`);
      }
      
      if (updateCount < 100) {
        setTimeout(simulateUpdate, 250); // Current 250ms interval
      } else {
        // Final results
        const avgTime = totalUpdateTime / updateCount;
        const maxTime = Math.max(...updateTimes);
        
        console.log(`📊 Final Results:`);
        console.log(`   Updates: ${updateCount}`);
        console.log(`   Average time: ${avgTime.toFixed(2)}ms`);
        console.log(`   Max time: ${maxTime.toFixed(2)}ms`);
        console.log(`   Target: <2ms average, <16ms max`);
        
        if (avgTime > 2) {
          console.warn('⚠️ Average update time too high!');
        }
        if (maxTime > 16) {
          console.warn('⚠️ Update spikes causing frame drops!');
        }
        
        console.log('✅ Update frequency test complete');
      }
    };
    
    simulateUpdate();
  },
  
  // Test 5: Compare polling vs subscription performance
  testPollingVsSubscription() {
    console.log('🔄 Testing Polling vs Subscription Performance...');
    
    class TestBuffer {
      private items: DisplayBufferItem[] = [];
      private subscribers: Set<Function> = new Set();
      private lastChangeId = 0;
      
      addItem(item: DisplayBufferItem) {
        this.items.push(item);
        this.lastChangeId++;
        this.notifySubscribers();
      }
      
      // Polling approach (current)
      getItems() {
        return [...this.items];
      }
      
      // Subscription approach (recommended)
      subscribe(callback: Function) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
      }
      
      private notifySubscribers() {
        this.subscribers.forEach(callback => callback(this.items));
      }
    }
    
    const buffer = new TestBuffer();
    
    // Test polling approach
    let pollingUpdates = 0;
    let pollingTime = 0;
    
    console.time('Polling approach (100 checks)');
    const pollingInterval = setInterval(() => {
      const start = performance.now();
      buffer.getItems(); // Always copies array
      const end = performance.now();
      
      pollingTime += (end - start);
      pollingUpdates++;
      
      if (pollingUpdates >= 100) {
        clearInterval(pollingInterval);
        console.timeEnd('Polling approach (100 checks)');
        console.log(`📊 Polling: ${pollingUpdates} updates, ${pollingTime.toFixed(2)}ms total`);
        
        // Test subscription approach
        testSubscription();
      }
    }, 10);
    
    function testSubscription() {
      let subscriptionUpdates = 0;
      let subscriptionTime = 0;
      
      console.time('Subscription approach (10 actual changes)');
      
      const unsubscribe = buffer.subscribe((items: DisplayBufferItem[]) => {
        const start = performance.now();
        // Process items (no copying needed)
        const end = performance.now();
        
        subscriptionTime += (end - start);
        subscriptionUpdates++;
        
        if (subscriptionUpdates >= 10) {
          console.timeEnd('Subscription approach (10 actual changes)');
          console.log(`📊 Subscription: ${subscriptionUpdates} updates, ${subscriptionTime.toFixed(2)}ms total`);
          
          // Compare results
          const pollingEfficiency = pollingTime / pollingUpdates;
          const subscriptionEfficiency = subscriptionTime / subscriptionUpdates;
          
          console.log(`📊 Comparison:`);
          console.log(`   Polling: ${pollingEfficiency.toFixed(3)}ms per update`);
          console.log(`   Subscription: ${subscriptionEfficiency.toFixed(3)}ms per update`);
          console.log(`   Improvement: ${((pollingEfficiency - subscriptionEfficiency) / pollingEfficiency * 100).toFixed(1)}%`);
          
          unsubscribe();
          console.log('✅ Polling vs Subscription test complete');
        }
      });
      
      // Add items to trigger subscription updates
      for (let i = 0; i < 10; i++) {
        setTimeout(() => {
          buffer.addItem({ id: `item_${i}`, content: `Item ${i}`, timestamp: Date.now(), type: 'text' });
        }, i * 100);
      }
    }
  },
  
  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Performance Test Suite...');
    console.log('=' .repeat(50));
    
    this.testBufferOperations();
    console.log('\n');
    
    await this.testMathRenderingPerformance();
    console.log('\n');
    
    this.testMemoryUsage();
    console.log('\n');
    
    this.testUpdateFrequency();
    console.log('\n');
    
    this.testPollingVsSubscription();
    
    console.log('\n🏁 All performance tests initiated!');
    console.log('Check console output for detailed results.');
  }
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as Window & { PerformanceTestSuite?: unknown }).PerformanceTestSuite = PerformanceTestSuite;
  console.log('💡 Performance test suite available as window.PerformanceTestSuite');
  console.log('Run: PerformanceTestSuite.runAllTests()');
}

export default PerformanceTestSuite;