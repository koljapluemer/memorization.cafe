import type { ClozeStrategy } from '@/app/database';

// Thresholds for progressive difficulty
export const CLOZE_THRESHOLD_CONSECUTIVE_2 = 0.7;
export const CLOZE_THRESHOLD_CONSECUTIVE_3 = 0.8;
export const CLOZE_THRESHOLD_ALL_RANDOM = 0.9;
export const CLOZE_THRESHOLD_FORCE_ALL = 0.95;

export const CLOZE_MARKER = '＿';

export interface ClozeResult {
  clozedText: string;
  clozedIndices: number[];
}

/**
 * Generate cloze text based on strategy, indices, and retrievability
 */
export function generateClozeText(
  content: string,
  indices: number[],
  strategy: ClozeStrategy,
  retrievability?: number
): ClozeResult {
  if (strategy === 'split') {
    return generateSplitCloze(content, indices);
  }

  if (strategy === 'atEveryCharacter') {
    return generateCharacterCloze(content, indices, retrievability);
  }

  // Default: atSpace
  return generateWordCloze(content, indices, retrievability);
}

/**
 * Generate cloze for 'split' strategy
 */
function generateSplitCloze(content: string, indices: number[]): ClozeResult {
  if (indices.length === 0) {
    return { clozedText: content, clozedIndices: [] };
  }

  // Pick a random marker
  const randomMarkerIndex = indices[Math.floor(Math.random() * indices.length)]!;

  // Cloze everything after that marker
  const beforeMarker = content.substring(0, randomMarkerIndex + 1);
  const clozedText = beforeMarker + CLOZE_MARKER;

  return { clozedText, clozedIndices: [randomMarkerIndex] };
}

/**
 * Generate cloze for 'atEveryCharacter' strategy
 */
function generateCharacterCloze(
  content: string,
  indices: number[],
  retrievability?: number
): ClozeResult {
  if (indices.length === 0) {
    return { clozedText: content, clozedIndices: [] };
  }

  const validIndices = indices.filter((i) => i >= 0 && i < content.length);
  if (validIndices.length === 0) {
    return { clozedText: content, clozedIndices: [] };
  }

  // Determine how many to cloze based on retrievability
  const indicesToCloze = selectIndicesToCloze(validIndices, retrievability);

  // Build the clozed text
  let clozedText = '';
  let currentClozeStart = -1;

  for (let i = 0; i < content.length; i++) {
    if (indicesToCloze.includes(i)) {
      if (currentClozeStart === -1) {
        currentClozeStart = i;
      }
    } else {
      if (currentClozeStart !== -1) {
        clozedText += CLOZE_MARKER;
        currentClozeStart = -1;
      }
      clozedText += content[i];
    }
  }

  // Handle trailing cloze
  if (currentClozeStart !== -1) {
    clozedText += CLOZE_MARKER;
  }

  return { clozedText, clozedIndices: indicesToCloze };
}

/**
 * Generate cloze for 'atSpace' strategy
 */
function generateWordCloze(
  content: string,
  indices: number[],
  retrievability?: number
): ClozeResult {
  // Split content by spaces to get words/progressions
  const parts = content.split(/(\s+)/); // Keep spaces in the result
  const words: string[] = [];
  const wordPositions: number[] = []; // Start position of each word in original string

  let position = 0;
  for (const part of parts) {
    if (part.trim() !== '') {
      words.push(part);
      wordPositions.push(position);
    }
    position += part.length;
  }

  if (words.length === 0 || indices.length === 0) {
    return { clozedText: content, clozedIndices: [] };
  }

  const validIndices = indices.filter((i) => i >= 0 && i < words.length);
  if (validIndices.length === 0) {
    return { clozedText: content, clozedIndices: [] };
  }

  // Determine which word indices to cloze
  const wordIndicesToCloze = selectIndicesToCloze(validIndices, retrievability);

  // Build the clozed text
  let clozedText = '';
  position = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i]!;
    const wordStart = wordPositions[i]!;

    // Add any spaces before this word
    while (position < wordStart) {
      clozedText += content[position];
      position++;
    }

    // Add word or cloze marker
    if (wordIndicesToCloze.includes(i)) {
      clozedText += CLOZE_MARKER;
    } else {
      clozedText += word;
    }

    position += word.length;
  }

  // Add any trailing content
  while (position < content.length) {
    clozedText += content[position];
    position++;
  }

  return { clozedText, clozedIndices: wordIndicesToCloze };
}

/**
 * Select which indices to cloze based on retrievability
 */
function selectIndicesToCloze(validIndices: number[], retrievability?: number): number[] {
  if (validIndices.length === 0) return [];

  const r = retrievability ?? 0;

  // Force all at 95%+
  if (r >= CLOZE_THRESHOLD_FORCE_ALL) {
    return [...validIndices].sort((a, b) => a - b);
  }

  // Find consecutive groups
  const consecutiveGroups = getConsecutiveGroups(validIndices);

  // Allow all at 90%+
  if (r >= CLOZE_THRESHOLD_ALL_RANDOM) {
    // Randomly pick to cloze all or subset
    if (Math.random() < 0.5) {
      return [...validIndices].sort((a, b) => a - b);
    }
  }

  // Allow 3 consecutive at 80%+
  if (r >= CLOZE_THRESHOLD_CONSECUTIVE_3) {
    const triples = consecutiveGroups.filter((g) => g.length >= 3);
    if (triples.length > 0 && Math.random() < 0.4) {
      const randomTriple = triples[Math.floor(Math.random() * triples.length)]!;
      return randomTriple.slice(0, 3);
    }
  }

  // Allow 2 consecutive at 70%+
  if (r >= CLOZE_THRESHOLD_CONSECUTIVE_2) {
    const pairs = consecutiveGroups.filter((g) => g.length >= 2);
    if (pairs.length > 0 && Math.random() < 0.5) {
      const randomPair = pairs[Math.floor(Math.random() * pairs.length)]!;
      return randomPair.slice(0, 2);
    }
  }

  // Default: pick one random index
  return [validIndices[Math.floor(Math.random() * validIndices.length)]!];
}

/**
 * Find consecutive groups of indices
 */
export function getConsecutiveGroups(indices: number[]): number[][] {
  if (indices.length === 0) return [];

  const sorted = [...indices].sort((a, b) => a - b);
  const groups: number[][] = [];
  let currentGroup: number[] = [sorted[0]!];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]!;
    const previous = sorted[i - 1]!;

    if (current === previous + 1) {
      currentGroup.push(current);
    } else {
      groups.push(currentGroup);
      currentGroup = [current];
    }
  }

  groups.push(currentGroup);
  return groups;
}

/**
 * Get default indices for a cloze based on strategy
 */
export function getDefaultIndices(content: string, strategy: ClozeStrategy): number[] {
  if (strategy === 'split') {
    // Default: one marker in the middle
    return [Math.floor(content.length / 2)];
  }

  if (strategy === 'atEveryCharacter') {
    // Every non-space character
    const indices: number[] = [];
    for (let i = 0; i < content.length; i++) {
      if (content[i] !== ' ' && content[i] !== '\t') {
        indices.push(i);
      }
    }
    return indices;
  }

  // Default: atSpace - every word with more than 3 characters
  const parts = content.split(/(\s+)/);
  const indices: number[] = [];
  let wordIndex = 0;

  for (const part of parts) {
    if (part.trim() !== '') {
      if (part.length > 3) {
        indices.push(wordIndex);
      }
      wordIndex++;
    }
  }

  return indices;
}
