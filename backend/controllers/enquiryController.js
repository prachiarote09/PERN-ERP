const prisma = require("../utils/prisma");

const createEnquiry = async (req, res) => {
  try {
    const { customerId, enquiryDate, remarks, items } = req.body;

    if (!customerId || !items || items.length === 0) {
      return res.status(400).json({
        message: "Customer and at least one product are required",
      });
    }

    const customer = await prisma.customer.findUnique({
      where: {
        id: Number(customerId),
      },
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

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

      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          message: "Product quantity must be greater than 0",
        });
      }
    }

    const enquiryCount = await prisma.enquiry.count();

    const enquiryNo = `ENQ-${String(enquiryCount + 1).padStart(4, "0")}`;

    const enquiry = await prisma.enquiry.create({
      data: {
        enquiryNo,
        customerId: Number(customerId),
        createdById: req.user.userId,
        enquiryDate: enquiryDate ? new Date(enquiryDate) : new Date(),
        remarks,
        status: "NEW",

        items: {
          create: items.map((item) => ({
            productId: Number(item.productId),
            quantity: Number(item.quantity),
          })),
        },
      },

      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Enquiry created successfully",
      enquiry,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create enquiry",
    });
  }
};


const getEnquiries = async (req, res) => {
  try {
    const enquiries = await prisma.enquiry.findMany({
      orderBy: {
        id: "desc",
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.json({
      enquiries,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch enquiries",
    });
  }
};


const getEnquiryById = async (req, res) => {
  try {
    const enquiryId = Number(req.params.id);

    if (Number.isNaN(enquiryId)) {
      return res.status(400).json({
        message: "Invalid enquiry ID",
      });
    }

    const enquiry = await prisma.enquiry.findUnique({
      where: {
        id: enquiryId,
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!enquiry) {
      return res.status(404).json({
        message: "Enquiry not found",
      });
    }

    res.json({
      enquiry,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch enquiry",
    });
  }
};


module.exports = {
  createEnquiry,
  getEnquiries,
  getEnquiryById,
};