/**
 * Inconsistency Analyzer
 * Detects discrepancies between verification script claims and actual evidence
 */

import { GitEvidence } from '../collectors/git-evidence';
import { FileSystemEvidence } from '../collectors/filesystem-evidence';

export interface VerificationClaim {
  category: string;
  claim: string;
  value: any;
  confidence: number;
}

export interface Inconsistency {
  category: string;
  scriptClaim: any;
  evidenceFindings: any;
  conflictType: 'major' | 'minor' | 'enhancement';
  confidence: number;
  correction: any;
  reasoning: string;
}

export interface CorrectionRule {
  category: string;
  evidenceThreshold: number;
  correctionLogic: (scriptValue: any, evidenceValue: any) => any;
  confidenceWeight: number;
}

export class InconsistencyAnalyzer {
  private correctionRules: CorrectionRule[];

  constructor() {
    this.correctionRules = this.initializeCorrectionRules();
  }

  analyzeInconsistencies(
    scriptOutput: any,
    gitEvidence: GitEvidence,
    fsEvidence: FileSystemEvidence
  ): Inconsistency[] {
    const inconsistencies: Inconsistency[] = [];

    // Analyze phase completion inconsistencies
    const phaseInconsistency = this.analyzePhaseCompletion(
      scriptOutput,
      gitEvidence,
      fsEvidence
    );
    if (phaseInconsistency) {
      inconsistencies.push(phaseInconsistency);
    }

    // Analyze protected core modification claims
    const protectedCoreInconsistency = this.analyzeProtectedCoreStatus(
      scriptOutput,
      gitEvidence
    );
    if (protectedCoreInconsistency) {
      inconsistencies.push(protectedCoreInconsistency);
    }

    // Analyze implementation progress
    const progressInconsistency = this.analyzeImplementationProgress(
      scriptOutput,
      fsEvidence
    );
    if (progressInconsistency) {
      inconsistencies.push(progressInconsistency);
    }

    return inconsistencies;
  }

  private analyzePhaseCompletion(
    scriptOutput: any,
    gitEvidence: GitEvidence,
    fsEvidence: FileSystemEvidence
  ): Inconsistency | null {
    // Extract script's phase completion claim
    const scriptPhasesClaimed = this.extractPhasesFromScript(scriptOutput);

    // Get evidence-based phase analysis
    const gitPhaseAnalysis = this.analyzeGitPhases(gitEvidence);
    const fsPhaseAnalysis = this.analyzeFileSystemPhases(fsEvidence);

    // Combine evidence with confidence weighting
    const evidencePhases = this.combinePhaseEvidence(gitPhaseAnalysis, fsPhaseAnalysis);

    // Check for significant discrepancy
    const discrepancy = this.calculatePhaseDiscrepancy(scriptPhasesClaimed, evidencePhases);

    if (discrepancy.isSignificant) {
      return {
        category: 'phase_completion',
        scriptClaim: scriptPhasesClaimed,
        evidenceFindings: evidencePhases,
        conflictType: discrepancy.severity,
        confidence: discrepancy.confidence,
        correction: evidencePhases,
        reasoning: discrepancy.reasoning
      };
    }

    return null;
  }

  private analyzeProtectedCoreStatus(
    scriptOutput: any,
    gitEvidence: GitEvidence
  ): Inconsistency | null {
    // Check if script claims unauthorized modifications
    const scriptClaimsModification = this.extractProtectedCoreWarning(scriptOutput);

    if (scriptClaimsModification) {
      // Check if modifications are authorized (PC-XXX change records)
      const authorizedChanges = this.checkAuthorizedChanges(gitEvidence);

      if (authorizedChanges.length > 0) {
        return {
          category: 'protected_core_modifications',
          scriptClaim: 'Unauthorized modifications detected',
          evidenceFindings: authorizedChanges,
          conflictType: 'minor',
          confidence: 0.85,
          correction: 'Authorized changes via approved change records',
          reasoning: `Found ${authorizedChanges.length} authorized change records: ${authorizedChanges.join(', ')}`
        };
      }
    }

    return null;
  }

  private analyzeImplementationProgress(
    scriptOutput: any,
    fsEvidence: FileSystemEvidence
  ): Inconsistency | null {
    // Check for implementation markers that script might miss
    const scriptProgress = this.extractProgressFromScript(scriptOutput);
    const evidenceProgress = this.calculateEvidenceBasedProgress(fsEvidence);

    const progressGap = evidenceProgress.completion - scriptProgress.completion;

    if (progressGap > 0.15) { // 15% or more difference
      return {
        category: 'implementation_progress',
        scriptClaim: scriptProgress,
        evidenceFindings: evidenceProgress,
        conflictType: 'enhancement',
        confidence: 0.75,
        correction: evidenceProgress,
        reasoning: `Evidence shows ${(progressGap * 100).toFixed(0)}% more progress than script detected`
      };
    }

    return null;
  }

  private extractPhasesFromScript(scriptOutput: any): any {
    // Parse script output to extract phase completion claims
    // This would parse the actual pinglearn-verify output
    if (typeof scriptOutput === 'string') {
      const phaseMatch = scriptOutput.match(/Phases completed: (\d+)\/(\d+)/);
      if (phaseMatch) {
        return {
          completed: parseInt(phaseMatch[1]),
          total: parseInt(phaseMatch[2]),
          percentage: (parseInt(phaseMatch[1]) / parseInt(phaseMatch[2])) * 100
        };
      }
    }
    return { completed: 0, total: 4, percentage: 0 };
  }

