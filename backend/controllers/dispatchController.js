const prisma = require("../utils/prisma");

const createDispatch = async (req, res) => {
  try {
    const salesOrderId = Number(req.params.salesOrderId);

    const {
      dispatchDate,
      vehicleNumber,
      driverName,
      items,
    } = req.body;

    if (Number.isNaN(salesOrderId)) {
      return res.status(400).json({
        message: "Invalid Sales Order ID",
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        message: "At least one dispatch item is required",
      });
    }

    const salesOrder = await prisma.salesOrder.findUnique({
      where: {
        id: salesOrderId,
      },
      include: {
        items: true,
        dispatch: true,
      },
    });

    if (!salesOrder) {
      return res.status(404).json({
        message: "Sales Order not found",
      });
    }

     if (salesOrder.dispatch) {
      return res.status(409).json({
        message: "Sales Order has already been dispatched",
      });
    }
    if (salesOrder.status !== "CONFIRMED") {
      return res.status(400).json({
        message: "Only a CONFIRMED Sales Order can be dispatched",
      });
    }

   

    // Validate requested dispatch quantities
    for (const dispatchItem of items) {
      const orderItem = salesOrder.items.find(
        (item) =>
          item.productId === Number(dispatchItem.productId)
      );

      if (!orderItem) {
        return res.status(400).json({
          message: `Product ${dispatchItem.productId} is not part of this Sales Order`,
        });
      }

      const quantity = Number(dispatchItem.quantity);

      if (quantity <= 0) {
        return res.status(400).json({
          message: "Dispatch quantity must be greater than 0",
        });
      }

      if (quantity > orderItem.quantity) {
        return res.status(400).json({
          message: `Dispatch quantity cannot exceed ordered quantity for product ${dispatchItem.productId}`,
        });
      }
    }

    const dispatchCount = await prisma.dispatch.count();

    const dispatchNo = `DIS-${String(
      dispatchCount + 1
    ).padStart(4, "0")}`;

    const dispatch = await prisma.$transaction(async (tx) => {
      const dispatchInventories = [];

      // Sort product IDs to acquire locks in a consistent order.
      const sortedItems = [...items].sort(
        (a, b) =>
          Number(a.productId) - Number(b.productId)
      );

      // Lock inventory rows.
      for (const dispatchItem of sortedItems) {
        const inventoryRows = await tx.$queryRaw`
          SELECT
            id,
            "productId",
            "physicalQty",
            "reservedQty"
          FROM "Inventory"
          WHERE "productId" = ${Number(dispatchItem.productId)}
          FOR UPDATE
        `;

        if (inventoryRows.length === 0) {
          throw new Error(
            `Inventory not found for product ID ${dispatchItem.productId}`
          );
        }

        dispatchInventories.push({
          dispatchItem,
          inventory: inventoryRows[0],
        });
      }

      // Validate reserved quantity.
      for (const {
        dispatchItem,
        inventory,
      } of dispatchInventories) {
        const quantity = Number(dispatchItem.quantity);

        if (quantity > inventory.reservedQty) {
          const error = new Error(
            `Cannot dispatch ${quantity} units of product ${dispatchItem.productId}. Only ${inventory.reservedQty} units are reserved.`
          );

          error.statusCode = 400;
          throw error;
        }

        if (quantity > inventory.physicalQty) {
          const error = new Error(
            `Cannot dispatch ${quantity} units of product ${dispatchItem.productId}. Only ${inventory.physicalQty} units are physically available.`
          );

          error.statusCode = 400;
          throw error;
        }
      }

      // Create dispatch.
      const newDispatch = await tx.dispatch.create({
        data: {
          dispatchNo,
          salesOrderId: salesOrder.id,
          processedById: req.user.userId,
          dispatchDate: dispatchDate
            ? new Date(dispatchDate)
            : new Date(),
          vehicleNumber,
          driverName,

          items: {
            create: items.map((item) => ({
              productId: Number(item.productId),
              quantity: Number(item.quantity),
            })),
          },
        },

        include: {
          salesOrder: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Reduce physical and reserved quantities.
      for (const {
        dispatchItem,
        inventory,
      } of dispatchInventories) {
        const quantity = Number(dispatchItem.quantity);

        await tx.inventory.update({
          where: {
            id: inventory.id,
          },
          data: {
            physicalQty: {
              decrement: quantity,
            },
            reservedQty: {
              decrement: quantity,
            },
          },
        });
      }

      // Mark Sales Order as dispatched.
      await tx.salesOrder.update({
        where: {
          id: salesOrder.id,
        },
        data: {
          status: "DISPATCHED",
        },
      });

      return newDispatch;
    });

    res.status(201).json({
      message: "Dispatch created successfully",
      dispatch,
    });
  } catch (error) {
    console.error(error);

    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Dispatch already exists for this Sales Order",
      });
    }

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to create dispatch",
    });
  }
};


const getDispatches = async (req, res) => {
  try {
    const dispatches = await prisma.dispatch.findMany({
      orderBy: {
        id: "desc",
      },

      include: {
        salesOrder: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.json({
      dispatches,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch dispatches",
    });
  }
};


const getDispatchById = async (req, res) => {
  try {
    const dispatchId = Number(req.params.id);

    if (Number.isNaN(dispatchId)) {
      return res.status(400).json({
        message: "Invalid dispatch ID",
      });
    }

    const dispatch = await prisma.dispatch.findUnique({
      where: {
        id: dispatchId,
      },

      include: {
        salesOrder: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!dispatch) {
      return res.status(404).json({
        message: "Dispatch not found",
      });
    }

    res.json({
      dispatch,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch dispatch",
    });
  }
};


module.exports = {
  createDispatch,
  getDispatches,
  getDispatchById,
};