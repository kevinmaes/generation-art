/**
 * Performance timing utilities for tracking operation durations
 */

export class PerformanceTimer {
  private startTimes = new Map<string, number>();
  private durations = new Map<string, number>();
  private memorySnapshots = new Map<string, NodeJS.MemoryUsage>();

  /**
   * Start timing an operation
   */
  start(label: string): void {
    this.startTimes.set(label, performance.now());
    this.memorySnapshots.set(label, process.memoryUsage());
  }

  /**
   * End timing an operation and return duration in ms
   */
  end(label: string): number {
    const startTime = this.startTimes.get(label);
    if (!startTime) {
      console.warn(`No start time found for label: ${label}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.durations.set(label, duration);
    this.startTimes.delete(label);
    
    return duration;
  }

  /**
   * End timing and log the result
   */
  endAndLog(label: string, prefix = '  '): number {
    const duration = this.end(label);
    const memoryStart = this.memorySnapshots.get(label);
    const memoryEnd = process.memoryUsage();
    
    const seconds = (duration / 1000).toFixed(2);
    let message = `${prefix}⏱️  ${label}: ${seconds}s`;
    
    if (memoryStart) {
      const heapDiff = (memoryEnd.heapUsed - memoryStart.heapUsed) / (1024 * 1024);
      if (Math.abs(heapDiff) > 1) {
        message += ` (heap ${heapDiff > 0 ? '+' : ''}${heapDiff.toFixed(1)}MB)`;
      }
    }
    
    console.log(message);
    
    // Warn if operation took too long
    if (duration > 10000) {
      console.log(`${prefix}⚠️  Warning: ${label} took more than 10 seconds`);
    }
    
    return duration;
  }

  /**
   * Get all recorded durations
   */
  getDurations(): Map<string, number> {
    return new Map(this.durations);
  }

  /**
   * Get summary statistics
   */
  getSummary(): { total: number; operations: { label: string; duration: number }[] } {
    const operations = Array.from(this.durations.entries())
      .map(([label, duration]) => ({ label, duration }))
      .sort((a, b) => b.duration - a.duration);
    
    const total = operations.reduce((sum, op) => sum + op.duration, 0);
    
    return { total, operations };
  }

  /**
   * Log a summary of all operations
   */
  logSummary(title = 'Performance Summary'): void {
    const summary = this.getSummary();
    
    console.log(`\n📊 ${title}`);
    console.log('─'.repeat(50));
    
    for (const op of summary.operations) {
      const seconds = (op.duration / 1000).toFixed(2);
      const percentage = ((op.duration / summary.total) * 100).toFixed(1);
      console.log(`  ${op.label}: ${seconds}s (${percentage}%)`);
    }
    
    console.log('─'.repeat(50));
    console.log(`  Total: ${(summary.total / 1000).toFixed(2)}s`);
    
    // Memory usage
    const memUsage = process.memoryUsage();
    console.log(`  Memory: ${(memUsage.heapUsed / (1024 * 1024)).toFixed(1)}MB heap used`);
  }

  /**
   * Reset all timers
   */
  reset(): void {
    this.startTimes.clear();
    this.durations.clear();
    this.memorySnapshots.clear();
  }
}

/**
 * Create a simple timer for quick measurements
 */
export function createTimer(): PerformanceTimer {
  return new PerformanceTimer();
}

/**
 * Measure a single async operation
 */
export async function measureAsync<T>(
  label: string,
  operation: () => Promise<T>,
  logResult = true
): Promise<T> {
  const timer = new PerformanceTimer();
  timer.start(label);
  
  try {
    const result = await operation();
    if (logResult) {
      timer.endAndLog(label);
    } else {
      timer.end(label);
    }
    return result;
  } catch (error) {
    timer.endAndLog(label);
    throw error;
  }
}

/**
 * Measure a single sync operation
 */
export function measureSync<T>(
  label: string,
  operation: () => T,
  logResult = true
): T {
  const timer = new PerformanceTimer();
  timer.start(label);
  
  try {
    const result = operation();
    if (logResult) {
      timer.endAndLog(label);
    } else {
      timer.end(label);
    }
    return result;
  } catch (error) {
    timer.endAndLog(label);
    throw error;
  }
}