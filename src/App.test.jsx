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

  it('kayıt sekmesi açılışta görünür ve sadece işleme odaklanır', () => {
    render(<App />);
    expect(screen.getByText('What did you skip?')).toBeTruthy();
    expect(screen.queryByText('Recent wins')).toBeNull();
  });

  it('hedefler sekmesine geçilir', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Goals'));
    expect(screen.getAllByText('Everyday pot').length).toBeGreaterThan(0);
    expect(screen.queryByText('Your name')).toBeNull();
  });

  it('geçmiş sekmesinde seri ve kayıtlar birlikte durur', () => {
    render(<App />);
    fireEvent.click(screen.getByText('History'));
    expect(screen.getByText('Current streak')).toBeTruthy();
    expect(screen.getByText('This week')).toBeTruthy();
    expect(screen.getByText('Recent wins')).toBeTruthy();
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
            by: 'Ada',
          },
        ],
        member: { id: 'm1', name: 'Ada' },
      })
    );

    render(<App />);
    // Kayıt sekmesi: toplam görünür.
    expect(screen.getAllByText(/£26\.00/).length).toBeGreaterThan(0);

    // Geçmiş sekmesi: kaydın kendisi.
    fireEvent.click(screen.getByText('History'));
    expect(screen.getAllByText('Coffee').length).toBeGreaterThan(0);

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
        generalName: 'Daily pot',
        goals: [],
        entries: [
          { id: 'e1', amount: 400, goalId: null, at: '2026-01-02T10:00:00.000Z', note: 'Coffee' },
          { id: 'e2', amount: 600, goalId: null, at: '2026-01-02T11:00:00.000Z', note: 'Taxi' },
        ],
      })
    );
    render(<App />);
    fireEvent.click(screen.getByText('Goals'));
    expect(screen.getAllByText('Daily pot').length).toBeGreaterThan(0);
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

describe('ayarlar', () => {
  it('dişli düğmesiyle açılıp kapanır', () => {
    render(<App />);
    expect(screen.queryByText('Settings')).toBeNull();

    fireEvent.click(screen.getByLabelText('Settings'));
    expect(screen.getByText('Settings')).toBeTruthy();
    expect(screen.getByText('Your name')).toBeTruthy();
    expect(screen.getByText('Currency')).toBeTruthy();

    fireEvent.click(screen.getByText('Done'));
    expect(screen.queryByText('Settings')).toBeNull();
    expect(screen.getByText('What did you skip?')).toBeTruthy();
  });

  it('ayarlar açıkken sekme çubuğu gizlenir', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));
    expect(screen.queryByText('History')).toBeNull();
  });

  it('isim kaydedilir', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));
    fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'Ada' } });
    fireEvent.click(screen.getByText('Save name'));
    expect(screen.getByText('Saved')).toBeTruthy();
  });
});

describe('yedekleme', () => {
  it('ayarlarda yedekleme bölümü vardır', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));
    expect(screen.getByText('Backup')).toBeTruthy();
    expect(screen.getByText('Save a copy')).toBeTruthy();
    expect(screen.getByText('Restore from a file')).toBeTruthy();
  });

  it('kopya kaydetmek indirme başlatır', () => {
    const click = vi.fn();
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = realCreate(tag);
      if (tag === 'a') el.click = click;
      return el;
    });
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:test'),
      revokeObjectURL: vi.fn(),
    });

    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));
    fireEvent.click(screen.getByText('Save a copy'));

    expect(click).toHaveBeenCalled();
    expect(screen.getByText(/Saved 0 wins/)).toBeTruthy();
    document.createElement.mockRestore();
  });
});

describe('gerçek aktarım', () => {
  function seed(entryDate) {
    window.localStorage.setItem(
      'ortak-birikim-defteri:v1',
      JSON.stringify({
        currency: 'GBP',
        goals: [],
        entries: [{ id: 'e1', amount: 2600, goalId: null, at: entryDate, note: 'Coffee' }],
        transfers: [],
      })
    );
  }

  it('bekleyen tutar geçmiş sekmesinde görünür', () => {
    seed(new Date().toISOString());
    render(<App />);
    fireEvent.click(screen.getByText('History'));
    expect(screen.getByText('Not in the bank yet')).toBeTruthy();
    expect(screen.getAllByText('£26.00').length).toBeGreaterThan(0);
  });

  it('yeni kayıtta kayıt sekmesini rahatsız etmez', () => {
    seed(new Date().toISOString());
    render(<App />);
    expect(screen.queryByText('Not in the bank yet')).toBeNull();
  });

  it('bir haftayı geçince kayıt sekmesinde hatırlatır', () => {
    const old = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    seed(old);
    render(<App />);
    expect(screen.getByText('Not in the bank yet')).toBeTruthy();
  });

  it('aktarımı onaylayınca bekleyen kalmaz', () => {
    const old = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    seed(old);
    render(<App />);
    fireEvent.click(screen.getByText('I moved all £26.00'));
    expect(screen.queryByText('Not in the bank yet')).toBeNull();
    fireEvent.click(screen.getByText('History'));
    expect(screen.getByText(/is in the bank/)).toBeTruthy();
  });
});

