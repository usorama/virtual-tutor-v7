import featureFlagsData from '../../feature-flags.json';

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
}

export const featureFlags: FeatureFlags = featureFlagsData as FeatureFlags;