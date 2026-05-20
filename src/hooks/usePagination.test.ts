import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from './usePagination';

const makeItems = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

describe('usePagination', () => {
  it('retorna a primeira página por padrão', () => {
    const items = makeItems(25);
    const { result } = renderHook(() => usePagination(items, 10));
    expect(result.current.currentPage).toBe(1);
    expect(result.current.paginatedItems).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('calcula o total de páginas corretamente', () => {
    const { result } = renderHook(() => usePagination(makeItems(25), 10));
    expect(result.current.totalPages).toBe(3);
  });

  it('navega para a próxima página', () => {
    const items = makeItems(25);
    const { result } = renderHook(() => usePagination(items, 10));
    act(() => result.current.goToPage(2));
    expect(result.current.currentPage).toBe(2);
    expect(result.current.paginatedItems).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
  });

  it('última página tem itens restantes', () => {
    const items = makeItems(25);
    const { result } = renderHook(() => usePagination(items, 10));
    act(() => result.current.goToPage(3));
    expect(result.current.paginatedItems).toEqual([21, 22, 23, 24, 25]);
  });

  it('não vai além da última página', () => {
    const items = makeItems(10);
    const { result } = renderHook(() => usePagination(items, 10));
    act(() => result.current.goToPage(99));
    expect(result.current.currentPage).toBe(1);
  });

  it('não vai abaixo da página 1', () => {
    const items = makeItems(10);
    const { result } = renderHook(() => usePagination(items, 10));
    act(() => result.current.goToPage(-5));
    expect(result.current.currentPage).toBe(1);
  });

  it('reset volta para a página 1', () => {
    const items = makeItems(25);
    const { result } = renderHook(() => usePagination(items, 10));
    act(() => result.current.goToPage(2));
    act(() => result.current.reset());
    expect(result.current.currentPage).toBe(1);
  });

  it('lista vazia retorna totalPages = 1', () => {
    const { result } = renderHook(() => usePagination([], 10));
    expect(result.current.totalPages).toBe(1);
    expect(result.current.paginatedItems).toEqual([]);
  });
});
