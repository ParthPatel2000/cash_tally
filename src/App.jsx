import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_RECEIPT_SETTINGS, RECEIPT_SETTINGS_STORAGE_KEY, TALLY_STORAGE_KEY } from './constants';
import { buildReceiptText, hasPrintableAmount } from './Receipt';
import { normalizeReceiptSettings } from './lib/receiptSettings';
import { createId, loadReceiptSettings, loadTallies } from './lib/storage';
import { openBrowserPrintQueue } from './lib/printUtils';
import { Header, OperatorBar } from './components/Header';
import { CreateTally, EmptyState, TallyTabs } from './components/TallyTabs';
import { TallyTable } from './components/TallyTable';
import { SettingsModal } from './components/SettingsModal';
import { DeleteModal } from './components/DeleteModal';
import { Toast } from './components/Toast';

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
            <TallyTable
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
