
const express = require("express");
const router = express.Router();

const quotationController = require("../controllers/quotationController");
const validateRequest = require("../validators/validateRequest");
const authenticate = require("../middleware/authenticate");
const authorizeRoles = require("../middleware/authorizeRoles");
const scopeToClient = require("../middleware/scopeToClient");
const requireCsrfToken = require("../middleware/requireCsrfToken");
const {
  createQuotationSchema,
  updateQuotationSchema,
  quotationIdSchema,
  listQuotationsQuerySchema,
} = require("../validators/quotationValidator");


router.use(authenticate);

// Keep the PDF route before the generic ID route.
router.get(
    "/:id/pdf",
    scopeToClient,
    validateRequest(quotationIdSchema, "params"),
    quotationController.downloadQuotationPdf
);

router.get("/", scopeToClient, quotationController.getQuotations);

router.post(
    "/",
    authorizeRoles("admin"),
    requireCsrfToken,
    validateRequest(createQuotationSchema),
    quotationController.createQuotation
);



router.get("/:id", scopeToClient, validateRequest(quotationIdSchema, "params"), quotationController.getQuotationById);

router.patch(
    "/:id",
    authorizeRoles("admin"),
    requireCsrfToken,
    validateRequest(quotationIdSchema, "params"),
    validateRequest(updateQuotationSchema),
    quotationController.updateQuotation
);

router.delete(
    "/:id",
    authorizeRoles("admin"),
    requireCsrfToken,
    validateRequest(quotationIdSchema, "params"),
    quotationController.deleteQuotation
);

module.exports = router;
