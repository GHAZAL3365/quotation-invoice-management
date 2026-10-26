
const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });

const money = (value) => {
  const amount = Number(value ?? 0);

  return `INR ${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)}`;
};

const date = (value) => {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

const safe = (value, fallback = "—") =>
  escapeHtml(value == null || value === "" ? fallback : value);

const renderInvoiceTemplate = (invoice) => {
  const client = invoice.clientId || invoice.client || {};
  const items = Array.isArray(invoice.items) ? invoice.items : [];

  const total = Number(invoice.total || 0);
  const paidAmount = Number(invoice.paidAmount || 0);
  const balanceDue = Math.max(0, total - paidAmount);

  const companyName =
    process.env.COMPANY_NAME || "Ultrakey IT Solutions Private Limited";

  const logoPath = process.env.COMPANY_LOGO_PATH || "";

  // Logo paths are supplied by trusted server configuration, not invoice input.
  const logoHtml = logoPath
    ? `<div class="logo-placeholder">${safe(companyName)}</div>`
    : `<div class="logo-placeholder">${safe(companyName)}</div>`;

  const itemRows = items
    .map((item) => {
      const quantity = Number(item.quantity || 0);
      const rate = Number(item.rate || 0);
      const amount = Number(item.amount ?? quantity * rate);

      return `
        <tr>
          <td class="qty">${quantity}</td>
          <td>${safe(item.description)}</td>
          <td class="numeric">${money(rate)}</td>
          <td class="numeric">${money(amount)}</td>
        </tr>
      `;
    })
    .join("");

  const subtotal = Number(invoice.subtotal || 0);
  const discount = Number(invoice.discount || 0);
  const taxRate = Number(invoice.taxRate || 0);
  const taxAmount = Number(invoice.taxAmount || 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${safe(invoice.invoiceNumber)}</title>
  <style>
    @page {
      size: A4;
      margin: 14mm;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      color: #26374a;
      font-size: 10px;
      line-height: 1.45;
    }

    .top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #597b9b;
      padding-bottom: 12px;
      margin-bottom: 18px;
    }

    .logo-placeholder {
      color: #23618a;
      font-weight: bold;
      font-size: 17px;
      max-width: 60%;
    }

    .invoice-label {
      background: #597b9b;
      color: white;
      font-size: 20px;
      font-weight: bold;
      padding: 8px 18px;
      letter-spacing: 1px;
    }

    .details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }

    .panel {
      background: #597b9b;
      color: white;
      padding: 12px;
      min-height: 105px;
      overflow-wrap: anywhere;
    }

    .panel h3 {
      margin: 0 0 7px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: .5px;
    }

    .panel p {
      margin: 2px 0;
    }

    .meta {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
    }

    .meta th {
      background: #597b9b;
      color: white;
      text-align: left;
      padding: 7px;
    }

    .meta td {
      padding: 7px;
      border: 1px solid #d7e0e8;
    }

    table.items {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }

    .items thead {
      display: table-header-group;
    }

    .items th {
      background: #597b9b;
      color: white;
      text-align: left;
      padding: 8px 6px;
    }

    .items td {
      padding: 8px 6px;
      border-bottom: 1px solid #dbe3ea;
      overflow-wrap: anywhere;
    }

    .items tr {
      break-inside: avoid;
    }

    .numeric { text-align: right; white-space: nowrap; }
    .qty { text-align: center; width: 10%; }

    .bottom {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
      margin-top: 20px;
      break-inside: avoid;
    }

    .payment {
      background: #f0f3f6;
      padding: 12px;
      overflow-wrap: anywhere;
    }

    .payment h3 {
      margin: 0 0 8px;
      color: #315d80;
    }

    .totals {
      width: 100%;
      border-collapse: collapse;
    }

    .totals td {
      padding: 5px 2px;
      border-bottom: 1px solid #e1e6eb;
    }

    .totals td:last-child {
      text-align: right;
      white-space: nowrap;
    }

    .grand-total td {
      background: #597b9b;
      color: white;
      font-weight: bold;
      padding: 9px 6px;
    }

    .status {
      margin-top: 12px;
      padding: 8px;
      border: 1px solid #597b9b;
      color: #315d80;
      font-weight: bold;
      text-align: center;
    }

    .notes {
      margin-top: 18px;
      padding-top: 10px;
      border-top: 1px solid #d7e0e8;
      overflow-wrap: anywhere;
    }

    .footer {
      margin-top: 22px;
      padding-top: 10px;
      border-top: 1px solid #597b9b;
      color: #597b9b;
      text-align: center;
      font-size: 9px;
    }
  </style>
</head>
<body>
  <header class="top">
    ${logoHtml}
    <div class="invoice-label">INVOICE</div>
  </header>

  <section class="details">
    <div class="panel">
      <h3>From</h3>
      <p><strong>${safe(companyName)}</strong></p>
      <p>${safe(process.env.COMPANY_ADDRESS, "")}</p>
      <p>${safe(process.env.COMPANY_EMAIL, "")}</p>
      <p>${safe(process.env.COMPANY_PHONE, "")}</p>
      <p>${safe(process.env.COMPANY_TAX_ID, "")}</p>
    </div>

    <div class="panel">
      <h3>Bill To</h3>
      <p><strong>${safe(client.clientName)}</strong></p>
      <p>${safe(client.billingAddress, "")}</p>
      <p>${safe(client.email, "")}</p>
      <p>${safe(client.phone, "")}</p>
      <p>${safe(client.taxId, "")}</p>
    </div>
  </section>

  <table class="meta">
    <thead>
      <tr>
        <th>Invoice Number</th>
        <th>Invoice Date</th>
        <th>Due Date</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${safe(invoice.invoiceNumber)}</td>
        <td>${date(invoice.invoiceDate)}</td>
        <td>${date(invoice.dueDate)}</td>
      </tr>
    </tbody>
  </table>

  <table class="items">
    <thead>
      <tr>
        <th style="width:10%">Qty</th>
        <th style="width:42%">Service / Description</th>
        <th style="width:24%; text-align:right">Rate</th>
        <th style="width:24%; text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <section class="bottom">
    <div class="payment">
      <h3>Payment Information</h3>
      <p>Invoice: ${safe(invoice.invoiceNumber)}</p>
      <p>Payment status: ${safe(invoice.status)}</p>
      <p>Payment details can be confirmed with the company.</p>
    </div>

    <table class="totals">
      <tbody>
        <tr><td>Subtotal</td><td>${money(subtotal)}</td></tr>
        <tr><td>Discount</td><td>-${money(discount)}</td></tr>
        <tr><td>Tax (${taxRate}%)</td><td>${money(taxAmount)}</td></tr>
        <tr><td>Amount Paid</td><td>${money(paidAmount)}</td></tr>
        <tr class="grand-total"><td>Balance Due</td><td>${money(balanceDue)}</td></tr>
      </tbody>
    </table>
  </section>

  ${
    invoice.notes
      ? `<section class="notes"><strong>Notes</strong><p>${safe(invoice.notes)}</p></section>`
      : ""
  }

  <footer class="footer">
    Thank you for your business.
    ${process.env.COMPANY_EMAIL ? ` | ${safe(process.env.COMPANY_EMAIL)}` : ""}
    ${process.env.COMPANY_WEBSITE ? ` | ${safe(process.env.COMPANY_WEBSITE)}` : ""}
  </footer>
</body>
</html>`;
};

module.exports = renderInvoiceTemplate;
