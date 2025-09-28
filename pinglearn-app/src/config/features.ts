/**
 * Unified Feature Flags - Single Source of Truth
 * Build-time feature resolution for optimal performance
 * V1 deployment ready configuration
 */

export const FEATURES = {
  // Core features (V1 ready - always enabled)
  geminiLive: true,
  mathTranscription: true,
  voiceFlow: true,
  liveKitCore: true,
  showThenTell: true,
  showThenTellTiming: true, // From enableShowThenTellTiming

  // Environment-based flags
  debugMode: process.env.NODE_ENV === 'development',
  monitoring: process.env.NODE_ENV === 'production',
  performanceOptimization: process.env.NODE_ENV === 'production',

  // V2 features (disabled for V1)
  newDashboard: false,
  aiGeneratedFeatures: false,
  advancedProtection: false,
  rollback: false,
} as const;

export type FeatureFlag = keyof typeof FEATURES;

/**
 * Simple runtime hook for edge cases requiring dynamic checks
 * Prefer direct FEATURES.flagName access for better performance
 */
export const useFeature = (flag: FeatureFlag): boolean => {
  return FEATURES[flag];
};

/**
 * Backward compatibility mapping (temporary - remove after migration)
 */
export const legacyFeatureFlags = {
  enableGeminiLive: FEATURES.geminiLive,
  enableMathTranscription: FEATURES.mathTranscription,
  enableVoiceFlow: FEATURES.voiceFlow,
  enableLiveKitCore: FEATURES.liveKitCore,
  enableShowThenTell: FEATURES.showThenTell,
  enableShowThenTellTiming: FEATURES.showThenTellTiming,
  enableNewDashboard: FEATURES.newDashboard,
  enableAIGeneratedFeatures: FEATURES.aiGeneratedFeatures,
  enableAdvancedProtection: FEATURES.advancedProtection,
  enableMonitoring: FEATURES.monitoring,
  enableRollback: FEATURES.rollback,
  enablePerformanceOptimization: FEATURES.performanceOptimization,
  enableFC010: true, // Maps to showThenTell
};

/**
 * Development utilities
 */
export const getFeatureStatus = () => {
  if (FEATURES.debugMode) {
    console.log('🎯 Feature Flags Status:', FEATURES);
  }
  return FEATURES;
};