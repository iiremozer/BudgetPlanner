import { useState } from 'react';
import { formatMoney, parseAmount, CURRENCIES } from '../lib/money.js';
import { pendingAmount, daysWaiting, lastTransferAt } from '../lib/transfers.js';
import { hostOf } from '../lib/banklink.js';

export default function TransferCard({ entries, transfers, currency, prompting, bankLink, onConfirm }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const pending = pendingAmount(entries, transfers);
  if (pending <= 0) {
    const last = lastTransferAt(transfers);
    if (!last) return null;
    return (
      <section className="card transfer-clear">
        <p className="transfer-clear-text">
          Everything you have logged is in the bank. Nothing waiting.
        </p>
      </section>
    );
  }

  const days = daysWaiting(entries, transfers);
  const symbol = CURRENCIES[currency].symbol;
  const parsed = parseAmount(amount);

  function confirm(value) {
    if (value === null || value <= 0) {
      setError('Enter how much you actually moved.');
      return;
    }
    onConfirm(Math.min(value, pending));
    setAmount('');
    setError('');
    setOpen(false);
  }

  return (
    <section className={`card transfer${prompting ? ' transfer-due' : ''}`}>
      <div className="card-head">
        <h2 className="card-title">Not in the bank yet</h2>
        {days > 0 ? <span className="card-note">{days} days</span> : null}
      </div>

      <p className="transfer-amount">{formatMoney(pending, currency)}</p>
      <p className="hint">
        {prompting
          ? 'This has been sitting a while. Money only really counts as saved once it has left your current account.'
          : 'Move this across when you can, then confirm it here.'}
      </p>

      {open ? (
        <div className="stack" style={{ marginTop: 14 }}>
          <div>
            <label className="field-label" htmlFor="moved">
              How much did you move?
            </label>
            <input
              id="moved"
              className="control control-amount"
              type="text"
              inputMode="decimal"
              placeholder={`${symbol}0.00`}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError('');
              }}
            />
          </div>
          {error ? <p className="error">{error}</p> : null}
          <button type="button" className="btn" onClick={() => confirm(parsed)}>
            Confirm
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <div className="stack" style={{ marginTop: 14 }}>
          {bankLink ? (
            <a
              className="btn btn-ghost bank-link"
              href={bankLink.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Open my bank</span>
              <span className="bank-host">{hostOf(bankLink)}</span>
            </a>
          ) : null}
          <button type="button" className="btn" onClick={() => confirm(pending)}>
            I moved all {formatMoney(pending, currency)}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setOpen(true)}>
            I moved part of it
          </button>
        </div>
      )}
    </section>
  );
}
