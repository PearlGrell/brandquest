import { useState, useCallback } from "react";

const MAX_HINTS = 4;
const COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours

interface HintState {
  usedAt: number[]; // timestamps of hint usage
}

const STORAGE_KEY = "celestio_hints";

function getHintState(): HintState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { usedAt: [] };
}

function saveHintState(state: HintState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getActiveHints(state: HintState): number[] {
  const now = Date.now();
  return state.usedAt.filter((t) => now - t < COOLDOWN_MS);
}

export function useHints() {
  const [state, setState] = useState<HintState>(getHintState);

  const activeHints = getActiveHints(state);
  const hintsRemaining = MAX_HINTS - activeHints.length;
  const canUseHint = hintsRemaining > 0;

  const useHint = useCallback((): boolean => {
    const current = getHintState();
    const active = getActiveHints(current);
    if (active.length >= MAX_HINTS) return false;

    const updated: HintState = { usedAt: [...active, Date.now()] };
    saveHintState(updated);
    setState(updated);
    return true;
  }, []);

  return { hintsRemaining, canUseHint, submitHint: useHint, maxHints: MAX_HINTS };
}
