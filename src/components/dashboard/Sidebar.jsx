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
  FiUserCheck,
  FiShoppingBag,
  FiArchive,
  FiImage,
  FiTag,
  FiGift
} from "react-icons/fi";

const Sidebar = ({ isOpen, onClose, darkMode, toggleTheme }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const [expandOrders, setExpandOrders] = useState(false);

  useEffect(() => {
    if (pathname.includes("/admin/orders")) {
      setExpandOrders(true);
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const menuCategories = [
    {
      name: "Overview",
      items: [
        {
          name: "Dashboard",
          path: "/dashboard",
          icon: <FiHome className="w-5 h-5" />,
        },
      ]
    },
    {
      name: "Management",
      items: [
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
          icon: <FiArchive className="w-5 h-5" />,
        },
      ]
    },
    {
      name: "Orders & Operations",
      items: [
        {
          name: "Orders",
          icon: <FiPackage className="w-5 h-5" />,
          path: "/admin/orders",
        },
        {
          name: "Delivery Agents",
          path: "/admin/drivers",
          icon: <FiTruck className="w-5 h-5" />,
        },
        {
          name: "Warehouses",
          path: "/admin/warehouses",
          icon: <FiArchive className="w-5 h-5" />,
        },
      ]
    },
    {
      name: "Marketing",
      items: [
        {
          name: "Promotions",
          path: "/admin/promotions",
          icon: <FiGift className="w-5 h-5" />,
        },
        {
          name: "Coupon Codes",
          path: "/admin/coupons",
          icon: <FiTag className="w-5 h-5" />,
        },
        {
          name: "Banners",
          path: "/admin/banners",
          icon: <FiImage className="w-5 h-5" />,
        },
      ]
    },
    {
      name: "Business",
      items: [
        {
          name: "Promotors",
          path: "/admin/promotors",
          icon: <FiUserCheck className="w-5 h-5" />,
        },
        {
          name: "Payments",
          path: "/admin/payments",
          icon: <FiCreditCard className="w-5 h-5" />,
        },
      ]
    }
  ];

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (window.innerWidth < 1024 && onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #4B5563 #1F2937;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1F2937;
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4B5563;
          border-radius: 3px;
          transition: background-color 0.2s ease;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6B7280;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:active {
          background: #9CA3AF;
        }
      `}</style>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50
          bg-gray-900 
          shadow-2xl
          border-r border-gray-700
          transition-transform duration-300 ease-in-out
          w-64
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header with Logo */}
          <div className="p-4 border-b border-gray-700 bg-gray-800">
            <Link
              to="/dashboard"
              className="flex items-center justify-center lg:justify-start"
              onClick={handleLinkClick}
            >
              <img
                src={Logo}
                alt="Admin Panel Logo"
                height={32}
                width={128}
                className="object-contain transition-all duration-200 hover:scale-105"
              />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar py-4 px-2 space-y-6">
            {menuCategories.map((category) => (
              <div key={category.name} className="space-y-2">
                {/* Category Header */}
                <div className="px-4 py-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {category.name}
                  </h3>
                </div>

                {/* Category Items */}
                <div className="space-y-1">
                  {category.items.map((item) => {
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
                                ? "bg-blue-600 text-white shadow-md"
                                : "text-gray-300 hover:bg-gray-800 hover:text-white"
                              }
                              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
                              active:scale-[0.98]
                            `}
                          >
                            <div className="flex items-center">
                              <span className="mr-3 flex-shrink-0">{item.icon}</span>
                              <span className="truncate">{item.name}</span>
                            </div>
                            <span className={`flex-shrink-0 transition-transform duration-200 ${expandOrders ? 'rotate-180' : 'rotate-0'
                              }`}>
                              <FiChevronDown className="w-4 h-4" />
                            </span>
                          </button>

                          <div className={`
                            overflow-hidden transition-all duration-300 ease-in-out
                            ${expandOrders ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}
                          `}>
                            <div className="ml-4 pl-4 border-l-2 border-gray-700 space-y-1 py-1">
                              {item.subItems.map((sub) => {
                                const isSubActive = pathname === sub.path;
                                return (
                                  <Link
                                    key={sub.name}
                                    to={sub.path}
                                    onClick={handleLinkClick}
                                    className={`
                                      block px-4 py-2.5 text-sm rounded-lg transition-all duration-200
                                      ${isSubActive
                                        ? "bg-blue-500 text-white font-medium shadow-sm border-l-2 border-blue-400"
                                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                                      }
                                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
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
                        onClick={handleLinkClick}
                        className={`
                          flex items-center px-4 py-3 rounded-lg text-sm font-medium 
                          transition-all duration-200
                          ${isActive
                            ? "bg-blue-600 text-white shadow-md"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                          }
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
                          active:scale-[0.98]
                        `}
                      >
                        <span className="mr-3 flex-shrink-0">{item.icon}</span>
                        <span className="truncate">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-gray-700 bg-gray-800">
            <button
              onClick={() => {
                handleLogout();
                handleLinkClick();
              }}
              className="w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium 
                text-red-400 hover:bg-red-900/20 hover:text-red-300
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900
                active:scale-[0.98]"
            >
              <FiLogOut className="mr-3 flex-shrink-0" />
              <span>Logout</span>
            </button>

            <div className="mt-4 text-center text-xs text-gray-500">
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