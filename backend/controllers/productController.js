const prisma = require("../utils/prisma");

const createProduct = async (req, res) => {
  try {
    const {
      code,
      name,
      category,
      unit,
      basePrice,
    } = req.body;

    if (!code || !name || !category || !unit || basePrice === undefined) {
      return res.status(400).json({
        message: "Code, name, category, unit and basePrice are required",
      });
    }

    if (Number(basePrice) < 0) {
      return res.status(400).json({
        message: "Base price cannot be negative",
      });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { code },
    });

    if (existingProduct) {
      return res.status(409).json({
        message: "Product code already exists",
      });
    }

    const product = await prisma.product.create({
      data: {
        code,
        name,
        category,
        unit,
        basePrice: Number(basePrice),
      },
    });

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create product",
    });
  }
};

const getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        inventory: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    res.json({
      products,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch products",
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const productId = Number(req.params.id);

    if (Number.isNaN(productId)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      include: {
        inventory: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json({
      product,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch product",
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
};