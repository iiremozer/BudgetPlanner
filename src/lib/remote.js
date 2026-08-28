import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

const TIMEOUT_MS = 10000;

export function isRemoteConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

async function callFunction(name, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`${name} failed: ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Ortak defteri okur. Defter henüz yoksa null döner. */
export function readBook(code) {
  return callFunction('book_read', { p_code: code });
}

/** Ortak defteri yazar, sunucuda duran son hali geri verir. */
export function writeBook(code, state) {
  return callFunction('book_write', { p_code: code, p_state: state });
}
