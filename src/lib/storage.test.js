import { describe, it, expect } from 'vitest';
import {
  STORAGE_KEY,
  defaultState,
  normalizeState,
  loadState,
  saveState,
  makeId,
} from './storage.js';

// localStorage taklidi — testler tarayıcı ortamı gerektirmesin diye.
function fakeStore(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
    _dump: () => Object.fromEntries(data),
  };
}

const goal = { id: 'g1', name: 'Tatil', emoji: '🏖️', target: 10000, createdAt: '2026-01-01T00:00:00.000Z' };
const validEntry = {
  id: 'e1',
  amount: 500,
  at: '2026-01-02T10:00:00.000Z',
  goalId: 'g1',
  note: 'Kahve almadım',
};

describe('defaultState', () => {
  it('boş bir defterle başlar', () => {
    const s = defaultState();
    expect(s.currency).toBe('GBP');
    expect(s.goals).toEqual([]);
    expect(s.entries).toEqual([]);
  });
});

describe('normalizeState', () => {
  it('sağlam veriyi olduğu gibi geçirir', () => {
    const s = normalizeState({ currency: 'TRY', goals: [goal], entries: [validEntry] });
    expect(s.currency).toBe('TRY');
    expect(s.goals).toHaveLength(1);
    expect(s.entries).toHaveLength(1);
  });

  it('çöp girdide varsayılana döner', () => {
    expect(normalizeState(null)).toEqual(defaultState());
    expect(normalizeState('bozuk')).toEqual(defaultState());
    expect(normalizeState(42)).toEqual(defaultState());
  });

  it('bilinmeyen para birimini varsayılana çevirir', () => {
    expect(normalizeState({ currency: 'JPY' }).currency).toBe('GBP');
  });

  it('adı olmayan hedefi atar', () => {
    const s = normalizeState({ goals: [goal, { id: 'g2', name: '   ' }, { name: 'idsiz' }] });
    expect(s.goals.map((g) => g.id)).toEqual(['g1']);
  });

  it('eksik emoji ve hedef tutarını tamamlar', () => {
    const s = normalizeState({ goals: [{ id: 'g3', name: 'Açık uçlu' }] });
    expect(s.goals[0].emoji).toBe('🎯');
    expect(s.goals[0].target).toBe(0);
  });

  it('sıfır veya eksi tutarlı kaydı atar', () => {
    const s = normalizeState({
      goals: [goal],
      entries: [validEntry, { ...validEntry, id: 'e2', amount: 0 }, { ...validEntry, id: 'e3', amount: -5 }],
    });
    expect(s.entries.map((e) => e.id)).toEqual(['e1']);
  });

  it('geçersiz tarihli kaydı atar', () => {
    const s = normalizeState({ goals: [goal], entries: [{ ...validEntry, at: 'bir ara' }] });
    expect(s.entries).toEqual([]);
  });

  it('silinmiş hedefe bağlı kaydı hedefsiz bırakır ama korur', () => {
    const s = normalizeState({ goals: [], entries: [validEntry] });
    expect(s.entries).toHaveLength(1);
    expect(s.entries[0].goalId).toBeNull();
  });

  it('notu kırpar', () => {
    const s = normalizeState({ goals: [goal], entries: [{ ...validEntry, note: '  boşluklu  ' }] });
    expect(s.entries[0].note).toBe('boşluklu');
  });
});

describe('loadState / saveState', () => {
  it('yazıp okuduğunda aynı veriyi verir', () => {
    const store = fakeStore();
    const state = { currency: 'EUR', goals: [goal], entries: [validEntry] };
    expect(saveState(state, store)).toBe(true);
    expect(loadState(store)).toEqual(normalizeState(state));
  });

  it('kayıt yoksa varsayılan defteri açar', () => {
    expect(loadState(fakeStore())).toEqual(defaultState());
  });

  it('bozuk JSON çökertmez', () => {
    const store = fakeStore({ [STORAGE_KEY]: '{bu json değil' });
    expect(loadState(store)).toEqual(defaultState());
  });

  it('depo yoksa sessizce varsayılana döner', () => {
    expect(loadState(null)).toEqual(defaultState());
  });

  it('yazma hatası uygulamayı düşürmez', () => {
    const brokenStore = {
      getItem: () => null,
      setItem: () => {
        throw new Error('kota doldu');
      },
    };
    expect(saveState(defaultState(), brokenStore)).toBe(false);
  });
});

