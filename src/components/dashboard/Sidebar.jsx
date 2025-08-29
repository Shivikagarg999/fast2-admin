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
  FiShoppingBag,
  FiMenu,
  FiX,
} from "react-icons/fi";

const Sidebar = ({ darkMode, toggleTheme }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const [expandOrders, setExpandOrders] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false); 

  // Detect screen size for mobile view
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Auto-expand orders if we're on any order page
  useEffect(() => {
    if (pathname.includes("/admin/orders")) {
      setExpandOrders(true);
    }
  }, [pathname]);

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
      name: "Products",
      path: "/admin/products",
      icon: <FiShoppingBag className="w-5 h-5" />,
    },
     {
      name: "Categories",
      path: "/admin/categories",
      icon: <FiShoppingBag className="w-5 h-5" />,
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

  const handleMobileNavClick = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Close mobile menu when route changes
  useEffect(() => {
    if (isMobile && mobileOpen) {
      setMobileOpen(false);
    }
  }, [pathname, isMobile, mobileOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileOpen, isMobile]);

  return (
    <>
      {/* Mobile Toggle Button - Fixed position, always rendered */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className={`fixed top-4 left-4 z-[60] rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
          isMobile ? 'block' : 'hidden'
        }`}
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-40 lg:hidden transition-opacity duration-200"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50
          bg-white dark:bg-gray-900 
          shadow-xl dark:shadow-2xl
          border-r border-gray-200 dark:border-gray-700
          transition-all duration-300 ease-in-out
          ${isMobile 
            ? `w-80 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`
            : 'w-64 translate-x-0'
          }
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header with Logo */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <Link 
              to="/dashboard" 
              className="flex items-center justify-center lg:justify-start"
              onClick={handleMobileNavClick}
            >
              <img
                src={Logo}
                alt="Admin Panel Logo"
                height={32}
                width={128}
                className="object-contain transition-all duration-200 hover:scale-105"
                style={{
                  filter: darkMode ? 'brightness(0) invert(1)' : 'none'
                }}
              />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
            {menuItems.map((item) => {
              if (item.isParent) {
                const isOrdersActive = pathname.includes("/admin/orders");
                
                return (
                  <div key={item.name} className="space-y-1">
                    <button
                      onClick={() => setExpandOrders(!expandOrders)}
                      className={`
                        w-full flex items-center justify-between px-4 py-3 rounded-lg
                        text-sm font-medium transition-all duration-200
                        ${isOrdersActive
                          ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 shadow-sm"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                        }
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
                        active:scale-[0.98]
                      `}
                    >
                      <div className="flex items-center">
                        <span className="mr-3 flex-shrink-0">{item.icon}</span>
                        <span className="truncate">{item.name}</span>
                      </div>
                      <span className={`flex-shrink-0 transition-transform duration-200 ${
                        expandOrders ? 'rotate-180' : 'rotate-0'
                      }`}>
                        <FiChevronDown className="w-4 h-4" />
                      </span>
                    </button>

                    <div className={`
                      overflow-hidden transition-all duration-300 ease-in-out
                      ${expandOrders ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}
                    `}>
                      <div className="ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-1 py-1">
                        {item.subItems.map((sub) => {
                          const isSubActive = pathname === sub.path;
                          return (
                            <Link
                              key={sub.name}
                              to={sub.path}
                              onClick={handleMobileNavClick}
                              className={`
                                block px-4 py-2.5 text-sm rounded-lg transition-all duration-200
                                ${isSubActive
                                  ? "bg-blue-50 dark:bg-blue-800/30 text-blue-700 dark:text-blue-200 font-medium shadow-sm border-l-2 border-blue-500"
                                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                                }
                                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
                                active:scale-[0.98]
                              `}
                            >
                              <span className="truncate">{sub.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              const isActive = pathname.startsWith(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={handleMobileNavClick}
                  className={`
                    flex items-center px-4 py-3 rounded-lg text-sm font-medium 
                    transition-all duration-200
                    ${isActive
                      ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 shadow-sm"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                    }
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
                    active:scale-[0.98]
                  `}
                >
                  <span className="mr-3 flex-shrink-0">{item.icon}</span>
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <button
              onClick={() => {
                handleLogout();
                handleMobileNavClick();
              }}
              className="w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium 
                text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
                active:scale-[0.98]"
            >
              <FiLogOut className="mr-3 flex-shrink-0" />
              <span>Logout</span>
            </button>

            {/* Theme toggle button */}
            {toggleTheme && (
              <button
                onClick={toggleTheme}
                className="w-full flex items-center px-4 py-2 mt-2 rounded-lg text-xs
                  text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                <span className="mr-2">{darkMode ? '☀️' : '🌙'}</span>
                <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            )}

            <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
              <p>v1.0.0</p>
              <p className="mt-1">© {new Date().getFullYear()}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Spacer for desktop to prevent content overlap */}
      {!isMobile && <div className="w-64 flex-shrink-0" />}
    </>
  );
};

export default Sidebar;