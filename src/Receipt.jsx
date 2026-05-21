export function normalizeQuantity(value) {
  const qty = parseInt(value, 10);
  return Number.isFinite(qty) && qty > 0 ? qty : 0;
}

export function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export function todayLocalDisplay() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const year = now.getFullYear();
  return `${month}/${day}/${year}`;
}

export function getTallyRows(tally, denominations) {
  let total = 0;
  const rows = denominations.map((denom) => {
    const qty = normalizeQuantity(tally.quantities[String(denom)]);
    const amount = qty * denom;
    total += amount;
    return { denom, qty, amount };
  });
  return { rows, total };
}

export function hasPrintableAmount(tally, denominations) {
  return denominations.some((denom) => normalizeQuantity(tally.quantities[String(denom)]) > 0);
}

function formatReceiptLine(left, right, width) {
  const leftText = String(left || '');
  const rightText = String(right || '');
  const spaceCount = Math.max(1, width - leftText.length - rightText.length);
  return leftText + ' '.repeat(spaceCount) + rightText;
}

export function buildReceiptText(tally, receiptSettings) {
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