  private analyzeGitPhases(gitEvidence: GitEvidence): any {
    const phaseAnalysis = {
      currentPhase: 'unknown',
      completedPhases: [] as string[],
      confidence: 0,
      evidence: [] as string[]
    };

    // Analyze current branch for phase indication
    const branch = gitEvidence.currentBranch;
    if (/phase-3|stabilization|uat/i.test(branch)) {
      phaseAnalysis.currentPhase = 'phase-3';
      phaseAnalysis.completedPhases = ['phase-0', 'phase-1', 'phase-2'];
      phaseAnalysis.confidence = 0.9;
      phaseAnalysis.evidence.push(`Current branch: ${branch}`);
    } else if (/phase-2|gemini/i.test(branch)) {
      phaseAnalysis.currentPhase = 'phase-2';
      phaseAnalysis.completedPhases = ['phase-0', 'phase-1'];
      phaseAnalysis.confidence = 0.8;
      phaseAnalysis.evidence.push(`Current branch: ${branch}`);
    } else if (/phase-1|core/i.test(branch)) {
      phaseAnalysis.currentPhase = 'phase-1';
      phaseAnalysis.completedPhases = ['phase-0'];
      phaseAnalysis.confidence = 0.7;
      phaseAnalysis.evidence.push(`Current branch: ${branch}`);
    }

    // Analyze change records for completion evidence
    const changeRecords = gitEvidence.changeRecords;
    if (changeRecords.includes('PC-007')) {
      phaseAnalysis.evidence.push('PC-007 completed (Phase 2 critical fix)');
      if (phaseAnalysis.completedPhases.length < 3) {
        phaseAnalysis.completedPhases = ['phase-0', 'phase-1', 'phase-2'];
      }
    }

    return phaseAnalysis;
  }

  private analyzeFileSystemPhases(fsEvidence: FileSystemEvidence): any {
    const phases = fsEvidence.phaseMarkers;
    const completedPhases = phases
      .filter(p => p.confidence > 0.7)
      .map(p => p.phase);

    return {
      completedPhases,
      confidence: phases.reduce((acc, p) => acc + p.confidence, 0) / phases.length,
      evidence: phases.map(p => `${p.phase}: ${p.markers.length} markers found`)
    };
  }

  private combinePhaseEvidence(gitAnalysis: any, fsAnalysis: any): any {
    // Weight git evidence higher (0.7) than filesystem evidence (0.3)
    const gitWeight = 0.7;
    const fsWeight = 0.3;

    const combinedConfidence = (gitAnalysis.confidence * gitWeight) +
                              (fsAnalysis.confidence * fsWeight);

    // Use git analysis as primary, supplement with filesystem evidence
    return {
      completed: Math.max(gitAnalysis.completedPhases.length, fsAnalysis.completedPhases.length),
      total: 4,
      percentage: (Math.max(gitAnalysis.completedPhases.length, fsAnalysis.completedPhases.length) / 4) * 100,
      currentPhase: gitAnalysis.currentPhase,
      confidence: combinedConfidence,
      evidence: [...gitAnalysis.evidence, ...fsAnalysis.evidence]
    };
  }

  private calculatePhaseDiscrepancy(scriptClaim: any, evidenceClaim: any): any {
    const completionDiff = evidenceClaim.completed - scriptClaim.completed;
    const isSignificant = completionDiff >= 1; // At least 1 full phase difference

    let severity: 'major' | 'minor' | 'enhancement' = 'minor';
    if (completionDiff >= 2) severity = 'major';
    else if (completionDiff >= 1) severity = 'enhancement';

    return {
      isSignificant,
      severity,
      confidence: evidenceClaim.confidence,
      reasoning: `Evidence shows ${evidenceClaim.completed}/4 phases complete vs script's ${scriptClaim.completed}/4. Current phase: ${evidenceClaim.currentPhase}`
    };
  }

  private extractProtectedCoreWarning(scriptOutput: any): boolean {
    if (typeof scriptOutput === 'string') {
      return /protected core modified/i.test(scriptOutput);
    }
    return false;
  }

  private checkAuthorizedChanges(gitEvidence: GitEvidence): string[] {
    return gitEvidence.changeRecords.filter(record => /PC-\d{3}/.test(record));
  }

  private extractProgressFromScript(scriptOutput: any): any {
    // Extract overall progress percentage from script
    const match = scriptOutput.match(/(\d+)%.*compliance/i);
    const percentage = match ? parseInt(match[1]) : 0;

    return {
      completion: percentage / 100,
      source: 'verification_script'
    };
  }

  private calculateEvidenceBasedProgress(fsEvidence: FileSystemEvidence): any {
    const requiredFiles = fsEvidence.requiredFiles;
    const existingFiles = requiredFiles.filter(f => f.exists).length;
    const completion = existingFiles / requiredFiles.length;

    return {
      completion,
      existingFiles,
      totalFiles: requiredFiles.length,
      source: 'filesystem_evidence'
    };
  }

  private initializeCorrectionRules(): CorrectionRule[] {
    return [
      {
        category: 'phase_completion',
        evidenceThreshold: 0.8,
        correctionLogic: (scriptValue: any, evidenceValue: any) => evidenceValue,
        confidenceWeight: 0.9
      },
      {
        category: 'protected_core_modifications',
        evidenceThreshold: 0.85,
        correctionLogic: (scriptValue: any, evidenceValue: any) => evidenceValue,
        confidenceWeight: 0.85
      }
    ];
  }
}