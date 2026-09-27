import { useEffect, useState } from "react";
import api from "../services/api";

function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [products, setProducts] = useState([]);

  const [showForm, setShowForm] = useState(false);

  const [enquiryId, setEnquiryId] = useState("");
  const [validUntil, setValidUntil] = useState("");

  const [items, setItems] = useState([
    {
      productId: "",
      quantity: 1,
      unitPrice: "",
      discountPct: 0,
      gstPct: 18,
    },
  ]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchData = async () => {
    try {
      const [quotationResponse, enquiryResponse, productResponse] =
        await Promise.all([
          api.get("/quotations", config),
          api.get("/enquiries", config),
          api.get("/products", config),
        ]);

      setQuotations(quotationResponse.data.quotations || []);
      setEnquiries(enquiryResponse.data.enquiries || []);
      setProducts(productResponse.data.products || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load quotation data");
    }
  };
const createSalesOrder = async (quotationId) => {
  setError("");
  setSuccess("");

  try {
    const response = await api.post(
      `/sales-orders/from-quotation/${quotationId}`,
      {},
      config
    );

    setSuccess(
      `Sales Order ${response.data.salesOrder.orderNo} created successfully!`
    );

    fetchData();
  } catch (err) {
    console.error(err);

    setError(
      err.response?.data?.message ||
        "Failed to create Sales Order"
    );
  }
};
  useEffect(() => {
    fetchData();
  }, []);

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: "",
        quantity: 1,
        unitPrice: "",
        discountPct: 0,
        gstPct: 18,
      },
    ]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];

    updated[index][field] = value;

    // Automatically fill base price when product is selected
    if (field === "productId") {
      const product = products.find(
        (p) => p.id === Number(value)
      );

      if (product) {
        updated[index].unitPrice = Number(product.basePrice);
      }
    }

    setItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    try {
      await api.post(
        "/quotations",
        {
          enquiryId: Number(enquiryId),
          validUntil,
          items: items.map((item) => ({
            productId: Number(item.productId),
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            discountPct: Number(item.discountPct),
            gstPct: Number(item.gstPct),
          })),
        },
        config
      );

      setSuccess("Quotation created successfully!");

      setEnquiryId("");
      setValidUntil("");

      setItems([
        {
          productId: "",
          quantity: 1,
          unitPrice: "",
          discountPct: 0,
          gstPct: 18,
        },
      ]);

      setShowForm(false);

      fetchData();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to create quotation"
      );
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(
        `/quotations/${id}/status`,
        { status },
        config
      );

      setSuccess(`Quotation status changed to ${status}`);

      fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update quotation"
      );
    }
  };

  // Only NEW enquiries can receive a quotation
  const availableEnquiries = enquiries.filter(
    (enquiry) => enquiry.status === "NEW"
  );

  return (
    <div>
      {/* Header */}

      <div className="page-header">
        <div>
          <h1>Quotations</h1>
          <p>Manage customer quotations</p>
        </div>

        <button
          className="primary-btn"
          onClick={() => setShowForm(!showForm)}
        >
          + New Quotation
        </button>
      </div>

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Create quotation */}

      {showForm && (
        <div className="form-card">
          <h2>Create Quotation</h2>

          {availableEnquiries.length === 0 ? (
            <p className="empty">
              No NEW enquiries available for quotation.
              Create a new enquiry first.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <label>Enquiry</label>

              <select
                value={enquiryId}
                onChange={(e) =>
                  setEnquiryId(e.target.value)
                }
                required
              >
                <option value="">
                  Select Enquiry
                </option>

                {availableEnquiries.map((enquiry) => (
                  <option
                    key={enquiry.id}
                    value={enquiry.id}
                  >
                    {enquiry.enquiryNo} -{" "}
                    {enquiry.customer?.name}
                  </option>
                ))}
              </select>

              <label>Valid Until</label>

              <input
                type="date"
                value={validUntil}
                onChange={(e) =>
                  setValidUntil(e.target.value)
                }
                required
              />

              <h3>Quotation Items</h3>

              {items.map((item, index) => (
                <div
                  className="quotation-item"
                  key={index}
                >
                  <select
                    value={item.productId}
                    onChange={(e) =>
                      updateItem(
                        index,
                        "productId",
                        e.target.value
                      )
                    }
                    required
                  >
                    <option value="">
                      Product
                    </option>

                    {products.map((product) => (
                      <option
                        key={product.id}
                        value={product.id}
                      >
                        {product.code} -{" "}
                        {product.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(
                        index,
                        "quantity",
                        e.target.value
                      )
                    }
                    required
                  />

                  <input
                    type="number"
                    min="0"
                    placeholder="Unit Price"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(
                        index,
                        "unitPrice",
                        e.target.value
                      )
                    }
                    required
                  />

                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Discount %"
                    value={item.discountPct}
                    onChange={(e) =>
                      updateItem(
                        index,
                        "discountPct",
                        e.target.value
                      )
                    }
                  />

                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="GST %"
                    value={item.gstPct}
                    onChange={(e) =>
                      updateItem(
                        index,
                        "gstPct",
                        e.target.value
                      )
                    }
                  />

                  {items.length > 1 && (
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() =>
                        removeItem(index)
                      }
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="secondary-btn"
                onClick={addItem}
              >
                + Add Product
              </button>

              <div className="form-actions">
                <button
                  type="submit"
                  className="primary-btn"
                >
                  Create Quotation
                </button>

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() =>
                    setShowForm(false)
                  }
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Quotations table */}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Quotation No</th>
              <th>Customer</th>
              <th>Enquiry</th>
              <th>Grand Total</th>
              <th>Valid Until</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {quotations.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty">
                  No quotations found
                </td>
              </tr>
            ) : (
              quotations.map((quotation) => (
                <tr key={quotation.id}>
                  <td>
                    <strong>
                      {quotation.quotationNo}
                    </strong>
                  </td>

                  <td>
                    {quotation.customer?.name || "-"}
                  </td>

                  <td>
                    {quotation.enquiry?.enquiryNo || "-"}
                  </td>

                  <td>
                    ₹
                    {Number(
                      quotation.grandTotal
                    ).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </td>

                  <td>
                    {quotation.validUntil
                      ? new Date(
                          quotation.validUntil
                        ).toLocaleDateString()
                      : "-"}
                  </td>

                  <td>
                    <span
                      className={`status ${quotation.status}`}
                    >
                      {quotation.status}
                    </span>
                  </td>

                  <td>
                    {quotation.status === "DRAFT" && (
                      <button
                        className="secondary-btn"
                        onClick={() =>
                          updateStatus(
                            quotation.id,
                            "SENT"
                          )
                        }
                      >
                        Send
                      </button>
                    )}

                    {quotation.status === "SENT" && (
                      <button
                        className="primary-btn"
                        onClick={() =>
                          updateStatus(
                            quotation.id,
                            "ACCEPTED"
                          )
                        }
                      >
                        Accept
                      </button>
                    )}

                    {quotation.status === "ACCEPTED" && (
  <button
    className="primary-btn"
    onClick={() => createSalesOrder(quotation.id)}
  >
    Create Order
  </button>
)}

                    {quotation.status === "REJECTED" && (
                      <span className="error-text">
                        Rejected
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Quotations;