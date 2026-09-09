import { describe, it, expect } from 'vitest';
import { normalizeBankLink, cleanBankLink, hostOf } from './banklink.js';

describe('normalizeBankLink', () => {
  it('https adresi kabul eder', () => {
    expect(normalizeBankLink('https://bank.example.com/login')).toEqual({
      url: 'https://bank.example.com/login',
      host: 'bank.example.com',
    });
  });

  it('şema yoksa https ekler', () => {
    expect(normalizeBankLink('bank.example.com').url).toBe('https://bank.example.com/');
  });

  it('www önekini ad gösteriminden atar', () => {
    expect(normalizeBankLink('https://www.bank.example.com').host).toBe('bank.example.com');
  });

  it('http reddeder', () => {
    expect(normalizeBankLink('http://bank.example.com')).toBeNull();
  });

  it('tehlikeli şemaları reddeder', () => {
    expect(normalizeBankLink('javascript:alert(1)')).toBeNull();
    expect(normalizeBankLink('data:text/html,<script>')).toBeNull();
    expect(normalizeBankLink('file:///etc/passwd')).toBeNull();
  });

  it('alan adı olmayanı reddeder', () => {
    expect(normalizeBankLink('https://localhost')).toBeNull();
    expect(normalizeBankLink('bank')).toBeNull();
  });

  it('boş ve bozuk girdide null verir', () => {
    expect(normalizeBankLink('')).toBeNull();
    expect(normalizeBankLink('   ')).toBeNull();
    expect(normalizeBankLink(null)).toBeNull();
    expect(normalizeBankLink(42)).toBeNull();
  });

  it('aşırı uzun adresi reddeder', () => {
    expect(normalizeBankLink(`https://bank.example.com/${'x'.repeat(600)}`)).toBeNull();
  });
});

describe('cleanBankLink', () => {
  it('nesneden okur', () => {
    expect(cleanBankLink({ url: 'https://bank.example.com' })).toEqual({
      url: 'https://bank.example.com/',
    });
  });

  it('düz metinden de okur', () => {
    expect(cleanBankLink('https://bank.example.com')).toEqual({ url: 'https://bank.example.com/' });
  });

  it('geçersizde null verir', () => {
    expect(cleanBankLink({ url: 'javascript:alert(1)' })).toBeNull();
    expect(cleanBankLink(null)).toBeNull();
  });
});

describe('hostOf', () => {
  it('alan adını verir', () => {
    expect(hostOf({ url: 'https://www.bank.example.com/x' })).toBe('bank.example.com');
  });

  it('bağlantı yoksa boş verir', () => {
    expect(hostOf(null)).toBe('');
  });
});