describe('banka kısayolu', () => {
  it('ayarlarda alan vardır', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));
    expect(screen.getByText('Your bank')).toBeTruthy();
  });

  it('güvensiz adresi reddeder', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));
    fireEvent.change(screen.getByPlaceholderText('https://'), {
      target: { value: 'javascript:alert(1)' },
    });
    fireEvent.click(screen.getByText('Save link'));
    expect(screen.getByText(/full https:\/\/ web address/)).toBeTruthy();
  });

  it('kaydedilen adres aktarım kartında alan adıyla görünür', () => {
    const old = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    window.localStorage.setItem(
      'ortak-birikim-defteri:v1',
      JSON.stringify({
        currency: 'GBP',
        goals: [],
        entries: [{ id: 'e1', amount: 2600, goalId: null, at: old }],
        transfers: [],
        bankLink: { url: 'https://www.bank.example.com/login' },
      })
    );
    render(<App />);
    const link = screen.getByText('Open my bank').closest('a');
    expect(link.getAttribute('href')).toBe('https://www.bank.example.com/login');
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(screen.getByText('bank.example.com')).toBeTruthy();
  });
});

describe('eşin aktivitesi', () => {
  function seedShared({ seen } = {}) {
    window.localStorage.setItem(
      'ortak-birikim-defteri:v1',
      JSON.stringify({
        currency: 'GBP',
        member: { id: 'm1', name: 'Ada' },
        goals: [
          {
            id: 'g1',
            name: 'House',
            emoji: '🏠',
            color: 'clay',
            target: 500000,
            order: 0,
            createdAt: '2026-01-01T00:00:00.000Z',
            share: { code: 'ABCD1234EFGH' },
          },
        ],
        entries: [
          { id: 'e1', amount: 10000, goalId: 'g1', at: '2026-03-01T10:00:00.000Z', by: 'Ada' },
          { id: 'e2', amount: 20000, goalId: 'g1', at: '2026-03-02T10:00:00.000Z', by: 'Sam' },
        ],
        seen: seen ? { g1: seen } : {},
      })
    );
  }

  it('kimin ne koyduğunu gösterir', () => {
    seedShared({ seen: '2026-04-01T00:00:00.000Z' });
    render(<App />);
    fireEvent.click(screen.getByText('Goals'));
    expect(screen.getByText('You')).toBeTruthy();
    expect(screen.getByText('Sam')).toBeTruthy();
    expect(screen.getByText('£100.00')).toBeTruthy();
    expect(screen.getByText('£200.00')).toBeTruthy();
  });

  it('görülmemiş kayıt varsa rozet çıkar', () => {
    seedShared();
    render(<App />);
    fireEvent.click(screen.getByText('Goals'));
    expect(screen.getByText('1 new')).toBeTruthy();
    expect(screen.getByText(/Sam added £200\.00/)).toBeTruthy();
  });

  it('her şey görüldüyse rozet yerine Shared yazar', () => {
    seedShared({ seen: '2026-04-01T00:00:00.000Z' });
    render(<App />);
    fireEvent.click(screen.getByText('Goals'));
    expect(screen.queryByText('1 new')).toBeNull();
    expect(screen.getByText('Shared')).toBeTruthy();
  });

  it('sekmeden çıkınca görülmüş sayılır', () => {
    seedShared();
    render(<App />);
    fireEvent.click(screen.getByText('Goals'));
    expect(screen.getByText('1 new')).toBeTruthy();

    fireEvent.click(screen.getByText('Save'));
    fireEvent.click(screen.getByText('Goals'));
    expect(screen.queryByText('1 new')).toBeNull();
  });

  it('kendi kaydın yeni sayılmaz', () => {
    window.localStorage.setItem(
      'ortak-birikim-defteri:v1',
      JSON.stringify({
        currency: 'GBP',
        member: { id: 'm1', name: 'Ada' },
        goals: [
          {
            id: 'g1',
            name: 'House',
            emoji: '🏠',
            target: 500000,
            order: 0,
            createdAt: '2026-01-01T00:00:00.000Z',
            share: { code: 'ABCD1234EFGH' },
          },
        ],
        entries: [
          { id: 'e1', amount: 10000, goalId: 'g1', at: '2026-03-01T10:00:00.000Z', by: 'Ada' },
        ],
        seen: {},
      })
    );
    render(<App />);
    fireEvent.click(screen.getByText('Goals'));
    expect(screen.queryByText(/new/)).toBeNull();
  });
});

