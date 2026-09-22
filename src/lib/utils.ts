import clsx, { type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export function round(value: number, places = 0): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

export function pct(value: number): string {
  return `${Math.round(value)}%`;
}

export function signed(value: number, suffix = '%'): string {
  const rounded = round(value, 1);
  if (rounded > 0) return `+${rounded}${suffix}`;
  return `${rounded}${suffix}`;
}

export function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

/**
 * Deterministic PRNG (mulberry32) so the demo dataset is byte-identical on
 * every machine and every reload. Chosen over a hand-rolled xorshift because
 * its output distribution is uniform enough that the seeded percentages the
 * dashboard reports actually match the parameters that produced them.
 */
export function createRng(seed: number) {
  let a = seed >>> 0 || 1;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length) % items.length];
}

export function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function chance(rng: () => number, probability: number): boolean {
  return rng() < probability;
}

export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function formatDayLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function titleCase(value: string): string {
  return value
    .split(/[-\s]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Normalises free text for keyword matching in the answer evaluator. */
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s+.#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function wordCount(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}
