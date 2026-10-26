const express = require("express");
const authenticate = require("../middleware/authenticate");
const authorizeRoles = require("../middleware/authorizeRoles");
const paymentController = require("../controllers/paymentController");
const paymentService = require("../services/paymentService");

const router = express.Router();

router.use(authenticate, authorizeRoles("admin"));

// Get all payments with optional filtering and pagination
router.get("/", paymentController.getPayments);

// Direct payment creation endpoint
router.post("/", async (req, res, next) => {
  try {
    const { invoiceId, amount, paymentDate, paymentMethod, reference, notes } = req.body;
    if (!invoiceId || !amount) {
      return res.status(400).json({ success: false, message: "invoiceId and amount are required" });
    }
    const payment = await paymentService.createPayment(invoiceId, {
      amount,
      paymentDate,
      paymentMethod,
      reference,
      notes,
    });
    return res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: { payment },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
