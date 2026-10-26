
// Puppeteer stripped per AI Studio container guidelines
// const puppeteer = require("puppeteer");
const quotationService = require("./quotationService");

const COMPANY = {
  name: "Ultrakey IT Solutions Private Limited",
  email: "support@ultrakeyit.com",
  website: "www.ultrakeyit.com",
  phone: "+91 63004 40316",
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatDate = (value) => {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));

function buildQuotationHtml(quotation) {
  const client =
    quotation.clientId && typeof quotation.clientId === "object"
      ? quotation.clientId
      : {};

  const rows = quotation.items
    .map(
      (item, index) => `
        <tr>
          <td class="center">${index + 1}</td>
          <td>${escapeHtml(item.description)}</td>
          <td class="right">${Number(item.quantity)}</td>
          <td class="right">${formatMoney(item.rate)}</td>
          <td class="right">${formatMoney(item.amount)}</td>
        </tr>
      `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(quotation.quotationNumber)}</title>
        <style>
          @page {
            size: A4;
            margin: 18mm 15mm 20mm;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            color: #243449;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12px;
            line-height: 1.5;
          }

          .top-band {
            height: 8px;
            background: #203b5b;
            margin-bottom: 28px;
          }

          .header {
            display: flex;
            justify-content: space-between;
            gap: 28px;
            align-items: flex-start;
            padding-bottom: 22px;
            border-bottom: 1px solid #dce5ee;
          }

          .company-name {
            color: #203b5b;
            font-size: 21px;
            font-weight: 700;
            margin: 0 0 8px;
          }

          .muted {
            color: #64748b;
          }

          .quotation-label {
            color: #203b5b;
            font-size: 26px;
            font-weight: 800;
            letter-spacing: 1px;
            margin: 0;
            text-align: right;
          }

          .quote-number {
            margin-top: 7px;
            text-align: right;
            font-weight: 700;
          }

          .details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 26px 0;
          }

          .panel {
            background: #eef3f8;
            border-radius: 5px;
            padding: 15px;
            min-height: 115px;
          }

          .panel-title {
            color: #597b9b;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1px;
            margin-bottom: 9px;
            text-transform: uppercase;
          }

          .strong {
            font-weight: 700;
            color: #203b5b;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }

          thead {
            display: table-header-group;
          }

          th {
            background: #203b5b;
            color: white;
            padding: 11px 8px;
            font-size: 10px;
            text-align: left;
          }

          td {
            border-bottom: 1px solid #e2e8f0;
            padding: 11px 8px;
            vertical-align: top;
            overflow-wrap: anywhere;
          }

          tbody tr:nth-child(even) {
            background: #f8fafc;
          }

          .right {
            text-align: right;
            white-space: nowrap;
          }

          .center {
            text-align: center;
          }

          .summary {
            width: 55%;
            margin-left: auto;
            margin-top: 22px;
          }

          .summary-row {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            padding: 6px 0;
          }

          .grand-total {
            border-top: 2px solid #203b5b;
            margin-top: 8px;
            padding-top: 12px;
            font-size: 16px;
            font-weight: 800;
            color: #203b5b;
          }

          .notes {
            margin-top: 30px;
            padding: 15px;
            border: 1px solid #dce5ee;
            border-radius: 5px;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
          }

          .footer {
            margin-top: 36px;
            padding-top: 14px;
            border-top: 1px solid #dce5ee;
            text-align: center;
            color: #64748b;
            font-size: 10px;
          }

          .validity {
            margin-top: 8px;
            padding: 8px 10px;
            background: #eef3f8;
            border-radius: 4px;
          }
        </style>
      </head>

      <body>
        <div class="top-band"></div>

        <header class="header">
          <div>
            <h1 class="company-name">${escapeHtml(COMPANY.name)}</h1>
            <div class="muted">${escapeHtml(COMPANY.email)}</div>
            <div class="muted">${escapeHtml(COMPANY.website)}</div>
            <div class="muted">${escapeHtml(COMPANY.phone)}</div>
          </div>

          <div>
            <h2 class="quotation-label">QUOTATION</h2>
            <div class="quote-number">
              ${escapeHtml(quotation.quotationNumber)}
            </div>
            <div class="muted" style="text-align:right;margin-top:5px">
              Status: ${escapeHtml(quotation.status)}
            </div>
          </div>
        </header>

        <section class="details">
          <div class="panel">
            <div class="panel-title">Quotation for</div>
            <div class="strong">${escapeHtml(client.clientName || "Client")}</div>
            ${client.email ? `<div>${escapeHtml(client.email)}</div>` : ""}
            ${client.phone ? `<div>${escapeHtml(client.phone)}</div>` : ""}
            ${
              client.billingAddress
                ? `<div style="margin-top:6px">${escapeHtml(client.billingAddress)}</div>`
                : ""
            }
            ${
              client.taxId
                ? `<div style="margin-top:6px">Tax ID: ${escapeHtml(client.taxId)}</div>`
                : ""
            }
          </div>

          <div class="panel">
            <div class="panel-title">Quotation details</div>
            <div>
              <span class="muted">Quotation date:</span>
              <span class="strong">${formatDate(quotation.quotationDate)}</span>
            </div>
            <div style="margin-top:8px">
              <span class="muted">Valid until:</span>
              <span class="strong">${formatDate(quotation.validUntil)}</span>
            </div>
            <div class="validity">
              This quotation is valid until the date shown above.
            </div>
          </div>
        </section>

        <table>
          <thead>
            <tr>
              <th style="width:7%">#</th>
              <th>Description</th>
              <th style="width:13%;text-align:right">Qty</th>
              <th style="width:18%;text-align:right">Rate</th>
              <th style="width:20%;text-align:right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <section class="summary">
          <div class="summary-row">
            <span class="muted">Subtotal</span>
            <span>${formatMoney(quotation.subtotal)}</span>
          </div>
          <div class="summary-row">
            <span class="muted">Discount</span>
            <span>${formatMoney(quotation.discount)}</span>
          </div>
          <div class="summary-row">
            <span class="muted">Tax (${Number(quotation.taxRate)}%)</span>
            <span>${formatMoney(quotation.taxAmount)}</span>
          </div>
          <div class="summary-row grand-total">
            <span>Total</span>
            <span>${formatMoney(quotation.total)}</span>
          </div>
        </section>

        ${
          quotation.notes
            ? `<section class="notes">
                <div class="strong" style="margin-bottom:6px">Notes and terms</div>
                ${escapeHtml(quotation.notes)}
              </section>`
            : ""
        }

        <footer class="footer">
          ${escapeHtml(COMPANY.email)} |
          ${escapeHtml(COMPANY.website)} |
          Contact No: ${escapeHtml(COMPANY.phone)}
        </footer>
      </body>
    </html>
  `;
}

function createMinimalPdf(title, lines = []) {
  const textCmds = lines
    .map((line, i) => `${i === 0 ? "" : "0 -16 Td "}(${String(line).replace(/[()\\]/g, "")}) Tj`)
    .join("\n");
  const streamContent = `BT /F1 11 Tf 50 740 Td (${title}) Tj\n0 -24 Td\n${textCmds}\nET`;
  const stream = `<< /Length ${Buffer.byteLength(streamContent)} >>\nstream\n${streamContent}\nendstream`;
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj",
    `4 0 obj\n${stream}\nendobj`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj"
  ];
  let offset = 9;
  let body = "%PDF-1.4\n";
  let xref = "xref\n0 6\n0000000000 65535 f \n";
  for (const obj of objects) {
    xref += String(offset).padStart(10, "0") + " 00000 n \n";
    body += obj + "\n";
    offset += Buffer.byteLength(obj) + 1;
  }
  const startxref = offset;
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF`;
  return Buffer.from(body + xref + trailer);
}

async function generateQuotationPdf(id) {
  const quotation = await quotationService.getQuotationById(id);
  const quoteNumber = quotation?.quotationNumber || id || "QUOTE";
  return createMinimalPdf(`QUOTATION: ${quoteNumber}`, [
    `Total: INR ${quotation?.total || 0}`,
    `Status: ${quotation?.status || "Draft"}`,
    `Quotation Date: ${quotation?.quotationDate ? new Date(quotation.quotationDate).toLocaleDateString() : "-"}`,
    `Valid Until: ${quotation?.validUntil ? new Date(quotation.validUntil).toLocaleDateString() : "-"}`,
    `Generated by Quotation & Invoice Management System`
  ]);
}

module.exports = {
  generateQuotationPdf,
};
