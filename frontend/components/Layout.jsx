import { NavLink, Outlet, useNavigate } from "react-router-dom";

function Layout() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <h2>PERN ERP</h2>
          <span>Enterprise Resource Planning</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard">Dashboard</NavLink>

          <NavLink to="/enquiries">Enquiries</NavLink>

          <NavLink to="/quotations">Quotations</NavLink>

          <NavLink to="/sales-orders">Sales Orders</NavLink>

          <NavLink to="/inventory">Inventory</NavLink>

          {user.role === "ADMIN" && (
            <NavLink to="/dispatches">Dispatch</NavLink>
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="user-info">
            <strong>{user.name || "User"}</strong>
            <span>{user.role || "SALES_USER"}</span>
          </div>

          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="main-area">
        <header className="topbar">
          <div>
            <h3>PERN ERP</h3>
          </div>

          <div className="topbar-user">
            <span>{user.name || "User"}</span>
            <span className="role-badge">
              {user.role || "SALES_USER"}
            </span>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;