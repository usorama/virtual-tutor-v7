/**
 * Git Evidence Collector
 * Collects evidence from git history, branches, and commits
 */

import { execSync } from 'child_process';
import { join } from 'path';

export interface GitEvidence {
  currentBranch: string;
  recentCommits: Array<{
    hash: string;
    message: string;
    date: string;
  }>;
  changeRecords: string[];
  tags: string[];
  branchHistory: string[];
}

export class GitEvidenceCollector {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  async collect(): Promise<GitEvidence> {
    try {
      const currentBranch = this.getCurrentBranch();
      const recentCommits = this.getRecentCommits(20);
      const changeRecords = this.getChangeRecords();
      const tags = this.getTags();
      const branchHistory = this.getBranchHistory();

      return {
        currentBranch,
        recentCommits,
        changeRecords,
        tags,
        branchHistory
      };
    } catch (error) {
      console.error('Error collecting git evidence:', error);
      return {
        currentBranch: 'unknown',
        recentCommits: [],
        changeRecords: [],
        tags: [],
        branchHistory: []
      };
    }
  }

  private getCurrentBranch(): string {
    try {
      return execSync('git branch --show-current', {
        cwd: this.projectRoot,
        encoding: 'utf8'
      }).trim();
    } catch {
      return 'unknown';
    }
  }

  private getRecentCommits(count: number = 10): Array<{hash: string, message: string, date: string}> {
    try {
      const output = execSync(`git log --oneline -${count} --pretty=format:"%H|%s|%ci"`, {
        cwd: this.projectRoot,
        encoding: 'utf8'
      });

      return output.split('\n').map(line => {
        const [hash, message, date] = line.split('|');
        return { hash, message, date };
      });
    } catch {
      return [];
    }
  }

  private getChangeRecords(): string[] {
    try {
      const commits = execSync('git log --oneline --all', {
        cwd: this.projectRoot,
        encoding: 'utf8'
      });

      const pcPattern = /PC-\d{3}/g;
      const matches = commits.match(pcPattern) || [];
      return [...new Set(matches)].sort();
    } catch {
      return [];
    }
  }

  private getTags(): string[] {
    try {
      const output = execSync('git tag --sort=-version:refname', {
        cwd: this.projectRoot,
        encoding: 'utf8'
      });
      return output.split('\n').filter(tag => tag.trim());
    } catch {
      return [];
    }
  }

  private getBranchHistory(): string[] {
    try {
      const output = execSync('git branch -a --format="%(refname:short)"', {
        cwd: this.projectRoot,
        encoding: 'utf8'
      });
      return output.split('\n')
        .filter(branch => branch.trim() && !branch.includes('origin/'))
        .map(branch => branch.trim());
    } catch {
      return [];
    }
  }

  /**
   * Analyze phase progression based on git evidence
   */
  analyzePhaseProgression(): {
    detectedPhase: string;
    confidence: number;
    evidence: string[];
  } {
    const branch = this.getCurrentBranch();
    const commits = this.getChangeRecords();

    // Phase detection logic based on branch patterns
    const phasePatterns = [
      { phase: 'phase-3', pattern: /phase-3|stabilization|uat/i, weight: 0.9 },
      { phase: 'phase-2', pattern: /phase-2|gemini/i, weight: 0.8 },
      { phase: 'phase-1', pattern: /phase-1|core-services/i, weight: 0.7 },
      { phase: 'phase-0', pattern: /phase-0|foundation/i, weight: 0.6 }
    ];

    let detectedPhase = 'unknown';
    let confidence = 0;
    const evidence: string[] = [];

    // Check current branch
    for (const { phase, pattern, weight } of phasePatterns) {
      if (pattern.test(branch)) {
        detectedPhase = phase;
        confidence = weight;
        evidence.push(`Current branch: ${branch}`);
        break;
      }
    }

    // Check change records for completion evidence
    const pcRecords = commits.length;
    if (pcRecords >= 7) {
      evidence.push(`PC-007 completed (${pcRecords} change records)`);
      if (detectedPhase === 'phase-2' || detectedPhase === 'phase-3') {
        confidence = Math.min(confidence + 0.1, 1.0);
      }
    }

    return { detectedPhase, confidence, evidence };
  }
}