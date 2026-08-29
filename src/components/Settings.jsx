import { useState } from 'react';
import { CURRENCIES, CURRENCY_CODES } from '../lib/money.js';

export default function Settings({ member, currency, onSetName, onCurrencyChange, onClose }) {
  const [name, setName] = useState(member?.name ?? '');
  const [saved, setSaved] = useState(false);

  return (
    <>
      <div className="sheet-head">
        <h2 className="sheet-title">Settings</h2>
        <button type="button" className="link" onClick={onClose}>
          Done
        </button>
      </div>

      <section className="card">
        <div className="card-head">
          <h3 className="card-title">Your name</h3>
        </div>
        <div className="stack">
          <p className="hint">
            Shown next to the wins you log on shared goals, so the other person can see who saved
            what. It is not used anywhere else.
          </p>
          <input
            className="control"
            type="text"
            placeholder="Your name"
            value={name}
            maxLength={24}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
          />
          <button
            type="button"
            className="btn"
            disabled={!name.trim() || name.trim() === member?.name}
            onClick={() => {
              onSetName(name.trim());
              setSaved(true);
            }}
          >
            {saved ? 'Saved' : 'Save name'}
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3 className="card-title">Currency</h3>
          <span className="card-note">{CURRENCIES[currency].label}</span>
        </div>
        <div className="chips">
          {CURRENCY_CODES.map((code) => (
            <button
              key={code}
              type="button"
              className="chip"
              aria-pressed={currency === code}
              onClick={() => onCurrencyChange(code)}
            >
              {CURRENCIES[code].symbol} {code}
            </button>
          ))}
        </div>
        <p className="hint" style={{ marginTop: 12 }}>
          Changing this relabels existing amounts. It does not convert them.
        </p>
      </section>

      <section className="card">
        <div className="card-head">
          <h3 className="card-title">Your data</h3>
        </div>
        <p className="hint">
          Everything is kept on this device. Only the goals you choose to share leave your phone,
          and only that goal and its entries go with them.
        </p>
      </section>
    </>
  );
}
