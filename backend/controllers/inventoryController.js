const prisma = require("../utils/prisma");

const createInventory = async (req, res) => {
  try {
    const { productId, physicalQty } = req.body;

    if (!productId || physicalQty === undefined) {
      return res.status(400).json({
        message: "productId and physicalQty are required",
      });
    }

    const product = await prisma.product.findUnique({
      where: {
        id: Number(productId),
      },
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if (Number(physicalQty) < 0) {
      return res.status(400).json({
        message: "Physical quantity cannot be negative",
      });
    }

    const existingInventory = await prisma.inventory.findUnique({
      where: {
        productId: Number(productId),
      },
    });

    if (existingInventory) {
      return res.status(409).json({
        message: "Inventory already exists for this product",
      });
    }

    const inventory = await prisma.inventory.create({
      data: {
        productId: Number(productId),
        physicalQty: Number(physicalQty),
        reservedQty: 0,
      },
      include: {
        product: true,
      },
    });

    res.status(201).json({
      message: "Inventory created successfully",
      inventory,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create inventory",
    });
  }
};

const getInventory = async (req, res) => {
  try {
    const inventory = await prisma.inventory.findMany({
      include: {
        product: true,
      },
      orderBy: {
        productId: "asc",
      },
    });

    const result = inventory.map((item) => ({
      ...item,
      availableQty: item.physicalQty - item.reservedQty,
    }));

    res.json({
      inventory: result,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch inventory",
    });
  }
};

const updateInventory = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const { physicalQty } = req.body;

    if (Number.isNaN(productId)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    if (physicalQty === undefined) {
      return res.status(400).json({
        message: "physicalQty is required",
      });
    }

    if (Number(physicalQty) < 0) {
      return res.status(400).json({
        message: "Physical quantity cannot be negative",
      });
    }

    const inventory = await prisma.inventory.findUnique({
      where: {
        productId,
      },
    });

    if (!inventory) {
      return res.status(404).json({
        message: "Inventory not found",
      });
    }

    if (Number(physicalQty) < inventory.reservedQty) {
      return res.status(400).json({
        message:
          "Physical quantity cannot be less than reserved quantity",
      });
    }

    const updatedInventory = await prisma.inventory.update({
      where: {
        productId,
      },
      data: {
        physicalQty: Number(physicalQty),
      },
      include: {
        product: true,
      },
    });

    res.json({
      message: "Inventory updated successfully",
      inventory: {
        ...updatedInventory,
        availableQty:
          updatedInventory.physicalQty -
          updatedInventory.reservedQty,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update inventory",
    });
  }
};

module.exports = {
  createInventory,
  getInventory,
  updateInventory,
};