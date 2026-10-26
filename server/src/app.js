const path = require("path");
const fs = require("fs");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const healthRoutes = require("./routes/healthRoutes");
const clientRoutes = require("./routes/clientRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const authRoutes = require("./routes/authRoutes");
const quotationRoutes = require("./routes/quotationRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const notFoundMiddleware = require("./middleware/notFound");
const errorHandlerMiddleware = require("./middleware/errorHandler");

const app = express();

app.disable("x-powered-by");

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    frameguard: false,
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

// API routes
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/clients", clientRoutes);
app.use("/api/v1/invoices", invoiceRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/quotations", quotationRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/settings", settingsRoutes);

// Database offline graceful fallback error handler per web.md
app.use((err, req, res, next) => {
  if (
    err.name === "MongooseError" ||
    err.name === "MongoNetworkError" ||
    (err.message && err.message.includes("buffering timed out"))
  ) {
    console.warn("[AI Studio] Database offline — returning mock empty response");
    if (req.method === "GET") {
      return res.json(req.path.endsWith("s") || req.path.endsWith("s/") ? [] : {});
    }
    return res.status(503).json({ error: "Service temporarily unavailable (database offline)" });
  }
  next(err);
});

// Serve frontend static assets from client/dist if built
const clientDistPath = path.resolve(__dirname, "../../client/dist");
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api")) {
      const indexPath = path.join(clientDistPath, "index.html");
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
    }
    next();
  });
}

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

module.exports = app;