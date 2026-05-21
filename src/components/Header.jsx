export function Header({ onOpenSettings }) {
  return (
    <header>
      <span className="wordmark">Cash Tally</span>
      <button className="settings-cog" type="button" onClick={onOpenSettings} aria-label="Open settings">
        ⚙
      </button>
    </header>
  );
}

export function OperatorBar({ operatorName, onOperatorNameChange, hasTallies, onPrintAll }) {
  return (
    <div id="operator-bar">
      <div className="operator-inline-row">
        <label className="operator-inline-label">
          <span>Operator </span>
          <input
            id="operator-name"
            type="text"
            value={operatorName}
            placeholder="Who is closing?"
            autoComplete="off"
            onChange={(event) => onOperatorNameChange(event.target.value)}
          />
        </label>

        {hasTallies && (
          <button className="btn-print btn-print-all-top" type="button" onClick={onPrintAll}>
            Print All
          </button>
        )}
      </div>
    </div>
  );
}
