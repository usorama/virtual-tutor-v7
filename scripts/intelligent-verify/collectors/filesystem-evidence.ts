/**
 * Filesystem Evidence Collector
 * Checks for phase-specific files, directories, and implementation markers
 */

import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

export interface FileSystemEvidence {
  requiredFiles: Array<{
    path: string;
    exists: boolean;
    size: number;
    lastModified: Date;
  }>;
  protectedCoreFiles: number;
  changeRecordFiles: string[];
  testFiles: number;
  phaseMarkers: Array<{
    phase: string;
    markers: string[];
    confidence: number;
  }>;
}

export class FileSystemEvidenceCollector {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  async collect(): Promise<FileSystemEvidence> {
    try {
      const requiredFiles = this.checkRequiredFiles();
      const protectedCoreFiles = this.countProtectedCoreFiles();
      const changeRecordFiles = this.findChangeRecordFiles();
      const testFiles = this.countTestFiles();
      const phaseMarkers = this.detectPhaseMarkers();

      return {
        requiredFiles,
        protectedCoreFiles,
        changeRecordFiles,
        testFiles,
        phaseMarkers
      };
    } catch (error) {
      console.error('Error collecting filesystem evidence:', error);
      return {
        requiredFiles: [],
        protectedCoreFiles: 0,
        changeRecordFiles: [],
        testFiles: 0,
        phaseMarkers: []
      };
    }
  }

  private checkRequiredFiles(): Array<{path: string, exists: boolean, size: number, lastModified: Date}> {
    const criticalFiles = [
      // Phase 0 - Foundation
      'src/protected-core/claude.md',
      'src/protected-core/websocket/manager/singleton-manager.ts',
      'src/protected-core/contracts/voice.contract.ts',

      // Phase 1 - Core Services
      'src/protected-core/voice-engine/livekit/service.ts',
      'src/protected-core/transcription/display/buffer.ts',
      'src/protected-core/voice-engine/gemini/service.ts',

      // Phase 2 - Gemini Integration
      'livekit-agent/agent.py',
      'src/app/api/transcription/route.ts',
      'src/app/api/livekit/token/route.ts',

      // Phase 3 - Stabilization
      'e2e/critical-path.spec.ts',
      'docs/new-arch-impl-planning/phase-3-stabilization.md'
    ];

    return criticalFiles.map(relativePath => {
      const fullPath = join(this.projectRoot, relativePath);
      let exists = false;
      let size = 0;
      let lastModified = new Date(0);

      try {
        if (existsSync(fullPath)) {
          exists = true;
          const stats = statSync(fullPath);
          size = stats.size;
          lastModified = stats.mtime;
        }
      } catch (error) {
        // File doesn't exist or can't be accessed
      }

      return {
        path: relativePath,
        exists,
        size,
        lastModified
      };
    });
  }

  private countProtectedCoreFiles(): number {
    try {
      const protectedCorePath = join(this.projectRoot, 'src/protected-core');
      if (!existsSync(protectedCorePath)) return 0;

      const output = execSync('find src/protected-core -type f -name "*.ts" | wc -l', {
        cwd: this.projectRoot,
        encoding: 'utf8'
      });
      return parseInt(output.trim()) || 0;
    } catch {
      return 0;
    }
  }

  private findChangeRecordFiles(): string[] {
    try {
      const changeRecordsPath = join(this.projectRoot, 'docs/change_records/protected_core_changes');
      if (!existsSync(changeRecordsPath)) return [];

      const output = execSync('find docs/change_records/protected_core_changes -name "PC-*.md"', {
        cwd: this.projectRoot,
        encoding: 'utf8'
      });

      return output.split('\n')
        .filter(file => file.trim())
        .map(file => file.trim());
    } catch {
      return [];
    }
  }

  private countTestFiles(): number {
    try {
      const output = execSync('find . -name "*.test.ts" -o -name "*.spec.ts" | wc -l', {
        cwd: this.projectRoot,
        encoding: 'utf8'
      });
      return parseInt(output.trim()) || 0;
    } catch {
      return 0;
    }
  }

  private detectPhaseMarkers(): Array<{phase: string, markers: string[], confidence: number}> {
    const phaseMarkers = [
      {
        phase: 'phase-0',
        files: ['src/protected-core/claude.md', 'feature-flags.json'],
        patterns: ['WebSocketManager.getInstance', 'protected-core']
      },
      {
        phase: 'phase-1',
        files: ['src/protected-core/voice-engine/livekit/service.ts'],
        patterns: ['LiveKitVoiceService', 'VoiceServiceContract']
      },
      {
        phase: 'phase-2',
        files: ['livekit-agent/agent.py', 'src/app/api/transcription/route.ts'],
        patterns: ['gemini-2.0-flash', 'google.beta.realtime']
      },
      {
        phase: 'phase-3',
        files: ['e2e/critical-path.spec.ts'],
        patterns: ['critical-path', 'stabilization']
      }
    ];

    return phaseMarkers.map(({ phase, files, patterns }) => {
      const existingFiles = files.filter(file =>
        existsSync(join(this.projectRoot, file))
      );

      const foundPatterns = patterns.filter(pattern => {
        try {
          const output = execSync(`grep -r "${pattern}" src/ livekit-agent/ 2>/dev/null || true`, {
            cwd: this.projectRoot,
            encoding: 'utf8'
          });
          return output.length > 0;
        } catch {
          return false;
        }
      });

      const markers = [...existingFiles, ...foundPatterns];
      const confidence = (existingFiles.length / files.length) * 0.7 +
                        (foundPatterns.length / patterns.length) * 0.3;

      return { phase, markers, confidence };
    });
  }

  /**
   * Analyze phase completion based on filesystem evidence
   */
  analyzePhaseCompletion(): {
    completedPhases: string[];
    currentPhase: string;
    confidence: number;
    evidence: string[];
  } {
    const requiredFiles = this.checkRequiredFiles();
    const phaseMarkers = this.detectPhaseMarkers();
    const changeRecords = this.findChangeRecordFiles();

    const completedPhases: string[] = [];
    const evidence: string[] = [];

    // Check phase completion based on file existence and markers
    for (const { phase, confidence, markers } of phaseMarkers) {
      if (confidence > 0.7) {
        completedPhases.push(phase);
        evidence.push(`${phase}: ${markers.length} markers found (${(confidence * 100).toFixed(0)}% confidence)`);
      }
    }

    // Determine current phase (highest confidence that's not fully complete)
    const sortedPhases = phaseMarkers
      .sort((a, b) => b.confidence - a.confidence)
      .filter(p => p.confidence > 0.5);

    const currentPhase = sortedPhases[0]?.phase || 'unknown';
    const overallConfidence = sortedPhases[0]?.confidence || 0;

    // Add change record evidence
    if (changeRecords.length > 0) {
      evidence.push(`${changeRecords.length} change records found`);
    }

    return {
      completedPhases,
      currentPhase,
      confidence: overallConfidence,
      evidence
    };
  }
}