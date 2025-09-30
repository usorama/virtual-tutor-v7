import featureFlagsData from '../../feature-flags.json';

/**
 * Resilience system feature flags (ERR-005)
 */
interface ResilienceFlags {
  selfHealing: boolean;
  errorPredictor: boolean;
  intelligentFallback: boolean;
  recoveryOrchestrator: boolean;
}

interface FeatureFlags {
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
  enableShowThenTell: boolean;
  enableFC010: boolean;
  enableShowThenTellTiming: boolean;
  resilience: ResilienceFlags;
}

export const featureFlags: FeatureFlags = featureFlagsData as FeatureFlags;

/**
 * Check if a resilience feature is enabled
 * @param feature - Resilience feature name
 * @returns true if enabled
 */
export function isResilienceEnabled(
  feature: keyof ResilienceFlags
): boolean {
  return featureFlags.resilience?.[feature] ?? false;
}

/**
 * Check if all resilience features are enabled
 * @returns true if all enabled
 */
export function isFullResilienceEnabled(): boolean {
  return (
    isResilienceEnabled('selfHealing') &&
    isResilienceEnabled('errorPredictor') &&
    isResilienceEnabled('intelligentFallback') &&
    isResilienceEnabled('recoveryOrchestrator')
  );
}