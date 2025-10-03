/**
 * Event Bus Bridge
 *
 * CRITICAL FIX for transcript display bug.
 *
 * Problem: SessionOrchestrator uses dynamic import which creates a DIFFERENT
 * event bus instance than LiveKitRoom's static export. Events emitted by
 * LiveKitRoom never reach SessionOrchestrator's listener.
 *
 * Solution: This bridge listens on the CORRECT event bus (LiveKitRoom's instance)
 * and directly adds transcripts to DisplayBuffer via SessionOrchestrator's public API.
 *
 * See: /docs/evidence/CRITICAL-BUG-EVENT-BUS-MISMATCH.md
 */

import { liveKitEventBus } from '@/components/voice/LiveKitRoom';
import { SessionOrchestrator } from '@/protected-core';

export class EventBusBridge {
  private static instance: EventBusBridge | null = null;
  private isInitialized = false;

  private constructor() {}

  static initialize(): void {
    if (!this.instance) {
      this.instance = new EventBusBridge();
    }

    if (!this.instance.isInitialized) {
      this.instance.setupBridge();
      this.instance.isInitialized = true;
      console.log('[EventBusBridge] Initialized and connected to LiveKit event bus');
    }
  }

  static cleanup(): void {
    if (this.instance && this.instance.isInitialized) {
      // Event bus cleanup would go here if needed
      this.instance.isInitialized = false;
      console.log('[EventBusBridge] Cleaned up');
    }
  }

  private setupBridge(): void {
    // Listen on the CORRECT event bus instance (LiveKitRoom's static export)
    liveKitEventBus.on('livekit:transcript', (data: any) => {
      console.log('[EventBusBridge] ✅ Received transcript from LiveKit event bus');
      console.log('[EventBusBridge] Data:', {
        hasSegments: !!data.segments,
        segmentCount: data.segments?.length,
        speaker: data.speaker
      });

      if (!data.segments || !Array.isArray(data.segments)) {
        console.warn('[EventBusBridge] ❌ Invalid transcript data structure');
        return;
      }

      // Get orchestrator instance and add transcripts directly to DisplayBuffer
      const orchestrator = SessionOrchestrator.getInstance();

      data.segments.forEach((segment: any, idx: number) => {
        if (!segment.content) {
          console.warn('[EventBusBridge] ⚠️ Segment missing content:', segment);
          return;
        }

        // Add to display buffer using orchestrator's public API
        try {
          const itemId = (orchestrator as any).addTranscriptionItem({
            type: segment.type || 'text',
            content: segment.content,
            speaker: data.speaker || 'teacher',
            confidence: segment.confidence || 1.0
          });

          console.log(`[EventBusBridge] ✅ Added segment ${idx + 1}/${data.segments.length} to DisplayBuffer:`, {
            id: itemId,
            content: segment.content.substring(0, 50) + (segment.content.length > 50 ? '...' : '')
          });
        } catch (error) {
          console.error('[EventBusBridge] ❌ Failed to add transcript item:', error);
        }
      });

      console.log(`[EventBusBridge] ✅ Successfully processed ${data.segments.length} segments`);
    });

    console.log('[EventBusBridge] ✅ Event listener attached to liveKitEventBus');
  }
}
