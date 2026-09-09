import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Newest-first copy of a list. Written with an index loop so it works on every
 * Hermes build (the array-by-copy helpers are not reliably available).
 */
export function reversed<T>(items: readonly T[]): T[] {
  const output: T[] = [];
  for (let index = items.length - 1; index >= 0; index -= 1) {
    output.push(items[index]);
  }
  return output;
}
