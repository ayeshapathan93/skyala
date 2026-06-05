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
    @page { size: A4; margin: 10mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; background: #fff; }
    .page { width: 210mm; min-height: 297mm; margin: 0 auto; }
    .invoice { border: 1px solid #111; padding: 10mm; }

    .row { display: flex; justify-content: space-between; gap: 10mm; }
    .col { flex: 1; }
    .shop-name { font-size: 18px; font-weight: 700; letter-spacing: 0.3px; text-transform: uppercase; }
    .small { font-size: 11px; line-height: 1.35; }
    .muted { color: #333; }
    .title { text-align: center; font-size: 16px; font-weight: 700; margin: 4mm 0 3mm; text-transform: uppercase; }

    table.box { width: 100%; border-collapse: collapse; font-size: 11px; }
    table.box td { border: 1px solid #111; padding: 2.4mm 2.8mm; vertical-align: top; }
    table.box td.half { width: 50%; }

    table.items { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 11px; }
    table.items th, table.items td { border: 1px solid #111; padding: 2.2mm 2.2mm; }
    table.items th { background: #f2f2f2; font-weight: 700; text-transform: uppercase; font-size: 10.5px; }

    .center { text-align: center; }
    .right { text-align: right; }

    .w-name { width: 38%; }
    .w-hsn { width: 10%; }
    .w-qty { width: 7%; }
    .w-unit { width: 7%; }
    .w-rate { width: 12%; }
    .w-disc { width: 10%; }
    .w-amt { width: 16%; }

    .summary-wrap { display: flex; gap: 6mm; margin-top: 4mm; }
    .words { flex: 1; border: 1px solid #111; padding: 3mm; }
    .words .head { font-size: 10.5px; font-weight: 700; text-transform: uppercase; margin-bottom: 1mm; }

    table.summary { width: 74mm; border-collapse: collapse; font-size: 11px; }
    table.summary td { border: 1px solid #111; padding: 2.2mm 2.6mm; }
    table.summary td.label { font-weight: 700; }
    table.summary tr.total td { font-weight: 700; font-size: 12px; }

    .sign-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 10mm; gap: 8mm; }
    .note { font-size: 10px; color: #333; }
    .sign { width: 65mm; text-align: center; }
    .sign .line { border-top: 1px solid #111; margin-top: 18mm; padding-top: 2mm; font-size: 11px; }
  </style>
</head>
<body>
  <div class="page">
    <div class="invoice">
      <div class="row">
        <div class="col">
          <div class="shop-name">${shopName || 'Shop Name'}</div>
          <div class="small muted">${shopAddress || ''}</div>
          <div class="small muted">GSTIN: ${shopGst || '-'}</div>
          <div class="small muted">Mobile: ${shopMobile || '-'}</div>
        </div>
        <div class="col" style="text-align:right;">
          <div class="small"><strong>Bill No:</strong> ${billNumber || '-'}</div>
          <div class="small"><strong>Date:</strong> ${invoiceDate}</div>
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

