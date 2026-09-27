import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Login from "../pages/Login";
import Layout from "../components/Layout";
import Enquiries from "../pages/Enquiries";
import Quotations from "../pages/Quotations";
import SalesOrders from "../pages/SalesOrders";
import Inventory from "../pages/Inventory";
import Dispatch from "../pages/Dispatch";
import api from "../services/api";

function Dashboard() {
  const [counts, setCounts] = useState({
    enquiries: 0,
    quotations: 0,
    salesOrders: 0,
    inventory: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const [
          enquiriesResponse,
          quotationsResponse,
          salesOrdersResponse,
          inventoryResponse,
        ] = await Promise.all([
          api.get("/enquiries", config),
          api.get("/quotations", config),
          api.get("/sales-orders", config),
          api.get("/inventory", config),
        ]);

        const getArray = (response, possibleKeys) => {
          const data = response.data;

          if (Array.isArray(data)) {
            return data;
          }

          if (Array.isArray(data?.data)) {
            return data.data;
          }

          for (const key of possibleKeys) {
            if (Array.isArray(data?.[key])) {
              return data[key];
            }
          }

          return [];
        };

        const enquiries = getArray(enquiriesResponse, ["enquiries"]);
        const quotations = getArray(quotationsResponse, ["quotations"]);
        const salesOrders = getArray(salesOrdersResponse, [
          "salesOrders",
          "orders",
        ]);
        const inventory = getArray(inventoryResponse, ["inventory"]);

        setCounts({
          enquiries: enquiries.length,
          quotations: quotations.length,
          salesOrders: salesOrders.length,
          inventory: inventory.length,
        });
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome to PERN ERP</p>
        </div>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <span>Enquiries</span>
          <strong>{counts.enquiries}</strong>
        </div>

        <div className="dashboard-card">
          <span>Quotations</span>
          <strong>{counts.quotations}</strong>
        </div>

        <div className="dashboard-card">
          <span>Sales Orders</span>
          <strong>{counts.salesOrders}</strong>
        </div>

        <div className="dashboard-card">
          <span>Inventory</span>
          <strong>{counts.inventory}</strong>
        </div>
      </div>
    </div>
  );
}

function Placeholder({ title }) {
  return (
    <div className="placeholder-page">
      <h1>{title}</h1>
      <p>This module will be available here.</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected application layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/enquiries" element={<Enquiries />} />

          <Route path="/quotations" element={<Quotations />} />

          <Route path="/sales-orders" element={<SalesOrders />} />

          <Route path="/inventory" element={<Inventory />} />

          <Route path="/dispatches" element={<Dispatch />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;