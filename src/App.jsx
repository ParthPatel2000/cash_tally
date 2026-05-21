import { useEffect, useMemo, useState } from 'react';

const TALLY_STORAGE_KEY = 'cash_tally_state_v1';
const RECEIPT_SETTINGS_STORAGE_KEY = 'cash_tally_receipt_settings_v1';

const DEFAULT_RECEIPT_SETTINGS = {
  denominations: [100, 50, 20, 10, 5, 1],
  paperWidthMm: 80,
  paddingLeftMm: 8,
  paddingRightMm: 3,
  paddingTopBottomMm: 3,
  charWidth: 36,
  fontSizePx: 12,
  minFontSizePx: 8,
  lineHeight: 1.22,
  fontFamily: 'Consolas, "Courier New", monospace',
  operatorName: '',
  showPrintPreview: false
};

function createId() {
  return `tally-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeQuantity(value) {
  const qty = parseInt(value, 10);
  return Number.isFinite(qty) && qty > 0 ? qty : 0;
}

function positiveInteger(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function positiveNumber(value, fallback, allowZero = false) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && (allowZero ? parsed >= 0 : parsed > 0) ? parsed : fallback;
}

function normalizeReceiptSettings(settings) {
  const rawDenoms = Array.isArray(settings.denominations)
    ? settings.denominations
    : String(settings.denominations || '').split(',');

  const denominations = rawDenoms
    .map((value) => parseInt(value, 10))
    .filter((value) => Number.isFinite(value) && value > 0);

  const minFontSizePx = Math.max(
    6,
    positiveNumber(settings.minFontSizePx, DEFAULT_RECEIPT_SETTINGS.minFontSizePx)
  );

  return {
    denominations: denominations.length ? denominations : DEFAULT_RECEIPT_SETTINGS.denominations,
    paperWidthMm: positiveNumber(settings.paperWidthMm, DEFAULT_RECEIPT_SETTINGS.paperWidthMm),
    paddingLeftMm: positiveNumber(settings.paddingLeftMm, DEFAULT_RECEIPT_SETTINGS.paddingLeftMm, true),
    paddingRightMm: positiveNumber(settings.paddingRightMm, DEFAULT_RECEIPT_SETTINGS.paddingRightMm, true),
    paddingTopBottomMm: positiveNumber(
      settings.paddingTopBottomMm,
      DEFAULT_RECEIPT_SETTINGS.paddingTopBottomMm,
      true
    ),
    charWidth: Math.max(28, positiveInteger(settings.charWidth, DEFAULT_RECEIPT_SETTINGS.charWidth)),
    minFontSizePx,
    fontSizePx: Math.max(
      minFontSizePx,
      positiveNumber(settings.fontSizePx, DEFAULT_RECEIPT_SETTINGS.fontSizePx)
    ),
    lineHeight: positiveNumber(settings.lineHeight, DEFAULT_RECEIPT_SETTINGS.lineHeight),
    fontFamily: String(settings.fontFamily || DEFAULT_RECEIPT_SETTINGS.fontFamily),
    operatorName: String(settings.operatorName || '').trim(),
    showPrintPreview: Boolean(settings.showPrintPreview)
  };
}

function loadTallies() {
  try {
    const raw = localStorage.getItem(TALLY_STORAGE_KEY);
    if (!raw) return { tallies: [], activeTallyId: null };

    const state = JSON.parse(raw);
    const tallies = Array.isArray(state.tallies)
      ? state.tallies.map((tally) => ({
          id: tally.id || createId(),
          name: tally.name || 'Untitled',
          quantities:
            tally.quantities && typeof tally.quantities === 'object' ? tally.quantities : {}
        }))
      : [];

    const activeTallyId = tallies.some((tally) => tally.id === state.activeTallyId)
      ? state.activeTallyId
      : tallies[0]?.id ?? null;

    return { tallies, activeTallyId };
  } catch (error) {
    console.warn('Could not load tally state', error);
    return { tallies: [], activeTallyId: null };
  }
}

function loadReceiptSettings() {
  try {
    const raw = localStorage.getItem(RECEIPT_SETTINGS_STORAGE_KEY);
    return normalizeReceiptSettings(raw ? JSON.parse(raw) : DEFAULT_RECEIPT_SETTINGS);
  } catch (error) {
    console.warn('Could not load receipt settings', error);
    return normalizeReceiptSettings(DEFAULT_RECEIPT_SETTINGS);
  }
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function todayLocalDisplay() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const year = now.getFullYear();
  return `${month}/${day}/${year}`;
}

function getTallyRows(tally, denominations) {
  let total = 0;
  const rows = denominations.map((denom) => {
    const qty = normalizeQuantity(tally.quantities[String(denom)]);
    const amount = qty * denom;
    total += amount;
    return { denom, qty, amount };
  });
  return { rows, total };
}

function hasPrintableAmount(tally, denominations) {
  return denominations.some((denom) => normalizeQuantity(tally.quantities[String(denom)]) > 0);
}

function formatReceiptLine(left, right, width) {
  const leftText = String(left || '');
  const rightText = String(right || '');
  const spaceCount = Math.max(1, width - leftText.length - rightText.length);
  return leftText + ' '.repeat(spaceCount) + rightText;
}

function buildReceiptText(tally, receiptSettings) {
  const { rows, total } = getTallyRows(tally, receiptSettings.denominations);
  const today = todayLocalDisplay();
  const maxTitleWidth = receiptSettings.charWidth - today.length - 1;
  const title = formatReceiptLine(
    (tally.name || 'TALLY').slice(0, maxTitleWidth),
    today,
    receiptSettings.charWidth
  );

  const lines = [];
  const denomWidth = 7;
  const qtyWidth = 4;
  const headerLeft = 'DENOM'.padEnd(denomWidth, ' ') + 'QTY'.padStart(qtyWidth, ' ');

  if (receiptSettings.operatorName) {
    lines.push(`OPERATOR: ${receiptSettings.operatorName}`.slice(0, receiptSettings.charWidth));
  }

  lines.push(title);
  lines.push('-'.repeat(receiptSettings.charWidth));
  lines.push(formatReceiptLine(headerLeft, 'AMOUNT', receiptSettings.charWidth));
  lines.push('-'.repeat(receiptSettings.charWidth));

  rows.forEach((row) => {
    const qtyText = row.qty > 0 ? String(row.qty) : '-';
    const amountText = row.qty > 0 ? money(row.amount) : '-';
    const left = `$${row.denom}`.padEnd(denomWidth, ' ') + qtyText.padStart(qtyWidth, ' ');
    lines.push(formatReceiptLine(left, amountText, receiptSettings.charWidth));
  });

  lines.push('-'.repeat(receiptSettings.charWidth));
  lines.push(formatReceiptLine('TOTAL', money(total), receiptSettings.charWidth));
  lines.push('');

  return lines.join('\n');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeCss(value) {
  return String(value).replace(/</g, '').replace(/>/g, '').replace(/;/g, '');
}

function buildPrintDocument(receipts, title, receiptSettings) {
  const receiptBlocks = receipts
    .map(
      (receipt) => `
      <section class="receipt-block">
        <pre>${escapeHtml(receipt)}</pre>
      </section>
    `
    )
    .join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @page {
      size: ${receiptSettings.paperWidthMm}mm auto;
      margin: 0;
    }

    * { box-sizing: border-box; }

    html,
    body {
      width: ${receiptSettings.paperWidthMm}mm;
      margin: 0;
      padding: 0;
      background: #fff;
      color: #000;
      font-family: ${escapeCss(receiptSettings.fontFamily)};
    }

    .receipt-block {
      width: ${receiptSettings.paperWidthMm}mm;
      min-height: 1px;
      padding: ${receiptSettings.paddingTopBottomMm}mm ${receiptSettings.paddingRightMm}mm ${receiptSettings.paddingTopBottomMm}mm ${receiptSettings.paddingLeftMm}mm;
      page-break-after: always;
      break-after: page;
    }

    .receipt-block:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    pre {
      margin: 0;
      white-space: pre;
      overflow: hidden;
      font-family: ${escapeCss(receiptSettings.fontFamily)};
      font-size: ${receiptSettings.fontSizePx}px;
      line-height: ${receiptSettings.lineHeight};
    }

    @media screen {
      body { padding: 16px; }
      .receipt-block {
        border: 1px dashed #999;
        margin-bottom: 16px;
      }
    }
  </style>
</head>
<body>
  ${receiptBlocks}
  <script>
    const SHOULD_KEEP_PREVIEW_OPEN = ${receiptSettings.showPrintPreview ? 'true' : 'false'};

    window.addEventListener('load', () => {
      window.focus();

      window.addEventListener('afterprint', () => {
        if (!SHOULD_KEEP_PREVIEW_OPEN) window.close();
      });

      setTimeout(() => {
        window.print();
        if (!SHOULD_KEEP_PREVIEW_OPEN) {
          setTimeout(() => window.close(), 100);
        }
      }, 150);
    });
  <\/script>
</body>
</html>`;
}

