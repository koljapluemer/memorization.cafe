import type { Duration } from './Duration';

/**
 * Converts a Duration enum to milliseconds
 */
export function durationToMilliseconds(duration: Duration | undefined): number {
  if (!duration) return 0;

  switch (duration) {
    case 'HOUR':
      return 60 * 60 * 1000;
    case 'DAY':
      return 24 * 60 * 60 * 1000;
    case 'TWO_DAYS':
      return 2 * 24 * 60 * 60 * 1000;
    case 'WEEK':
      return 7 * 24 * 60 * 60 * 1000;
    case 'MONTH':
      return 30 * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
}

/**
 * Checks if the minimum interval has passed since the last review
 */
export function hasMinimumIntervalPassed(
  lastReviewDate: Date | null | undefined,
  minimumInterval: Duration | undefined,
  now: Date = new Date()
): boolean {
  // If no minimum interval is set, always allow
  if (!minimumInterval) return true;

  // If no last review date, allow (first time)
  if (!lastReviewDate) return true;

  const intervalMs = durationToMilliseconds(minimumInterval);
  const elapsedMs = now.getTime() - lastReviewDate.getTime();

  return elapsedMs >= intervalMs;
}
