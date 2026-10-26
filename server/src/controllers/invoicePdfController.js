
const invoicePdfService = require("../services/invoicePdfService");

const downloadInvoicePdf = async (req, res, next) => {
  try {
    const { pdfBuffer, invoiceNumber } =
      await invoicePdfService.generateInvoicePdf(req.params.id, req.clientId);

    const safeInvoiceNumber = String(invoiceNumber).replace(
      /[^a-zA-Z0-9_-]/g,
      "_"
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoice-${safeInvoiceNumber}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader("Cache-Control", "private, no-store");

    return res.status(200).send(pdfBuffer);
  } catch (error) {
    return next(error);
  }
};

module.exports = { downloadInvoicePdf };
