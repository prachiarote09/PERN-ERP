const express = require("express");

const {
  createInventory,
  getInventory,
  updateInventory,
} = require("../controllers/inventoryController");

const {
  authenticateToken,
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

// ADMIN can create inventory
router.post(
  "/",
  authenticateToken,
  requireRole("ADMIN"),
  createInventory
);

// ADMIN + SALES_USER can view inventory
router.get(
  "/",
  authenticateToken,
  getInventory
);

// ADMIN can update physical quantity
router.patch(
  "/:productId",
  authenticateToken,
  requireRole("ADMIN"),
  updateInventory
);

module.exports = router;