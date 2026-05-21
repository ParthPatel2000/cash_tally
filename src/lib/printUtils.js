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

export function openBrowserPrintQueue(receipts, title, receiptSettings) {
  const printWindow = window.open('', '_blank', 'width=420,height=700');
  if (!printWindow) return false;

  printWindow.document.open();
  printWindow.document.write(buildPrintDocument(receipts, title, receiptSettings));
  printWindow.document.close();
  return true;
}
