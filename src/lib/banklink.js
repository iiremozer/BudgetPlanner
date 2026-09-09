// Kullanıcının kendi bankasına kısayol. Uygulama içinde banka listesi
// tutmuyoruz — bir liste sunmak, komisyon alınmasa bile tanıtım gibi
// görünebilir. Kullanıcı kendi adresini yapıştırır.
//
// Güvenlik tarafı: yalnızca https kabul edilir ve düğmede her zaman gerçek
// alan adı gösterilir, böylece bağlantı bir şekilde değişse bile nereye
// gidildiği görünür.

export function normalizeBankLink(input) {
  if (typeof input !== 'string') return null;
  const text = input.trim();
  if (text === '') return null;

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`;

  let url;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:') return null;
  if (!url.hostname.includes('.')) return null;
  if (url.href.length > 500) return null;

  return { url: url.href, host: url.hostname.replace(/^www\./, '') };
}

/** Depoda tutulacak hali. Geçersizse null. */
export function cleanBankLink(raw) {
  if (!raw || typeof raw !== 'object') {
    const fromString = normalizeBankLink(raw);
    return fromString ? { url: fromString.url } : null;
  }
  const parsed = normalizeBankLink(raw.url);
  return parsed ? { url: parsed.url } : null;
}

export function hostOf(link) {
  const parsed = normalizeBankLink(link?.url);
  return parsed ? parsed.host : '';
}
