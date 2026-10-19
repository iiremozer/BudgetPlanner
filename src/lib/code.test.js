import { describe, it, expect } from 'vitest';
import { makeBookCode, normalizeCode, formatCode, inviteText, CODE_LENGTH } from './code.js';

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

describe('inviteText', () => {
  const code = 'ABCDEFGH2345';

  it('hedefin adını ve kodu taşır', () => {
    const text = inviteText('Holiday', code);
    expect(text).toContain('Holiday');
    expect(text).toContain('ABCDEFGH2345');
  });

  it('kod kendi satırında, boşluksuz ve tek başına durur', () => {
    const lines = inviteText('Holiday', code).split('\n');
    expect(lines).toContain('ABCDEFGH2345');
    // Kodun satırında başka hiçbir şey yok: çift dokunuş hepsini seçsin.
    expect(lines.filter((l) => l.includes('ABCDEFGH2345'))).toEqual(['ABCDEFGH2345']);
  });

  it('kodun iki yanında boş satır var', () => {
    const lines = inviteText('Holiday', code).split('\n');
    const i = lines.indexOf('ABCDEFGH2345');
    expect(lines[i - 1]).toBe('');
    expect(lines[i + 1]).toBe('');
  });

  it('kodu asla gruplamaz', () => {
    expect(inviteText('Holiday', code)).not.toContain('ABCD EFGH');
  });

  it('nereye gireceğini söyler', () => {
    expect(inviteText('Holiday', code)).toContain('Join a shared goal');
  });

  it('adsız hedefte de anlamlı kalır', () => {
    expect(inviteText('   ', code)).toContain('a goal');
  });
});
