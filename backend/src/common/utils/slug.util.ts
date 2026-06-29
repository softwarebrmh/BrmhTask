import { randomBytes } from 'crypto';

export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
  const suffix = randomBytes(3).toString('hex');
  return `${base}-${suffix}`;
}
