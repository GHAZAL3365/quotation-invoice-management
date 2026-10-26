
const invoiceService = require("../services/invoiceService");

const createInvoice = async (req, res) => {
    const invoice = await invoiceService.createInvoice(req.body);

    return res.status(201).json({
        success: true,
        message: "Invoice created successfully",
        data: invoice,
    });
};

const getInvoices = async (req, res, next) => {
  try {
    const result = await invoiceService.getInvoices(
      {
        ...(req.validatedQuery || req.query),
        ...(req.clientId ? { clientId: req.clientId } : {}),
      }
    );

    return res.status(200).json({
      success: true,
      message: "Invoices retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getInvoiceById = async (req, res) => {
    const invoice = await invoiceService.getInvoiceById(
        req.params.id,
        req.clientId
    );

    return res.status(200).json({
        success: true,
        message: "Invoice retrieved successfully",
        data: invoice,
    });
};


const updateInvoice = async (req, res) => {
    const invoice = await invoiceService.updateInvoice(
        req.params.id,
        req.body
    );

    return res.status(200).json({
        success: true,
        message: "Invoice updated successfully",
        data: invoice,
    });
};

const deleteInvoice = async (req, res) => {
    await invoiceService.deleteInvoice(req.params.id);

    return res.status(200).json({
        success: true,
        message: "Invoice deleted successfully",
    });
};


module.exports = {
    createInvoice,
    getInvoices,
    getInvoiceById,
    updateInvoice,
    deleteInvoice,
};
