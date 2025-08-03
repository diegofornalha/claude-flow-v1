/**
 * Performance Optimization Module
 * 
 * Provides performance monitoring, metrics collection, and optimization utilities
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';

// ==================== Performance Metrics ====================

export interface PerformanceMetrics {
  requestCount: number;
  averageResponseTime: number;
  peakResponseTime: number;
  errorRate: number;
  activeConnections: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  timestamp: number;
}

export interface RequestMetrics {
  tool: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
  memoryBefore?: number;
  memoryAfter?: number;
}

// ==================== Performance Monitor ====================

export class PerformanceMonitor extends EventEmitter {
  private requests: Map<string, RequestMetrics> = new Map();
  private completedRequests: RequestMetrics[] = [];
  private maxHistorySize = 1000;
  private metricsInterval: NodeJS.Timer | null = null;
  
  constructor(private intervalMs: number = 60000) {
    super();
  }
  
  /**
   * Start monitoring performance metrics
   */
  start(): void {
    if (this.metricsInterval) return;
    
    this.metricsInterval = setInterval(() => {
      this.emit('metrics', this.getMetrics());
    }, this.intervalMs);
  }
  
  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }
  
  /**
   * Record request start
   */
  recordRequestStart(requestId: string, tool: string): void {
    const memoryBefore = process.memoryUsage().heapUsed;
    
    this.requests.set(requestId, {
      tool,
      startTime: performance.now(),
      success: false,
      memoryBefore
    });
  }
  
  /**
   * Record request completion
   */
  recordRequestEnd(requestId: string, success: boolean, error?: string): void {
    const request = this.requests.get(requestId);
    if (!request) return;
    
    request.endTime = performance.now();
    request.duration = request.endTime - request.startTime;
    request.success = success;
    request.error = error;
    request.memoryAfter = process.memoryUsage().heapUsed;
    
    this.completedRequests.push(request);
    this.requests.delete(requestId);
    
    // Maintain history size
    if (this.completedRequests.length > this.maxHistorySize) {
      this.completedRequests.shift();
    }
    
    this.emit('request', request);
  }
  
  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const now = Date.now();
    const recentRequests = this.completedRequests.filter(
      r => r.startTime > performance.now() - 300000 // Last 5 minutes
    );
    
    const successfulRequests = recentRequests.filter(r => r.success);
    const totalDuration = successfulRequests.reduce((sum, r) => sum + (r.duration || 0), 0);
    const averageResponseTime = successfulRequests.length > 0 
      ? totalDuration / successfulRequests.length 
      : 0;
    
    const peakResponseTime = Math.max(
      0,
      ...successfulRequests.map(r => r.duration || 0)
    );
    
    const errorRate = recentRequests.length > 0
      ? (recentRequests.length - successfulRequests.length) / recentRequests.length
      : 0;
    
    return {
      requestCount: recentRequests.length,
      averageResponseTime,
      peakResponseTime,
      errorRate,
      activeConnections: this.requests.size,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      timestamp: now
    };
  }
  
  /**
   * Get metrics by tool
   */
  getToolMetrics(): Map<string, PerformanceMetrics> {
    const toolMetrics = new Map<string, RequestMetrics[]>();
    
    // Group by tool
    for (const request of this.completedRequests) {
      const tool = request.tool;
      if (!toolMetrics.has(tool)) {
        toolMetrics.set(tool, []);
      }
      toolMetrics.get(tool)!.push(request);
    }
    
    // Calculate metrics per tool
    const result = new Map<string, PerformanceMetrics>();
    
    for (const [tool, requests] of toolMetrics) {
      const successfulRequests = requests.filter(r => r.success);
      const totalDuration = successfulRequests.reduce((sum, r) => sum + (r.duration || 0), 0);
      
      result.set(tool, {
        requestCount: requests.length,
        averageResponseTime: successfulRequests.length > 0 
          ? totalDuration / successfulRequests.length 
          : 0,
        peakResponseTime: Math.max(0, ...successfulRequests.map(r => r.duration || 0)),
        errorRate: requests.length > 0
          ? (requests.length - successfulRequests.length) / requests.length
          : 0,
        activeConnections: 0,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        timestamp: Date.now()
      });
    }
    
    return result;
  }
  
  /**
   * Clear metrics history
   */
  clearHistory(): void {
    this.completedRequests = [];
  }
}

// ==================== Resource Monitor ====================

export interface ResourceLimits {
  maxMemoryMB: number;
  maxCpuPercent: number;
  maxActiveRequests: number;
}

export class ResourceMonitor {
  private cpuInterval: NodeJS.Timer | null = null;
  private lastCpuUsage: NodeJS.CpuUsage = process.cpuUsage();
  private lastCpuCheck = process.hrtime.bigint();
  
  constructor(
    private limits: ResourceLimits = {
      maxMemoryMB: 512,
      maxCpuPercent: 80,
      maxActiveRequests: 100
    }
  ) {}
  
