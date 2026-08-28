import { describe, it, expect } from 'vitest';
import { makeBookCode, normalizeCode, formatCode, CODE_LENGTH } from './code.js';

describe('makeBookCode', () => {
  it('doğru uzunlukta kod üretir', () => {
    expect(makeBookCode()).toHaveLength(CODE_LENGTH);
  });

  it('yalnızca izinli karakterleri kullanır', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(makeBookCode()).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
    }
  });

  it('karıştırılabilecek harfleri üretmez', () => {
    const many = Array.from({ length: 200 }, () => makeBookCode()).join('');
    expect(many).not.toMatch(/[O01I]/);
  });

  it('pratikte tekrar etmez', () => {
    const codes = new Set(Array.from({ length: 2000 }, () => makeBookCode()));
    expect(codes.size).toBe(2000);
  });

  it('verilen rastgele kaynağını kullanır', () => {
    expect(makeBookCode(() => 0)).toBe('A'.repeat(CODE_LENGTH));
  });
});

describe('normalizeCode', () => {
  it('boşluk ve tireleri temizler', () => {
    expect(normalizeCode('abcd-efgh 2345')).toBe('ABCDEFGH2345');
  });

  it('kısa kodu reddeder', () => {
    expect(normalizeCode('ABC')).toBeNull();
  });

  it('boş girdide null verir', () => {
    expect(normalizeCode('')).toBeNull();
    expect(normalizeCode(null)).toBeNull();
    expect(normalizeCode('!!!!')).toBeNull();
  });

  it('ürettiğimiz kodu kabul eder', () => {
    const code = makeBookCode();
    expect(normalizeCode(formatCode(code))).toBe(code);
  });
});

describe('formatCode', () => {
  it('dörderli gruplar', () => {
    expect(formatCode('ABCDEFGH2345')).toBe('ABCD EFGH 2345');
  });

  it('bozuk girdide boş döner', () => {
    expect(formatCode(null)).toBe('');
  });
});
