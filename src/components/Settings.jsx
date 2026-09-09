import { useRef, useState } from 'react';
import { CURRENCIES, CURRENCY_CODES } from '../lib/money.js';
import { toBackup, fromBackup, backupFilename } from '../lib/backup.js';
import { normalizeBankLink, hostOf } from '../lib/banklink.js';

export default function Settings({
  member,
  currency,
  state,
  onSetName,
  onCurrencyChange,
  onRestore,
  bankLink,
  onSetBankLink,
  onClose,
}) {
  const [name, setName] = useState(member?.name ?? '');
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(null);
  const [message, setMessage] = useState('');
  const [link, setLink] = useState(bankLink?.url ?? '');
  const [linkError, setLinkError] = useState('');
  const fileInput = useRef(null);
  const [bank, setBank] = useState(bankLink?.url ?? '');
  const [bankError, setBankError] = useState('');

  function exportBackup() {
    const payload = toBackup(state);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = backupFilename();
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(`Saved ${payload.counts.entries} wins and ${payload.counts.goals} goals.`);
  }

  function readFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const restored = fromBackup(String(reader.result));
      if (!restored) {
        setMessage('That file is not a savings book backup.');
        setPending(null);
        return;
      }
      setPending(restored);
      setMessage('');
    };
    reader.onerror = () => setMessage('Could not read that file.');
    reader.readAsText(file);
  }

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
          <h3 className="card-title">Your bank</h3>
          {bankLink ? <span className="card-note">{hostOf(bankLink)}</span> : null}
        </div>
        <div className="stack">
          <p className="hint">
            Paste your own bank's web address and a shortcut appears next to the transfer
            reminder. This app never touches your money or your login. The link stays on this
            phone and is never shared with anyone you share a goal with.
          </p>
          <input
            className="control"
            type="url"
            inputMode="url"
            autoCapitalize="off"
            placeholder="https://"
            value={bank}
            onChange={(e) => {
              setBank(e.target.value);
              setBankError('');
            }}
          />
          {bankError ? <p className="error">{bankError}</p> : null}
          <button
            type="button"
            className="btn"
            onClick={() => {
              if (bank.trim() === '') {
                onSetBankLink(null);
                setBankError('');
                return;
              }
              const parsed = normalizeBankLink(bank);
              if (!parsed) {
                setBankError('That needs to be a full https:// web address.');
                return;
              }
              onSetBankLink({ url: parsed.url });
              setBank(parsed.url);
              setBankError('');
            }}
          >
            {bank.trim() === '' ? 'Remove link' : 'Save link'}
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3 className="card-title">Your bank</h3>
          {bankLink ? <span className="card-note">{hostOf(bankLink)}</span> : null}
        </div>
        <div className="stack">
          <p className="hint">
            Paste your own bank's web address. A shortcut appears next to the transfer prompt, so
            moving money and confirming it takes one trip. On most banks this opens their app.
          </p>
          <input
            className="control"
            type="url"
            inputMode="url"
            placeholder="https://"
            value={link}
            onChange={(e) => {
              setLink(e.target.value);
              setLinkError('');
            }}
          />
          {linkError ? <p className="error">{linkError}</p> : null}
          <button
            type="button"
            className="btn"
            onClick={() => {
              if (link.trim() === '') {
                onSetBankLink(null);
                setLinkError('');
                return;
              }
              const parsed = normalizeBankLink(link);
              if (!parsed) {
                setLinkError('That needs to be a full https address, like https://bank.co.uk');
                return;
              }
              onSetBankLink({ url: parsed.url });
              setLink(parsed.url);
            }}
          >
            {link.trim() === '' ? 'Remove shortcut' : 'Save shortcut'}
          </button>
          <p className="hint">
            This stays on your phone. It is never sent with shared goals, and the address is always
            shown on the button so you can see where it goes. The app never touches your money — it
            only opens a link.
          </p>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3 className="card-title">Backup</h3>
        </div>
        <div className="stack">
          <p className="hint">
            Your book lives on this phone. If you clear your browser or leave the app unused for a
            while, iOS can delete it. Save a copy somewhere safe now and then.
          </p>

          <button type="button" className="btn" onClick={exportBackup}>
            Save a copy
          </button>

          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={(e) => {
              readFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />

          {pending ? (
            <div className="restore-panel">
              <p className="hint">
                That file has {pending.entries.length} wins and {pending.goals.length} goals. Add
                them to what you already have, or start over from the file?
              </p>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  onRestore(pending, 'merge');
                  setPending(null);
                  setMessage('Restored and merged.');
                }}
              >
                Add to my book
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  onRestore(pending, 'replace');
                  setPending(null);
                  setMessage('Book replaced with the file.');
                }}
              >
                Replace my book
              </button>
              <button type="button" className="link" onClick={() => setPending(null)}>
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-ghost" onClick={() => fileInput.current?.click()}>
              Restore from a file
            </button>
          )}

          {message ? <p className="preview">{message}</p> : null}
        </div>
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
