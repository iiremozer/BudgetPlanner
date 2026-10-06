import { useRef, useState } from 'react';
import { CURRENCIES, CURRENCY_CODES } from '../lib/money.js';
import { toBackup, fromBackup, backupFilename } from '../lib/backup.js';
import { normalizeBankLink, hostOf } from '../lib/banklink.js';
import { ACCENTS, THEMES } from '../lib/colors.js';

const THEME_LABELS = { system: 'Match phone', light: 'Light', dark: 'Dark' };

export default function Settings({
  member,
  currency,
  state,
  onSetName,
  onCurrencyChange,
  onRestore,
  bankLink,
  onSetBankLink,
  onEraseEverything,
  theme,
  accent,
  onSetTheme,
  onSetAccent,
  onClose,
}) {
  const [name, setName] = useState(member?.name ?? '');
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(null);
  const [message, setMessage] = useState('');
  const [link, setLink] = useState(bankLink?.url ?? '');
  const [linkError, setLinkError] = useState('');
  const [confirmErase, setConfirmErase] = useState(false);
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
    setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // Tarayıcı bu adresi zaten bırakmışsa sorun değil.
      }
    }, 1000);
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
          <h3 className="card-title">Appearance</h3>
        </div>
        <div className="stack">
          <div>
            <span className="field-label">Theme</span>
            <div className="segmented segmented-3" role="group" aria-label="Theme">
              {THEMES.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="segment"
                  aria-pressed={theme === id}
                  onClick={() => onSetTheme(id)}
                >
                  {THEME_LABELS[id]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="field-label">Accent colour</span>
            <div className="swatches">
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="swatch"
                  aria-label={a.name}
                  aria-pressed={accent === a.id}
                  style={{ background: a.base }}
                  onClick={() => onSetAccent(a.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

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
        <div className="stack">
          <p className="hint">
            Everything is kept on this device. Only the goals you choose to share leave your phone,
            and only that goal and its entries go with them. To remove a shared goal from the
            server, open that goal and choose "Delete the shared copy".
          </p>

          {confirmErase ? (
            <div className="confirm-box">
              <p className="hint">
                Erase every goal, win and setting on this phone? Shared copies on the server are not
                touched. Save a copy first if you might want it back.
              </p>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  onEraseEverything();
                  setConfirmErase(false);
                  setMessage('Everything on this device was erased.');
                }}
              >
                Yes, erase everything
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirmErase(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmErase(true)}>
              Erase everything on this device
            </button>
          )}
        </div>
      </section>
    </>
  );
}
