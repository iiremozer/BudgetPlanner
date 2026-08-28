import { useState } from 'react';
import { parseAmount, formatMoney, CURRENCIES } from '../lib/money.js';

const QUICK = [1, 3, 5, 10];

export default function EntryForm({ currency, goals, onAdd }) {
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [goalId, setGoalId] = useState('');
  const [error, setError] = useState('');

  const symbol = CURRENCIES[currency].symbol;
  const parsed = parseAmount(amount);
  const ready = parsed !== null && parsed > 0;

  function submit() {
    if (parsed === null) {
      setError('Tutarı sayı olarak yaz, örneğin 5 ya da 4,50.');
      return;
    }
    if (parsed <= 0) {
      setError('Sıfırdan büyük bir tutar gerekiyor.');
      return;
    }
    onAdd({
      amount: parsed,
      note: note.trim(),
      goalId: goalId === '' ? null : goalId,
    });
    setNote('');
    setAmount('');
    setError('');
  }

  return (
    <section className="section">
      <div className="section-head">
        <h2 className="section-title">Bugünün kazancı</h2>
        <span className="section-note">{symbol}</span>
      </div>

      <div className="form">
        <div className="field">
          <label className="field-label" htmlFor="note">
            Ne yapmadın
          </label>
          <input
            id="note"
            className="control"
            type="text"
            placeholder="Kahve almadım"
            value={note}
            maxLength={80}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="field">
            <label className="field-label" htmlFor="amount">
              Cebinde kalan
            </label>
            <input
              id="amount"
              className="control control-amount"
              type="text"
              inputMode="decimal"
              placeholder={`${symbol}0,00`}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (error) setError('');
              }}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="goal">
              Hangi hedefe
            </label>
            <select
              id="goal"
              className="control"
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
            >
              <option value="">Genel kasa</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.emoji} {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="quick">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              className="quick-chip"
              onClick={() => {
                setAmount(String(q));
                setError('');
              }}
            >
              {formatMoney(q * 100, currency)}
            </button>
          ))}
        </div>

        {error ? <p className="error">{error}</p> : null}

        <button type="button" className="press" onClick={submit} disabled={!ready}>
          Deftere işle
        </button>
      </div>
    </section>
  );
}
