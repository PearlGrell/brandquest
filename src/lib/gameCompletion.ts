// Game completion tracking utility

export interface GameCompletion {
  levelId: 1 | 2 | 3;
  levelName: string;
  completedAt: number; // timestamp
  attempts: number;
}

/**
 * Get all completed games. If teamId is missing, it tracks as 'guest'.
 */
export const getCompletedGames = (teamId?: string | null): GameCompletion[] => {
  const activeId = teamId || "guest";
  const key = `celestio_game_completions_${activeId}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
};

/**
 * Check if a specific game has been completed
 */
export const isGameCompleted = (teamId: string | null | undefined, levelId: 1 | 2 | 3): boolean => {
  const completions = getCompletedGames(teamId);
  return completions.some((c) => c.levelId === levelId);
};

/**
 * Mark a game as completed
 */
export const markGameCompleted = (teamId: string | null | undefined, levelId: 1 | 2 | 3, levelName: string): void => {
  const activeId = teamId || "guest";
  const key = `celestio_game_completions_${activeId}`;
  const completions = getCompletedGames(activeId);

  // Check if already completed
  const existing = completions.find((c) => c.levelId === levelId);
  if (existing) {
    // Increment attempt count
    existing.attempts += 1;
    existing.completedAt = Date.now();
  } else {
    // Add new completion
    completions.push({
      levelId,
      levelName,
      completedAt: Date.now(),
      attempts: 1,
    });
  }

  localStorage.setItem(key, JSON.stringify(completions));
};

/**
 * Clear all completions for a team (for testing)
 */
export const clearGameCompletions = (teamId: string): void => {
  const key = `celestio_game_completions_${teamId}`;
  localStorage.removeItem(key);
};
