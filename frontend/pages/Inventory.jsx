import { useEffect, useState } from "react";
import api from "../services/api";

function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchInventory = async () => {
    try {
      const response = await api.get("/inventory", config);

      setInventory(response.data.inventory || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load inventory");
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Inventory</h1>
          <p>View current stock availability</p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Product Code</th>
              <th>Product</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Physical Qty</th>
              <th>Reserved Qty</th>
              <th>Available Qty</th>
            </tr>
          </thead>

          <tbody>
            {inventory.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty">
                  No inventory found
                </td>
              </tr>
            ) : (
              inventory.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.product?.code}</strong>
                  </td>

                  <td>{item.product?.name || "-"}</td>

                  <td>{item.product?.category || "-"}</td>

                  <td>{item.product?.unit || "-"}</td>

                  <td>{item.physicalQty}</td>

                  <td>{item.reservedQty}</td>

                  <td>
                    <span
                      className={
                        item.availableQty > 0
                          ? "stock-available"
                          : "stock-empty"
                      }
                    >
                      {item.availableQty}
                    </span>
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

export default Inventory;