describe('hedef tamamlama kutlaması', () => {
  function seedGoal({ amount, target, celebrated }) {
    window.localStorage.setItem(
      'ortak-birikim-defteri:v1',
      JSON.stringify({
        currency: 'GBP',
        member: { id: 'm1', name: 'Ada' },
        goals: [
          {
            id: 'g1',
            name: 'Japan',
            emoji: '🛫',
            color: 'teal',
            target,
            order: 0,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        entries: [
          { id: 'e1', amount, goalId: 'g1', at: '2026-01-02T10:00:00.000Z', emoji: '☕', by: 'Ada' },
        ],
        celebrated: celebrated ? { g1: '2026-02-01T00:00:00.000Z' } : {},
      })
    );
  }

  it('hedef dolunca kutlama açılır', () => {
    seedGoal({ amount: 100000, target: 100000 });
    render(<App />);
    expect(screen.getByText('Goal reached')).toBeTruthy();
    expect(screen.getByText('Japan')).toBeTruthy();
    // Tutar hem kutlamada hem arkadaki toplamda görünür.
    expect(screen.getAllByText('£1,000.00').length).toBeGreaterThan(0);
    expect(screen.getByText(/saved in 1 day/)).toBeTruthy();
  });

  it('hedef dolmadıysa açılmaz', () => {
    seedGoal({ amount: 50000, target: 100000 });
    render(<App />);
    expect(screen.queryByText('Goal reached')).toBeNull();
  });

  it('bir kez kutlanınca tekrar açılmaz', () => {
    seedGoal({ amount: 100000, target: 100000, celebrated: true });
    render(<App />);
    expect(screen.queryByText('Goal reached')).toBeNull();
  });

  it('kapatınca bir daha gelmez', () => {
    seedGoal({ amount: 100000, target: 100000 });
    render(<App />);
    fireEvent.click(screen.getByText('Done'));
    expect(screen.queryByText('Goal reached')).toBeNull();
    expect(screen.getByText('What did you skip?')).toBeTruthy();
  });

  it('paylaşım metni panoya kopyalanır', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText }, share: undefined });

    seedGoal({ amount: 100000, target: 100000 });
    render(<App />);
    fireEvent.click(screen.getByText('Share this'));

    await vi.waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(writeText.mock.calls[0][0]).toContain('Japan');
  });
});

describe('tema ve kişiselleştirme', () => {
  it('ayarlarda tema ve vurgu rengi vardır', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));
    expect(screen.getByText('Appearance')).toBeTruthy();
    expect(screen.getByText('Dark')).toBeTruthy();
    expect(screen.getByLabelText('Plum')).toBeTruthy();
  });

  it('koyu tema seçimi belgeye yazılır', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));
    fireEvent.click(screen.getByText('Dark'));
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('açık temaya dönülebilir', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));
    fireEvent.click(screen.getByText('Dark'));
    fireEvent.click(screen.getByText('Light'));
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('vurgu rengi değişkene yazılır', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));
    fireEvent.click(screen.getByLabelText('Plum'));
    expect(document.documentElement.style.getPropertyValue('--pine')).toBe('#452a46');
  });
});

