import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Logo from "../../assets/images/logo.png";
import usePermissions from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../config/permissions";
import {
  FiHome,
  FiUsers,
  FiPackage,
  FiTruck,
  FiCreditCard,
  FiSmartphone,
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
  FiTrendingUp,
  FiBriefcase,
  FiBarChart2,
  FiSettings,
  FiLayers,
  FiGrid,
  FiBell,
  FiMail,
  FiLock,
  FiMessageCircle,
  FiClock,
  FiCalendar,
} from "react-icons/fi";

const Sidebar = ({ isOpen, onClose, isCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const { isSuperAdmin, hasPermission } = usePermissions();

  const [expandedCategories, setExpandedCategories] = useState(new Set());

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
        {
          name: "Analytics",
          path: "/admin/analytics",
          icon: <FiBarChart2 className="w-4 h-4" />,
          permission: PERMISSIONS.DASHBOARD_VIEW,
        },
        {
          name: "Reports",
          path: "/admin/reports",
          icon: <FiBarChart2 className="w-4 h-4" />,
          permission: PERMISSIONS.REPORTS_VIEW,
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
          name: "Referrals",
          path: "/admin/referrals",
          icon: <FiGift className="w-4 h-4" />,
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
        {
          name: "Subcategories",
          path: "/admin/subcategories",
          icon: <FiGrid className="w-4 h-4" />,
          permission: PERMISSIONS.SUBCATEGORIES_VIEW,
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
          name: "Marketing Hub",
          path: "/admin/marketing",
          icon: <FiTrendingUp className="w-4 h-4" />,
          permission: PERMISSIONS.MARKETING_VIEW,
        },
        {
          name: "Social Posts & AI",
          path: "/admin/marketing?tab=posts",
          icon: <FiImage className="w-4 h-4" />,
          permission: PERMISSIONS.MARKETING_VIEW,
        },
        {
          name: "Auto-Post Scheduler",
          path: "/admin/marketing?tab=autopost",
          icon: <FiClock className="w-4 h-4" />,
          permission: PERMISSIONS.MARKETING_VIEW,
        },
        {
          name: "Scheduled Posts Queue",
          path: "/admin/marketing?tab=scheduled",
          icon: <FiCalendar className="w-4 h-4" />,
          permission: PERMISSIONS.MARKETING_VIEW,
        },
        {
          name: "WhatsApp Inbox",
          path: "/admin/marketing?tab=whatsapp",
          icon: <FiMessageCircle className="w-4 h-4" />,
          permission: PERMISSIONS.WHATSAPP_VIEW,
        },
        {
          name: "Notifications",
          path: "/admin/marketing?tab=notifications",
          icon: <FiBell className="w-4 h-4" />,
          permission: PERMISSIONS.POPUPS_VIEW,
        },
        {
          name: "Coupon Codes",
          path: "/admin/marketing?tab=coupons",
          icon: <FiTag className="w-4 h-4" />,
          permission: PERMISSIONS.COUPONS_VIEW,
        },
        {
          name: "Banners",
          path: "/admin/marketing?tab=banners",
          icon: <FiImage className="w-4 h-4" />,
          permission: PERMISSIONS.BANNERS_VIEW,
        },
        {
          name: "Discounts",
          path: "/admin/discounts",
          icon: <FiGift className="w-4 h-4" />,
          permission: PERMISSIONS.DISCOUNTS_VIEW,
        },
        {
          name: "Home Sections",
          path: "/admin/home-sections",
          icon: <FiGrid className="w-4 h-4" />,
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
          icon: <FiDollarSign className="w-4 h-4" />,
          permission: PERMISSIONS.DRIVERS_VIEW,
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
        {
          name: "Password Management",
          path: "/admin/passwords",
          icon: <FiLock className="w-4 h-4" />,
          permission: null,
        },
        {
          name: "Payment Settings",
          path: "/admin/payment-settings",
          icon: <FiCreditCard className="w-4 h-4" />,
          permission: null,
        },
        {
          name: "App Version / Force Update",
          path: "/admin/app-version",
          icon: <FiSmartphone className="w-4 h-4" />,
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

  // Only the category containing the current page starts expanded —
  // everything else stays collapsed so the sidebar shows section
  // headers instead of every item at once.
  useEffect(() => {
    for (const category of menuCategories) {
      if (category.items.some(item => pathname.startsWith(item.path))) {
        setExpandedCategories(prev => new Set(prev).add(category.name));
        break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleCategory = (name) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

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
          background: #f3bf2e;
        }

        .active-item-glow {
          box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.18), 0 2px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .hover-glow:hover {
          box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.08);
        }

        .text-2xs {
          font-size: 0.65rem;
          line-height: 1rem;
        }
      `}</style>

      {/* Mobile backdrop — dims the page and lets you tap outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50
          sidebar-gradient
          shadow-lg shadow-black/10
          transition-all duration-300 ease-in-out
          w-[85vw] max-w-64
          ${isCollapsed ? 'lg:w-16' : 'lg:w-64'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header with Logo */}
          <div className="p-4">
            {!isCollapsed ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center justify-center"
                  onClick={handleLinkClick}
                >
                  <div className="bg-white rounded-2xl shadow-sm px-4 py-2.5 w-full flex items-center justify-center">
                    <img
                      src={Logo}
                      alt="GMKart Admin"
                      height={28}
                      width={110}
                      className="object-contain transition-all duration-300 hover:scale-105"
                    />
                  </div>
                </Link>
                <div className="mt-3 hidden lg:flex items-center justify-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></div>
                  <span className="text-2xs font-semibold text-black/70">System Active</span>
                </div>
              </>
            ) : (
              <Link to="/dashboard" className="flex items-center justify-center py-1" onClick={handleLinkClick}>
                <div className="bg-white rounded-xl p-2 shadow-sm">
                  <FiHome className="w-5 h-5 text-black" />
                </div>
              </Link>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar py-4 px-3 space-y-1">
            {menuCategories.map((category) => {
              const isCategoryActive = category.items.some(item => pathname.startsWith(item.path));
              const isExpanded = expandedCategories.has(category.name);
              const showItems = isCollapsed || isExpanded;

              return (
                <div key={category.name} className="space-y-1.5 mb-2">
                  {/* Category Header — click to expand/collapse its items */}
                  {!isCollapsed && (
                    <button
                      type="button"
                      onClick={() => toggleCategory(category.name)}
                      className="w-full px-3 py-1.5 flex items-center group focus:outline-none"
                    >
                      <div className="mr-1.5 text-black/50">{category.icon}</div>
                      <h3 className="text-2xs font-bold text-black/50 uppercase tracking-widest truncate">
                        {category.name}
                      </h3>
                      {isCategoryActive && (
                        <div className="ml-2 w-1 h-3 bg-black rounded-full flex-shrink-0"></div>
                      )}
                      <span
                        className={`ml-auto flex-shrink-0 text-black/40 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : 'rotate-0'
                        }`}
                      >
                        <FiChevronDown className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  )}

                  {/* Category Items */}
                  <div
                    className={`
                      overflow-hidden transition-all duration-300 ease-in-out
                      ${showItems ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}
                    `}
                  >
                    <div className="space-y-0.5">
                      {category.items.map((item) => {
                        const [itemBase, itemQuery] = item.path.split('?');
                        const isActive = itemQuery
                          ? (pathname === itemBase && location.search.includes(itemQuery))
                          : (pathname === item.path && !location.search) || (item.path !== '/dashboard' && pathname.startsWith(item.path) && !location.search);
                        return (
                          <Link
                            key={item.name}
                            to={item.path}
                            onClick={handleLinkClick}
                            title={isCollapsed ? item.name : undefined}
                            className={`
                              flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 rounded-lg text-sm font-medium
                              transition-all duration-200
                              border border-transparent
                              ${isActive
                                ? "bg-white text-black border-white active-item-glow"
                                : "text-black/75 hover:bg-white/40 hover:text-black hover-glow hover:border-white/50"
                              }
                              focus:outline-none focus:ring-1 focus:ring-black/20
                              active:scale-[0.98]
                              group
                            `}
                          >
                            <span className={`
                              ${isCollapsed ? '' : 'mr-2.5'} flex-shrink-0 transition-colors duration-200
                              ${isActive ? "text-black" : "text-black/60 group-hover:text-black"}
                            `}>
                              {item.icon}
                            </span>
                            {!isCollapsed && <span className="truncate text-sm">{item.name}</span>}
                            {!isCollapsed && isActive && (
                              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse flex-shrink-0"></div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-black/10">
            <button
              onClick={() => {
                handleLogout();
                handleLinkClick();
              }}
              title={isCollapsed ? 'Logout' : undefined}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-center px-3'} py-2.5 rounded-full text-sm font-semibold
                bg-black text-white hover:bg-gray-900
                transition-all duration-200
                focus:outline-none focus:ring-1 focus:ring-black/30
                active:scale-[0.98]
                group`}
            >
              <FiLogOut className={`${isCollapsed ? '' : 'mr-2.5'} flex-shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5`} />
              {!isCollapsed && <span>Log out</span>}
            </button>

            {!isCollapsed && (
              <div className="mt-3 text-center">
                <p className="text-2xs font-medium text-black/40">v2.1.0 · © {new Date().getFullYear()}</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
