const express = require("express");

const {
  createEnquiry,
  getEnquiries,
  getEnquiryById,
} = require("../controllers/enquiryController");

const {
  authenticateToken,
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/",
  authenticateToken,
  requireRole("ADMIN", "SALES_USER"),
  createEnquiry
);

router.get(
  "/",
  authenticateToken,
  requireRole("ADMIN", "SALES_USER"),
  getEnquiries
);

router.get(
  "/:id",
  authenticateToken,
  requireRole("ADMIN", "SALES_USER"),
  getEnquiryById
);

module.exports = router;