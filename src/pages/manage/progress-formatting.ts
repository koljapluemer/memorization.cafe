import { State } from 'ts-fsrs';
import { predictRecall } from 'ebisu-js';
import type { Model as EbisuModel } from 'ebisu-js';

export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const absDays = Math.abs(diffDays);

  if (absDays === 0) {
    return 'Today';
  } else if (absDays === 1) {
    return diffDays > 0 ? 'Tomorrow' : 'Yesterday';
  } else if (diffDays > 0) {
    return `In ${absDays} days`;
  } else {
    return `${absDays} days ago`;
  }
}

export function formatAbsoluteDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getFSRSStateName(state: State): string {
  switch (state) {
    case State.New:
      return 'New';
    case State.Learning:
      return 'Learning';
    case State.Review:
      return 'Review';
    case State.Relearning:
      return 'Relearning';
    default:
      return 'Unknown';
  }
}

export function calculateRecallProbability(model: EbisuModel, lastReviewDate: Date): number {
  const now = new Date();
  const elapsedHours = (now.getTime() - lastReviewDate.getTime()) / (1000 * 60 * 60);
  const recallProbability = predictRecall(model, elapsedHours, true);
  return recallProbability;
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}
