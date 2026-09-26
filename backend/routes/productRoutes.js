const express = require("express");

const {
  createProduct,
  getProducts,
  getProductById,
} = require("../controllers/productController");

const {
  authenticateToken,
  requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/",
  authenticateToken,
  requireRole("ADMIN"),
  createProduct
);

router.get(
  "/",
  authenticateToken,
  getProducts
);

router.get(
  "/:id",
  authenticateToken,
  getProductById
);

module.exports = router;