describe('makeId', () => {
  it('benzersiz kimlik üretir', () => {
    const ids = new Set(Array.from({ length: 500 }, () => makeId('e')));
    expect(ids.size).toBe(500);
  });

  it('öneki korur', () => {
    expect(makeId('goal').startsWith('goal_')).toBe(true);
  });
});

describe('kayıt simgesi', () => {
  it('simgeyi korur', () => {
    const s = normalizeState({ goals: [], entries: [{ ...validEntry, goalId: null, emoji: '☕' }] });
    expect(s.entries[0].emoji).toBe('☕');
  });

  it('simge yoksa null olur', () => {
    const s = normalizeState({ goals: [], entries: [{ ...validEntry, goalId: null }] });
    expect(s.entries[0].emoji).toBeNull();
  });

  it('simge yerine sayı gelirse null olur', () => {
    const s = normalizeState({ goals: [], entries: [{ ...validEntry, goalId: null, emoji: 42 }] });
    expect(s.entries[0].emoji).toBeNull();
  });
});

describe('hedef planı', () => {
  it('geçerli planı korur', () => {
    const s = normalizeState({ goals: [{ ...goal, plan: { perPeriod: 5000, period: 'month' } }] });
    expect(s.goals[0].plan).toEqual({ perPeriod: 5000, period: 'month' });
  });

  it('bilinmeyen dönemi haftaya çevirir', () => {
    const s = normalizeState({ goals: [{ ...goal, plan: { perPeriod: 5000, period: 'decade' } }] });
    expect(s.goals[0].plan.period).toBe('week');
  });

  it('sıfır katkılı planı atar', () => {
    const s = normalizeState({ goals: [{ ...goal, plan: { perPeriod: 0, period: 'week' } }] });
    expect(s.goals[0].plan).toBeNull();
  });

  it('plan yoksa null olur', () => {
    const s = normalizeState({ goals: [goal] });
    expect(s.goals[0].plan).toBeNull();
  });
});

describe('ortak defter alanları', () => {
  it('geçerli üyeyi korur', () => {
    const s = normalizeState({ member: { id: 'm1', name: 'İrem' } });
    expect(s.member).toEqual({ id: 'm1', name: 'İrem' });
  });

  it('adsız üyeyi atar', () => {
    expect(normalizeState({ member: { id: 'm1', name: '  ' } }).member).toBeNull();
  });

  it('hedefin paylaşım kodunu büyük harfe çevirir', () => {
    const s = normalizeState({ goals: [{ ...goal, share: { code: 'abcd1234' } }] });
    expect(s.goals[0].share).toEqual({ code: 'ABCD1234' });
  });

  it('kısa paylaşım kodunu reddeder', () => {
    const s = normalizeState({ goals: [{ ...goal, share: { code: 'ABC' } }] });
    expect(s.goals[0].share).toBeNull();
  });

  it('hedefin sıra numarasını korur', () => {
    const s = normalizeState({ goals: [{ ...goal, order: 3 }] });
    expect(s.goals[0].order).toBe(3);
  });

  it('silinen kimlik listesini korur', () => {
    const s = normalizeState({ deleted: { entries: ['a', 'b'], goals: ['g1'] } });
    expect(s.deleted).toEqual({ entries: ['a', 'b'], goals: ['g1'] });
  });

  it('bozuk silme listesini boşaltır', () => {
    expect(normalizeState({ deleted: 'çöp' }).deleted).toEqual({ entries: [], goals: [] });
  });

  it('kaydı kimin girdiğini saklar', () => {
    const s = normalizeState({ goals: [], entries: [{ ...validEntry, goalId: null, by: 'İrem' }] });
    expect(s.entries[0].by).toBe('İrem');
  });
});

describe('genel kavanozun adı', () => {
  it('verilmezse varsayılanı alır', () => {
    expect(normalizeState({}).generalName).toBe('Everyday pot');
  });

  it('kullanıcının adını korur ve kırpar', () => {
    expect(normalizeState({ generalName: '  Günlük  ' }).generalName).toBe('Günlük');
  });

  it('boş ad varsayılana döner', () => {
    expect(normalizeState({ generalName: '   ' }).generalName).toBe('Everyday pot');
  });

  it('çok uzun adı kısaltır', () => {
    expect(normalizeState({ generalName: 'x'.repeat(80) }).generalName).toHaveLength(40);
  });
});
