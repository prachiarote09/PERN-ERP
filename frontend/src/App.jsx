import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/Login";
import Layout from "../components/Layout";
import Enquiries from "../pages/Enquiries";
import Quotations from "../pages/Quotations";
import SalesOrders from "../pages/SalesOrders";
import Inventory from "../pages/Inventory";
import Dispatch from "../pages/Dispatch";
function Dashboard() {
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
          <strong>0</strong>
        </div>

        <div className="dashboard-card">
          <span>Quotations</span>
          <strong>0</strong>
        </div>

        <div className="dashboard-card">
          <span>Sales Orders</span>
          <strong>0</strong>
        </div>

        <div className="dashboard-card">
          <span>Inventory</span>
          <strong>6</strong>
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

          <Route
  path="/dispatches"
  element={<Dispatch />}
/>
        </Route>

        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
