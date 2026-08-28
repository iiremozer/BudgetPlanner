import { CURRENCIES, CURRENCY_CODES } from '../lib/money.js';

export default function Cover({ currency, onCurrencyChange }) {
  return (
    <header className="cover">
      <p className="cover-eyebrow">Hane Hesabı · Cilt I</p>
      <h1 className="cover-title">Ortak Birikim Defteri</h1>
      <p className="cover-sub">Harcamadığın her kuruş buraya yazılır.</p>

      <div className="currency-row" role="group" aria-label="Para birimi">
        {CURRENCY_CODES.map((code) => (
          <button
            key={code}
            type="button"
            className="currency-chip"
            aria-pressed={currency === code}
            aria-label={CURRENCIES[code].label}
            onClick={() => onCurrencyChange(code)}
          >
            {CURRENCIES[code].symbol}
          </button>
        ))}
      </div>
    </header>
  );
}
