// Canlı modda uygulama sayfayı yayından okuyor. Tarayıcı o sayfayı
// önbelleğe alıyor, yani yeni sürüm yayınlansa bile uygulama bir süre
// eskisini açmaya devam ediyor.
//
// Çözüm: açılışta sayfanın kendisini önbelleği atlayarak bir kez isteyip,
// içindeki ana betiğin adına bakmak. Vite o ada içeriğin özetini koyuyor,
// yani ad değiştiyse sürüm değişmiş demektir. Değiştiyse sayfayı
// yeniliyoruz; isteği "reload" ile yaptığımız için yenileme artık yeni
// sürümü alıyor.

/** Belgedeki ana betiğin dosya adı. Bulunamazsa null. */
export function currentScript(doc = document) {
  const el = doc.querySelector('script[type="module"][src]');
  if (!el) return null;
  return fileNameOf(el.getAttribute('src'));
}

/** Uzak sayfanın metninden ana betiğin dosya adını çıkarır. */
export function scriptInHtml(html) {
  if (typeof html !== 'string') return null;
  const match = html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/i);
  return match ? fileNameOf(match[1]) : null;
}

function fileNameOf(src) {
  if (typeof src !== 'string' || !src) return null;
  const clean = src.split('?')[0].split('#')[0];
  const name = clean.slice(clean.lastIndexOf('/') + 1);
  return name || null;
}

/**
 * Yayındaki sürüm farklıysa true döner. Ağ yoksa ya da bir şey ters giderse
 * false: güncellik kontrolü uygulamanın açılmasını engellememeli.
 */
export async function hasNewerBuild({ fetcher = fetch, href, doc = document } = {}) {
  const url = href ?? (typeof location === 'undefined' ? null : location.href);
  if (!url) return false;
  const mine = currentScript(doc);
  if (!mine) return false;
  try {
    const res = await fetcher(url, { cache: 'reload' });
    if (!res || !res.ok) return false;
    const theirs = scriptInHtml(await res.text());
    return Boolean(theirs) && theirs !== mine;
  } catch {
    return false;
  }
}
