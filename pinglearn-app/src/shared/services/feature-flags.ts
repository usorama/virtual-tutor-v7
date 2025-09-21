/**
 * Feature Flags Service
 * Manages feature toggles for safe deployment and rollback
 */

import flags from '../../../feature-flags.json';

export interface FeatureFlags {
  enableGeminiLive: boolean;
  enableMathTranscription: boolean;
  enableNewDashboard: boolean;
  enableAIGeneratedFeatures: boolean;
  enableVoiceFlow: boolean;
  enableLiveKitCore: boolean;
  enableAdvancedProtection: boolean;
  enableMonitoring: boolean;
  enableRollback: boolean;
  enablePerformanceOptimization: boolean;
}

export class FeatureFlagService {
  /**
   * Check if a specific feature is enabled
   */
  static isEnabled(flag: keyof FeatureFlags): boolean {
    return flags[flag] ?? false;
  }

  /**
   * Get all feature flags
   */
  static getAllFlags(): FeatureFlags {
    return { ...flags } as FeatureFlags;
  }

  /**
   * Get flags for a specific category
   */
  static getCategoryFlags(category: 'core' | 'experimental' | 'protection'): Partial<FeatureFlags> {
    switch (category) {
      case 'core':
        return {
          enableGeminiLive: flags.enableGeminiLive,
          enableMathTranscription: flags.enableMathTranscription,
          enableVoiceFlow: flags.enableVoiceFlow,
          enableLiveKitCore: flags.enableLiveKitCore,
        };
      case 'experimental':
        return {
          enableNewDashboard: flags.enableNewDashboard,
          enableAIGeneratedFeatures: flags.enableAIGeneratedFeatures,
          enablePerformanceOptimization: flags.enablePerformanceOptimization,
        };
      case 'protection':
        return {
          enableAdvancedProtection: flags.enableAdvancedProtection,
          enableMonitoring: flags.enableMonitoring,
          enableRollback: flags.enableRollback,
        };
      default:
        return {};
    }
  }

  /**
   * Check if any experimental features are enabled
   */
  static hasExperimentalFeatures(): boolean {
    return flags.enableAIGeneratedFeatures ||
           flags.enableNewDashboard ||
           flags.enablePerformanceOptimization;
  }

  /**
   * Check if system is in protected mode
   */
  static isProtectedMode(): boolean {
    return flags.enableAdvancedProtection;
  }
}