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
  const minRows = Math.max(8, safeItems.length);
  const paddedItems = [...safeItems];
  while (paddedItems.length < minRows) {
    paddedItems.push({ name: '', quantity: '', rate: '', total: '' });
  }

  const resolvedShopName = shopName || 'Skyla Organic & Herbal';
  const resolvedShopAddress =
    shopAddress || 'At Bhoisamudraga, Post Harangul Bk Latur Maharashtra Pin 413531';
  const resolvedPhones = [shopPhone, shopPhone2].filter(Boolean).join('/') || '9970603386/9970338001';

  const customerDisplay = customerAddress
    ? `${customerName || '-'} ( ${customerAddress}`
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
    @page { size: A4; margin: 6mm; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .invoice-wrap { width: 100%; max-width: none; margin: 0; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #111;
      background: #fff;
      font-size: 13px;
      line-height: 1.35;
    }
    .invoice-wrap {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
      border: 2px solid #111;
    }
    .blue { color: #1a3a7a; }
    .red { color: #c0392b; }
    .bold { font-weight: 700; }

    .top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px 6px;
      font-size: 13px;
      border-bottom: 1px solid #111;
    }
    .bill-no-value { color: #c0392b; font-weight: 700; font-size: 15px; }

    .header-center {
      text-align: center;
      padding: 6px 12px 10px;
      border-bottom: 1px solid #111;
    }
    .shop-name {
      font-size: 24px;
      font-weight: 700;
      color: #1a3a7a;
      margin-bottom: 4px;
      text-transform: capitalize;
    }
    .shop-address {
      color: #c0392b;
      font-size: 12px;
      line-height: 1.4;
      margin-bottom: 2px;
    }
    .shop-phone {
      color: #1a3a7a;
      font-size: 13px;
      font-weight: 600;
    }

    .customer-section {
      padding: 8px 12px;
      border-bottom: 1px solid #111;
    }
    .customer-line {
      margin-bottom: 6px;
      color: #1a3a7a;
      font-weight: 700;
    }
    .underline-field {
      display: inline-block;
      min-width: 70%;
      border-bottom: 1.5px solid #111;
      padding-bottom: 2px;
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
      padding: 5px 6px;
      vertical-align: middle;
    }
    table.items thead th {
      background: #d8d0e8;
      color: #1a3a7a;
      font-weight: 700;
      text-align: center;
      font-size: 13px;
    }
    .col-item { width: 48%; text-align: left; }
    .col-qty { width: 14%; text-align: center; }
    .col-rate { width: 19%; text-align: center; }
    .col-total { width: 19%; text-align: center; }

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
      padding: 7px 10px;
      color: #1a3a7a;
      font-weight: 700;
      font-size: 13px;
    }
    .summary .label { width: 50%; }
    .summary .value { width: 50%; text-align: center; }
    .summary .balance-value { color: #1a3a7a; font-size: 14px; }

    .terms-row {
      padding: 8px 12px;
      border-top: 1px solid #111;
      background: #fff;
    }
    .terms-row .terms {
      color: #c0392b;
      font-size: 13px;
      font-weight: 600;
    }

    .footer-bar {
      background: #b8b8b8;
      min-height: 42px;
      border-top: 1px solid #111;
    }
  </style>
</head>
<body>
  <div class="invoice-wrap">
    <div class="top-row blue bold">
      <span>Date : ${formatDate(date)}</span>
      <span>Bill No. : <span class="bill-no-value">${escapeHtml(billNumber || '-')}</span></span>
    </div>

    <div class="header-center">
      <div class="shop-name">${escapeHtml(resolvedShopName)}</div>
      <div class="shop-address">${escapeHtml(resolvedShopAddress)}</div>
      <div class="shop-phone">${escapeHtml(resolvedPhones)}</div>
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
