export interface ChangelogEntry {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  title: string;
  description: string;
  features?: string[];
  improvements?: string[];
  bugFixes?: string[];
  breakingChanges?: string[];
  technical?: string[];
  contributors?: string[];
}

export interface ChangelogData {
  entries: ChangelogEntry[];
  metadata: {
    lastUpdated: string;
    totalReleases: number;
    currentVersion: string;
  };
}