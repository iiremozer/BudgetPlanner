import { useState } from 'react';

export default function MemberCard({ member, onSetName }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(member?.name ?? '');

  return (
    <section className="card">
      <div className="card-head">
        <h2 className="card-title">Your name</h2>
        {member && !editing ? <span className="card-note">{member.name}</span> : null}
      </div>

      {member && !editing ? (
        <div className="stack">
          <p className="hint">Shown next to the entries you log on shared goals.</p>
          <button type="button" className="btn btn-ghost" onClick={() => setEditing(true)}>
            Change name
          </button>
        </div>
      ) : (
        <div className="stack">
          <p className="hint">
            Used only on shared goals, so the other person can see who logged what.
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
            onClick={() => {
              onSetName(name.trim());
              setEditing(false);
            }}
          >
            Save
          </button>
        </div>
      )}
    </section>
  );
}
