const numberToWords = (num) => {
  const ones = [
    'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const toWords = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ` ${ones[n % 10]}` : '');
    if (n < 1000) return `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${toWords(n % 100)}` : ''}`;
    if (n < 100000) return `${toWords(Math.floor(n / 1000))} Thousand${n % 1000 ? ` ${toWords(n % 1000)}` : ''}`;
    if (n < 10000000) return `${toWords(Math.floor(n / 100000))} Lakh${n % 100000 ? ` ${toWords(n % 100000)}` : ''}`;
    return `${toWords(Math.floor(n / 10000000))} Crore${n % 10000000 ? ` ${toWords(n % 10000000)}` : ''}`;
  };

  const safe = Number.isFinite(Number(num)) ? Number(num) : 0;
  const [integer, fraction = '00'] = safe.toFixed(2).split('.');
  const rupees = toWords(parseInt(integer, 10));
  const paisa = parseInt(fraction.padEnd(2, '0').slice(0, 2), 10);

  if (!paisa) return `${rupees} Rupees Only`;
  return `${rupees} Rupees and ${toWords(paisa)} Paise Only`;
};

const fs = require('fs');
const path = require('path');

let LOGO_BASE64 = '';
try {
  const logoPath = path.join(__dirname, '..', '..', 'frontend', 'public', 'skyla-logo.png');
  if (fs.existsSync(logoPath)) {
    const logoBuffer = fs.readFileSync(logoPath);
    LOGO_BASE64 = 'data:image/png;base64,' + logoBuffer.toString('base64');
  }
} catch (_) {
  // logo embedding is best-effort; fall back gracefully
}

module.exports = (invoice) => {
  const money = (n) => Number(Number.isFinite(Number(n)) ? Number(n) : 0);
  const qtyNum = (n) => Number(Number.isFinite(Number(n)) ? Number(n) : 0);

  const {
    shopName,
    shopAddress,
    shopGst,
    shopMobile,
    billNumber,
    date,
    customerName,
    customerPhone,
    customerAddress,
    items,
    subtotal,
    totalQty,
    discount,
    cgst,
    sgst,
    totalAmount,
    paidAmount,
    balance,
  } = invoice || {};

  const safeItems = Array.isArray(items) ? items : [];
  const minRows = 12;
  const paddedItems = safeItems
    .slice(0, 99)
    .map((it) => ({
      name: String(it?.name ?? ''),
      hsn: String(it?.hsn ?? ''),
      qty: qtyNum(it?.qty),
      unit: String(it?.unit ?? 'pcs'),
      rate: money(it?.rate),
      discount: money(it?.discount),
      amount: money(it?.amount),
    }));
  while (paddedItems.length < minRows) {
    paddedItems.push({ name: '', hsn: '', qty: 0, unit: '', rate: 0, discount: 0, amount: 0 });
  }

  const safeSubtotal = money(subtotal);
  const safeDiscount = money(discount);
  const safeCgst = money(cgst);
  const safeSgst = money(sgst);
  const safeTotalQty = qtyNum(totalQty);
  const safeTotalAmount = money(totalAmount);
  const safePaid = money(paidAmount);
  const safeBalance = money(balance);

  const amountWords = numberToWords(safeTotalAmount);
  const invoiceDate = new Date(date || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const rupee = '&#8377;';
  const nbsp = '&nbsp;';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice ${billNumber || ''}</title>
  <style>
    @page { size: A4; margin: 5mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; background: #fff; }
    .page { width: 170mm; min-height: 240mm; margin: 0 auto; }
    .invoice { border: 1px solid #111; padding: 4mm 5mm; }

    .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2mm; gap: 4mm; }
    .logo-section { flex: 0 0 auto; }
    .logo-section img { height: 30mm; width: auto; }
    .header-right { text-align: right; font-size: 10px; line-height: 1.4; }
    .header-right .bill-date { font-weight: 600; }

    .row { display: flex; justify-content: space-between; gap: 4mm; }
    .col { flex: 1; }
    .shop-name { font-size: 16px; font-weight: 700; letter-spacing: 0.2px; text-transform: uppercase; margin-bottom: 1mm; }
    .small { font-size: 10px; line-height: 1.3; }
    .muted { color: #333; }
    .title { text-align: center; font-size: 14px; font-weight: 700; margin: 2mm 0 2mm; text-transform: uppercase; }

    table.box { width: 100%; border-collapse: collapse; font-size: 10px; }
    table.box td { border: 1px solid #111; padding: 1.8mm 2mm; vertical-align: top; }
    table.box td.half { width: 50%; }

    table.items { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 10px; }
    table.items th, table.items td { border: 1px solid #111; padding: 1.6mm 1.6mm; }
    table.items th { background: #f2f2f2; font-weight: 700; text-transform: uppercase; font-size: 9.5px; }

    .center { text-align: center; }
    .right { text-align: right; }

    .w-name { width: 38%; }
    .w-hsn { width: 10%; }
    .w-qty { width: 7%; }
    .w-unit { width: 7%; }
    .w-rate { width: 12%; }
    .w-disc { width: 10%; }
    .w-amt { width: 16%; }

    .summary-wrap { display: flex; gap: 3mm; margin-top: 2mm; }
    .words { flex: 1; border: 1px solid #111; padding: 2mm; }
    .words .head { font-size: 9.5px; font-weight: 700; text-transform: uppercase; margin-bottom: 0.8mm; }

    table.summary { width: 70mm; border-collapse: collapse; font-size: 10px; }
    table.summary td { border: 1px solid #111; padding: 1.6mm 2mm; }
    table.summary td.label { font-weight: 700; }
    table.summary tr.total td { font-weight: 700; font-size: 11px; }

    .sign-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 6mm; gap: 4mm; }
    .note { font-size: 9px; color: #333; line-height: 1.2; }
    .sign { width: 55mm; text-align: center; }
    .sign .line { border-top: 1px solid #111; margin-top: 14mm; padding-top: 1.5mm; font-size: 10px; }
  </style>
</head>
<body>
  <div class="page">
    <div class="invoice">
      <div class="header-top">
        <div class="logo-section">
          <div style="font-size: 24px; font-weight: bold; color: #0052CC; letter-spacing: 2px;">SKYLA</div>
        </div>
        <div class="header-right">
          <div class="bill-date"><strong>Bill No:</strong> ${billNumber || '-'}</div>
          <div class="bill-date"><strong>Date:</strong> ${invoiceDate}</div>
          ${LOGO_BASE64 ? `<div style="margin-top:3mm;">
            <img src="${LOGO_BASE64}" alt="Skyla Logo" style="height:18mm;width:auto;display:block;margin-left:auto;" />
          </div>` : '<div style="margin-top:3mm;font-size:9px;color:#0052CC;font-weight:700;letter-spacing:1px;">SKYLA</div>'}
        </div>
      </div>

      <div class="row">
        <div class="col">
          <div class="shop-name">${shopName || 'Shop Name'}</div>
          <div class="small muted">${shopAddress || ''}</div>
          <div class="small muted">GSTIN: ${shopGst || '-'}</div>
          <div class="small muted">Mobile: ${shopMobile || '-'}</div>
        </div>
      </div>

      <div class="title">GST Tax Invoice</div>

      <table class="box" cellspacing="0" cellpadding="0">
        <tr>
          <td class="half">
            <div class="small"><strong>Customer Name:</strong> ${customerName || '-'}</div>
            <div class="small"><strong>Mobile:</strong> ${customerPhone || '-'}</div>
          </td>
          <td class="half">
            <div class="small"><strong>Customer Address:</strong> ${customerAddress || '-'}</div>
          </td>
        </tr>
      </table>

      <table class="box" cellspacing="0" cellpadding="0" style="border-top:0;">
        <tr>
          <td class="half">
            <div class="small"><strong>Total Qty:</strong> ${safeTotalQty}</div>
          </td>
          <td class="half">
            <div class="small"><strong>Paid Amount:</strong> ${rupee}${safePaid.toFixed(2)} ${nbsp}${nbsp}<strong>Balance:</strong> ${rupee}${safeBalance.toFixed(2)}</div>
          </td>
        </tr>
      </table>

      <table class="items">
        <thead>
          <tr>
            <th class="w-name">Item Name</th>
            <th class="w-hsn center">HSN</th>
            <th class="w-qty center">Qty</th>
            <th class="w-unit center">Unit</th>
            <th class="w-rate right">Rate</th>
            <th class="w-disc center">Discount</th>
            <th class="w-amt right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${paddedItems.map((item) => {
            const discountText = item.discount ? `${money(item.discount).toFixed(2)}%` : '';
            const computed = item.qty * item.rate * (1 - (item.discount || 0) / 100);
            const lineAmount = item.amount || computed;

            return `
              <tr>
                <td class="w-name">${item.name || nbsp}</td>
                <td class="w-hsn center">${item.hsn || nbsp}</td>
                <td class="w-qty center">${item.qty ? item.qty : nbsp}</td>
                <td class="w-unit center">${item.unit || nbsp}</td>
                <td class="w-rate right">${item.rate ? `${rupee}${money(item.rate).toFixed(2)}` : nbsp}</td>
                <td class="w-disc center">${discountText || nbsp}</td>
                <td class="w-amt right">${lineAmount ? `${rupee}${money(lineAmount).toFixed(2)}` : nbsp}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div class="summary-wrap">
        <div class="words">
          <div class="head">Amount in Words</div>
          <div class="small">${amountWords}</div>
        </div>
        <table class="summary">
          <tr><td class="label">Total Qty</td><td class="right">${safeTotalQty}</td></tr>
          <tr><td class="label">Subtotal</td><td class="right">${rupee}${safeSubtotal.toFixed(2)}</td></tr>
          <tr><td class="label">Discount</td><td class="right">${rupee}${safeDiscount.toFixed(2)}</td></tr>
          <tr><td class="label">CGST</td><td class="right">${rupee}${safeCgst.toFixed(2)}</td></tr>
          <tr><td class="label">SGST</td><td class="right">${rupee}${safeSgst.toFixed(2)}</td></tr>
          <tr class="total"><td class="label">Grand Total</td><td class="right">${rupee}${safeTotalAmount.toFixed(2)}</td></tr>
        </table>
      </div>

      <div class="sign-row">
        <div style="flex:1;">
          <div class="note">Goods once sold will not be taken back. This is a computer generated invoice.</div>
        </div>
        <div class="sign">
          <div class="line">Authorised Signature</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
};

