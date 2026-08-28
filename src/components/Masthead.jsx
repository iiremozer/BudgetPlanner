import { CURRENCIES, CURRENCY_CODES } from '../lib/money.js';

export default function Masthead({ currency, onCurrencyChange }) {
  return (
    <header className="masthead">
      <div>
        <h1 className="masthead-title">Our Savings Book</h1>
        <p className="masthead-sub">Every skipped spend lands here.</p>
      </div>
      <select
        className="currency-pick"
        aria-label="Currency"
        value={currency}
        onChange={(e) => onCurrencyChange(e.target.value)}
      >
        {CURRENCY_CODES.map((code) => (
          <option key={code} value={code}>
            {CURRENCIES[code].symbol}
          </option>
        ))}
      </select>
    </header>
  );
}
