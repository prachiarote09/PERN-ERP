const prisma = require("../utils/prisma");

const createCustomer = async (req, res) => {
  try {
    const {
  name,
  email,
  phone,
  address,
  city,
  state,
  pincode,
  gstNumber,
} = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({
        message: "Name, email and phone are required",
      });
    }

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        email,
      },
    });

    if (existingCustomer) {
      return res.status(409).json({
        message: "Customer with this email already exists",
      });
    }

   const customer = await prisma.customer.create({
  data: {
    name,
    email,
    phone,
    address,
    city,
    state,
    pincode,
    gstNumber,
  },
});

    res.status(201).json({
      message: "Customer created successfully",
      customer,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create customer",
    });
  }
};

const getCustomers = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        id: "asc",
      },
    });

    res.json({
      customers,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch customers",
    });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const customerId = Number(req.params.id);

    if (Number.isNaN(customerId)) {
      return res.status(400).json({
        message: "Invalid customer ID",
      });
    }

    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    res.json({
      customer,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch customer",
    });
  }
};

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
};