function openBrowserPrintQueue(receipts, title, receiptSettings) {
  const printWindow = window.open('', '_blank', 'width=420,height=700');
  if (!printWindow) return false;

  printWindow.document.open();
  printWindow.document.write(buildPrintDocument(receipts, title, receiptSettings));
  printWindow.document.close();
  return true;
}

function cleanQuantity(value) {
  return String(value || '').replace(/[^\d]/g, '').slice(0, 6);
}

function Header({ onOpenSettings }) {
  return (
    <header>
      <span className="wordmark">Cash Tally</span>
      <button className="settings-cog" type="button" onClick={onOpenSettings} aria-label="Open settings">
        ⚙
      </button>
    </header>
  );
}

function OperatorBar({ operatorName, onOperatorNameChange, hasTallies, onPrintAll }) {
  return (
    <div id="operator-bar">
      <div className="operator-inline-row">
        <label className="operator-inline-label">
          <span>Operator</span>
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

function TallyTabs({ tallies, activeTallyId, onSelect, onAdd, onDelete }) {
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

function CreateTally({ onCancel, onCreate }) {
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

function EmptyState({ onAdd }) {
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

function TallyContent({ tally, denominations, onQuantityChange, onClear, onPrint }) {
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

function SettingsModal({ open, settings, onClose, onSave, onReset }) {
  const [draft, setDraft] = useState(settings);

  useEffect(() => {
    if (open) setDraft(settings);
  }, [open, settings]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }

    if (open) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function updateField(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="modal-backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
        <div className="modal-header">
          <h3 id="settings-modal-title">Settings</h3>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Close settings">
            ×
          </button>
        </div>

        <div className="settings-section">
          <h3>Receipt Layout</h3>
          <div className="label-field">
            <label>Denominations</label>
            <input
              value={Array.isArray(draft.denominations) ? draft.denominations.join(', ') : draft.denominations}
              placeholder="100, 50, 20, 10, 5, 1"
              onChange={(event) => updateField('denominations', event.target.value)}
            />
          </div>

          <div className="settings-grid">
            <div className="label-field">
              <label>Paper Width MM</label>
              <input
                type="number"
                step="1"
                min="1"
                value={draft.paperWidthMm}
                onChange={(event) => updateField('paperWidthMm', event.target.value)}
              />
            </div>
            <div className="label-field">
              <label>Characters Wide</label>
              <input
                type="number"
                step="1"
                min="1"
                value={draft.charWidth}
                onChange={(event) => updateField('charWidth', event.target.value)}
              />
            </div>
            <div className="label-field">
              <label>Left Padding MM</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={draft.paddingLeftMm}
                onChange={(event) => updateField('paddingLeftMm', event.target.value)}
              />
            </div>
            <div className="label-field">
              <label>Right Padding MM</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={draft.paddingRightMm}
                onChange={(event) => updateField('paddingRightMm', event.target.value)}
              />
            </div>
            <div className="label-field">
              <label>Top/Bottom MM</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={draft.paddingTopBottomMm}
                onChange={(event) => updateField('paddingTopBottomMm', event.target.value)}
              />
            </div>
            <div className="label-field">
              <label>Font Size PX</label>
              <input
                type="number"
                step="0.5"
                min={draft.minFontSizePx}
                value={draft.fontSizePx}
                onChange={(event) => updateField('fontSizePx', event.target.value)}
              />
            </div>
            <div className="label-field">
              <label>Minimum Font PX</label>
              <input
                type="number"
                step="0.5"
                min="6"
                value={draft.minFontSizePx}
                onChange={(event) => updateField('minFontSizePx', event.target.value)}
              />
            </div>
            <div className="label-field">
              <label>Line Height</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={draft.lineHeight}
                onChange={(event) => updateField('lineHeight', event.target.value)}
              />
            </div>
          </div>

          <div className="label-field">
            <label className="checkbox-label">
              <span>Keep receipt preview open after printing</span>
              <input
                type="checkbox"
                checked={Boolean(draft.showPrintPreview)}
                onChange={(event) => updateField('showPrintPreview', event.target.checked)}
              />
            </label>
          </div>

          <div className="label-field">
            <label>Font Family</label>
            <input
              value={draft.fontFamily}
              onChange={(event) => updateField('fontFamily', event.target.value)}
            />
          </div>
        </div>

        <div className="actions">
          <button className="btn-clear" type="button" onClick={onReset}>
            Reset
          </button>
          <button className="btn-save" type="button" onClick={() => onSave(draft)}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ tally, onCancel, onConfirm }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onCancel();
    }

    if (tally) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [tally, onCancel]);

  if (!tally) return null;

  return (
    <div className="modal-backdrop" onClick={(event) => event.target === event.currentTarget && onCancel()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
        <h3 id="delete-modal-title">Delete tally?</h3>
        <p>Delete &quot;{tally.name}&quot;? This cannot be undone.</p>
        <div className="actions">
          <button className="btn-clear" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-danger" type="button" onClick={onConfirm} autoFocus>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ toast }) {
  return <div className={`toast${toast.message ? ' show' : ''}${toast.type ? ` ${toast.type}` : ''}`}>{toast.message}</div>;
}

export default function App() {
  const initialTallyState = useMemo(loadTallies, []);
  const [tallies, setTallies] = useState(initialTallyState.tallies);
  const [activeTallyId, setActiveTallyId] = useState(initialTallyState.activeTallyId);
  const [isCreatingTally, setIsCreatingTally] = useState(false);
  const [pendingDeleteTallyId, setPendingDeleteTallyId] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [receiptSettings, setReceiptSettings] = useState(() => loadReceiptSettings());
  const [toast, setToast] = useState({ message: '', type: '' });

  const activeTally = tallies.find((tally) => tally.id === activeTallyId) || null;
  const pendingDeleteTally = tallies.find((tally) => tally.id === pendingDeleteTallyId) || null;

  useEffect(() => {
    localStorage.setItem(TALLY_STORAGE_KEY, JSON.stringify({ tallies, activeTallyId }));
  }, [tallies, activeTallyId]);

  useEffect(() => {
    localStorage.setItem(RECEIPT_SETTINGS_STORAGE_KEY, JSON.stringify(receiptSettings));
  }, [receiptSettings]);

  useEffect(() => {
    if (tallies.length && !activeTally) {
      setActiveTallyId(tallies[0].id);
    }
  }, [tallies, activeTally]);

  function showToast(message, type = '') {
    setToast({ message, type });
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => setToast({ message: '', type: '' }), 2800);
  }

  function updateReceiptSettings(settings, persistToast = true) {
    const normalized = normalizeReceiptSettings(settings);
    setReceiptSettings(normalized);
    setSettingsOpen(false);
    if (persistToast) showToast('Receipt settings saved', 'success');
  }

  function resetReceiptSettings() {
    localStorage.removeItem(RECEIPT_SETTINGS_STORAGE_KEY);
    setReceiptSettings(normalizeReceiptSettings(DEFAULT_RECEIPT_SETTINGS));
    showToast('Receipt settings reset', 'success');
  }

  function updateOperatorName(operatorName) {
    setReceiptSettings((current) => normalizeReceiptSettings({ ...current, operatorName }));
  }

  function createTally(rawName) {
    const name = String(rawName || '').trim();

    if (!name) {
      showToast('Enter a tally name', 'error');
      return;
    }

    if (tallies.some((tally) => tally.name.toLowerCase() === name.toLowerCase())) {
      showToast('That tally already exists', 'error');
      return;
    }

    const tally = { id: createId(), name, quantities: {} };
    setTallies((current) => [...current, tally]);
    setActiveTallyId(tally.id);
    setIsCreatingTally(false);
  }

  function deletePendingTally() {
    if (!pendingDeleteTally) return;
    const deleteId = pendingDeleteTally.id;
    const deletedName = pendingDeleteTally.name;

    setTallies((current) => {
      const index = current.findIndex((tally) => tally.id === deleteId);
      const nextTallies = current.filter((tally) => tally.id !== deleteId);

      if (activeTallyId === deleteId) {
        setActiveTallyId(nextTallies[index]?.id || nextTallies[index - 1]?.id || nextTallies[0]?.id || null);
      }

      return nextTallies;
    });

    setPendingDeleteTallyId(null);
    showToast(`${deletedName} deleted`, 'success');
  }

  function updateQuantity(denom, quantity) {
    setTallies((current) =>
      current.map((tally) =>
        tally.id === activeTallyId
          ? { ...tally, quantities: { ...tally.quantities, [String(denom)]: quantity } }
          : tally
      )
    );
  }

  function clearActiveTally() {
    if (!activeTally) return;
    setTallies((current) =>
      current.map((tally) => (tally.id === activeTally.id ? { ...tally, quantities: {} } : tally))
    );
  }

  function printActiveTally() {
    if (!activeTally) return;

    if (!hasPrintableAmount(activeTally, receiptSettings.denominations)) {
      showToast('Nothing to print', 'error');
      return;
    }

    const ok = openBrowserPrintQueue(
      [buildReceiptText(activeTally, receiptSettings)],
      activeTally.name,
      receiptSettings
    );
    showToast(ok ? 'Print dialog opened' : 'Allow popups to print receipts', ok ? 'success' : 'error');
  }

  function printAllTallies() {
    const printableTallies = tallies.filter((tally) =>
      hasPrintableAmount(tally, receiptSettings.denominations)
    );

    if (!printableTallies.length) {
      showToast('No tallies to print', 'error');
      return;
    }

    const receipts = printableTallies.map((tally) => buildReceiptText(tally, receiptSettings));
    const ok = openBrowserPrintQueue(receipts, 'All Cash Tallies', receiptSettings);
    showToast(ok ? 'Print dialog opened' : 'Allow popups to print receipts', ok ? 'success' : 'error');
  }

  return (
    <>
      <div className="app">
        <Header onOpenSettings={() => setSettingsOpen(true)} />

        <div id="panel-tally" className="panel active">
          <OperatorBar
            operatorName={receiptSettings.operatorName}
            onOperatorNameChange={updateOperatorName}
            hasTallies={tallies.length > 0}
            onPrintAll={printAllTallies}
          />

          <TallyTabs
            tallies={tallies}
            activeTallyId={activeTallyId}
            onSelect={(id) => {
              setActiveTallyId(id);
              setIsCreatingTally(false);
            }}
            onAdd={() => setIsCreatingTally(true)}
            onDelete={setPendingDeleteTallyId}
          />

          <div id="create-tally-container">
            {isCreatingTally && (
              <CreateTally onCancel={() => setIsCreatingTally(false)} onCreate={createTally} />
            )}
          </div>

          {!tallies.length && !isCreatingTally && <EmptyState onAdd={() => setIsCreatingTally(true)} />}

          {activeTally && (
            <TallyContent
              tally={activeTally}
              denominations={receiptSettings.denominations}
              onQuantityChange={updateQuantity}
              onClear={clearActiveTally}
              onPrint={printActiveTally}
            />
          )}
        </div>
      </div>

      <SettingsModal
        open={settingsOpen}
        settings={receiptSettings}
        onClose={() => setSettingsOpen(false)}
        onSave={updateReceiptSettings}
        onReset={resetReceiptSettings}
      />

      <DeleteModal
        tally={pendingDeleteTally}
        onCancel={() => setPendingDeleteTallyId(null)}
        onConfirm={deletePendingTally}
      />

      <Toast toast={toast} />
    </>
  );
}
