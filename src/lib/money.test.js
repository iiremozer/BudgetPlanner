import { describe, it, expect } from 'vitest';
import { formatMoney, parseAmount, CURRENCY_CODES, isCurrencyCode } from './money.js';

describe('formatMoney', () => {
  it('kuruşu doğru simge ve ayraçla yazar', () => {
    expect(formatMoney(1234, 'GBP')).toBe('£12.34');
    expect(formatMoney(1234, 'TRY')).toBe('₺12,34');
    expect(formatMoney(1234, 'EUR')).toBe('€12,34');
    expect(formatMoney(1234, 'USD')).toBe('$12.34');
  });

  it('binlik ayracı ekler', () => {
    expect(formatMoney(123456789, 'GBP')).toBe('£1,234,567.89');
    expect(formatMoney(123456789, 'TRY')).toBe('₺1.234.567,89');
  });

  it('sıfır ve küçük tutarları iki haneyle gösterir', () => {
    expect(formatMoney(0, 'GBP')).toBe('£0.00');
    expect(formatMoney(5, 'GBP')).toBe('£0.05');
    expect(formatMoney(50, 'GBP')).toBe('£0.50');
  });

  it('bilinmeyen para birimini varsayılana düşürür', () => {
    expect(formatMoney(100, 'XYZ')).toBe('£1.00');
  });

  it('simge istenmezse yalnızca sayı verir', () => {
    expect(formatMoney(1234, 'GBP', { showSymbol: false })).toBe('12.34');
  });
});

describe('parseAmount', () => {
  it('sade sayıları okur', () => {
    expect(parseAmount('5')).toBe(500);
    expect(parseAmount('0')).toBe(0);
    expect(parseAmount('12.34')).toBe(1234);
    expect(parseAmount('12,34')).toBe(1234);
  });

  it('para simgelerini ve boşlukları yok sayar', () => {
    expect(parseAmount(' £5.00 ')).toBe(500);
    expect(parseAmount('₺7,50')).toBe(750);
    expect(parseAmount('$3')).toBe(300);
  });

  it('her iki ayraç varsa sondakini ondalık kabul eder', () => {
    expect(parseAmount('1.234,56')).toBe(123456);
    expect(parseAmount('1,234.56')).toBe(123456);
  });

  it('tek ayraç ve tam üç hane binlik ayracıdır', () => {
    expect(parseAmount('1,234')).toBe(123400);
    expect(parseAmount('1.234')).toBe(123400);
  });

  it('tek ayraç ve iki hane ondalıktır', () => {
    expect(parseAmount('1,23')).toBe(123);
    expect(parseAmount('1.5')).toBe(150);
  });

  it('geçersiz girdide null döner', () => {
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('   ')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('5 pound')).toBeNull();
    expect(parseAmount('-5')).toBeNull();
    expect(parseAmount(null)).toBeNull();
    expect(parseAmount(undefined)).toBeNull();
  });

  it('sayı tipini de kabul eder', () => {
    expect(parseAmount(5)).toBe(500);
    expect(parseAmount(5.5)).toBe(550);
    expect(parseAmount(-1)).toBeNull();
    expect(parseAmount(NaN)).toBeNull();
  });

  it('yazıp okuma turu tutarlıdır', () => {
    for (const code of CURRENCY_CODES) {
      const printed = formatMoney(98765, code, { showSymbol: false });
      expect(parseAmount(printed)).toBe(98765);
    }
  });
});

describe('isCurrencyCode', () => {
  it('desteklenen dört birimi tanır', () => {
    expect(CURRENCY_CODES).toEqual(['GBP', 'TRY', 'EUR', 'USD']);
    expect(isCurrencyCode('TRY')).toBe(true);
    expect(isCurrencyCode('JPY')).toBe(false);
  });
});