describe('hedef düzenleme', () => {
  function seedTwoGoals() {
    window.localStorage.setItem(
      'ortak-birikim-defteri:v1',
      JSON.stringify({
        currency: 'GBP',
        goals: [
          { id: 'g1', name: 'Japan', emoji: '🛫', color: 'teal', target: 300000, order: 0, createdAt: '2026-01-01T00:00:00.000Z' },
          { id: 'g2', name: 'House', emoji: '🏠', color: 'clay', target: 500000, order: 1, createdAt: '2026-01-02T00:00:00.000Z' },
        ],
        entries: [],
      })
    );
  }

  it('adı değiştirilebilir', () => {
    seedTwoGoals();
    render(<App />);
    fireEvent.click(screen.getByText('Goals'));
    fireEvent.click(screen.getAllByLabelText('Edit goal')[0]);
    const input = screen.getByDisplayValue('Japan');
    fireEvent.change(input, { target: { value: 'Tokyo' } });
    fireEvent.click(screen.getByText('Save changes'));
    expect(screen.getAllByText('Tokyo').length).toBeGreaterThan(0);
    expect(screen.queryByDisplayValue('Japan')).toBeNull();
  });

  it('hedef tutarı değiştirilebilir', () => {
    seedTwoGoals();
    render(<App />);
    fireEvent.click(screen.getByText('Goals'));
    fireEvent.click(screen.getAllByLabelText('Edit goal')[0]);
    fireEvent.change(screen.getByDisplayValue('3,000.00'), { target: { value: '4000' } });
    fireEvent.click(screen.getByText('Save changes'));
    expect(screen.getByText(/of £4,000\.00/)).toBeTruthy();
  });

  it('adsız kaydetmeye izin vermez', () => {
    seedTwoGoals();
    render(<App />);
    fireEvent.click(screen.getByText('Goals'));
    fireEvent.click(screen.getAllByLabelText('Edit goal')[0]);
    fireEvent.change(screen.getByDisplayValue('Japan'), { target: { value: '  ' } });
    fireEvent.click(screen.getByText('Save changes'));
    expect(screen.getByText('Give the goal a name.')).toBeTruthy();
  });

  it('sıra değişince kartların ağırlığı değişir', () => {
    seedTwoGoals();
    const { container } = render(<App />);
    fireEvent.click(screen.getByText('Goals'));
    expect(container.querySelector('.goal-rank-0').textContent).toContain('Japan');

    fireEvent.click(screen.getByText('Reorder'));
    fireEvent.click(screen.getAllByLabelText('Move up')[1]);
    expect(container.querySelector('.goal-rank-0').textContent).toContain('House');
  });

  it('sıralama modu kapalıyken ok tuşları görünmez', () => {
    seedTwoGoals();
    render(<App />);
    fireEvent.click(screen.getByText('Goals'));
    expect(screen.queryByLabelText('Move up')).toBeNull();
    expect(screen.getAllByLabelText('Edit goal').length).toBeGreaterThan(0);
  });

  it('sıralama modunda düzenleme ve silme gizlenir', () => {
    seedTwoGoals();
    render(<App />);
    fireEvent.click(screen.getByText('Goals'));
    fireEvent.click(screen.getByText('Reorder'));
    expect(screen.queryByLabelText('Edit goal')).toBeNull();
    expect(screen.queryByLabelText('Remove goal')).toBeNull();
    expect(screen.getAllByLabelText('Move to top').length).toBeGreaterThan(0);
  });

  it('en üste taşı tek dokunuşta sonuncuyu başa alır', () => {
    seedTwoGoals();
    const { container } = render(<App />);
    fireEvent.click(screen.getByText('Goals'));
    fireEvent.click(screen.getByText('Reorder'));
    fireEvent.click(screen.getAllByLabelText('Move to top')[1]);
    expect(container.querySelector('.goal-rank-0').textContent).toContain('House');
  });
});

