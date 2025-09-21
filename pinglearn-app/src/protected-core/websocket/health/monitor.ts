/**
 * WebSocket Health Monitor
 * PROTECTED CORE - DO NOT MODIFY WITHOUT APPROVAL
 *
 * Monitors WebSocket connection health through ping/pong mechanisms,
 * tracks latency, and provides connection quality metrics.
 */

import { EventEmitter } from 'events';

export interface HealthMetrics {
  latency: number;
  averageLatency: number;
  packetLoss: number;
  uptime: number;
  lastPingTime: number;
  lastPongTime: number;
  isHealthy: boolean;
  quality: 'excellent' | 'good' | 'poor' | 'critical';
}

export interface PingResult {
  sent: number;
  received?: number;
  latency?: number;
  timeout: boolean;
}

export class WebSocketHealthMonitor extends EventEmitter {
  private pingInterval: NodeJS.Timeout | null = null;
  private pingTimeouts: Map<number, NodeJS.Timeout> = new Map();
  private pingResults: PingResult[] = [];
  private connectionStartTime: number = 0;
  private isMonitoring = false;
  private pingCounter = 0;

  // Configuration
  private readonly pingIntervalMs: number;
  private readonly pingTimeoutMs: number;
  private readonly maxStoredResults: number;
  private readonly healthThresholds: {
    excellent: number;
    good: number;
    poor: number;
  };

  constructor(config: {
    pingIntervalMs?: number;
    pingTimeoutMs?: number;
    maxStoredResults?: number;
    healthThresholds?: { excellent: number; good: number; poor: number };
  } = {}) {
    super();

    this.pingIntervalMs = config.pingIntervalMs ?? 30000; // 30 seconds
    this.pingTimeoutMs = config.pingTimeoutMs ?? 5000; // 5 seconds
    this.maxStoredResults = config.maxStoredResults ?? 100;
    this.healthThresholds = config.healthThresholds ?? {
      excellent: 100, // < 100ms
      good: 300,      // < 300ms
      poor: 1000      // < 1000ms
    };
  }

  /**
   * Start health monitoring
   */
  start(sendPing: () => void): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.connectionStartTime = Date.now();
    this.pingResults = [];
    this.pingCounter = 0;

    this.pingInterval = setInterval(() => {
      this.sendPing(sendPing);
    }, this.pingIntervalMs);

    // Send first ping immediately
    setTimeout(() => this.sendPing(sendPing), 100);
  }

  /**
   * Stop health monitoring
   */
  stop(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Clear all pending timeouts
    this.pingTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.pingTimeouts.clear();
  }

  /**
   * Send a ping and track the result
   */
  private sendPing(sendPingCallback: () => void): void {
    const pingId = ++this.pingCounter;
    const sentTime = Date.now();

    const result: PingResult = {
      sent: sentTime,
      timeout: false
    };

    // Set timeout for this ping
    const timeoutId = setTimeout(() => {
      result.timeout = true;
      this.recordPingResult(result);
      this.pingTimeouts.delete(pingId);
    }, this.pingTimeoutMs);

    this.pingTimeouts.set(pingId, timeoutId);

    try {
      sendPingCallback();
    } catch (error) {
      console.error('Failed to send ping:', error);
      result.timeout = true;
      this.recordPingResult(result);
      clearTimeout(timeoutId);
      this.pingTimeouts.delete(pingId);
    }
  }

  /**
   * Handle received pong
   */
  handlePong(): void {
    const receivedTime = Date.now();

    // Find the most recent ping without a pong
    for (let i = this.pingResults.length - 1; i >= 0; i--) {
      const result = this.pingResults[i];
      if (!result.received && !result.timeout) {
        result.received = receivedTime;
        result.latency = receivedTime - result.sent;

        // Clear the timeout for this ping
        this.pingTimeouts.forEach((timeout, pingId) => {
          clearTimeout(timeout);
          this.pingTimeouts.delete(pingId);
        });

        this.emit('pong-received', result);
        break;
      }
    }
  }

  /**
   * Record a ping result and maintain the results buffer
   */
  private recordPingResult(result: PingResult): void {
    this.pingResults.push(result);

    // Maintain max buffer size
    if (this.pingResults.length > this.maxStoredResults) {
      this.pingResults.shift();
    }

    this.emit('ping-result', result);

    // Emit health status if needed
    const metrics = this.getMetrics();
    this.emit('health-update', metrics);
  }

  /**
   * Get current health metrics
   */
  getMetrics(): HealthMetrics {
    const now = Date.now();
    const recentResults = this.pingResults.slice(-20); // Last 20 pings
    const successfulPings = recentResults.filter(r => !r.timeout && r.latency !== undefined);
    const timeoutPings = recentResults.filter(r => r.timeout);

    // Calculate latencies
    const latencies = successfulPings.map(r => r.latency!);
    const currentLatency = latencies.length > 0 ? latencies[latencies.length - 1] : 0;
    const averageLatency = latencies.length > 0 ?
      latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length : 0;

    // Calculate packet loss
    const packetLoss = recentResults.length > 0 ?
      (timeoutPings.length / recentResults.length) * 100 : 0;

    // Calculate uptime
    const uptime = now - this.connectionStartTime;

    // Determine connection quality
    let quality: HealthMetrics['quality'] = 'critical';
    if (packetLoss < 5) {
      if (averageLatency < this.healthThresholds.excellent) {
        quality = 'excellent';
      } else if (averageLatency < this.healthThresholds.good) {
        quality = 'good';
      } else if (averageLatency < this.healthThresholds.poor) {
        quality = 'poor';
      }
    }

    // Determine if connection is healthy
    const isHealthy = packetLoss < 10 && averageLatency < this.healthThresholds.poor;

    const lastSuccessfulPing = successfulPings[successfulPings.length - 1];

    return {
      latency: currentLatency,
      averageLatency,
      packetLoss,
      uptime,
      lastPingTime: recentResults.length > 0 ? recentResults[recentResults.length - 1].sent : 0,
      lastPongTime: lastSuccessfulPing?.received || 0,
      isHealthy,
      quality
    };
  }

  /**
   * Get detailed ping history
   */
  getPingHistory(): PingResult[] {
    return [...this.pingResults];
  }

  /**
   * Get connection quality score (0-100)
   */
  getQualityScore(): number {
    const metrics = this.getMetrics();

    // Base score on latency
    let latencyScore = 100;
    if (metrics.averageLatency > this.healthThresholds.excellent) {
      latencyScore = Math.max(0, 100 - (metrics.averageLatency - this.healthThresholds.excellent) / 10);
    }

    // Reduce score based on packet loss
    const packetLossScore = Math.max(0, 100 - metrics.packetLoss * 10);

    // Combined score
    return Math.floor((latencyScore + packetLossScore) / 2);
  }

  /**
   * Check if connection needs attention
   */
  needsAttention(): boolean {
    const metrics = this.getMetrics();
    return !metrics.isHealthy || metrics.quality === 'critical';
  }

  /**
   * Get human-readable status
   */
  getStatusMessage(): string {
    const metrics = this.getMetrics();
    const score = this.getQualityScore();

    return `${metrics.quality.toUpperCase()} (${score}/100) - ` +
           `Latency: ${Math.round(metrics.averageLatency)}ms, ` +
           `Loss: ${metrics.packetLoss.toFixed(1)}%`;
  }

  /**
   * Reset all metrics (on reconnection)
   */
  reset(): void {
    this.pingResults = [];
    this.pingCounter = 0;
    this.connectionStartTime = Date.now();
    this.pingTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.pingTimeouts.clear();
  }
}