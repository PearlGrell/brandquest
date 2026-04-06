import { getCachedEventConfig } from "./apiClient";

// Date gate for event features
// Unlock date is fetched from backend via getCachedEventConfig()
// Falls back to April 10, 2026 if no config is cached

export const getFeatureUnlockDate = (): Date => {
  const config = getCachedEventConfig();
  if (config && config.unlockDate) {
    return new Date(config.unlockDate);
  }
  // Fallback to April 10, 2026
  return new Date(2026, 3, 10);
};

export const isFeatureUnlocked = (): boolean => {
  const now = new Date();
  const unlockDate = getFeatureUnlockDate();
  return now >= unlockDate;
};

export const getDaysUntilUnlock = (): number => {
  const now = new Date();
  const unlockDate = getFeatureUnlockDate();
  const diffTime = unlockDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
