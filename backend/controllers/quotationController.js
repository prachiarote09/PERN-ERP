const prisma = require("../utils/prisma");

const roundToTwo = (value) => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

const createQuotation = async (req, res) => {
  try {
    const {
      enquiryId,
      validUntil,
      items,
    } = req.body;

    if (!enquiryId || !validUntil || !items || items.length === 0) {
      return res.status(400).json({
        message: "Enquiry, valid until date and quotation items are required",
      });
    }

    // Check enquiry
    const enquiry = await prisma.enquiry.findUnique({
      where: {
        id: Number(enquiryId),
      },
      include: {
        customer: true,
      },
    });

    if (!enquiry) {
      return res.status(404).json({
        message: "Enquiry not found",
      });
    }

    // Enquiry must be NEW
    if (enquiry.status !== "NEW") {
      return res.status(400).json({
        message: "Quotation can only be created for a NEW enquiry",
      });
    }

    let subtotal = 0;
    let discountAmount = 0;
    let gstAmount = 0;

    const quotationItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: {
          id: Number(item.productId),
        },
      });

      if (!product) {
        return res.status(404).json({
          message: `Product with ID ${item.productId} not found`,
        });
      }

      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      const discountPct = Number(item.discountPct || 0);
      const gstPct = Number(item.gstPct || 0);

      if (quantity <= 0) {
        return res.status(400).json({
          message: "Quantity must be greater than 0",
        });
      }

      if (unitPrice < 0) {
        return res.status(400).json({
          message: "Unit price cannot be negative",
        });
      }

      if (discountPct < 0 || discountPct > 100) {
        return res.status(400).json({
          message: "Discount percentage must be between 0 and 100",
        });
      }

      if (gstPct < 0 || gstPct > 100) {
        return res.status(400).json({
          message: "GST percentage must be between 0 and 100",
        });
      }

      // Basic amount before discount
      const grossAmount = quantity * unitPrice;

      // Discount
      const itemDiscount =
        grossAmount * (discountPct / 100);

      // Amount after discount
      const taxableAmount =
        grossAmount - itemDiscount;

      // GST
      const itemGst =
        taxableAmount * (gstPct / 100);

      // Final line amount
      const lineAmount =
        taxableAmount + itemGst;

      subtotal += grossAmount;
      discountAmount += itemDiscount;
      gstAmount += itemGst;

      quotationItems.push({
        productId: Number(item.productId),
        quantity,
        unitPrice: roundToTwo(unitPrice),
        discountPct: roundToTwo(discountPct),
        gstPct: roundToTwo(gstPct),
        lineAmount: roundToTwo(lineAmount),
      });
    }

    subtotal = roundToTwo(subtotal);
    discountAmount = roundToTwo(discountAmount);
    gstAmount = roundToTwo(gstAmount);

    const grandTotal = roundToTwo(
      subtotal - discountAmount + gstAmount
    );

    const quotationCount = await prisma.quotation.count();

    const quotationNo = `QUO-${String(
      quotationCount + 1
    ).padStart(4, "0")}`;

    const quotation = await prisma.$transaction(async (tx) => {
      const newQuotation = await tx.quotation.create({
        data: {
          quotationNo,
          enquiryId: enquiry.id,
          customerId: enquiry.customerId,
          createdById: req.user.userId,
          validUntil: new Date(validUntil),

          subtotal,
          discountAmount,
          gstAmount,
          grandTotal,

          status: "DRAFT",

          items: {
            create: quotationItems,
          },
        },

        include: {
          customer: true,
          enquiry: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Once quotation is created,
      // enquiry moves from NEW to QUOTED
      await tx.enquiry.update({
        where: {
          id: enquiry.id,
        },
        data: {
          status: "QUOTED",
        },
      });

      return newQuotation;
    });

    res.status(201).json({
      message: "Quotation created successfully",
      quotation,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create quotation",
    });
  }
};


const getQuotations = async (req, res) => {
  try {
    const quotations = await prisma.quotation.findMany({
      orderBy: {
        id: "desc",
      },

      include: {
        customer: true,
        enquiry: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.json({
      quotations,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch quotations",
    });
  }
};


const getQuotationById = async (req, res) => {
  try {
    const quotationId = Number(req.params.id);

    if (Number.isNaN(quotationId)) {
      return res.status(400).json({
        message: "Invalid quotation ID",
      });
    }

    const quotation = await prisma.quotation.findUnique({
      where: {
        id: quotationId,
      },

      include: {
        customer: true,
        enquiry: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!quotation) {
      return res.status(404).json({
        message: "Quotation not found",
      });
    }

    res.json({
      quotation,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch quotation",
    });
  }
};
const updateQuotationStatus = async (req, res) => {
  try {
    const quotationId = Number(req.params.id);
    const { status } = req.body;

    if (Number.isNaN(quotationId)) {
      return res.status(400).json({
        message: "Invalid quotation ID",
      });
    }

    const allowedStatuses = [
      "DRAFT",
      "SENT",
      "ACCEPTED",
      "REJECTED",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid quotation status",
      });
    }

    const quotation = await prisma.quotation.findUnique({
      where: {
        id: quotationId,
      },
    });

    if (!quotation) {
      return res.status(404).json({
        message: "Quotation not found",
      });
    }

    if (quotation.status === "ACCEPTED" || quotation.status === "REJECTED") {
      return res.status(400).json({
        message: "Final quotation status cannot be changed",
      });
    }

    const updatedQuotation = await prisma.quotation.update({
      where: {
        id: quotationId,
      },
      data: {
        status,
      },
    });

    res.json({
      message: "Quotation status updated successfully",
      quotation: updatedQuotation,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update quotation status",
    });
  }
};

module.exports = {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotationStatus,
};