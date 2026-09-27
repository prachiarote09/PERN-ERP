const express = require("express");

const {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotationStatus,
} = require("../controllers/quotationController");

const {
  authenticateToken,
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/",
  authenticateToken,
  requireRole("ADMIN", "SALES_USER"),
  createQuotation
);

router.get(
  "/",
  authenticateToken,
  requireRole("ADMIN", "SALES_USER"),
  getQuotations
);
router.patch(
  "/:id/status",
  authenticateToken,
  requireRole("ADMIN", "SALES_USER"),
  updateQuotationStatus
);
router.get(
  "/:id",
  authenticateToken,
  requireRole("ADMIN", "SALES_USER"),
  getQuotationById
);

module.exports = router;