  /**
   * Check if resources are within limits
   */
  checkResources(activeRequests: number): { ok: boolean; reason?: string } {
    // Check memory
    const memoryUsageMB = process.memoryUsage().heapUsed / 1024 / 1024;
    if (memoryUsageMB > this.limits.maxMemoryMB) {
      return { ok: false, reason: `Memory usage ${memoryUsageMB.toFixed(2)}MB exceeds limit ${this.limits.maxMemoryMB}MB` };
    }
    
    // Check active requests
    if (activeRequests > this.limits.maxActiveRequests) {
      return { ok: false, reason: `Active requests ${activeRequests} exceeds limit ${this.limits.maxActiveRequests}` };
    }
    
    // Check CPU
    const cpuPercent = this.getCpuUsagePercent();
    if (cpuPercent > this.limits.maxCpuPercent) {
      return { ok: false, reason: `CPU usage ${cpuPercent.toFixed(2)}% exceeds limit ${this.limits.maxCpuPercent}%` };
    }
    
    return { ok: true };
  }
  
  /**
   * Get current CPU usage percentage
   */
  private getCpuUsagePercent(): number {
    const currentCpuUsage = process.cpuUsage();
    const currentTime = process.hrtime.bigint();
    
    const timeDelta = Number(currentTime - this.lastCpuCheck) / 1e9; // Convert to seconds
    const userDelta = (currentCpuUsage.user - this.lastCpuUsage.user) / 1000; // Convert to ms
    const systemDelta = (currentCpuUsage.system - this.lastCpuUsage.system) / 1000;
    
    const cpuPercent = ((userDelta + systemDelta) / timeDelta) * 100;
    
    this.lastCpuUsage = currentCpuUsage;
    this.lastCpuCheck = currentTime;
    
    return cpuPercent;
  }
  
  /**
   * Update resource limits
   */
  updateLimits(limits: Partial<ResourceLimits>): void {
    this.limits = { ...this.limits, ...limits };
  }
}

// ==================== Performance Optimization Utilities ====================

/**
 * Request queue with priority and rate limiting
 */
export class OptimizedRequestQueue<T> {
  private queue: Array<{ priority: number; item: T; timestamp: number }> = [];
  private processing = false;
  private processedCount = 0;
  private windowStart = Date.now();
  
  constructor(
    private processor: (item: T) => Promise<void>,
    private options: {
      maxConcurrent?: number;
      rateLimit?: { count: number; windowMs: number };
    } = {}
  ) {}
  
  /**
   * Add item to queue with priority (higher = more important)
   */
  async enqueue(item: T, priority: number = 0): Promise<void> {
    this.queue.push({ priority, item, timestamp: Date.now() });
    this.queue.sort((a, b) => b.priority - a.priority);
    
    if (!this.processing) {
      this.processing = true;
      this.processQueue();
    }
  }
  
  /**
   * Process queued items
   */
  private async processQueue(): Promise<void> {
    const maxConcurrent = this.options.maxConcurrent || 5;
    const rateLimit = this.options.rateLimit;
    
    while (this.queue.length > 0) {
      // Check rate limit
      if (rateLimit) {
        const now = Date.now();
        if (now - this.windowStart > rateLimit.windowMs) {
          this.windowStart = now;
          this.processedCount = 0;
        }
        
        if (this.processedCount >= rateLimit.count) {
          // Wait until next window
          const waitTime = rateLimit.windowMs - (now - this.windowStart);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
      
      // Process batch
      const batch = this.queue.splice(0, maxConcurrent);
      await Promise.all(
        batch.map(async ({ item }) => {
          try {
            await this.processor(item);
            this.processedCount++;
          } catch (error) {
            console.error('Error processing queue item:', error);
          }
        })
      );
    }
    
    this.processing = false;
  }
  
  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }
  
  /**
   * Clear queue
   */
  clear(): void {
    this.queue = [];
  }
}

// ==================== Memory Pool ====================

/**
 * Object pool for reducing allocations
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private inUse = new Set<T>();
  
  constructor(
    private factory: () => T,
    private reset: (obj: T) => void,
    private initialSize: number = 10
  ) {
    // Pre-allocate objects
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory());
    }
  }
  
  /**
   * Acquire object from pool
   */
  acquire(): T {
    let obj = this.pool.pop();
    
    if (!obj) {
      obj = this.factory();
    }
    
    this.inUse.add(obj);
    return obj;
  }
  
  /**
   * Release object back to pool
   */
  release(obj: T): void {
    if (!this.inUse.has(obj)) return;
    
    this.reset(obj);
    this.inUse.delete(obj);
    this.pool.push(obj);
  }
  
  /**
   * Get pool statistics
   */
  getStats(): { pooled: number; inUse: number; total: number } {
    return {
      pooled: this.pool.length,
      inUse: this.inUse.size,
      total: this.pool.length + this.inUse.size
    };
  }
}

// ==================== Export Singleton Instances ====================

export const performanceMonitor = new PerformanceMonitor();
export const resourceMonitor = new ResourceMonitor();