describe('veri silme', () => {
  function seedShared() {
    window.localStorage.setItem(
      'ortak-birikim-defteri:v1',
      JSON.stringify({
        currency: 'GBP',
        member: { id: 'm1', name: 'Ada' },
        goals: [
          {
            id: 'g1',
            name: 'House',
            emoji: '🏠',
            target: 500000,
            order: 0,
            createdAt: '2026-01-01T00:00:00.000Z',
            share: { code: 'ABCD1234EFGH' },
          },
        ],
        entries: [{ id: 'e1', amount: 5000, goalId: 'g1', at: '2026-03-01T10:00:00.000Z', by: 'Ada' }],
      })
    );
  }

  it('panel kod, gönderme ve durdurmadan ibarettir', () => {
    seedShared();
    render(<App />);
    fireEvent.click(screen.getByText('Goals'));
    fireEvent.click(screen.getByLabelText('Sharing options'));
    expect(screen.getByText('ABCD 1234 EFGH')).toBeTruthy();
    expect(screen.getByText('Send code')).toBeTruthy();
    expect(screen.getByText('Stop sharing')).toBeTruthy();
  });

  it('durdurmak iki sonucu da tek adımda sorar', () => {
    seedShared();
    render(<App />);
    fireEvent.click(screen.getByText('Goals'));
    fireEvent.click(screen.getByLabelText('Sharing options'));
    fireEvent.click(screen.getByText('Stop sharing'));

    expect(screen.getByText('Stop sharing House?')).toBeTruthy();
    expect(screen.getByText('Just on this phone')).toBeTruthy();
    expect(screen.getByText('For both of us')).toBeTruthy();

    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.getByText('Send code')).toBeTruthy();
  });

  it('bu telefonda durdurmak sunucudaki kopyaya dokunmaz', () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(true) }));
    vi.stubGlobal('fetch', fetchMock);
    seedShared();
    render(<App />);
    fireEvent.click(screen.getByText('Goals'));
    fireEvent.click(screen.getByLabelText('Sharing options'));
    fireEvent.click(screen.getByText('Stop sharing'));
    fireEvent.click(screen.getByText('Just on this phone'));

    expect(screen.getByLabelText('Share this goal')).toBeTruthy();
    const deleteCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes('book_delete'));
    expect(deleteCalls).toHaveLength(0);
  });

  it('sunucudan silince hedef yerelde kalır ama paylaşımdan çıkar', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(true) })));
    seedShared();
    render(<App />);
    fireEvent.click(screen.getByText('Goals'));
    fireEvent.click(screen.getByLabelText('Sharing options'));
    fireEvent.click(screen.getByText('Stop sharing'));
    fireEvent.click(screen.getByText('For both of us'));

    await vi.waitFor(() => expect(screen.getByLabelText('Share this goal')).toBeTruthy());
    expect(screen.getAllByText('House').length).toBeGreaterThan(0);
  });

  it('cihazı silmek onay ister ve defteri boşaltır', () => {
    seedShared();
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));
    fireEvent.click(screen.getByText('Erase everything on this device'));
    expect(screen.getByText(/Erase every goal/)).toBeTruthy();

    fireEvent.click(screen.getByText('Yes, erase everything'));
    fireEvent.click(screen.getByText('Done'));
    fireEvent.click(screen.getByText('Goals'));
    expect(screen.queryByText('House')).toBeNull();
  });

  it('silme onayı paylaşımlı hedefleri listeler', () => {
    seedShared();
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));
    fireEvent.click(screen.getByText('Erase everything on this device'));

    expect(screen.getByText('Goals you share')).toBeTruthy();
    expect(screen.getByText('🏠 House')).toBeTruthy();
    expect(screen.getByText('The other person carries on with it.')).toBeTruthy();
  });

  it('paylaşımlı hedef yoksa o bölüm hiç çıkmaz', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));
    fireEvent.click(screen.getByText('Erase everything on this device'));

    expect(screen.queryByText('Goals you share')).toBeNull();
  });

  it('işaretlenmezse sunucudaki kopyaya dokunmaz', () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(true) }));
    vi.stubGlobal('fetch', fetchMock);
    seedShared();
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));
    fireEvent.click(screen.getByText('Erase everything on this device'));
    fireEvent.click(screen.getByText('Yes, erase everything'));

    const deleteCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes('book_delete'));
    expect(deleteCalls).toHaveLength(0);
  });

  it('işaretlenirse sunucudaki kopyayı da siler', async () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(true) }));
    vi.stubGlobal('fetch', fetchMock);
    seedShared();
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));
    fireEvent.click(screen.getByText('Erase everything on this device'));

    fireEvent.click(screen.getByLabelText('Also delete the shared copy of House'));
    expect(screen.getByText('Will be deleted for both of you.')).toBeTruthy();

    fireEvent.click(screen.getByText('Yes, erase everything'));

    await vi.waitFor(() => {
      const calls = fetchMock.mock.calls.filter(([url]) => String(url).includes('book_delete'));
      expect(calls).toHaveLength(1);
    });
  });

  it('sunucu silinemezse cihaz yine temizlenir ve bunu söyler', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
    seedShared();
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));
    fireEvent.click(screen.getByText('Erase everything on this device'));
    fireEvent.click(screen.getByLabelText('Also delete the shared copy of House'));
    fireEvent.click(screen.getByText('Yes, erase everything'));

    await vi.waitFor(() =>
      expect(screen.getByText(/could not be removed from the server/)).toBeTruthy()
    );
    fireEvent.click(screen.getByText('Done'));
    fireEvent.click(screen.getByText('Goals'));
    expect(screen.queryByText('House')).toBeNull();
  });
});

describe('bildirim ayarları', () => {
  it('varsayılan olarak ikisi de kapalıdır', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));
    expect(screen.getByText('Reminders')).toBeTruthy();
    const boxes = screen.getAllByRole('checkbox');
    expect(boxes).toHaveLength(2);
    expect(boxes.every((b) => !b.checked)).toBe(true);
  });

  it('tarayıcıda çalışmadığını söyler', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));
    expect(screen.getByText(/only work in the installed app/)).toBeTruthy();
  });

  it('web ortamında izin alınamayınca açılmaz', async () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    await vi.waitFor(() =>
      expect(screen.getByText(/Notifications are turned off/)).toBeTruthy()
    );
    expect(screen.getAllByRole('checkbox')[0].checked).toBe(false);
  });
});

