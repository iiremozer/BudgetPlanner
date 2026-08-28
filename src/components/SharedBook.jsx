import { useState } from 'react';
import { makeBookCode, normalizeCode, formatCode } from '../lib/code.js';

function statusText(status, lastSync) {
  if (status === 'syncing') return 'Syncing…';
  if (status === 'error') return 'Offline — will retry';
  if (lastSync) {
    return `Last synced ${lastSync.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }
  return 'Not synced yet';
}

export default function SharedBook({ member, book, status, lastSync, onSetName, onJoin, onLeave, onSyncNow }) {
  const [name, setName] = useState(member?.name ?? '');
  const [joining, setJoining] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  if (!member) {
    return (
      <section className="card">
        <div className="card-head">
          <h2 className="card-title">Share this book</h2>
        </div>
        <div className="stack">
          <p className="hint">
            Put your name in and you can share one book with someone else. Each entry shows who
            logged it.
          </p>
          <input
            className="control"
            type="text"
            placeholder="Your name"
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            type="button"
            className="btn"
            disabled={!name.trim()}
            onClick={() => onSetName(name.trim())}
          >
            Continue
          </button>
        </div>
      </section>
    );
  }

  if (!book) {
    return (
      <section className="card">
        <div className="card-head">
          <h2 className="card-title">Share this book</h2>
          <span className="card-note">{member.name}</span>
        </div>

        {joining ? (
          <div className="stack">
            <p className="hint">Enter the code from the other person's book.</p>
            <input
              className="control code-input"
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              placeholder="ABCD EFGH 2345"
              value={codeInput}
              onChange={(e) => {
                setCodeInput(e.target.value);
                setError('');
              }}
            />
            {error ? <p className="error">{error}</p> : null}
            <button
              type="button"
              className="btn"
              onClick={() => {
                const code = normalizeCode(codeInput);
                if (!code) {
                  setError('That code does not look right. Check it and try again.');
                  return;
                }
                onJoin(code);
                setJoining(false);
                setCodeInput('');
              }}
            >
              Join book
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setJoining(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <div className="stack">
            <p className="hint">
              Create a book and share the code, or join one that already exists. Everything you have
              logged so far comes with you.
            </p>
            <button type="button" className="btn" onClick={() => onJoin(makeBookCode())}>
              Create a shared book
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setJoining(true)}>
              I have a code
            </button>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="card">
      <div className="card-head">
        <h2 className="card-title">Shared book</h2>
        <span className="card-note">{member.name}</span>
      </div>

      <div className="stack">
        <button
          type="button"
          className="code-box"
          onClick={() => {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(book.code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            }
          }}
        >
          <span className="code-value">{formatCode(book.code)}</span>
          <span className="code-hint">{copied ? 'Copied' : 'Tap to copy'}</span>
        </button>

        <p className="hint">
          Anyone with this code can open the book. There is no password, so only share it with the
          person you are saving with.
        </p>

        <div className="sync-row">
          <span className={`sync-status sync-${status}`}>{statusText(status, lastSync)}</span>
          <button type="button" className="link" onClick={onSyncNow}>
            Sync now
          </button>
        </div>

        <button type="button" className="btn btn-ghost" onClick={onLeave}>
          Leave book
        </button>
      </div>
    </section>
  );
}
