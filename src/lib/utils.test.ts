import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn (classname utility)', () => {
  it('concatena classes simples', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('ignora valores falsy', () => {
    expect(cn('foo', undefined, null, false, 'bar')).toBe('foo bar');
  });

  it('resolve conflitos do Tailwind (última classe vence)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('concatena classes condicionais', () => {
    const active = true;
    expect(cn('base', active && 'active')).toBe('base active');
  });

  it('retorna string vazia quando não há classes', () => {
    expect(cn()).toBe('');
  });
});
