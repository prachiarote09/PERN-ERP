const express = require("express");

const {
  createDispatch,
  getDispatches,
  getDispatchById,
} = require("../controllers/dispatchController");

const {
  authenticateToken,
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/from-sales-order/:salesOrderId",
  authenticateToken,
  requireRole("ADMIN"),
  createDispatch
);

router.get(
  "/",
  authenticateToken,
  requireRole("ADMIN", "SALES_USER"),
  getDispatches
);

router.get(
  "/:id",
  authenticateToken,
  requireRole("ADMIN", "SALES_USER"),
  getDispatchById
);

module.exports = router;