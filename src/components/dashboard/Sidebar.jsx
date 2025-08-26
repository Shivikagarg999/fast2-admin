import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Logo from "../../../src/assets/images/logo.png";
import {
  FiHome,
  FiUsers,
  FiPackage,
  FiTruck,
  FiCreditCard,
  FiLogOut,
  FiChevronDown,
  FiChevronRight,
  FiMenu,
  FiX,
} from "react-icons/fi";

const Sidebar = ({ darkMode, toggleTheme }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandOrders, setExpandOrders] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size for mobile view
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <FiHome className="w-5 h-5" />,
    },
    {
      name: "Users",
      path: "/admin/users",
      icon: <FiUsers className="w-5 h-5" />,
    },
    {
      name: "Orders",
      isParent: true,
      icon: <FiPackage className="w-5 h-5" />,
      subItems: [
        { name: "All Orders", path: "/admin/orders" },
        { name: "Completed Orders", path: "/admin/orders/completed-orders" },
        { name: "On-Going Orders", path: "/admin/orders/onGoing-orders" },
        { name: "Pending Orders", path: "/admin/orders/pending-orders" },
      ],
    },
    {
      name: "Delivery Agents",
      path: "/admin/agents",
      icon: <FiTruck className="w-5 h-5" />,
    },
    {
      name: "Payments",
      path: "/admin/payments",
      icon: <FiCreditCard className="w-5 h-5" />,
    },
  ];

  const toggleMobileMenu = () => {
    setMobileOpen((prev) => !prev);
  };

  // Close mobile menu when route changes
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [pathname, isMobile]);

  return (
    <>
      {/* Mobile menu button */}
      {isMobile && (
        <button
          onClick={toggleMobileMenu}
          className="fixed top-4 left-4 z-50 p-2 rounded-md bg-blue-600 text-white shadow-lg lg:hidden"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      )}

      {/* Overlay for mobile */}
      {mobileOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-white dark:bg-gray-800 shadow-lg
          transition-transform duration-200 ease-in-out z-50 border-r border-gray-200 dark:border-gray-700
          ${mobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0 lg:w-64"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center">
              <img
                src={Logo}
                alt="Admin Panel Logo"
                height={30}
                width={120}
                className="object-contain dark:filter dark:brightness-0 dark:invert"
              />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {menuItems.map((item) => {
                if (item.isParent) {
                  return (
                    <li key={item.name}>
                      <button
                        onClick={() => setExpandOrders(!expandOrders)}
                        className={`
                          w-full flex items-center justify-between px-4 py-3 rounded-lg
                          text-sm font-medium transition-colors
                          ${
                            pathname.includes("/admin/orders")
                              ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }
                        `}
                      >
                        <div className="flex items-center">
                          <span className="mr-3">{item.icon}</span>
                          <span>{item.name}</span>
                        </div>
                        <span>
                          {expandOrders ? <FiChevronDown /> : <FiChevronRight />}
                        </span>
                      </button>

                      {expandOrders && (
                        <ul className="ml-8 mt-1 space-y-1">
                          {item.subItems.map((sub) => (
                            <li key={sub.name}>
                              <Link
                                to={sub.path}
                                className={`
                                  block px-4 py-2 text-sm rounded-lg transition-colors
                                  ${
                                    pathname === sub.path
                                      ? "bg-blue-50 dark:bg-blue-800/50 text-blue-700 dark:text-blue-200"
                                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  }
                                `}
                              >
                                {sub.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                }

                return (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      className={`
                        flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors
                        ${
                          pathname.startsWith(item.path)
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }
                      `}
                    >
                      <span className="mr-3">{item.icon}</span>
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FiLogOut className="mr-3" />
              Logout
            </button>

            <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
              <p>v1.0.0</p>
              <p className="mt-1">© {new Date().getFullYear()}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
