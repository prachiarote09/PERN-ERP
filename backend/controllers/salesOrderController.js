const prisma = require("../utils/prisma");

const createSalesOrder = async (req, res) => {
  try {
    const quotationId = Number(req.params.quotationId);

    if (Number.isNaN(quotationId)) {
      return res.status(400).json({
        message: "Invalid quotation ID",
      });
    }

    // Fetch quotation with all required details
    const quotation = await prisma.quotation.findUnique({
      where: {
        id: quotationId,
      },
      include: {
        customer: true,
        items: true,
        salesOrder: true,
      },
    });

    if (!quotation) {
      return res.status(404).json({
        message: "Quotation not found",
      });
    }

    // Only ACCEPTED quotations can become Sales Orders
    if (quotation.status !== "ACCEPTED") {
      return res.status(400).json({
        message: "Only an ACCEPTED quotation can be converted to a Sales Order",
      });
    }

    // Prevent duplicate Sales Order
    if (quotation.salesOrder) {
      return res.status(409).json({
        message: "Sales Order already exists for this quotation",
        salesOrder: quotation.salesOrder,
      });
    }

    if (!quotation.items || quotation.items.length === 0) {
      return res.status(400).json({
        message: "Quotation has no items",
      });
    }

    const orderCount = await prisma.salesOrder.count();

    const orderNo = `SO-${String(orderCount + 1).padStart(4, "0")}`;

    const salesOrder = await prisma.$transaction(async (tx) => {
      const newSalesOrder = await tx.salesOrder.create({
        data: {
          orderNo,
          quotationId: quotation.id,
          customerId: quotation.customerId,
          createdById: req.user.userId,

          status: "PENDING",

          subtotal: quotation.subtotal,
          discountAmount: quotation.discountAmount,
          gstAmount: quotation.gstAmount,
          grandTotal: quotation.grandTotal,

          items: {
            create: quotation.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discountPct: item.discountPct,
              gstPct: item.gstPct,
              lineAmount: item.lineAmount,
            })),
          },
        },

        include: {
          customer: true,
          quotation: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      return newSalesOrder;
    });

    res.status(201).json({
      message: "Sales Order created successfully",
      salesOrder,
    });
  } catch (error) {
    console.error(error);

    // Handles database-level unique constraint
    // if two requests try to create an order
    // for the same quotation.
    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Sales Order already exists for this quotation",
      });
    }

    res.status(500).json({
      message: "Failed to create Sales Order",
    });
  }
};


const getSalesOrders = async (req, res) => {
  try {
    const salesOrders = await prisma.salesOrder.findMany({
      orderBy: {
        id: "desc",
      },

      include: {
        customer: true,
        quotation: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.json({
      salesOrders,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch Sales Orders",
    });
  }
};


const getSalesOrderById = async (req, res) => {
  try {
    const salesOrderId = Number(req.params.id);

    if (Number.isNaN(salesOrderId)) {
      return res.status(400).json({
        message: "Invalid Sales Order ID",
      });
    }

    const salesOrder = await prisma.salesOrder.findUnique({
      where: {
        id: salesOrderId,
      },

      include: {
        customer: true,
        quotation: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!salesOrder) {
      return res.status(404).json({
        message: "Sales Order not found",
      });
    }

    res.json({
      salesOrder,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch Sales Order",
    });
  }
};
const confirmSalesOrder = async (req, res) => {
  try {
    const salesOrderId = Number(req.params.id);

    if (Number.isNaN(salesOrderId)) {
      return res.status(400).json({
        message: "Invalid Sales Order ID",
      });
    }

    const salesOrder = await prisma.salesOrder.findUnique({
      where: {
        id: salesOrderId,
      },
      include: {
        items: true,
      },
    });

    if (!salesOrder) {
      return res.status(404).json({
        message: "Sales Order not found",
      });
    }

    if (salesOrder.status !== "PENDING") {
      return res.status(400).json({
        message: "Only a PENDING Sales Order can be confirmed",
      });
    }

    if (!salesOrder.items || salesOrder.items.length === 0) {
      return res.status(400).json({
        message: "Sales Order has no items",
      });
    }

    const confirmedOrder = await prisma.$transaction(async (tx) => {
      // Sort product IDs so concurrent transactions
      // acquire locks in the same order.
      const items = [...salesOrder.items].sort(
        (a, b) => a.productId - b.productId
      );

      const inventories = [];

      // Lock every inventory row before checking availability.
      for (const item of items) {
        const inventoryRows = await tx.$queryRaw`
          SELECT
            id,
            "productId",
            "physicalQty",
            "reservedQty"
          FROM "Inventory"
          WHERE "productId" = ${item.productId}
          FOR UPDATE
        `;

        if (inventoryRows.length === 0) {
          throw new Error(
            `Inventory not found for product ID ${item.productId}`
          );
        }

        inventories.push({
          item,
          inventory: inventoryRows[0],
        });
      }

      // Check availability while rows are locked.
      for (const { item, inventory } of inventories) {
        const availableQty =
          inventory.physicalQty - inventory.reservedQty;

        if (item.quantity > availableQty) {
          const error = new Error(
            `Insufficient inventory for product ID ${item.productId}. Available: ${availableQty}, Requested: ${item.quantity}`
          );

          error.statusCode = 400;

          throw error;
        }
      }

      // Reserve inventory.
      for (const { item, inventory } of inventories) {
        await tx.inventory.update({
          where: {
            id: inventory.id,
          },
          data: {
            reservedQty: {
              increment: item.quantity,
            },
          },
        });
      }

      // Confirm the Sales Order.
      const updatedOrder = await tx.salesOrder.update({
        where: {
          id: salesOrderId,
        },
        data: {
          status: "CONFIRMED",
          confirmedAt: new Date(),
        },
        include: {
          customer: true,
          quotation: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      return updatedOrder;
    });

    res.json({
      message: "Sales Order confirmed and inventory reserved successfully",
      salesOrder: confirmedOrder,
    });
  } catch (error) {
    console.error(error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to confirm Sales Order",
    });
  }
};

module.exports = {
  createSalesOrder,
  getSalesOrders,
  getSalesOrderById,
  confirmSalesOrder,
};