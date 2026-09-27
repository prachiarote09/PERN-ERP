const express = require("express");

const {
  createSalesOrder,
  getSalesOrders,
  getSalesOrderById,
} = require("../controllers/salesOrderController");

const {
  authenticateToken,
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/from-quotation/:quotationId",
  authenticateToken,
  requireRole("ADMIN", "SALES_USER"),
  createSalesOrder
);

router.get(
  "/",
  authenticateToken,
  requireRole("ADMIN", "SALES_USER"),
  getSalesOrders
);

router.get(
  "/:id",
  authenticateToken,
  requireRole("ADMIN", "SALES_USER"),
  getSalesOrderById
);

module.exports = router;