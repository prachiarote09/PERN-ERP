const request = require("supertest");
const app = require("../app");

describe("Quotation Module", () => {
  let token;
  let customerId;
  let enquiryId;

  test("should login as admin", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "admin@pernerp.com",
        password: "Admin@123",
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.token).toBeDefined();

    token = response.body.token;
  });

  test("should create customer", async () => {
    const uniqueEmail = `test${Date.now()}@example.com`;

    const response = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: `Test Customer ${Date.now()}`,
        email: uniqueEmail,
        phone: "9876543210",
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.customer).toBeDefined();

    customerId = response.body.customer.id;
  });

  test("should create enquiry", async () => {
    const response = await request(app)
      .post("/api/enquiries")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customerId,
        remarks: "Automated test enquiry",
        items: [
          {
            productId: 1,
            quantity: 2,
          },
        ],
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.enquiry).toBeDefined();

    enquiryId = response.body.enquiry.id;
  });

  test("should correctly calculate quotation total", async () => {
    const response = await request(app)
      .post("/api/quotations")
      .set("Authorization", `Bearer ${token}`)
      .send({
        enquiryId,
        validUntil: "2026-12-31",
        items: [
          {
            productId: 1,
            quantity: 2,
            unitPrice: 50000,
            discountPct: 10,
            gstPct: 18,
          },
        ],
      });

    expect(response.statusCode).toBe(201);

    const quotation = response.body.quotation;

    expect(Number(quotation.subtotal)).toBe(100000);
    expect(Number(quotation.discountAmount)).toBe(10000);
    expect(Number(quotation.gstAmount)).toBe(16200);
    expect(Number(quotation.grandTotal)).toBe(106200);
  });
});