describe('sekme çubuğu', () => {
  it('her sekmenin ikonu vardır', () => {
    const { container } = render(<App />);
    expect(container.querySelectorAll('.tab .tab-icon svg')).toHaveLength(3);
  });

  it('seçili sekme işaretlenir', () => {
    const { container } = render(<App />);
    const [save, , history] = container.querySelectorAll('.tab');
    expect(save.getAttribute('aria-current')).toBe('page');

    fireEvent.click(history);
    expect(save.getAttribute('aria-current')).toBeNull();
    expect(history.getAttribute('aria-current')).toBe('page');
  });
});

describe('vurgu rolleri', () => {
  it('koyu temada dolgu rengi açık, üstündeki yazı koyu olur', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));
    fireEvent.click(screen.getByText('Dark'));

    const style = document.documentElement.style;
    expect(style.getPropertyValue('--fill')).toBe('#7cc4af');
    expect(style.getPropertyValue('--on-fill')).toBe('#10151a');
  });

  it('açık temada dolgu koyu, yazı beyazdır', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));
    fireEvent.click(screen.getByText('Light'));

    const style = document.documentElement.style;
    expect(style.getPropertyValue('--fill')).toBe('#1e3a34');
    expect(style.getPropertyValue('--on-fill')).toBe('#ffffff');
  });

  it('koyu temada geniş yüzey ayrı bir ton kullanır', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));
    fireEvent.click(screen.getByText('Dark'));
    expect(document.documentElement.style.getPropertyValue('--pine')).toBe('#1b3a33');
  });
});

describe('paylaşımı sunucudan silerken hata', () => {
  it('sunucu silemese de bu cihazda paylaşım biter ve uyarı çıkar', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
    window.localStorage.setItem(
      'ortak-birikim-defteri:v1',
      JSON.stringify({
        currency: 'GBP',
        member: { id: 'm1', name: 'Ada' },
        goals: [
          {
            id: 'g1',
            name: 'House',
            emoji: '🏠',
            target: 500000,
            order: 0,
            createdAt: '2026-01-01T00:00:00.000Z',
            share: { code: 'ABCD1234EFGH' },
          },
        ],
        entries: [],
      })
    );

    render(<App />);
    fireEvent.click(screen.getByText('Goals'));
    fireEvent.click(screen.getByLabelText('Sharing options'));
    fireEvent.click(screen.getByText('Stop sharing'));
    fireEvent.click(screen.getByText('For both of us'));

    await vi.waitFor(() => expect(screen.getByLabelText('Share this goal')).toBeTruthy());
    expect(screen.getByText(/could not be removed from the server/)).toBeTruthy();

    fireEvent.click(screen.getByText('Dismiss'));
    expect(screen.queryByText(/could not be removed/)).toBeNull();
  });
});

describe('ayarlardan çıkış', () => {
  it('üstte ve altta iki çıkış vardır', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));
    expect(screen.getByText('Done')).toBeTruthy();
    expect(screen.getByText('Close settings')).toBeTruthy();
  });

  it('alttaki düğme de kapatır', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));
    fireEvent.click(screen.getByText('Close settings'));
    expect(screen.queryByText('Settings')).toBeNull();
    expect(screen.getByText('What did you skip?')).toBeTruthy();
  });

  it('sol kenardan sağa kaydırmak kapatır', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));

    fireEvent.touchStart(window, { touches: [{ clientX: 6, clientY: 300 }] });
    fireEvent.touchMove(window, { touches: [{ clientX: 40, clientY: 304 }] });
    fireEvent.touchMove(window, { touches: [{ clientX: 100, clientY: 308 }] });

    expect(screen.queryByText('Settings')).toBeNull();
  });

  it('parmak kalkmadan, hareketin ortasında kapanır', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));

    fireEvent.touchStart(window, { touches: [{ clientX: 4, clientY: 200 }] });
    fireEvent.touchMove(window, { touches: [{ clientX: 120, clientY: 206 }] });
    // touchend hiç gelmedi; iOS yatay sürüklemede touchcancel yollayabiliyor.
    fireEvent.touchCancel(window, { changedTouches: [{ clientX: 120, clientY: 206 }] });

    expect(screen.queryByText('Settings')).toBeNull();
  });

  it('eşiğe varmadan bırakmak kapatmaz', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));

    fireEvent.touchStart(window, { touches: [{ clientX: 8, clientY: 300 }] });
    fireEvent.touchMove(window, { touches: [{ clientX: 50, clientY: 302 }] });
    fireEvent.touchEnd(window, { changedTouches: [{ clientX: 50, clientY: 302 }] });

    expect(screen.getByText('Settings')).toBeTruthy();
  });

  it('ekranın ortasından kaydırmak kapatmaz', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));

    fireEvent.touchStart(window, { touches: [{ clientX: 200, clientY: 300 }] });
    fireEvent.touchMove(window, { touches: [{ clientX: 280, clientY: 304 }] });
    fireEvent.touchMove(window, { touches: [{ clientX: 340, clientY: 308 }] });

    expect(screen.getByText('Settings')).toBeTruthy();
  });

  it('dikey kaydırma kapatmaz', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));

    fireEvent.touchStart(window, { touches: [{ clientX: 12, clientY: 200 }] });
    fireEvent.touchMove(window, { touches: [{ clientX: 20, clientY: 260 }] });
    fireEvent.touchMove(window, { touches: [{ clientX: 140, clientY: 300 }] });

    expect(screen.getByText('Settings')).toBeTruthy();
  });

  it('iki parmakla kaydırmak kapatmaz', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));

    fireEvent.touchStart(window, {
      touches: [
        { clientX: 10, clientY: 300 },
        { clientX: 180, clientY: 320 },
      ],
    });
    fireEvent.touchMove(window, {
      touches: [
        { clientX: 120, clientY: 302 },
        { clientX: 290, clientY: 322 },
      ],
    });

    expect(screen.getByText('Settings')).toBeTruthy();
  });
});

