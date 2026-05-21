import { useState } from 'react';

export function TallyTabs({ tallies, activeTallyId, onSelect, onAdd, onDelete }) {
  return (
    <div id="drawer-tabs" className="drawer-tabs">
      {tallies.map((tally) => (
        <button
          key={tally.id}
          className={`drawer-tab${tally.id === activeTallyId ? ' active' : ''}`}
          type="button"
          onClick={() => onSelect(tally.id)}
        >
          <span>{tally.name}</span>
          <span
            className="delete-tally"
            title={`Delete ${tally.name}`}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onDelete(tally.id);
            }}
          >
            ×
          </span>
        </button>
      ))}

      <button className="drawer-tab-add" type="button" onClick={onAdd}>
        + Add Tally
      </button>
    </div>
  );
}

export function CreateTally({ onCancel, onCreate }) {
  const [name, setName] = useState('');

  function submit() {
    onCreate(name);
  }

  return (
    <div className="tally-create">
      <div className="label-field">
        <label>Tally Name</label>
        <input
          type="text"
          id="new-tally-name"
          value={name}
          placeholder="e.g. CRE, Lottery, Safe…"
          autoFocus
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submit();
            if (event.key === 'Escape') onCancel();
          }}
        />
      </div>
      <div className="actions">
        <button className="btn-clear" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn-add" type="button" onClick={submit}>
          Create
        </button>
      </div>
    </div>
  );
}

export function EmptyState({ onAdd }) {
  return (
    <div className="empty-state">
      <div className="empty-state-title">No tallies yet.</div>
      <div className="empty-state-subtitle">Create a tally for each drawer you need to count.</div>
      <button className="btn-add" type="button" onClick={onAdd}>
        + Add Tally
      </button>
    </div>
  );
}
