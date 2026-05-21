import { DEFAULT_RECEIPT_SETTINGS } from '../constants';

function positiveInteger(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function positiveNumber(value, fallback, allowZero = false) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && (allowZero ? parsed >= 0 : parsed > 0) ? parsed : fallback;
}

export function normalizeReceiptSettings(settings) {
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
