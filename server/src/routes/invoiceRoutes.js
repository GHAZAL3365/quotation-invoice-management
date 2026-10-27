const express = require("express");
const validateRequest = require("../validators/validateRequest");
const authenticate = require("../middleware/authenticate");
const authorizeRoles = require("../middleware/authorizeRoles");
const scopeToClient = require("../middleware/scopeToClient");
const requireCsrfToken = require("../middleware/requireCsrfToken");
const{getInvoicePayments,createPayment} = require("../controllers/paymentController");
const { createPaymentSchema, paymentIdParamsSchema } = require("../validators/paymentValidator");
const {
  createInvoiceSchema,
  updateInvoiceSchema,
  invoiceIdSchema,
  listInvoicesQuerySchema,
} = require("../validators/invoiceValidator");
const {downloadInvoicePdf} = require("../controllers/invoicePdfController");

const {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice
} = require("../controllers/invoiceController");

const router = express.Router();

router.post("/", authenticate, authorizeRoles("admin"), validateRequest(createInvoiceSchema), createInvoice);
router.get(
  "/",
  authenticate,
  scopeToClient,
  validateRequest(listInvoicesQuerySchema, "query"),
  getInvoices
);
router.get("/:id", authenticate, scopeToClient, validateRequest(invoiceIdSchema, "params"), getInvoiceById);
router.put("/:id", authenticate, authorizeRoles("admin"), validateRequest(invoiceIdSchema, "params"), validateRequest(updateInvoiceSchema), updateInvoice);
router.delete("/:id", authenticate, authorizeRoles("admin"), validateRequest(invoiceIdSchema, "params"), deleteInvoice);


// Record a payment against an invoice
router.post(
  "/:id/payments",
  authenticate,
  authorizeRoles("admin"),
  // requireCsrfToken,
  validateRequest(paymentIdParamsSchema, "params"),
  validateRequest(createPaymentSchema, "body"),
  createPayment
);

// Get payment history for an invoice
router.get(
  "/:id/payments",
  authenticate,
  authorizeRoles("admin"),
  validateRequest(paymentIdParamsSchema, "params"),
  getInvoicePayments
);
router.get(
  "/:id/pdf",
  authenticate,
  scopeToClient,
  validateRequest(invoiceIdSchema, "params"),
  downloadInvoicePdf
);

module.exports = router;