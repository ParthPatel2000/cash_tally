import { useMemo } from 'react';
import { getTallyRows, money, todayLocalDisplay } from '../Receipt';

function cleanQuantity(value) {
  return String(value || '').replace(/[^\d]/g, '').slice(0, 6);
}

export function TallyTable({ tally, denominations, onQuantityChange, onClear, onPrint }) {
  const { rows, total } = useMemo(
    () => getTallyRows(tally, denominations),
    [tally, denominations]
  );

  return (
    <div id="tally-content">
      <div className="tally-title-row">
        <div className="tally-title">{tally.name}</div>
        <div className="tally-date">{todayLocalDisplay()}</div>
      </div>

      <table className="tally-table">
        <thead>
          <tr>
            <th>Denom</th>
            <th style={{ textAlign: 'right' }}>Qty</th>
            <th style={{ textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.denom}>
              <td className="denom-cell">${row.denom}</td>
              <td className="qty-cell">
                <input
                  className="qty-input"
                  type="text"
                  inputMode="numeric"
                  value={tally.quantities[String(row.denom)] || ''}
                  placeholder="0"
                  onChange={(event) => onQuantityChange(row.denom, cleanQuantity(event.target.value))}
                  onKeyDown={(event) => {
                    const allowedKeys = [
                      'Backspace',
                      'Delete',
                      'ArrowLeft',
                      'ArrowRight',
                      'Tab',
                      'Home',
                      'End'
                    ];
                    if (allowedKeys.includes(event.key)) return;
                    if (!/^\d$/.test(event.key)) event.preventDefault();
                  }}
                />
              </td>
              <td className="amt-cell">{row.qty > 0 ? money(row.amount) : '—'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="total-row">
            <td colSpan="2" className="total-label">
              Total
            </td>
            <td className="total-amount">{money(total)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="actions">
        <button className="btn-clear" type="button" onClick={onClear}>
          Clear
        </button>
        <button className="btn-print" type="button" onClick={onPrint}>
          Print {tally.name}
        </button>
      </div>
    </div>
  );
}
