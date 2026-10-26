
const paymentService = require("../services/paymentService");

const createPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.createPayment(
      req.params.id,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: { payment },
    });
  } catch (error) {
    return next(error);
  }
};

const getInvoicePayments = async (req, res, next) => {
  try {
    const result = await paymentService.getInvoicePayments(
      req.params.id,
      req.validatedQuery || req.query
    );

    return res.status(200).json({
      success: true,
      message: "Invoice payments retrieved successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const getPayments = async (req, res, next) => {
  try {
    const result = await paymentService.getPayments(
      req.validatedQuery || req.query
    );

    return res.status(200).json({
      success: true,
      message: "Payments retrieved successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createPayment,
  getInvoicePayments,
  getPayments,
};
