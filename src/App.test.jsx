// @vitest-environment jsdom
//
// Uygulamayı gerçekten çiziyoruz. Eksik import, tanımsız değişken ya da
// çizim sırasında patlayan bir bileşen buradan geçemez — derleyici bu tür
// hataları yakalamıyor.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import App from './App.jsx';

beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('uygulama açılışı', () => {
  it('boş defterle çizilir', () => {
    render(<App />);
    expect(screen.getByText('Our Savings Book')).toBeTruthy();
  });

  it('toplam sıfırdan başlar', () => {
    render(<App />);
    expect(screen.getAllByText('£0.00').length).toBeGreaterThan(0);
  });

  it('ana bölümlerin hepsi görünür', () => {
    render(<App />);
    for (const title of ['What did you skip?', 'Goals', 'Recent wins', 'Your name']) {
      expect(screen.getByText(title)).toBeTruthy();
    }
  });

  it('kayıtlı defterle açılır', () => {
    window.localStorage.setItem(
      'ortak-birikim-defteri:v1',
      JSON.stringify({
        currency: 'GBP',
        goals: [
          {
            id: 'g1',
            name: 'Japan',
            emoji: '🛫',
            target: 300000,
            order: 0,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        entries: [
          {
            id: 'e1',
            amount: 2600,
            goalId: 'g1',
            at: '2026-01-02T10:00:00.000Z',
            note: 'Coffee',
            by: 'İrem',
          },
        ],
        member: { id: 'm1', name: 'İrem' },
      })
    );

    render(<App />);
    expect(screen.getByText('Japan')).toBeTruthy();
    expect(screen.getAllByText('Coffee').length).toBeGreaterThan(1);
    // Toplam, hedefin birikeni ve kayıt satırı — üçünde de aynı tutar görünür.
    expect(screen.getAllByText(/£26\.00/).length).toBeGreaterThan(0);
    expect(screen.getByText(/of £3,000\.00/)).toBeTruthy();
  });

  it('bozuk kayıtla da açılır', () => {
    window.localStorage.setItem('ortak-birikim-defteri:v1', '{bu json değil');
    render(<App />);
    expect(screen.getByText('Our Savings Book')).toBeTruthy();
  });
});

describe('genel kavanoz', () => {
  it('hedefler arasında varsayılan adıyla görünür', () => {
    render(<App />);
    expect(screen.getAllByText('Everyday pot').length).toBeGreaterThan(0);
  });

  it('hedefe bağlanmamış kayıtları toplar', () => {
    window.localStorage.setItem(
      'ortak-birikim-defteri:v1',
      JSON.stringify({
        currency: 'GBP',
        generalName: 'Günlük kasa',
        goals: [],
        entries: [
          { id: 'e1', amount: 400, goalId: null, at: '2026-01-02T10:00:00.000Z', note: 'Coffee' },
          { id: 'e2', amount: 600, goalId: null, at: '2026-01-02T11:00:00.000Z', note: 'Taxi' },
        ],
      })
    );
    render(<App />);
    expect(screen.getAllByText('Günlük kasa').length).toBeGreaterThan(0);
    expect(screen.getByText(/Next milestone/)).toBeTruthy();
  });
});
