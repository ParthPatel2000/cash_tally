import { useMemo } from 'react';
import { getTallyRows, money, todayLocalDisplay } from '../Receipt';
import { QuantityRow } from './QuantityRow';

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
                <QuantityRow
                  denom={row.denom}
                  value={tally.quantities[String(row.denom)] || ''}
                  onChange={onQuantityChange}
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