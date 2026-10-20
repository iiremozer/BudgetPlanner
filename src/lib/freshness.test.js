import { describe, it, expect, vi } from 'vitest';
import { currentScript, scriptInHtml, hasNewerBuild } from './freshness.js';

function fakeDoc(src) {
  return {
    querySelector: () => (src ? { getAttribute: () => src } : null),
  };
}

const page = (name) =>
  `<!doctype html><html><head><script type="module" crossorigin src="/BudgetPlanner/assets/${name}"></script></head></html>`;

describe('currentScript', () => {
  it('yoldan dosya adını alır', () => {
    expect(currentScript(fakeDoc('/BudgetPlanner/assets/index-AAA.js'))).toBe('index-AAA.js');
  });

  it('sorgu ve çapa işaretlerini atar', () => {
    expect(currentScript(fakeDoc('./assets/index-AAA.js?v=2#x'))).toBe('index-AAA.js');
  });

  it('betik yoksa null', () => {
    expect(currentScript(fakeDoc(null))).toBeNull();
  });
});

describe('scriptInHtml', () => {
  it('sayfa metninden adı çıkarır', () => {
    expect(scriptInHtml(page('index-BBB.js'))).toBe('index-BBB.js');
  });

  it('metin değilse null', () => {
    expect(scriptInHtml(undefined)).toBeNull();
  });

  it('betik yoksa null', () => {
    expect(scriptInHtml('<html></html>')).toBeNull();
  });
});

describe('hasNewerBuild', () => {
  const ok = (body) => () => Promise.resolve({ ok: true, text: () => Promise.resolve(body) });

  it('ad değiştiyse yeni sürüm vardır', async () => {
    const result = await hasNewerBuild({
      fetcher: ok(page('index-BBB.js')),
      href: 'https://example.test/',
      doc: fakeDoc('/assets/index-AAA.js'),
    });
    expect(result).toBe(true);
  });

  it('ad aynıysa yoktur', async () => {
    const result = await hasNewerBuild({
      fetcher: ok(page('index-AAA.js')),
      href: 'https://example.test/',
      doc: fakeDoc('/assets/index-AAA.js'),
    });
    expect(result).toBe(false);
  });

  it('önbelleği atlayarak ister', async () => {
    const fetcher = vi.fn(ok(page('index-AAA.js')));
    await hasNewerBuild({ fetcher, href: 'https://example.test/', doc: fakeDoc('/assets/index-AAA.js') });
    expect(fetcher).toHaveBeenCalledWith('https://example.test/', { cache: 'reload' });
  });

  it('ağ hatasında uygulamayı engellemez', async () => {
    const result = await hasNewerBuild({
      fetcher: () => Promise.reject(new Error('offline')),
      href: 'https://example.test/',
      doc: fakeDoc('/assets/index-AAA.js'),
    });
    expect(result).toBe(false);
  });

  it('sunucu hata dönerse yenileme istemez', async () => {
    const result = await hasNewerBuild({
      fetcher: () => Promise.resolve({ ok: false }),
      href: 'https://example.test/',
      doc: fakeDoc('/assets/index-AAA.js'),
    });
    expect(result).toBe(false);
  });
});
