
const quotationService = require("../services/quotationService");
const {
  generateQuotationPdf,
} = require("../services/quotationPdfService");

// Create quotation
exports.createQuotation = async (req, res, next) => {
  try {
    const quotation = await quotationService.createQuotation(req.body);

    return res.status(201).json({
      success: true,
      message: "Quotation created successfully",
      data: quotation,
    });
  } catch (error) {
    next(error);
  }
};

// Get all quotations
exports.getQuotations = async (req, res, next) => {
  try {
    const result = await quotationService.getQuotations(
      {
        ...(req.validatedQuery || req.query),
        ...(req.clientId ? { clientId: req.clientId } : {}),
      }
    );

    return res.status(200).json({
      success: true,
      message: "Quotations retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Get quotation by ID
exports.getQuotationById = async (req, res, next) => {
  try {
    const quotation = await quotationService.getQuotationById(
      req.params.id,
      req.clientId
    );

    return res.status(200).json({
      success: true,
      message: "Quotation retrieved successfully",
      data: quotation,
    });
  } catch (error) {
    next(error);
  }
};

// Update quotation
exports.updateQuotation = async (req, res, next) => {
  try {
    const quotation = await quotationService.updateQuotation(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Quotation updated successfully",
      data: quotation,
    });
  } catch (error) {
    next(error);
  }
};

// Delete quotation
exports.deleteQuotation = async (req, res, next) => {
  try {
    await quotationService.deleteQuotation(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Quotation deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Download quotation PDF
exports.downloadQuotationPdf = async (req, res, next) => {
  try {
    const quotation = await quotationService.getQuotationById(
      req.params.id,
      req.clientId
    );

    const pdfBuffer = await generateQuotationPdf(req.params.id);

    const filename = `${quotation.quotationNumber}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    return res.status(200).send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};
