export const TALLY_STORAGE_KEY = 'cash_tally_state_v1';
export const RECEIPT_SETTINGS_STORAGE_KEY = 'cash_tally_receipt_settings_v1';

export const DEFAULT_RECEIPT_SETTINGS = {
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
