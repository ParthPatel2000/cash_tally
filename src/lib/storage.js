import { DEFAULT_RECEIPT_SETTINGS, RECEIPT_SETTINGS_STORAGE_KEY, TALLY_STORAGE_KEY } from '../constants';
import { normalizeReceiptSettings } from './receiptSettings';

export function createId() {
  return `tally-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadTallies() {
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

export function loadReceiptSettings() {
  try {
    const raw = localStorage.getItem(RECEIPT_SETTINGS_STORAGE_KEY);
    return normalizeReceiptSettings(raw ? JSON.parse(raw) : DEFAULT_RECEIPT_SETTINGS);
  } catch (error) {
    console.warn('Could not load receipt settings', error);
    return normalizeReceiptSettings(DEFAULT_RECEIPT_SETTINGS);
  }
}
