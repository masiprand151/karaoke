import { useEffect, useState } from "react";
import useStorage from "../hooks/useStorage";
import { Outlet, useNavigate, NavLink, useLocation } from "react-router-dom";
import {
  FiShoppingCart,
  FiFileText,
  FiBarChart2,
  FiUsers,
  FiSettings,
  FiLogOut,
  FiClock,
  FiUser,
  FiHome,
} from "react-icons/fi";

export default function Layout() {
  const [user, setUser, removeUser] = useStorage("user");
  const navigate = useNavigate();
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, []);

  const pageTitles = {
    "/": "Room Dashboard",
    "/order": "Order",
    "/transaction": "Transaction",
    "/report": "Report",
    "/customer": "Customer",
    "/settings": "Settings",
  };

  const location = useLocation();

  const [time, setTime] = useState(new Date());
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const title = pageTitles[location.pathname] || "Karaokepro";

  const formattedTime = time.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  function handleLogout() {
    removeUser();
    navigate("/login");
  }

  return (
    <div className="pos-layout">
      {/* SIDEBAR */}
      <aside className="pos-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">K</div>

          <div>
            <div className="fw-bold">Karaokepro</div>

            <small>POS System</small>
          </div>
        </div>

        <div className="sidebar-menu">
          <div className="menu-label">MENU</div>

          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `menu-item ${isActive ? "active" : ""}`
            }
          >
            <FiHome />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/order"
            className={({ isActive }) =>
              `menu-item ${isActive ? "active" : ""}`
            }
          >
            <FiShoppingCart />
            <span>Order</span>
          </NavLink>

          <NavLink
            to="/transaction"
            className={({ isActive }) =>
              `menu-item ${isActive ? "active" : ""}`
            }
          >
            <FiFileText />
            <span>Transaction</span>
          </NavLink>

          <NavLink
            to="/report"
            className={({ isActive }) =>
              `menu-item ${isActive ? "active" : ""}`
            }
          >
            <FiBarChart2 />
            <span>Report</span>
          </NavLink>

          <div className="menu-label mt-4">MASTER</div>

          <NavLink
            to="/room-price"
            className={({ isActive }) =>
              `menu-item ${isActive ? "active" : ""}`
            }
          >
            <FiHome />
            <span>Room</span>
          </NavLink>
          <NavLink
            to="/customer"
            className={({ isActive }) =>
              `menu-item ${isActive ? "active" : ""}`
            }
          >
            <FiUsers />
            <span>Customer</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `menu-item ${isActive ? "active" : ""}`
            }
          >
            <FiSettings />
            <span>Settings</span>
          </NavLink>
        </div>

        <div className="sidebar-bottom">
          <button type="button" className="menu-item" onClick={handleLogout}>
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="pos-main">
        {/* HEADER */}
        <header className="pos-header">
          {/* TITLE */}
          <div>
            <h5 className="mb-1 fw-bold">{title}</h5>
          </div>

          {/* RIGHT */}
          <div className="header-right">
            {/* TIME */}
            <div className="header-time">
              <FiClock />

              <span>{formattedTime}</span>
            </div>

            {/* USER */}
            <div className="position-relative">
              <button
                type="button"
                className="header-user border-0 bg-transparent p-0"
                onClick={() => setShowMenu(!showMenu)}
              >
                <div className="user-icon">
                  <FiUser />
                </div>

                <div className="text-start">
                  <div className="fw-semibold">{user?.username}</div>

                  <small className="text-secondary">{user?.role}</small>
                </div>
              </button>
            </div>
          </div>
        </header>
        <div className="pos-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
