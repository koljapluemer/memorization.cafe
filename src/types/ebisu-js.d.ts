// Type declarations for ebisu-js
// This file provides types for the ebisu-js library, which has broken TypeScript source files

declare module 'ebisu-js' {
  export type Model = [number, number, number];

  export function defaultModel(t: number, a?: number, b?: number): Model;
  export function predictRecall(prior: Model, tnow: number, exact?: boolean): number;
  export function updateRecall(
    prior: Model,
    successes: number,
    total: number,
    tnow: number,
    q0?: number,
    rebalance?: boolean,
    tback?: number,
    params?: { useLog?: boolean; tolerance?: number }
  ): Model;
  export function modelToPercentileDecay(model: Model, percentile?: number, tolerance?: number): number;
  export function rescaleHalflife(prior: Model, scale?: number): Model;
}
