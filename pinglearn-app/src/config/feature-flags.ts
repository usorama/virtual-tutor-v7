import featureFlagsData from './feature-flags.json';

interface FeatureFlags {
  enableDarkTheme: boolean;
  enablePurposeBasedLearning: boolean;
}

export const featureFlags: FeatureFlags = featureFlagsData as FeatureFlags;