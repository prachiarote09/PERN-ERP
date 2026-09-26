const express = require("express");

const {
  createCustomer,
  getCustomers,
  getCustomerById,
} = require("../controllers/customerController");

const {
  authenticateToken,
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

// ADMIN + SALES_USER can create customers
router.post(
  "/",
  authenticateToken,
  requireRole("ADMIN", "SALES_USER"),
  createCustomer
);

// ADMIN + SALES_USER can view customers
router.get(
  "/",
  authenticateToken,
  requireRole("ADMIN", "SALES_USER"),
  getCustomers
);

// ADMIN + SALES_USER can view a customer
router.get(
  "/:id",
  authenticateToken,
  requireRole("ADMIN", "SALES_USER"),
  getCustomerById
);

module.exports = router;