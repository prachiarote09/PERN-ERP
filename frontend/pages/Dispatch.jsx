import { useEffect, useState } from "react";
import api from "../services/api";

function Dispatch() {
  const [orders, setOrders] = useState([]);
  const [dispatches, setDispatches] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [salesOrderId, setSalesOrderId] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverName, setDriverName] = useState("");

  const [items, setItems] = useState([]);

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
      const [ordersResponse, dispatchResponse] =
        await Promise.all([
          api.get("/sales-orders", config),
          api.get("/dispatches", config),
        ]);

      setOrders(ordersResponse.data.salesOrders || []);
      setDispatches(dispatchResponse.data.dispatches || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load dispatch data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const confirmedOrders = orders.filter(
    (order) => order.status === "CONFIRMED"
  );

  const handleOrderChange = (orderId) => {
    setSalesOrderId(orderId);

    const order = orders.find(
      (item) => item.id === Number(orderId)
    );

    if (order) {
      setItems(
        (order.items || []).map((item) => ({
          productId: item.productId,
          productName: item.product?.name || "Product",
          orderedQty: item.quantity,
          quantity: item.quantity,
        }))
      );
    }
  };

  const updateQuantity = (index, value) => {
    const updated = [...items];

    updated[index].quantity = value;

    setItems(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    try {
      const response = await api.post(
        `/dispatches/from-sales-order/${salesOrderId}`,
        {
          vehicleNumber,
          driverName,
          items: items.map((item) => ({
            productId: Number(item.productId),
            quantity: Number(item.quantity),
          })),
        },
        config
      );

      setSuccess(
        `Dispatch ${response.data.dispatch.dispatchNo} created successfully!`
      );

      setShowForm(false);
      setSalesOrderId("");
      setVehicleNumber("");
      setDriverName("");
      setItems([]);

      fetchData();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to create dispatch"
      );
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dispatch</h1>
          <p>Process confirmed sales orders</p>
        </div>

        <button
          className="primary-btn"
          onClick={() => setShowForm(!showForm)}
        >
          + New Dispatch
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

      {/* Dispatch Form */}

      {showForm && (
        <div className="form-card">
          <h2>Create Dispatch</h2>

          {confirmedOrders.length === 0 ? (
            <p className="empty">
              No confirmed sales orders available
              for dispatch.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <label>Sales Order</label>

              <select
                value={salesOrderId}
                onChange={(e) =>
                  handleOrderChange(e.target.value)
                }
                required
              >
                <option value="">
                  Select Sales Order
                </option>

                {confirmedOrders.map((order) => (
                  <option
                    key={order.id}
                    value={order.id}
                  >
                    {order.orderNo} -{" "}
                    {order.customer?.name}
                  </option>
                ))}
              </select>

              <label>Vehicle Number</label>

              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) =>
                  setVehicleNumber(e.target.value)
                }
                placeholder="e.g. MH01AB1234"
              />

              <label>Driver Name</label>

              <input
                type="text"
                value={driverName}
                onChange={(e) =>
                  setDriverName(e.target.value)
                }
                placeholder="Enter driver name"
              />

              {items.length > 0 && (
                <>
                  <h3>Dispatch Items</h3>

                  <div className="table-card">
                    <table>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Ordered Qty</th>
                          <th>Dispatch Qty</th>
                        </tr>
                      </thead>

                      <tbody>
                        {items.map((item, index) => (
                          <tr key={item.productId}>
                            <td>{item.productName}</td>

                            <td>{item.orderedQty}</td>

                            <td>
                              <input
                                type="number"
                                min="1"
                                max={item.orderedQty}
                                value={item.quantity}
                                onChange={(e) =>
                                  updateQuantity(
                                    index,
                                    e.target.value
                                  )
                                }
                                required
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              <div className="form-actions">
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={!salesOrderId}
                >
                  Create Dispatch
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

      {/* Dispatch History */}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Dispatch No</th>
              <th>Sales Order</th>
              <th>Vehicle</th>
              <th>Driver</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {dispatches.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty">
                  No dispatches found
                </td>
              </tr>
            ) : (
              dispatches.map((dispatch) => (
                <tr key={dispatch.id}>
                  <td>
                    <strong>
                      {dispatch.dispatchNo}
                    </strong>
                  </td>

                  <td>
                    {dispatch.salesOrder?.orderNo ||
                      "-"}
                  </td>

                  <td>
                    {dispatch.vehicleNumber || "-"}
                  </td>

                  <td>
                    {dispatch.driverName || "-"}
                  </td>

                  <td>
                    {dispatch.dispatchDate
                      ? new Date(
                          dispatch.dispatchDate
                        ).toLocaleDateString()
                      : "-"}
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

export default Dispatch;