describe('ortak kopya karşı taraftan silinince', () => {
  function seedPublished(published) {
    window.localStorage.setItem(
      'ortak-birikim-defteri:v1',
      JSON.stringify({
        currency: 'GBP',
        member: { id: 'm1', name: 'Ada' },
        goals: [
          {
            id: 'g1',
            name: 'House',
            emoji: '🏠',
            target: 500000,
            order: 0,
            createdAt: '2026-01-01T00:00:00.000Z',
            share: published ? { code: 'ABCD1234EFGH', published: true } : { code: 'ABCD1234EFGH' },
          },
        ],
        entries: [
          { id: 'e1', amount: 5000, goalId: 'g1', at: '2026-03-01T10:00:00.000Z', by: 'Ada' },
        ],
      })
    );
  }

  /** book_read null döner (defter yok), book_write çağrılırsa yakalarız. */
  function serverSaysGone() {
    const calls = [];
    const fetchMock = vi.fn((url, init) => {
      calls.push({ url: String(url), body: init?.body ? JSON.parse(init.body) : null });
      return Promise.resolve({ ok: true, json: () => Promise.resolve(null) });
    });
    vi.stubGlobal('fetch', fetchMock);
    return calls;
  }

  it('silinen defteri geri yazmaz, paylaşımı bu cihazda bitirir', async () => {
    const calls = serverSaysGone();
    seedPublished(true);
    render(<App />);

    await vi.waitFor(() => expect(screen.getByText(/no longer shared/)).toBeTruthy());

    const writes = calls.filter((c) => c.url.includes('book_write'));
    expect(writes).toHaveLength(0);

    fireEvent.click(screen.getByText('Goals'));
    expect(screen.getByLabelText('Share this goal')).toBeTruthy();
  });

  it('hedef ve kayıtlar cihazda kalır', async () => {
    serverSaysGone();
    seedPublished(true);
    render(<App />);

    await vi.waitFor(() => expect(screen.getByText(/no longer shared/)).toBeTruthy());
    fireEvent.click(screen.getByText('Goals'));
    expect(screen.getAllByText('House').length).toBeGreaterThan(0);
    expect(screen.getAllByText('£50.00').length).toBeGreaterThan(0);
  });

  it('henüz yayınlanmamış kod ilk yazımı yapar, paylaşım bitmez', async () => {
    const calls = serverSaysGone();
    seedPublished(false);
    render(<App />);

    await vi.waitFor(() => {
      expect(calls.filter((c) => c.url.includes('book_write')).length).toBeGreaterThan(0);
    });
    expect(screen.queryByText(/no longer shared/)).toBeNull();
  });
});

