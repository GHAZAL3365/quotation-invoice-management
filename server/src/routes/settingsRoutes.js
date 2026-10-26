const express = require("express");
const authenticate = require("../middleware/authenticate");
const authorizeRoles = require("../middleware/authorizeRoles");

const router = express.Router();

let appSettings = {
  general: {
    yearStart: "01 Apr",
    yearEnd: "31 Mar",
    predefinedLineItems: [
      { qty: 1, title: ".com/.in Domain Registration Charges per year", rate: 1600, description: "Domain Registration Per Year" },
      { qty: 1, title: "Hosting Plan for 1 year", rate: 2500, description: "Web Hosting Space for 1 year" },
      { qty: 1, title: "SSL Certificate for 1 Year", rate: 1200, description: "SSL Certificate for 1 Year" },
      { qty: 1, title: "Website Design & Development", rate: 25000, description: "Custom WordPress / React Application" },
      { qty: 1, title: "Employee Transfer from Ultrakey to Sainbiz One Time Service Fee", rate: 25000, description: "One Time Service Fee" },
      { qty: 1, title: "Hosting Plan Renewal for 1 Year", rate: 55000, description: "Enterprise Hosting Plan Renewal" },
      { qty: 1, title: "Security Audit & Optimization", rate: 15000, description: "Full stack security and speed audit" }
    ]
  },
  business: {
    logo: "",
    businessName: "Ultrakey IT Solutions Private Limited",
    address: "Flat No. 204, 2nd Floor, Cyber Residency, Indira Nagar, Gachibowli, Hyderabad, Telangana, India-500032",
    taxId: "36AADCU5062A1Z0",
    email: "support@ultrakeyit.com",
    phone: "+91 63004 40316",
    website: "https://ultrakeyit.com",
    extraInfo: "GST No: 36AADCU5062A1Z0"
  },
  quotation: {
    prefix: "AKEYQ-",
    suffix: "",
    autoIncrement: true,
    nextNumber: "52",
    validDays: 15,
    hideAdjustField: false,
    terms: "This is a fixed price quote. If accepted, we require a 60% deposit upfront before work commences.",
    footer: "Thanks for choosing Ultrakey IT Solutions Private Limited | support@ultrakeyit.com",
    acceptQuoteButton: true,
    acceptQuoteAction: "Convert Quote to Invoice and send to client",
    acceptQuoteText: "Please Note: After accepting this Quote an Invoice will be automatically generated. This will then become a legally binding contract.",
    declineReasonRequired: true,
    template: "template1"
  },
  invoice: {
    prefix: "AKEYI-",
    suffix: "",
    autoIncrement: true,
    nextNumber: "0126",
    dueDays: 14,
    hideAdjustField: false,
    terms: "Payment is due within 14 days from date of invoice. Late payment is subject to fees of 5% per month.\n\nPayment Methods:\n- 60% Advance Payment for Commencement\n- Remaining 40% Final Settlement",
    footer: "Thanks for choosing Ultrakey IT Solutions Private Limited | support@ultrakeyit.com",
    template: "template2"
  },
  payments: {
    currencySymbol: "₹",
    currencyPosition: "Left",
    thousandSeparator: ",",
    decimalSeparator: ".",
    decimals: 2,
    bankDetails: "Account Number: 50200092611852\nName: Ultrakey IT Solutions Pvt. Ltd.\nIFSC: HDFC0000968\nBranch: GACHIBOWLI",
    genericPayment: "Pay invoice via Gpay (or) Phonepe Number: 6300440316\nor Online Payment through Razorpay"
  },
  tax: {
    pricesEnteredWithTax: false,
    taxPercentage: 18,
    taxName: "GST (18%)"
  },
  emails: {
    emailAddress: "support@ultrakeyit.com",
    emailName: "Ultrakey IT Solutions Private Limited",
    bccClientEmails: true,
    quoteSubject: "New quote %number% available",
    invoiceSubject: "New invoice %number% available",
    paymentSubject: "Thanks for your payment"
  },
  translate: {
    quoteLabel: "Quote",
    quoteLabelPlural: "Quotes",
    invoiceLabel: "Invoice",
    invoiceLabelPlural: "Invoices",
    hrsQty: "Hrs/Qty",
    service: "Service",
    ratePrice: "Rate/Price",
    adjust: "Adjust",
    subTotal: "Sub Total",
    discount: "Discount",
    total: "Total",
    totalDue: "Total Due"
  }
};

router.use(authenticate, authorizeRoles("admin"));

router.get("/", (req, res) => {
  return res.json({
    success: true,
    data: appSettings,
  });
});

router.put("/", (req, res) => {
  if (req.body && typeof req.body === "object") {
    appSettings = {
      ...appSettings,
      ...req.body,
    };
  }
  return res.json({
    success: true,
    message: "Settings updated successfully",
    data: appSettings,
  });
});

module.exports = router;
