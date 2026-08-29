// @vitest-environment jsdom
//
// Uygulamayı gerçekten çiziyoruz. Eksik import, tanımsız değişken ya da
// çizim sırasında patlayan bir bileşen buradan geçemez — derleyici bu tür
// hataları yakalamıyor.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
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

  it('kayıt sekmesi açılışta görünür', () => {
    render(<App />);
    expect(screen.getByText('What did you skip?')).toBeTruthy();
    expect(screen.getByText('Recent wins')).toBeTruthy();
  });

  it('hedefler sekmesine geçilir', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Goals'));
    expect(screen.getByText('Your name')).toBeTruthy();
    expect(screen.getAllByText('Everyday pot').length).toBeGreaterThan(0);
  });

  it('seri sekmesine geçilir', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Streak'));
    expect(screen.getByText('Current streak')).toBeTruthy();
    expect(screen.getByText('This week')).toBeTruthy();
    expect(screen.getByText('Numbers')).toBeTruthy();
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
    // Kayıt sekmesi: toplam ve kaydın kendisi.
    expect(screen.getAllByText(/£26\.00/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Coffee').length).toBeGreaterThan(1);

    // Hedefler sekmesi: hedef ve ilerlemesi.
    fireEvent.click(screen.getByText('Goals'));
    expect(screen.getAllByText('Japan').length).toBeGreaterThan(0);
    expect(screen.getByText(/of £3,000\.00/)).toBeTruthy();
  });

  it('bozuk kayıtla da açılır', () => {
    window.localStorage.setItem('ortak-birikim-defteri:v1', '{bu json değil');
    render(<App />);
    expect(screen.getByText('Our Savings Book')).toBeTruthy();
  });
});

describe('genel kavanoz', () => {
  it('hedefler sekmesinde varsayılan adıyla görünür', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Goals'));
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
    fireEvent.click(screen.getByText('Goals'));
    expect(screen.getAllByText('Günlük kasa').length).toBeGreaterThan(0);
    expect(screen.getByText(/Next milestone/)).toBeTruthy();
  });
});

describe('renkler', () => {
  it('hedef kartı kendi rengini taşır', () => {
    window.localStorage.setItem(
      'ortak-birikim-defteri:v1',
      JSON.stringify({
        currency: 'GBP',
        goals: [
          { id: 'g1', name: 'Beach', emoji: '🏖️', color: 'ocean', target: 100000, order: 0, createdAt: '2026-01-01T00:00:00.000Z' },
          { id: 'g2', name: 'Car', emoji: '🚗', color: 'coral', target: 100000, order: 1, createdAt: '2026-01-01T00:00:00.000Z' },
        ],
        entries: [],
      })
    );
    const { container } = render(<App />);
    fireEvent.click(screen.getByText('Goals'));
    const tinted = container.querySelectorAll('.goal-tinted');
    // iki hedef artı genel kavanoz
    expect(tinted.length).toBe(3);
    const tones = [...tinted].map((el) => el.style.getPropertyValue('--tone'));
    expect(new Set(tones).size).toBe(3);
  });
});
