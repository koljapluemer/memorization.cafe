export interface WeightedItem<T> {
  item: T;
  weight: number;
}

/**
 * Selects a random item from an array based on weights.
 * Higher weights have higher probability of being selected.
 * Returns null if array is empty or all weights are 0.
 */
export function weightedRandomChoice<T>(items: WeightedItem<T>[]): T | null {
  if (items.length === 0) return null;

  // Filter out items with non-positive weights
  const validItems = items.filter(item => item.weight > 0);
  if (validItems.length === 0) return null;

  // Calculate total weight
  const totalWeight = validItems.reduce((sum, item) => sum + item.weight, 0);

  // Generate random number between 0 and totalWeight
  let random = Math.random() * totalWeight;

  // Select item based on cumulative weight
  for (const weightedItem of validItems) {
    random -= weightedItem.weight;
    if (random <= 0) {
      return weightedItem.item;
    }
  }

  // Fallback (should not reach here due to floating point, but just in case)
  return validItems[validItems.length - 1]!.item;
}
