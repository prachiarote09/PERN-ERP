import { useEffect, useState } from "react";
import api from "../services/api";

function Enquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [showForm, setShowForm] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [items, setItems] = useState([
    {
      productId: "",
      quantity: 1,
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
      const [enquiryResponse, customerResponse, productResponse] =
        await Promise.all([
          api.get("/enquiries", config),
          api.get("/customers", config),
          api.get("/products", config),
        ]);

      setEnquiries(enquiryResponse.data.enquiries || []);
      setCustomers(customerResponse.data.customers || []);
      setProducts(productResponse.data.products || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load enquiry data");
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
      },
    ]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const updatedItems = [...items];

    updatedItems[index][field] = value;

    setItems(updatedItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    try {
      await api.post(
        "/enquiries",
        {
          customerId: Number(customerId),
          remarks,
          items: items.map((item) => ({
            productId: Number(item.productId),
            quantity: Number(item.quantity),
          })),
        },
        config
      );

      setSuccess("Enquiry created successfully!");

      setCustomerId("");
      setRemarks("");
      setItems([
        {
          productId: "",
          quantity: 1,
        },
      ]);

      setShowForm(false);

      fetchData();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message || "Failed to create enquiry"
      );
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Enquiries</h1>
          <p>Manage customer enquiries</p>
        </div>

        <button
          className="primary-btn"
          onClick={() => setShowForm(!showForm)}
        >
          + New Enquiry
        </button>
      </div>

      {success && <div className="success-message">{success}</div>}

      {error && <div className="error-message">{error}</div>}

      {/* Create Enquiry Form */}

      {showForm && (
        <div className="form-card">
          <h2>Create Enquiry</h2>

          <form onSubmit={handleSubmit}>
            <label>Customer</label>

            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
            >
              <option value="">Select Customer</option>

              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>

            <label>Remarks</label>

            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter enquiry remarks"
              rows="3"
            />

            <h3>Products</h3>

            {items.map((item, index) => (
              <div className="item-row" key={index}>
                <select
                  value={item.productId}
                  onChange={(e) =>
                    updateItem(index, "productId", e.target.value)
                  }
                  required
                >
                  <option value="">Select Product</option>

                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.code} - {product.name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(index, "quantity", e.target.value)
                  }
                  required
                />

                {items.length > 1 && (
                  <button
                    type="button"
                    className="danger-btn"
                    onClick={() => removeItem(index)}
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
              <button type="submit" className="primary-btn">
                Create Enquiry
              </button>

              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Enquiry Table */}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Enquiry No</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Date</th>
              <th>Products</th>
            </tr>
          </thead>

          <tbody>
            {enquiries.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty">
                  No enquiries found
                </td>
              </tr>
            ) : (
              enquiries.map((enquiry) => (
                <tr key={enquiry.id}>
                  <td>
                    <strong>{enquiry.enquiryNo}</strong>
                  </td>

                  <td>
                    {enquiry.customer?.name || "-"}
                  </td>

                  <td>
                    <span className={`status ${enquiry.status}`}>
                      {enquiry.status}
                    </span>
                  </td>

                  <td>
                    {new Date(
                      enquiry.enquiryDate || enquiry.createdAt
                    ).toLocaleDateString()}
                  </td>

                  <td>
                    {enquiry.items?.length || 0}
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

export default Enquiries;