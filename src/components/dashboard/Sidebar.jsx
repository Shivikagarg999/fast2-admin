import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Logo from "../../../src/assets/images/logo.png";
import usePermissions from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../config/permissions";
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
  FiGift,
  FiShoppingCart,
  FiFileText,
  FiShield,
  FiDollarSign,
  FiClock,
  FiChevronRight,
  FiTrendingUp,
  FiBriefcase,
  FiBarChart2,
  FiSettings,
  FiLayers,
  FiBell,
  FiMail,
} from "react-icons/fi";

const Sidebar = ({ isOpen, onClose, darkMode, toggleTheme }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const { isSuperAdmin, hasPermission } = usePermissions();

  const [expandOrders, setExpandOrders] = useState(false);
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    if (pathname.includes("/admin/orders")) {
      setExpandOrders(true);
    }

    // Set active category based on current path
    for (const category of allMenuCategories) {
      if (category.items.some(item => pathname.startsWith(item.path))) {
        setActiveCategory(category.name);
        break;
      }
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const allMenuCategories = [
    {
      name: "Overview",
      icon: <FiHome className="w-3.5 h-3.5" />,
      items: [
        {
          name: "Dashboard",
          path: "/dashboard",
          icon: <FiBarChart2 className="w-4 h-4" />,
          permission: PERMISSIONS.DASHBOARD_VIEW,
        },
      ]
    },
    {
      name: "Management",
      icon: <FiBriefcase className="w-3.5 h-3.5" />,
      items: [
        {
          name: "Users",
          path: "/admin/users",
          icon: <FiUsers className="w-4 h-4" />,
          permission: PERMISSIONS.USERS_VIEW,
        },
        {
          name: "Products",
          path: "/admin/products",
          icon: <FiShoppingBag className="w-4 h-4" />,
          permission: PERMISSIONS.PRODUCTS_VIEW,
        },
        {
          name: "Categories",
          path: "/admin/categories",
          icon: <FiLayers className="w-4 h-4" />,
          permission: PERMISSIONS.CATEGORIES_VIEW,
        },
      ]
    },
    {
      name: "Operations",
      icon: <FiPackage className="w-3.5 h-3.5" />,
      items: [
        {
          name: "Orders",
          icon: <FiPackage className="w-4 h-4" />,
          path: "/admin/orders",
          permission: PERMISSIONS.ORDERS_VIEW,
        },
        {
          name: "Online payments",
          icon: <FiPackage className="w-4 h-4" />,
          path: "/admin/online-pay",
          permission: PERMISSIONS.ORDERS_VIEW,
        },
        {
          name: "Delivery Agents",
          path: "/admin/drivers",
          icon: <FiTruck className="w-4 h-4" />,
          permission: PERMISSIONS.DRIVERS_VIEW,
        },
        {
          name: "Warehouses",
          path: "/admin/warehouses",
          icon: <FiArchive className="w-4 h-4" />,
          permission: PERMISSIONS.WAREHOUSES_VIEW,
        },
      ]
    },
    {
      name: "Marketing",
      icon: <FiTrendingUp className="w-3.5 h-3.5" />,
      items: [
        {
          name: "Discounts",
          path: "/admin/discounts",
          icon: <FiGift className="w-4 h-4" />,
          permission: PERMISSIONS.DISCOUNTS_VIEW,
        },
        {
          name: "Coupon Codes",
          path: "/admin/coupons",
          icon: <FiTag className="w-4 h-4" />,
          permission: PERMISSIONS.COUPONS_VIEW,
        },
        {
          name: "Banners",
          path: "/admin/banners",
          icon: <FiImage className="w-4 h-4" />,
          permission: PERMISSIONS.BANNERS_VIEW,
        },
        {
          name: "Popups",
          path: "/admin/popups",
          icon: <FiBell className="w-4 h-4" />,
          permission: PERMISSIONS.POPUPS_VIEW,
        },
        {
          name: "Scratch Cards",
          path: "/admin/scratch-cards",
          icon: <FiGift className="w-4 h-4" />,
          permission: PERMISSIONS.PRODUCTS_VIEW,
        }
      ]
    },
    {
      name: "Business",
      icon: <FiBriefcase className="w-3.5 h-3.5" />,
      items: [
        {
          name: "Sellers",
          path: "/admin/sellers",
          icon: <FiShoppingCart className="w-4 h-4" />,
          permission: PERMISSIONS.SELLERS_VIEW,
        },
        {
          name: "Shops",
          path: "/admin/shops",
          icon: <FiBriefcase className="w-4 h-4" />,
          permission: PERMISSIONS.SHOPS_VIEW,
        },
        {
          name: "Promotors",
          path: "/admin/promotors",
          icon: <FiUserCheck className="w-4 h-4" />,
          permission: PERMISSIONS.PROMOTORS_VIEW,
        },
      ]
    },
    {
      name: "Finance",
      icon: <FiDollarSign className="w-3.5 h-3.5" />,
      items: [
        {
          name: "Promotor Payouts",
          path: "/admin/payouts/promotors",
          icon: <FiDollarSign className="w-4 h-4" />,
          permission: PERMISSIONS.PROMOTORS_VIEW,
        },
        {
          name: "Seller Payouts",
          path: "/admin/payouts/sellers",
          icon: <FiDollarSign className="w-4 h-4" />,
          permission: PERMISSIONS.SELLERS_VIEW,
        },
        {
          name: "Driver Payouts",
          path: "/admin/payouts/driver",
          icon: <FiDollarSign className="w-4 h-4" />
        },
      ]
    },
    {
      name: "Support",
      icon: <FiMail className="w-3.5 h-3.5" />,
      items: [
        {
          name: "Contact Us",
          path: "/admin/contacts",
          icon: <FiMail className="w-4 h-4" />,
          permission: PERMISSIONS.CONTACTS_VIEW,
        }
      ]
    },
    {
      name: "Legal",
      icon: <FiFileText className="w-3.5 h-3.5" />,
      items: [
        {
          name: "Policies",
          path: "/admin/terms",
          icon: <FiFileText className="w-4 h-4" />,
          permission: PERMISSIONS.TERMS_VIEW,
        }
      ]
    },
    ...(isSuperAdmin() ? [{
      name: "System",
      icon: <FiSettings className="w-3.5 h-3.5" />,
      items: [
        {
          name: "Admin Management",
          path: "/admin/admins",
          icon: <FiShield className="w-4 h-4" />,
          permission: null,
        },
        {
          name: "Role Management",
          path: "/admin/roles",
          icon: <FiShield className="w-4 h-4" />,
          permission: null,
        },
      ]
    }] : [])
  ];

  // Filter menu items based on permissions
  const menuCategories = useMemo(() => {
    return allMenuCategories
      .map(category => ({
        ...category,
        items: category.items.filter(item => {
          if (!item.permission) return true;
          return hasPermission(item.permission);
        })
      }))
      .filter(category => category.items.length > 0);
  }, [hasPermission, isSuperAdmin]);

  const handleLinkClick = () => {
    if (window.innerWidth < 1024 && onClose) {
      onClose();
    }
  };

  return (
    <>
      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.3) transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 2px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.2);
          border-radius: 2px;
          transition: background-color 0.2s ease;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.35);
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:active {
          background: rgba(100, 116, 139, 0.5);
        }

        .sidebar-gradient {
          background: #ffffff;
        }

        .active-item-glow {
          box-shadow: 0 4px 12px -2px rgba(59, 130, 246, 0.35), 0 2px 6px -1px rgba(59, 130, 246, 0.2);
        }

        .hover-glow:hover {
          box-shadow: 0 2px 8px -2px rgba(59, 130, 246, 0.15);
        }
        
        .text-2xs {
          font-size: 0.65rem;
          line-height: 1rem;
        }
      `}</style>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50
          sidebar-gradient
          shadow-md shadow-gray-200/80
          border-r border-gray-200
          transition-all duration-300 ease-in-out
          w-64
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header with Logo */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <Link
              to="/dashboard"
              className="flex items-center justify-center"
              onClick={handleLinkClick}
            >
              <div className="relative">
                <img
                  src={Logo}
                  alt="Enterprise Admin Panel"
                  height={28}
                  width={120}
                  className="object-contain transition-all duration-300 hover:scale-105 brightness-110"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              </div>
            </Link>
            <div className="mt-3 hidden lg:flex items-center justify-center space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-2xs font-medium text-emerald-600">System Active</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar py-4 px-3 space-y-1">
            {menuCategories.map((category) => (
              <div key={category.name} className="space-y-1.5 mb-4">
                {/* Category Header */}
                <div className="px-3 py-1.5 flex items-center">
                  <div className="mr-1.5 text-indigo-400">{category.icon}</div>
                  <h3 className="text-2xs font-bold text-indigo-400 uppercase tracking-widest truncate">
                    {category.name}
                  </h3>
                  {activeCategory === category.name && (
                    <div className="ml-auto w-1 h-3 bg-blue-500 rounded-full"></div>
                  )}
                </div>

                {/* Category Items */}
                <div className="space-y-0.5">
                  {category.items.map((item) => {
                    if (item.isParent) {
                      const isOrdersActive = pathname.includes("/admin/orders");

                      return (
                        <div key={item.name} className="space-y-1">
                          <button
                            onClick={() => setExpandOrders(!expandOrders)}
                            className={`
                              w-full flex items-center justify-between px-3 py-2.5 rounded-lg
                              text-sm font-medium transition-all duration-200
                              border border-transparent
                              ${isOrdersActive
                                ? "bg-blue-600 text-white border-blue-600 active-item-glow"
                                : "text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover-glow hover:border-blue-100"
                              }
                              focus:outline-none focus:ring-1 focus:ring-blue-500/30
                              active:scale-[0.98]
                            `}
                          >
                            <div className="flex items-center">
                              <span className={`mr-2.5 flex-shrink-0 ${isOrdersActive ? "text-white" : "text-blue-400"}`}>
                                {item.icon}
                              </span>
                              <span className="truncate text-sm">{item.name}</span>
                            </div>
                            <span className={`flex-shrink-0 transition-all duration-200 ${expandOrders ? 'rotate-180' : 'rotate-0'
                              } ${isOrdersActive ? "text-white" : "text-gray-400"}`}>
                              <FiChevronDown className="w-3.5 h-3.5" />
                            </span>
                          </button>

                          <div className={`
                            overflow-hidden transition-all duration-300 ease-in-out
                            ${expandOrders ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}
                          `}>
                            <div className="ml-3 pl-3 border-l-2 border-blue-200 space-y-0.5 py-0.5">
                              {item.subItems?.map((sub) => {
                                const isSubActive = pathname === sub.path;
                                return (
                                  <Link
                                    key={sub.name}
                                    to={sub.path}
                                    onClick={handleLinkClick}
                                    className={`
                                      block px-3 py-2 text-sm rounded-lg transition-all duration-200
                                      border border-transparent
                                      ${isSubActive
                                        ? "bg-blue-600 text-white border-blue-600 font-medium active-item-glow"
                                        : "text-gray-500 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-100"
                                      }
                                      focus:outline-none focus:ring-1 focus:ring-blue-500/30
                                      active:scale-[0.98]
                                    `}
                                  >
                                    <div className="flex items-center">
                                      <FiChevronRight className={`w-2.5 h-2.5 mr-2 ${isSubActive ? "text-white" : "text-blue-300"}`} />
                                      <span className="truncate text-sm">{sub.name}</span>
                                    </div>
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
                          flex items-center px-3 py-2.5 rounded-lg text-sm font-medium 
                          transition-all duration-200
                          border border-transparent
                          ${isActive
                            ? "bg-blue-600 text-white border-blue-600 active-item-glow"
                            : "text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover-glow hover:border-blue-100"
                          }
                          focus:outline-none focus:ring-1 focus:ring-blue-500/30
                          active:scale-[0.98]
                          group
                        `}
                      >
                        <span className={`
                          mr-2.5 flex-shrink-0 transition-colors duration-200
                          ${isActive ? "text-white" : "text-blue-400 group-hover:text-blue-500"}
                        `}>
                          {item.icon}
                        </span>
                        <span className="truncate text-sm">{item.name}</span>
                        {isActive && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse flex-shrink-0"></div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <button
              onClick={() => {
                handleLogout();
                handleLinkClick();
              }}
              className="w-full flex items-center justify-center px-3 py-2.5 rounded-lg text-sm font-medium
                bg-red-50
                text-red-600 hover:text-red-700 hover:bg-red-100
                border border-red-200 hover:border-red-300
                transition-all duration-200
                focus:outline-none focus:ring-1 focus:ring-red-500/30
                active:scale-[0.98]
                group"
            >
              <FiLogOut className="mr-2.5 flex-shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />
              <span>Logout</span>
            </button>

            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="text-center space-y-1">
                <p className="text-2xs font-medium text-gray-400">v2.1.0</p>
                <p className="text-2xs text-gray-400">
                  © {new Date().getFullYear()}
                </p>
                <div className="flex items-center justify-center space-x-1 mt-1.5">
                  <div className="w-1 h-1 rounded-full bg-emerald-500/50"></div>
                  <div className="w-1 h-1 rounded-full bg-blue-500/50"></div>
                  <div className="w-1 h-1 rounded-full bg-purple-500/50"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;