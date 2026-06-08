const formatDate = (date) => {
  const d = new Date(date || Date.now());
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const money = (n) => Number(Number.isFinite(Number(n)) ? Number(n) : 0).toFixed(2);

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

module.exports = (invoice) => {
  const {
    shopName,
    shopAddress,
    shopPhone,
    shopPhone2,
    billNumber,
    date,
    customerName,
    customerPhone,
    customerAddress,
    items = [],
    totalQty,
    discountPercent,
    gstPercent,
    totalAmount,
    receivedAmount,
    balanceAmount,
    termsAndConditions,
  } = invoice || {};

  const safeItems = Array.isArray(items) ? items : [];
  const minRows = Math.max(6, safeItems.length);
  const paddedItems = [...safeItems];
  while (paddedItems.length < minRows) {
    paddedItems.push({ name: '', quantity: '', rate: '', total: '' });
  }

  const resolvedShopName = shopName || 'Skyla Organic & Herbal';
  const resolvedShopAddress =
    shopAddress || 'At Bhoisamudraga, Post Harangul Bk Latur Maharashtra Pin 413531';
  const resolvedPhones = [shopPhone, shopPhone2].filter(Boolean).join('/') || '9970603386/9970338001';

  const customerDisplay = customerAddress
    ? `${customerName || '-'} ( ${customerAddress} )`
    : customerName || '-';

  const itemRows = paddedItems
    .map(
      (item) => `
      <tr>
        <td class="col-item">${item.name ? escapeHtml(item.name) : '&nbsp;'}</td>
        <td class="col-qty">${item.quantity !== '' && item.quantity !== undefined ? item.quantity : '&nbsp;'}</td>
        <td class="col-rate">${item.rate !== '' && item.rate !== undefined ? money(item.rate) : '&nbsp;'}</td>
        <td class="col-total">${item.total !== '' && item.total !== undefined ? money(item.total) : '&nbsp;'}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Bill ${escapeHtml(billNumber || '')}</title>
  <style>
    @page { size: A4; margin: 10mm; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .invoice-wrap { width: 190mm; max-width: 190mm; margin: 0 auto; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #111;
      background: #fff;
      font-size: 13px;
      line-height: 1.4;
    }
    .invoice-wrap {
      width: 100%;
      max-width: 190mm;
      margin: 0 auto;
      border: 1.5px solid #111;
      background: #fff;
    }
    .blue { color: #1a3a7a; }
    .red { color: #c0392b; }
    .bold { font-weight: 700; }

    .top-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 8px 12px;
      font-size: 13px;
      border-bottom: 1px solid #111;
    }
    .date-col {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    .invoice-logo {
      height: 60px;
      width: 60px;
      border-radius: 50%;
      object-fit: cover;
      display: block;
      border: 1.5px solid #1a3a7a;
    }
    .bill-no-value { color: #c0392b; font-weight: 700; font-size: 15px; }

    .header-center {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 24px;
      padding: 8px 15px;
      border-bottom: 1px solid #111;
    }
    .header-logo-container {
      flex-shrink: 0;
    }
    .shop-details {
      text-align: center;
    }
    .shop-name {
      font-size: 24px;
      font-weight: 700;
      color: #1a3a7a;
      margin-bottom: 3px;
      text-transform: capitalize;
    }
    .shop-address {
      color: #c0392b;
      font-size: 12px;
      line-height: 1.3;
      margin-bottom: 2px;
    }
    .shop-phone {
      color: #1a3a7a;
      font-size: 13px;
      font-weight: 600;
    }

    .customer-section {
      padding: 10px 12px;
      border-bottom: 1px solid #111;
    }
    .customer-line {
      margin-bottom: 6px;
      color: #1a3a7a;
      font-weight: 700;
      font-size: 13px;
    }
    .underline-field {
      display: inline-block;
      min-width: 70%;
      border-bottom: 1px solid #111;
      padding-bottom: 1px;
      margin-left: 4px;
    }

    table.items {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    table.items th,
    table.items td {
      border: 1px solid #111;
      padding: 6px 8px;
      vertical-align: middle;
    }
    table.items thead th {
      background: #d8d0e8;
      color: #1a3a7a;
      font-weight: 700;
      text-align: center;
      font-size: 13px;
    }
    .col-item { width: 55%; text-align: left; }
    .col-qty { width: 15%; text-align: center; }
    .col-rate { width: 15%; text-align: center; }
    .col-total { width: 15%; text-align: center; }

    .summary {
      border-top: 1px solid #111;
      background: #f4c7b8;
    }
    .summary table {
      width: 100%;
      border-collapse: collapse;
    }
    .summary td {
      border: 1px solid #111;
      padding: 6px 10px;
      color: #1a3a7a;
      font-weight: 700;
      font-size: 13px;
    }
    .summary .label { width: 50%; }
    .summary .value { width: 50%; text-align: center; }
    .summary .balance-value { color: #1a3a7a; font-size: 14px; }

    .terms-row {
      padding: 10px 12px;
      border-top: 1px solid #111;
      background: #fff;
    }
    .terms-row .terms {
      color: #c0392b;
      font-size: 11px;
      font-weight: 600;
    }

    .footer-bar {
      background: #b8b8b8;
      min-height: 32px;
      border-top: 1px solid #111;
    }
  </style>
</head>
<body>
  <div class="invoice-wrap">
    <div class="top-row blue bold">
      <div class="date-col">
        <span>Date : ${formatDate(date)}</span>
        
      </div>
      <div class="bill-no-col">
        <span>Bill No. : <span class="bill-no-value">${escapeHtml(billNumber || '-')}</span></span>
      </div>
    </div>

    <div class="header-center">
      <div class="header-logo-container">
        <img class="invoice-logo" src="data:image/png;base64,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" alt="Logo" />
      </div>
      <div class="shop-details">
        <div class="shop-name">${escapeHtml(resolvedShopName)}</div>
        <div class="shop-address">${escapeHtml(resolvedShopAddress)}</div>
        <div class="shop-phone">${escapeHtml(resolvedPhones)}</div>
      </div>
    </div>

    <div class="customer-section">
      <p class="customer-line">
        Name : <span class="underline-field">${escapeHtml(customerDisplay)}</span>
      </p>
      <p class="customer-line">
        Ph. No. : <span class="underline-field">${escapeHtml(customerPhone || '-')}</span>
      </p>
    </div>

    <table class="items">
      <thead>
        <tr>
          <th class="col-item">Item</th>
          <th class="col-qty">Qty.</th>
          <th class="col-rate">Rate</th>
          <th class="col-total">Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div class="summary">
      <table>
        <tr>
          <td class="label">Total Qty. : ${money(totalQty)}</td>
          <td class="value">Total : ${money(totalAmount)}</td>
        </tr>
        <tr>
          <td class="label">Discount : ${money(discountPercent)}%</td>
          <td class="value">GST % : ${money(gstPercent)}%</td>
        </tr>
        <tr>
          <td class="label">Received :</td>
          <td class="value">${money(receivedAmount)}</td>
        </tr>
        <tr>
          <td class="label">Balance :</td>
          <td class="value balance-value">${money(balanceAmount)}</td>
        </tr>
      </table>
    </div>

    <div class="terms-row">
      <div class="terms">${escapeHtml(termsAndConditions || 'Add Your Terms and Conditions Here')}</div>
    </div>

    <div class="footer-bar"></div>
  </div>
</body>
</html>`;
};