describe('hedef silmede onay', () => {
  function seedOne() {
    window.localStorage.setItem(
      'ortak-birikim-defteri:v1',
      JSON.stringify({
        currency: 'GBP',
        goals: [
          { id: 'g1', name: 'Holiday', emoji: '🏖️', target: 120000, order: 0, createdAt: '2026-01-01T00:00:00.000Z' },
        ],
        entries: [
          { id: 'e1', amount: 4500, goalId: 'g1', at: '2026-03-01T10:00:00.000Z', by: 'Ada' },
        ],
      })
    );
  }

  it('tek dokunuşta silmez, önce sorar', () => {
    seedOne();
    render(<App />);
    fireEvent.click(screen.getByText('Goals'));
    fireEvent.click(screen.getByLabelText('Remove goal'));

    expect(screen.getByText('Remove Holiday?')).toBeTruthy();
    expect(screen.getAllByText('Holiday').length).toBeGreaterThan(0);
  });

  it('paranın nereye gideceğini söyler', () => {
    seedOne();
    render(<App />);
    fireEvent.click(screen.getByText('Goals'));
    fireEvent.click(screen.getByLabelText('Remove goal'));
    expect(screen.getByText(/£45\.00 you logged moves to Everyday pot/)).toBeTruthy();
  });

  it('vazgeçince hedef durur', () => {
    seedOne();
    render(<App />);
    fireEvent.click(screen.getByText('Goals'));
    fireEvent.click(screen.getByLabelText('Remove goal'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Remove Holiday?')).toBeNull();
    expect(screen.getAllByText('Holiday').length).toBeGreaterThan(0);
  });

  it('onaylayınca siler ama kayıtlar genel kasaya geçer', () => {
    seedOne();
    render(<App />);
    fireEvent.click(screen.getByText('Goals'));
    fireEvent.click(screen.getByLabelText('Remove goal'));
    fireEvent.click(screen.getByText('Remove goal'));

    expect(screen.queryByText('Holiday')).toBeNull();
    expect(screen.getAllByText('£45.00').length).toBeGreaterThan(0);
  });
});

describe('yeni hedefin rengi', () => {
  it('arka arkaya kurulan hedefler farklı renk alır', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Goals'));

    const names = ['Alpha', 'Beta', 'Gamma'];
    for (const name of names) {
      const opener = screen.queryByText('New goal');
      if (opener) fireEvent.click(opener);
      fireEvent.click(screen.getByText('Just saving'));
      fireEvent.change(screen.getByPlaceholderText('Savings'), { target: { value: name } });
      fireEvent.click(screen.getByText('Create goal'));
    }

    const saved = JSON.parse(window.localStorage.getItem('ortak-birikim-defteri:v1'));
    const colors = saved.goals.map((g) => g.color);
    expect(new Set(colors).size).toBe(3);
  });
});

describe('kendi rengi ve kendi simgesi', () => {
  function openEditor() {
    render(<App />);
    fireEvent.click(screen.getByText('Goals'));
    fireEvent.click(screen.getByText('New goal'));
    fireEvent.click(screen.getByText('Just saving'));
    fireEvent.change(screen.getByPlaceholderText('Savings'), { target: { value: 'Ski trip' } });
  }

  it('renk seçicisi tek sırada ve kendi rengi var', () => {
    openEditor();
    expect(screen.getByLabelText('Pick your own colour')).toBeTruthy();
  });

  it('seçilen özel renk hedefe kaydedilir', () => {
    openEditor();
    const picker = screen.getByLabelText('Pick your own colour').querySelector('input');
    fireEvent.change(picker, { target: { value: '#3F7FD1' } });
    fireEvent.click(screen.getByText('Create goal'));

    const saved = JSON.parse(window.localStorage.getItem('ortak-birikim-defteri:v1'));
    expect(saved.goals[0].color).toBe('#3f7fd1');
  });

  it('kendi simgesi yazılabilir ve kaydedilir', () => {
    openEditor();
    fireEvent.click(screen.getByLabelText('Use your own icon'));
    fireEvent.change(screen.getByPlaceholderText('Paste any emoji'), { target: { value: '⛷️' } });
    fireEvent.click(screen.getByText('Create goal'));

    const saved = JSON.parse(window.localStorage.getItem('ortak-birikim-defteri:v1'));
    expect(saved.goals[0].emoji).toBe('⛷️');
  });

  it('özel renk kart ve kavanozda kullanılır', () => {
    openEditor();
    const picker = screen.getByLabelText('Pick your own colour').querySelector('input');
    fireEvent.change(picker, { target: { value: '#3f7fd1' } });
    fireEvent.click(screen.getByText('Create goal'));

    const card = document.querySelector('.goal-tinted');
    expect(card.getAttribute('style')).toContain('#3f7fd1');
  });
});

describe('sürüm damgası', () => {
  it('ayarların altında derleme anı görünür', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Settings'));
    expect(screen.getByText(/^Build /)).toBeTruthy();
  });
});
