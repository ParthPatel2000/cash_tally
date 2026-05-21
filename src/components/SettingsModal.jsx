import { useEffect, useState } from 'react';

export function SettingsModal({ open, settings, onClose, onSave, onReset }) {
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
