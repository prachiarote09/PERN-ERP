import { useEffect, useState } from "react";
import api from "../services/api";

function SalesOrders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get("/sales-orders", config);

      setOrders(response.data.salesOrders || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load sales orders");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const confirmOrder = async (orderId) => {
    setError("");
    setSuccess("");

    try {
      const response = await api.post(
        `/sales-orders/${orderId}/confirm`,
        {},
        config
      );

      setSuccess(
        `${response.data.salesOrder.orderNo} confirmed and inventory reserved successfully!`
      );

      fetchOrders();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to confirm sales order"
      );
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Sales Orders</h1>
          <p>Manage customer sales orders</p>
        </div>
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

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Order No</th>
              <th>Customer</th>
              <th>Quotation</th>
              <th>Total</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty">
                  No sales orders found
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>{order.orderNo}</strong>
                  </td>

                  <td>
                    {order.customer?.name || "-"}
                  </td>

                  <td>
                    {order.quotation?.quotationNo || "-"}
                  </td>

                  <td>
                    ₹
                    {Number(
                      order.grandTotal
                    ).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </td>

                  <td>
                    {order.orderDate
                      ? new Date(
                          order.orderDate
                        ).toLocaleDateString()
                      : "-"}
                  </td>

                  <td>
                    <span
                      className={`status ${order.status}`}
                    >
                      {order.status}
                    </span>
                  </td>

                  <td>
                    {order.status === "PENDING" && (
                      <button
                        className="primary-btn"
                        onClick={() =>
                          confirmOrder(order.id)
                        }
                      >
                        Confirm
                      </button>
                    )}

                    {order.status === "CONFIRMED" && (
                      <span className="success-text">
                        Inventory Reserved
                      </span>
                    )}

                    {order.status === "DISPATCHED" && (
                      <span className="success-text">
                        Dispatched
                      </span>
                    )}

                    {order.status === "CANCELLED" && (
                      <span className="error-text">
                        Cancelled
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

export default SalesOrders;