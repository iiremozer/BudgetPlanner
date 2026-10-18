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

    fireEvent.click(screen.getAllByLabelText('Move up')[1]);
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
