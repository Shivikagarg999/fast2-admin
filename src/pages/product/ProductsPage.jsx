import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  FiEdit,
  FiTrash2,
  FiPlus,
  FiPackage,
  FiX,
  FiShoppingCart,
  FiTrendingUp,
  FiDollarSign,
  FiBox,
  FiEye,
  FiBarChart2,
  FiGrid,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { Editor } from "@tinymce/tinymce-react";
import usePermissions from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../config/permissions";

const ProductsPage = () => {
  const { hasPermission } = usePermissions();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState({});
  const [allCategories, setAllCategories] = useState([]);
  const [promotors, setPromotors] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [activeTab, setActiveTab] = useState("products");
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [viewMode, setViewMode] = useState("table");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productOrders, setProductOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    brand: "",
    category: "",
    price: "",
    oldPrice: "",
    discountPercentage: "",
    hsnCode: "",
    gstPercent: "",
    taxType: "inclusive",
    unit: "piece",
    unitValue: "",
    promotor: "",
    commissionRate: "",
    commissionType: "percentage",
    commissionAmount: "",
    quantity: "",
    minOrderQuantity: "1",
    maxOrderQuantity: "10",
    stockStatus: "out-of-stock",
    lowStockThreshold: "10",
    weight: "",
    weightUnit: "g",
    dimensions: {
      length: "",
      width: "",
      height: "",
      unit: "cm",
    },
    warehouseId: "",
    warehouseCode: "",
    storageType: "",
    estimatedDeliveryTime: "",
    deliveryCharges: "0",
    freeDeliveryThreshold: "0",
    availablePincodes: [],
    serviceablePincodes: [],
    video: {
      url: "",
      thumbnail: "",
      duration: "",
      fileSize: "",
    },
    isActive: true,
    variants: [],
  });

  const [newPincode, setNewPincode] = useState("");
  const [newServiceablePincode, setNewServiceablePincode] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);

  const commonVariantTypes = [
    {
      name: "Color",
      options: ["Red", "Blue", "Green", "Black", "White", "Yellow"],
    },
    { name: "Size", options: ["S", "M", "L", "XL", "XXL"] },
    {
      name: "Material",
      options: ["Cotton", "Polyester", "Silk", "Wool", "Linen"],
    },
    { name: "Storage", options: ["64GB", "128GB", "256GB", "512GB", "1TB"] },
    { name: "Style", options: ["Classic", "Modern", "Vintage", "Sport"] },
  ];

  const PRODUCTS_PER_PAGE = 10;

  useEffect(() => {
    fetchProducts();
    fetchPromotors();
    fetchWarehouses();
    fetchAllCategories();
  }, []);

  const fetchPromotors = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/promotor/`
      );
      setPromotors(response.data || []);
    } catch (error) {
      console.error("Error fetching promotors:", error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/warehouse/`
      );
      setWarehouses(response.data || []);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };

  const fetchAllCategories = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/category/getall`
      );
      setAllCategories(response.data || []);

      const categoryMap = {};
      response.data.forEach((cat) => {
        categoryMap[cat._id] = cat.name;
      });
      setCategories(categoryMap);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/product/get-products-admin`
      );

      let productsArray = [];

      if (Array.isArray(response.data)) {
        productsArray = response.data;
      } else if (response.data && Array.isArray(response.data.products)) {
        productsArray = response.data.products;
      } else if (response.data && Array.isArray(response.data.data)) {
        productsArray = response.data.data;
      } else {
        console.warn("Unexpected API response structure:", response.data);
        productsArray = [];
      }

      setProducts(productsArray);

      const categoryMap = {};
      productsArray.forEach((product) => {
        if (product.category && product.category._id) {
          categoryMap[product.category._id] = product.category.name;
        }
      });

      setCategories(categoryMap);
    } catch (error) {
      console.error("Error fetching products:", error);
      alert("Failed to fetch products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch product status
  const fetchProductStatus = async (productId) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/product/${productId}/status`
      );
      if (response.data.success) {
        return response.data.isActive;
      }
      return null;
    } catch (error) {
      console.error("Error fetching product status:", error);
      return null;
    }
  };

  const toggleProductStatus = async (productId, currentStatus) => {
    try {
      if (currentStatus) {
        const confirmDeactivate = window.confirm(
          "Are you sure you want to deactivate this product? Deactivated products will not be visible to customers."
        );
        if (!confirmDeactivate) return;
      }

      const response = await axios.patch(
        `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/product/${productId}/toggle-active`
      );

      if (response.data.success) {
        alert(response.data.message);

        setProducts((prevProducts) =>
          prevProducts.map((product) =>
            product._id === productId
              ? {
                  ...product,
                  isActive: !currentStatus,
                  ...(response.data.product
                    ? {
                        stockStatus: response.data.product.stockStatus,
                      }
                    : {}),
                }
              : product
          )
        );
      }
    } catch (error) {
      console.error("Error toggling product status:", error);
      alert(
        "Error toggling product status: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const fetchProductAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/product/orders/stats/orders?limit=50`
      );
      setAnalyticsData(response.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      alert("Failed to fetch analytics data");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchProductOrders = async (productId) => {
    try {
      setOrdersLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/product/orders/${productId}/orders`
      );
      setProductOrders(response.data.orders || []);
    } catch (error) {
      console.error("Error fetching product orders:", error);
      setProductOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const openProductView = async (product) => {
    setSelectedProduct(product);
    await fetchProductOrders(product._id);
  };

  const closeProductView = () => {
    setSelectedProduct(null);
    setProductOrders([]);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      brand: "",
      category: "",
      price: "",
      oldPrice: "",
      discountPercentage: "",
      hsnCode: "",
      gstPercent: "",
      taxType: "inclusive",
      unit: "piece",
      unitValue: "",
      promotor: "",
      commissionRate: "",
      commissionType: "percentage",
      commissionAmount: "",
      quantity: "",
      minOrderQuantity: "1",
      maxOrderQuantity: "10",
      stockStatus: "out-of-stock",
      lowStockThreshold: "10",
      weight: "",
      weightUnit: "g",
      dimensions: {
        length: "",
        width: "",
        height: "",
        unit: "cm",
      },
      warehouseId: "",
      warehouseCode: "",
      storageType: "",
      estimatedDeliveryTime: "",
      deliveryCharges: "0",
      freeDeliveryThreshold: "0",
      availablePincodes: [],
      serviceablePincodes: [],
      video: {
        url: "",
        thumbnail: "",
        duration: "",
        fileSize: "",
      },
      isActive: true,
      variants: [],
    });
    setImagePreview("");
    setImageFile(null);
    setVideoFile(null);
    setNewPincode("");
    setNewServiceablePincode("");
  };

  const openAddModal = () => {
    if (!hasPermission(PERMISSIONS.PRODUCTS_CREATE)) {
      alert("You don't have permission to create products");
      return;
    }
    navigate("/admin/createProduct");
  };

  const openEditModal = (product) => {
    if (!hasPermission(PERMISSIONS.PRODUCTS_EDIT)) {
      alert("You don't have permission to edit products");
      return;
    }
    const productData = {
      name: product.name || "",
      description: product.description || "",
      brand: product.brand || "",
      category: product.category?._id || product.category || "",
      price: product.price || "",
      oldPrice: product.oldPrice || "",
      discountPercentage: product.discountPercentage || "",
      hsnCode: product.hsnCode || "",
      gstPercent: product.gstPercent || "",
      taxType: product.taxType || "inclusive",
      unit: product.unit || "piece",
      unitValue: product.unitValue || "",
      promotor: product.promotor?.id || "",
      commissionRate: product.promotor?.commissionRate || "",
      commissionType: product.promotor?.commissionType || "percentage",
      commissionAmount: product.promotor?.commissionAmount || "",
      quantity: product.quantity || "",
      minOrderQuantity: product.minOrderQuantity || "1",
      maxOrderQuantity: product.maxOrderQuantity || "10",
      stockStatus: product.stockStatus || "out-of-stock",
      lowStockThreshold: product.lowStockThreshold || "10",
      weight: product.weight || "",
      weightUnit: product.weightUnit || "g",
      dimensions: product.dimensions || {
        length: "",
        width: "",
        height: "",
        unit: "cm",
      },
      warehouseId: product.warehouse?.id || "",
      warehouseCode: product.warehouse?.code || "",
      storageType: product.warehouse?.storageType || "",
      estimatedDeliveryTime: product.delivery?.estimatedDeliveryTime || "",
      deliveryCharges: product.delivery?.deliveryCharges || "0",
      freeDeliveryThreshold: product.delivery?.freeDeliveryThreshold || "0",
      availablePincodes: product.delivery?.availablePincodes || [],
      serviceablePincodes: product.serviceablePincodes || [],
      video: product.video || {
        url: "",
        thumbnail: "",
        duration: "",
        fileSize: "",
      },
      isActive: product.isActive !== undefined ? product.isActive : true,
      variants: product.variants || [],
    };

    setFormData(productData);
    setImagePreview(
      (product.images && product.images[0] && product.images[0].url) || ""
    );
    setEditingProduct(product);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    resetForm();
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNestedInputChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleDescriptionChange = (content) => {
    setFormData((prev) => ({
      ...prev,
      description: content,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
    }
  };

  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          name: "",
          options: [{ value: "", price: "", quantity: "", sku: "" }],
        },
      ],
    }));
  };

  const removeVariant = (index) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const updateVariantName = (index, name) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((variant, i) =>
        i === index ? { ...variant, name } : variant
      ),
    }));
  };

  const addVariantOption = (variantIndex) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((variant, i) =>
        i === variantIndex
          ? {
              ...variant,
              options: [
                ...variant.options,
                { value: "", price: "", quantity: "", sku: "" },
              ],
            }
          : variant
      ),
    }));
  };

  const removeVariantOption = (variantIndex, optionIndex) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((variant, i) =>
        i === variantIndex
          ? {
              ...variant,
              options: variant.options.filter((_, j) => j !== optionIndex),
            }
          : variant
      ),
    }));
  };

  const updateVariantOption = (variantIndex, optionIndex, field, value) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((variant, i) =>
        i === variantIndex
          ? {
              ...variant,
              options: variant.options.map((option, j) =>
                j === optionIndex ? { ...option, [field]: value } : option
              ),
            }
          : variant
      ),
    }));
  };

  const applyCommonVariant = (variantType) => {
    const variant = commonVariantTypes.find((v) => v.name === variantType);
    if (variant) {
      setFormData((prev) => ({
        ...prev,
        variants: [
          ...prev.variants,
          {
            name: variant.name,
            options: variant.options.map((opt) => ({
              value: opt,
              price: "",
              quantity: "",
              sku: "",
            })),
          },
        ],
      }));
    }
  };

  const addPincode = (type) => {
    const pincode = type === "available" ? newPincode : newServiceablePincode;
    const field =
      type === "available" ? "availablePincodes" : "serviceablePincodes";

    if (pincode && !formData[field].includes(pincode)) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...prev[field], pincode],
      }));
      if (type === "available") setNewPincode("");
      else setNewServiceablePincode("");
    }
  };

  const removePincode = (pincode, type) => {
    const field =
      type === "available" ? "availablePincodes" : "serviceablePincodes";
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((p) => p !== pincode),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const submitData = new FormData();

      Object.keys(formData).forEach((key) => {
        if (
          key === "availablePincodes" ||
          key === "serviceablePincodes" ||
          key === "variants"
        ) {
          submitData.append(key, JSON.stringify(formData[key]));
        } else if (key === "dimensions" || key === "video") {
          submitData.append(key, JSON.stringify(formData[key]));
        } else if (key === "image" && imageFile) {
          submitData.append("images", imageFile);
        } else if (key === "videoFile" && videoFile) {
          submitData.append("video", videoFile);
        } else if (
          formData[key] !== null &&
          formData[key] !== undefined &&
          formData[key] !== ""
        ) {
          submitData.append(key, formData[key]);
        }
      });

      await axios.put(
        `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/product/${editingProduct._id}`,
        submitData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      alert("Product updated successfully!");
      closeModal();
      fetchProducts();
    } catch (error) {
      console.error("Error updating product:", error);
      alert(
        "Error updating product: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (productId, productName) => {
    if (!hasPermission(PERMISSIONS.PRODUCTS_DELETE)) {
      alert("You don't have permission to delete products");
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${productName}"?`)) {
      try {
        await axios.delete(`${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/product/${productId}`);
        alert("Product deleted successfully!");
        fetchProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
        alert(
          "Error deleting product: " +
            (error.response?.data?.message || error.message)
        );
      }
    }
  };

  const getStatusBadge = (stock) => {
    if (stock === 0)
      return (
        <span
          style={{
            padding: "4px 8px",
            fontSize: "12px",
            fontWeight: "500",
            borderRadius: "9999px",
            backgroundColor: "#fee2e2",
            color: "#dc2626",
          }}
        >
          Out of Stock
        </span>
      );
    if (stock < 10)
      return (
        <span
          style={{
            padding: "4px 8px",
            fontSize: "12px",
            fontWeight: "500",
            borderRadius: "9999px",
            backgroundColor: "#fef3c7",
            color: "#d97706",
          }}
        >
          Low Stock
        </span>
      );
    return (
      <span
        style={{
          padding: "4px 8px",
          fontSize: "12px",
          fontWeight: "500",
          borderRadius: "9999px",
          backgroundColor: "#dcfce7",
          color: "#16a34a",
        }}
      >
        In Stock
      </span>
    );
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const stripHtml = (html) => {
    if (!html) return "";
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        (p.name?.toLowerCase().includes(search.toLowerCase()) ||
          (categories[p.category] || "")
            .toLowerCase()
            .includes(search.toLowerCase())) &&
        (categoryFilter ? p.category === categoryFilter : true)
    );
  }, [products, search, categoryFilter, categories]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const indexOfLastProduct = currentPage * PRODUCTS_PER_PAGE;
  const indexOfFirstProduct = indexOfLastProduct - PRODUCTS_PER_PAGE;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  const buttonStyles = {
    primary: {
      backgroundColor: "#000000",
      color: "#ffffff",
      border: "none",
      borderRadius: "8px",
      padding: "8px 16px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    secondary: {
      backgroundColor: "#ffffff",
      color: "#374151",
      border: "1px solid #d1d5db",
      borderRadius: "8px",
      padding: "8px 16px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    danger: {
      backgroundColor: "#dc2626",
      color: "#ffffff",
      border: "none",
      borderRadius: "8px",
      padding: "8px 16px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    success: {
      backgroundColor: "#16a34a",
      color: "#ffffff",
      border: "none",
      borderRadius: "8px",
      padding: "8px 16px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    outline: {
      backgroundColor: "transparent",
      color: "#3b82f6",
      border: "1px solid #3b82f6",
      borderRadius: "8px",
      padding: "8px 16px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
  };

  return (
    <div
      style={{ backgroundColor: "#f3f4f6", minHeight: "100vh", width: "100%" }}
      className="dark:bg-gray-900"
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FiPackage
                style={{ width: "24px", height: "24px", color: "#2563eb" }}
              />
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#111827",
                }}
                className="dark:text-white"
              >
                Products Management
              </h1>
            </div>

            <div
              style={{
                display: "flex",
                gap: "16px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <button
                onClick={() => setActiveTab("products")}
                style={{
                  ...buttonStyles.secondary,
                  border: "none",
                  borderBottom:
                    activeTab === "products"
                      ? "2px solid #000000"
                      : "2px solid transparent",
                  borderRadius: "0",
                  backgroundColor: "transparent",
                  color: activeTab === "products" ? "#000000" : "#6b7280",
                }}
              >
                <FiPackage style={{ width: "16px", height: "16px" }} />
                Products
              </button>
              <button
                onClick={() => {
                  setActiveTab("analytics");
                  fetchProductAnalytics();
                }}
                style={{
                  ...buttonStyles.secondary,
                  border: "none",
                  borderBottom:
                    activeTab === "analytics"
                      ? "2px solid #000000"
                      : "2px solid transparent",
                  borderRadius: "0",
                  backgroundColor: "transparent",
                  color: activeTab === "analytics" ? "#000000" : "#6b7280",
                }}
              >
                <FiBarChart2 style={{ width: "16px", height: "16px" }} />
                Analytics
              </button>
            </div>
          </div>

          {activeTab === "products" && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <span
                    style={{
                      padding: "4px 8px",
                      fontSize: "12px",
                      backgroundColor: "#e5e7eb",
                      color: "#374151",
                      borderRadius: "9999px",
                    }}
                    className="dark:bg-gray-700 dark:text-gray-300"
                  >
                    {filteredProducts.length} items
                  </span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => setViewMode("table")}
                      style={{
                        ...buttonStyles.secondary,
                        backgroundColor:
                          viewMode === "table" ? "#000000" : "#ffffff",
                        color: viewMode === "table" ? "#ffffff" : "#374151",
                      }}
                    >
                      Table
                    </button>
                    <button
                      onClick={() => setViewMode("grid")}
                      style={{
                        ...buttonStyles.secondary,
                        backgroundColor:
                          viewMode === "grid" ? "#000000" : "#ffffff",
                        color: viewMode === "grid" ? "#ffffff" : "#374151",
                      }}
                    >
                      <FiGrid style={{ width: "16px", height: "16px" }} />
                      Grid
                    </button>
                  </div>
                </div>
                {hasPermission(PERMISSIONS.PRODUCTS_CREATE) && (
                  <button onClick={openAddModal} style={buttonStyles.primary}>
                    <FiPlus style={{ width: "16px", height: "16px" }} />
                    Add Product
                  </button>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  marginBottom: "24px",
                }}
                className="sm:flex-row"
              >
                <div style={{ flex: "1" }}>
                  <input
                    type="text"
                    placeholder="Search products by name or category..."
                    style={{
                      width: "100%",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      backgroundColor: "#ffffff",
                      color: "#111827",
                    }}
                    className="dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div style={{ width: "192px" }}>
                  <select
                    style={{
                      width: "100%",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      backgroundColor: "#ffffff",
                      color: "#111827",
                    }}
                    className="dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {allCategories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {viewMode === "table" ? (
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "8px",
                    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                    overflow: "hidden",
                  }}
                  className="dark:bg-gray-800"
                >
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{ width: "100%" }}
                      className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
                    >
                      <thead
                        style={{ backgroundColor: "#f9fafb" }}
                        className="dark:bg-gray-900"
                      >
                        <tr>
                          <th
                            style={{
                              padding: "12px 24px",
                              textAlign: "left",
                              fontSize: "12px",
                              fontWeight: "500",
                              color: "#6b7280",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                            className="dark:text-gray-400"
                          >
                            Product
                          </th>
                          <th
                            style={{
                              padding: "12px 24px",
                              textAlign: "left",
                              fontSize: "12px",
                              fontWeight: "500",
                              color: "#6b7280",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                            className="dark:text-gray-400"
                          >
                            Category
                          </th>
                          <th
                            style={{
                              padding: "12px 24px",
                              textAlign: "left",
                              fontSize: "12px",
                              fontWeight: "500",
                              color: "#6b7280",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                            className="dark:text-gray-400"
                          >
                            Price
                          </th>
                          <th
                            style={{
                              padding: "12px 24px",
                              textAlign: "left",
                              fontSize: "12px",
                              fontWeight: "500",
                              color: "#6b7280",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                            className="dark:text-gray-400"
                          >
                            Stock
                          </th>
                          <th
                            style={{
                              padding: "12px 24px",
                              textAlign: "center",
                              fontSize: "12px",
                              fontWeight: "500",
                              color: "#6b7280",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                            className="dark:text-gray-400"
                          >
                            Status
                          </th>
                          <th
                            style={{
                              padding: "12px 24px",
                              textAlign: "center",
                              fontSize: "12px",
                              fontWeight: "500",
                              color: "#6b7280",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                            className="dark:text-gray-400"
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {currentProducts.map((product) => (
                          <tr
                            key={product._id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <td style={{ padding: "16px 24px" }}>
                              {/* Product info remains the same */}
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <img
                                  src={
                                    (product.images &&
                                      product.images[0] &&
                                      product.images[0].url) ||
                                    "https://via.placeholder.com/40?text=No+Image"
                                  }
                                  alt={product.name}
                                  style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "6px",
                                    objectFit: "cover",
                                    marginRight: "12px",
                                  }}
                                  onError={(e) => {
                                    e.target.src =
                                      "https://via.placeholder.com/40?text=No+Image";
                                  }}
                                />
                                <div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      fontWeight: "500",
                                      color: "#111827",
                                    }}
                                    className="dark:text-white"
                                  >
                                    {product.name || "-"}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      color: "#6b7280",
                                      overflow: "hidden",
                                      display: "-webkit-box",
                                      WebkitLineClamp: 1,
                                      WebkitBoxOrient: "vertical",
                                    }}
                                    className="dark:text-gray-400"
                                  >
                                    {stripHtml(product.description || "")}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td
                              style={{
                                padding: "16px 24px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <span
                                style={{
                                  padding: "4px 8px",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  borderRadius: "6px",
                                  backgroundColor: "#f3f4f6",
                                  color: "#374151",
                                }}
                                className="dark:bg-gray-700 dark:text-gray-200"
                              >
                                {product.category && product.category._id
                                  ? categories[product.category._id] ||
                                    product.category.name ||
                                    "Uncategorized"
                                  : "Uncategorized"}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "16px 24px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <div
                                style={{ fontSize: "14px", color: "#111827" }}
                                className="dark:text-white"
                              >
                                {formatPrice(product.price)}
                                {product.oldPrice && (
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      color: "#6b7280",
                                      textDecoration: "line-through",
                                    }}
                                    className="dark:text-gray-400"
                                  >
                                    {formatPrice(product.oldPrice)}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td
                              style={{
                                padding: "16px 24px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                {getStatusBadge(product.quantity)}
                                <span
                                  style={{ fontSize: "14px", color: "#6b7280" }}
                                  className="dark:text-gray-400"
                                >
                                  ({product.quantity})
                                </span>
                              </div>
                            </td>
                            {/* Enhanced Status Column */}
                            <td
                              style={{
                                padding: "16px 24px",
                                whiteSpace: "nowrap",
                                textAlign: "center",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <button
                                  onClick={() =>
                                    toggleProductStatus(
                                      product._id,
                                      product.isActive
                                    )
                                  }
                                  style={{
                                    padding: "6px 12px",
                                    fontSize: "12px",
                                    fontWeight: "500",
                                    borderRadius: "6px",
                                    border: "none",
                                    cursor: "pointer",
                                    backgroundColor: product.isActive
                                      ? "#dcfce7"
                                      : "#fee2e2",
                                    color: product.isActive
                                      ? "#16a34a"
                                      : "#dc2626",
                                    transition: "all 0.2s",
                                    minWidth: "80px",
                                  }}
                                  className="hover:opacity-80"
                                  title={
                                    product.isActive
                                      ? "Click to deactivate"
                                      : "Click to activate"
                                  }
                                >
                                  {product.isActive ? "Active" : "Inactive"}
                                </button>
                              </div>
                            </td>
                            <td
                              style={{
                                padding: "16px 24px",
                                whiteSpace: "nowrap",
                                textAlign: "center",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "8px",
                                }}
                              >
                                <button
                                  onClick={() => openProductView(product)}
                                  style={{
                                    color: "#10b981",
                                    padding: "4px",
                                    borderRadius: "4px",
                                  }}
                                  className="hover:text-green-700"
                                  title="View Product"
                                >
                                  <FiEye
                                    style={{ width: "16px", height: "16px" }}
                                  />
                                </button>
                                {hasPermission(PERMISSIONS.PRODUCTS_EDIT) && (
                                  <button
                                    onClick={() => openEditModal(product)}
                                    style={{
                                      color: "#3b82f6",
                                      padding: "4px",
                                      borderRadius: "4px",
                                    }}
                                    className="hover:text-blue-700"
                                    title="Edit Product"
                                  >
                                    <FiEdit
                                      style={{ width: "16px", height: "16px" }}
                                    />
                                  </button>
                                )}
                                {hasPermission(PERMISSIONS.PRODUCTS_DELETE) && (
                                  <button
                                    onClick={() =>
                                      handleDelete(product._id, product.name)
                                    }
                                    style={{
                                      color: "#ef4444",
                                      padding: "4px",
                                      borderRadius: "4px",
                                    }}
                                    className="hover:text-red-700"
                                    title="Delete Product"
                                  >
                                    <FiTrash2
                                      style={{ width: "16px", height: "16px" }}
                                    />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: "24px",
                  }}
                >
                  {currentProducts.map((product) => (
                    <div
                      key={product._id}
                      style={{
                        backgroundColor: "#ffffff",
                        borderRadius: "12px",
                        padding: "16px",
                        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                      }}
                      className="dark:bg-gray-800"
                    >
                      <img
                        src={
                          (product.images &&
                            product.images[0] &&
                            product.images[0].url) ||
                          "https://via.placeholder.com/300x200?text=No+Image"
                        }
                        alt={product.name}
                        style={{
                          width: "100%",
                          height: "200px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          marginBottom: "12px",
                        }}
                      />
                      <h3
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#111827",
                          marginBottom: "8px",
                        }}
                        className="dark:text-white"
                      >
                        {product.name}
                      </h3>
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#6b7280",
                          marginBottom: "12px",
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                        className="dark:text-gray-400"
                      >
                        {stripHtml(product.description || "")}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "12px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "18px",
                            fontWeight: "bold",
                            color: "#111827",
                          }}
                          className="dark:text-white"
                        >
                          {formatPrice(product.price)}
                        </span>
                        {getStatusBadge(product.quantity)}
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => openProductView(product)}
                          style={{
                            ...buttonStyles.outline,
                            flex: "1",
                            fontSize: "14px",
                            padding: "6px 12px",
                          }}
                        >
                          <FiEye style={{ width: "14px", height: "14px" }} />
                          View
                        </button>
                        {hasPermission(PERMISSIONS.PRODUCTS_EDIT) && (
                          <button
                            onClick={() => openEditModal(product)}
                            style={{
                              ...buttonStyles.primary,
                              flex: "1",
                              fontSize: "14px",
                              padding: "6px 12px",
                            }}
                          >
                            <FiEdit style={{ width: "14px", height: "14px" }} />
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: "24px",
                  }}
                >
                  <div
                    style={{ fontSize: "14px", color: "#374151" }}
                    className="dark:text-gray-300"
                  >
                    Showing {indexOfFirstProduct + 1} to{" "}
                    {Math.min(indexOfLastProduct, filteredProducts.length)} of{" "}
                    {filteredProducts.length} products
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      style={{
                        ...buttonStyles.secondary,
                        opacity: currentPage === 1 ? 0.5 : 1,
                        cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      }}
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          style={{
                            padding: "8px 12px",
                            fontSize: "14px",
                            borderRadius: "8px",
                            border: "1px solid #d1d5db",
                            backgroundColor:
                              currentPage === pageNum ? "#000000" : "#ffffff",
                            color:
                              currentPage === pageNum ? "#ffffff" : "#374151",
                            cursor: "pointer",
                          }}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      style={{
                        ...buttonStyles.secondary,
                        opacity: currentPage === totalPages ? 0.5 : 1,
                        cursor:
                          currentPage === totalPages
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "analytics" && (
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                padding: "24px",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
              }}
              className="dark:bg-gray-800"
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "24px",
                }}
              >
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: "600",
                    color: "#111827",
                  }}
                  className="dark:text-white"
                >
                  Product Analytics
                </h2>
                <button
                  onClick={fetchProductAnalytics}
                  style={buttonStyles.primary}
                >
                  <FiTrendingUp style={{ width: "16px", height: "16px" }} />
                  Refresh
                </button>
              </div>

              {analyticsLoading ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <div
                    style={{
                      animation: "spin 1s linear infinite",
                      borderRadius: "9999px",
                      width: "32px",
                      height: "32px",
                      borderBottom: "2px solid #2563eb",
                      margin: "0 auto 16px",
                    }}
                  ></div>
                  <span style={{ color: "#6b7280" }}>Loading analytics...</span>
                </div>
              ) : analyticsData ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "24px",
                    marginBottom: "32px",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "#f0f9ff",
                      padding: "20px",
                      borderRadius: "8px",
                      border: "1px solid #bae6fd",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "8px",
                      }}
                    >
                      <FiShoppingCart
                        style={{
                          width: "24px",
                          height: "24px",
                          color: "#0369a1",
                        }}
                      />
                      <h3
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#0369a1",
                        }}
                      >
                        Total Products
                      </h3>
                    </div>
                    <p
                      style={{
                        fontSize: "32px",
                        fontWeight: "bold",
                        color: "#0369a1",
                      }}
                    >
                      {analyticsData.pagination?.totalProducts || 0}
                    </p>
                  </div>

                  <div
                    style={{
                      backgroundColor: "#f0fdf4",
                      padding: "20px",
                      borderRadius: "8px",
                      border: "1px solid #bbf7d0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "8px",
                      }}
                    >
                      <FiTrendingUp
                        style={{
                          width: "24px",
                          height: "24px",
                          color: "#16a34a",
                        }}
                      />
                      <h3
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#16a34a",
                        }}
                      >
                        Best Seller
                      </h3>
                    </div>
                    <p
                      style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        color: "#16a34a",
                      }}
                    >
                      {analyticsData.products?.[0]?.name || "N/A"}
                    </p>
                    <p style={{ fontSize: "14px", color: "#15803d" }}>
                      {analyticsData.products?.[0]?.stats?.totalQuantitySold ||
                        0}{" "}
                      units sold
                    </p>
                  </div>

                  <div
                    style={{
                      backgroundColor: "#fef7ed",
                      padding: "20px",
                      borderRadius: "8px",
                      border: "1px solid #fed7aa",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "8px",
                      }}
                    >
                      <FiBox
                        style={{
                          width: "24px",
                          height: "24px",
                          color: "#ea580c",
                        }}
                      />
                      <h3
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#ea580c",
                        }}
                      >
                        Low Stock
                      </h3>
                    </div>
                    <p
                      style={{
                        fontSize: "32px",
                        fontWeight: "bold",
                        color: "#ea580c",
                      }}
                    >
                      {analyticsData.products?.filter(
                        (p) => p.quantity <= p.lowStockThreshold
                      ).length || 0}
                    </p>
                  </div>

                  <div
                    style={{
                      backgroundColor: "#fef2f2",
                      padding: "20px",
                      borderRadius: "8px",
                      border: "1px solid #fecaca",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "8px",
                      }}
                    >
                      <FiDollarSign
                        style={{
                          width: "24px",
                          height: "24px",
                          color: "#dc2626",
                        }}
                      />
                      <h3
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#dc2626",
                        }}
                      >
                        Out of Stock
                      </h3>
                    </div>
                    <p
                      style={{
                        fontSize: "32px",
                        fontWeight: "bold",
                        color: "#dc2626",
                      }}
                    >
                      {analyticsData.products?.filter((p) => p.quantity === 0)
                        .length || 0}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#6b7280",
                  }}
                >
                  <FiBarChart2
                    style={{
                      width: "48px",
                      height: "48px",
                      margin: "0 auto 16px",
                      color: "#9ca3af",
                    }}
                  />
                  <p>
                    No analytics data available. Click refresh to load data.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Edit Product Modal */}
        {showModal && (
          <div
            style={{
              position: "fixed",
              inset: "0",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: "50",
              padding: "16px",
            }}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                width: "100%",
                maxWidth: "1200px",
                maxHeight: "95vh",
                overflowY: "auto",
              }}
              className="dark:bg-gray-800"
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "24px",
                  borderBottom: "1px solid #e5e7eb",
                }}
                className="dark:border-gray-700"
              >
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: "600",
                    color: "#111827",
                  }}
                  className="dark:text-white"
                >
                  Edit Product
                </h2>
                <button
                  onClick={closeModal}
                  style={{
                    color: "#9ca3af",
                    padding: "4px",
                    borderRadius: "4px",
                  }}
                  className="hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FiX style={{ width: "24px", height: "24px" }} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                  }}
                >
                  {/* Basic Information */}
                  <div
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      paddingBottom: "24px",
                    }}
                    className="dark:border-gray-700"
                  >
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: "500",
                        color: "#111827",
                        marginBottom: "16px",
                      }}
                      className="dark:text-white"
                    >
                      Basic Information
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr",
                        gap: "16px",
                      }}
                      className="md:grid-cols-2"
                    >
                      <div className="md:col-span-2">
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          Product Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          Description
                        </label>
                        <Editor
                          apiKey="xw0haeefepmen4923ro5m463eb97qhseuprfkpbuan5t10u5"
                          value={formData.description}
                          onEditorChange={handleDescriptionChange}
                          init={{
                            height: 300,
                            menubar:
                              "file edit view insert format tools table help",
                            plugins: [
                              "advlist autolink lists link image charmap print preview anchor",
                              "searchreplace visualblocks code fullscreen",
                              "insertdatetime media table paste code help wordcount",
                            ],
                            toolbar:
                              "undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help | image",
                            content_style:
                              "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
                            skin: "oxide-dark",
                            content_css: "dark",
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          Brand *
                        </label>
                        <input
                          type="text"
                          name="brand"
                          value={formData.brand}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          Category *
                        </label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select Category</option>
                          {allCategories.map((category) => (
                            <option key={category._id} value={category._id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Tax */}
                  <div
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      paddingBottom: "24px",
                    }}
                    className="dark:border-gray-700"
                  >
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: "500",
                        color: "#111827",
                        marginBottom: "16px",
                      }}
                      className="dark:text-white"
                    >
                      Pricing & Tax Information
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr",
                        gap: "16px",
                      }}
                      className="md:grid-cols-3"
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          Price *
                        </label>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          Old Price
                        </label>
                        <input
                          type="number"
                          name="oldPrice"
                          value={formData.oldPrice}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          Discount %
                        </label>
                        <input
                          type="number"
                          name="discountPercentage"
                          value={formData.discountPercentage}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          HSN Code
                        </label>
                        <input
                          type="text"
                          name="hsnCode"
                          value={formData.hsnCode}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          GST %
                        </label>
                        <input
                          type="number"
                          name="gstPercent"
                          value={formData.gstPercent}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          Tax Type
                        </label>
                        <select
                          name="taxType"
                          value={formData.taxType}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="inclusive">Inclusive</option>
                          <option value="exclusive">Exclusive</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Unit & Measurement */}
                  <div
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      paddingBottom: "24px",
                    }}
                    className="dark:border-gray-700"
                  >
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: "500",
                        color: "#111827",
                        marginBottom: "16px",
                      }}
                      className="dark:text-white"
                    >
                      Unit & Measurement
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr",
                        gap: "16px",
                      }}
                      className="md:grid-cols-2"
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          Unit
                        </label>
                        <input
                          type="text"
                          name="unit"
                          value={formData.unit}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          Unit Value
                        </label>
                        <input
                          type="number"
                          name="unitValue"
                          value={formData.unitValue}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Promotor Commission */}
                  <div
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      paddingBottom: "24px",
                    }}
                    className="dark:border-gray-700"
                  >
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: "500",
                        color: "#111827",
                        marginBottom: "16px",
                      }}
                      className="dark:text-white"
                    >
                      Promotor Commission
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr",
                        gap: "16px",
                      }}
                      className="md:grid-cols-2"
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          Promotor
                        </label>
                        <select
                          name="promotor"
                          value={formData.promotor}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Promotor</option>
                          {promotors.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          Commission Type
                        </label>
                        <select
                          name="commissionType"
                          value={formData.commissionType}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="percentage">Percentage</option>
                          <option value="fixed">Fixed</option>
                        </select>
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          Commission Rate
                        </label>
                        <input
                          type="number"
                          name="commissionRate"
                          value={formData.commissionRate}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          Commission Amount
                        </label>
                        <input
                          type="number"
                          name="commissionAmount"
                          value={formData.commissionAmount}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Inventory Management */}
                  <div
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      paddingBottom: "24px",
                    }}
                    className="dark:border-gray-700"
                  >
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: "500",
                        color: "#111827",
                        marginBottom: "16px",
                      }}
                      className="dark:text-white"
                    >
                      Inventory Management
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr",
                        gap: "16px",
                      }}
                      className="md:grid-cols-3"
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          Quantity
                        </label>
                        <input
                          type="number"
                          name="quantity"
                          value={formData.quantity}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          Min Order Qty
                        </label>
                        <input
                          type="number"
                          name="minOrderQuantity"
                          value={formData.minOrderQuantity}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          Max Order Qty
                        </label>
                        <input
                          type="number"
                          name="maxOrderQuantity"
                          value={formData.maxOrderQuantity}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          Stock Status
                        </label>
                        <select
                          name="stockStatus"
                          value={formData.stockStatus}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="in-stock">In Stock</option>
                          <option value="out-of-stock">Out of Stock</option>
                        </select>
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          Low Stock Threshold
                        </label>
                        <input
                          type="number"
                          name="lowStockThreshold"
                          value={formData.lowStockThreshold}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Shipping & Dimensions */}
                  <div
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      paddingBottom: "24px",
                    }}
                    className="dark:border-gray-700"
                  >
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: "500",
                        color: "#111827",
                        marginBottom: "16px",
                      }}
                      className="dark:text-white"
                    >
                      Shipping & Dimensions
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr",
                        gap: "16px",
                      }}
                      className="md:grid-cols-2"
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          Weight
                        </label>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <input
                            type="number"
                            name="weight"
                            value={formData.weight}
                            onChange={handleInputChange}
                            style={{
                              flex: 1,
                              padding: "8px 12px",
                              border: "1px solid #d1d5db",
                              borderRadius: "6px",
                              backgroundColor: "#ffffff",
                              color: "#111827",
                            }}
                            className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <select
                            name="weightUnit"
                            value={formData.weightUnit}
                            onChange={handleInputChange}
                            style={{
                              width: "100px",
                              padding: "8px 12px",
                              border: "1px solid #d1d5db",
                              borderRadius: "6px",
                              backgroundColor: "#ffffff",
                              color: "#111827",
                            }}
                            className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                          >
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                            <option value="lb">lb</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          Dimensions (L × W × H)
                        </label>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <input
                            type="number"
                            value={formData.dimensions.length}
                            onChange={(e) =>
                              handleNestedInputChange(
                                "dimensions",
                                "length",
                                e.target.value
                              )
                            }
                            placeholder="L"
                            style={{
                              flex: 1,
                              padding: "8px 12px",
                              border: "1px solid #d1d5db",
                              borderRadius: "6px",
                              backgroundColor: "#ffffff",
                              color: "#111827",
                            }}
                            className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                          />
                          <input
                            type="number"
                            value={formData.dimensions.width}
                            onChange={(e) =>
                              handleNestedInputChange(
                                "dimensions",
                                "width",
                                e.target.value
                              )
                            }
                            placeholder="W"
                            style={{
                              flex: 1,
                              padding: "8px 12px",
                              border: "1px solid #d1d5db",
                              borderRadius: "6px",
                              backgroundColor: "#ffffff",
                              color: "#111827",
                            }}
                            className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                          />
                          <input
                            type="number"
                            value={formData.dimensions.height}
                            onChange={(e) =>
                              handleNestedInputChange(
                                "dimensions",
                                "height",
                                e.target.value
                              )
                            }
                            placeholder="H"
                            style={{
                              flex: 1,
                              padding: "8px 12px",
                              border: "1px solid #d1d5db",
                              borderRadius: "6px",
                              backgroundColor: "#ffffff",
                              color: "#111827",
                            }}
                            className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                          />
                          <select
                            value={formData.dimensions.unit}
                            onChange={(e) =>
                              handleNestedInputChange(
                                "dimensions",
                                "unit",
                                e.target.value
                              )
                            }
                            style={{
                              width: "100px",
                              padding: "8px 12px",
                              border: "1px solid #d1d5db",
                              borderRadius: "6px",
                              backgroundColor: "#ffffff",
                              color: "#111827",
                            }}
                            className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                          >
                            <option value="cm">cm</option>
                            <option value="m">m</option>
                            <option value="in">in</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Warehouse Information */}
                  <div
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      paddingBottom: "24px",
                    }}
                    className="dark:border-gray-700"
                  >
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: "500",
                        color: "#111827",
                        marginBottom: "16px",
                      }}
                      className="dark:text-white"
                    >
                      Warehouse Information
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr",
                        gap: "16px",
                      }}
                      className="md:grid-cols-3"
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          Warehouse
                        </label>
                        <select
                          name="warehouseId"
                          value={formData.warehouseId}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Warehouse</option>
                          {warehouses.map((w) => (
                            <option key={w._id} value={w._id}>
                              {w.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          Warehouse Code
                        </label>
                        <input
                          type="text"
                          name="warehouseCode"
                          value={formData.warehouseCode}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          Storage Type
                        </label>
                        <input
                          type="text"
                          name="storageType"
                          value={formData.storageType}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Delivery Information */}
                  <div
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      paddingBottom: "24px",
                    }}
                    className="dark:border-gray-700"
                  >
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: "500",
                        color: "#111827",
                        marginBottom: "16px",
                      }}
                      className="dark:text-white"
                    >
                      Delivery Information
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr",
                        gap: "16px",
                      }}
                      className="md:grid-cols-3"
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          Est. Delivery Time
                        </label>
                        <input
                          type="text"
                          name="estimatedDeliveryTime"
                          value={formData.estimatedDeliveryTime}
                          onChange={handleInputChange}
                          placeholder="e.g., 3-5 days"
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          Delivery Charges
                        </label>
                        <input
                          type="number"
                          name="deliveryCharges"
                          value={formData.deliveryCharges}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          Free Delivery Threshold
                        </label>
                        <input
                          type="number"
                          name="freeDeliveryThreshold"
                          value={formData.freeDeliveryThreshold}
                          onChange={handleInputChange}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Available Pincodes */}
                    <div style={{ marginTop: "16px" }}>
                      <label
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "#374151",
                          marginBottom: "8px",
                        }}
                        className="dark:text-gray-300"
                      >
                        Available Pincodes
                      </label>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <input
                          type="text"
                          value={newPincode}
                          onChange={(e) => setNewPincode(e.target.value)}
                          placeholder="Enter pincode"
                          style={{
                            flex: 1,
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => addPincode("available")}
                          style={{
                            ...buttonStyles.primary,
                            padding: "8px 16px",
                          }}
                        >
                          Add
                        </button>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}
                      >
                        {formData.availablePincodes.map((pin, idx) => (
                          <span
                            key={idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 8px",
                              backgroundColor: "#e0f2fe",
                              color: "#0369a1",
                              borderRadius: "6px",
                              fontSize: "14px",
                            }}
                          >
                            {pin}
                            <button
                              type="button"
                              onClick={() => removePincode(pin, "available")}
                              style={{ color: "#0369a1", fontWeight: "bold" }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Serviceable Pincodes */}
                  <div
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      paddingBottom: "24px",
                    }}
                    className="dark:border-gray-700"
                  >
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: "500",
                        color: "#111827",
                        marginBottom: "16px",
                      }}
                      className="dark:text-white"
                    >
                      Serviceable Pincodes
                    </h3>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginBottom: "8px",
                      }}
                    >
                      <input
                        type="text"
                        value={newServiceablePincode}
                        onChange={(e) =>
                          setNewServiceablePincode(e.target.value)
                        }
                        placeholder="Enter serviceable pincode"
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          backgroundColor: "#ffffff",
                          color: "#111827",
                        }}
                        className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => addPincode("serviceable")}
                        style={{ ...buttonStyles.primary, padding: "8px 16px" }}
                      >
                        Add
                      </button>
                    </div>
                    <div
                      style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                    >
                      {formData.serviceablePincodes.map((pin, idx) => (
                        <span
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 8px",
                            backgroundColor: "#dcfce7",
                            color: "#16a34a",
                            borderRadius: "6px",
                            fontSize: "14px",
                          }}
                        >
                          {pin}
                          <button
                            type="button"
                            onClick={() => removePincode(pin, "serviceable")}
                            style={{ color: "#16a34a", fontWeight: "bold" }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Images */}
                  <div
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      paddingBottom: "24px",
                    }}
                    className="dark:border-gray-700"
                  >
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: "500",
                        color: "#111827",
                        marginBottom: "16px",
                      }}
                      className="dark:text-white"
                    >
                      Product Images (Max 5)
                    </h3>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "#374151",
                          marginBottom: "8px",
                        }}
                        className="dark:text-gray-300"
                      >
                        Upload Image
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          backgroundColor: "#ffffff",
                          color: "#111827",
                        }}
                        className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      />
                      {imagePreview && (
                        <div style={{ marginTop: "12px" }}>
                          <img
                            src={imagePreview}
                            alt="Preview"
                            style={{
                              width: "200px",
                              height: "200px",
                              objectFit: "cover",
                              borderRadius: "8px",
                              border: "1px solid #d1d5db",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Video */}
                  <div
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      paddingBottom: "24px",
                    }}
                    className="dark:border-gray-700"
                  >
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: "500",
                        color: "#111827",
                        marginBottom: "16px",
                      }}
                      className="dark:text-white"
                    >
                      Product Video
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr",
                        gap: "16px",
                      }}
                      className="md:grid-cols-2"
                    >
                      <div className="md:col-span-2">
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          Upload Video
                        </label>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoChange}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          Video URL
                        </label>
                        <input
                          type="text"
                          value={formData.video.url}
                          onChange={(e) =>
                            handleNestedInputChange(
                              "video",
                              "url",
                              e.target.value
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          Thumbnail URL
                        </label>
                        <input
                          type="text"
                          value={formData.video.thumbnail}
                          onChange={(e) =>
                            handleNestedInputChange(
                              "video",
                              "thumbnail",
                              e.target.value
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          Duration (seconds)
                        </label>
                        <input
                          type="number"
                          value={formData.video.duration}
                          onChange={(e) =>
                            handleNestedInputChange(
                              "video",
                              "duration",
                              e.target.value
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#374151",
                            marginBottom: "8px",
                          }}
                          className="dark:text-gray-300"
                        >
                          File Size (MB)
                        </label>
                        <input
                          type="number"
                          value={formData.video.fileSize}
                          onChange={(e) =>
                            handleNestedInputChange(
                              "video",
                              "fileSize",
                              e.target.value
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            backgroundColor: "#ffffff",
                            color: "#111827",
                          }}
                          className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Product Variants */}
                  <div
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      paddingBottom: "24px",
                    }}
                    className="dark:border-gray-700"
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "16px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "18px",
                          fontWeight: "500",
                          color: "#111827",
                        }}
                        className="dark:text-white"
                      >
                        Product Variants
                      </h3>
                      <button
                        type="button"
                        onClick={addVariant}
                        style={{
                          ...buttonStyles.primary,
                          padding: "6px 12px",
                          fontSize: "14px",
                        }}
                      >
                        <FiPlus style={{ width: "14px", height: "14px" }} /> Add
                        Variant
                      </button>
                    </div>

                    {/* Quick Add Common Variants */}
                    <div style={{ marginBottom: "16px" }}>
                      <label
                        style={{
                          display: "block",
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "#374151",
                          marginBottom: "8px",
                        }}
                        className="dark:text-gray-300"
                      >
                        Quick Add:
                      </label>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}
                      >
                        {commonVariantTypes.map((vt) => (
                          <button
                            key={vt.name}
                            type="button"
                            onClick={() => applyCommonVariant(vt.name)}
                            style={{
                              ...buttonStyles.outline,
                              padding: "6px 12px",
                              fontSize: "13px",
                            }}
                          >
                            {vt.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {formData.variants.map((variant, vIndex) => (
                      <div
                        key={vIndex}
                        style={{
                          padding: "16px",
                          backgroundColor: "#f9fafb",
                          borderRadius: "8px",
                          marginBottom: "16px",
                        }}
                        className="dark:bg-gray-900"
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "12px",
                          }}
                        >
                          <input
                            type="text"
                            value={variant.name}
                            onChange={(e) =>
                              updateVariantName(vIndex, e.target.value)
                            }
                            placeholder="Variant name (e.g., Color, Size)"
                            style={{
                              flex: 1,
                              padding: "8px 12px",
                              border: "1px solid #d1d5db",
                              borderRadius: "6px",
                              backgroundColor: "#ffffff",
                              color: "#111827",
                              marginRight: "12px",
                            }}
                            className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                          />
                          <button
                            type="button"
                            onClick={() => removeVariant(vIndex)}
                            style={{
                              ...buttonStyles.danger,
                              padding: "6px 12px",
                            }}
                          >
                            <FiTrash2
                              style={{ width: "14px", height: "14px" }}
                            />
                          </button>
                        </div>

                        {variant.options.map((option, oIndex) => (
                          <div
                            key={oIndex}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
                              gap: "8px",
                              marginBottom: "8px",
                              alignItems: "center",
                            }}
                          >
                            <input
                              type="text"
                              value={option.value}
                              onChange={(e) =>
                                updateVariantOption(
                                  vIndex,
                                  oIndex,
                                  "value",
                                  e.target.value
                                )
                              }
                              placeholder="Option value"
                              style={{
                                padding: "8px 12px",
                                border: "1px solid #d1d5db",
                                borderRadius: "6px",
                                backgroundColor: "#ffffff",
                                color: "#111827",
                              }}
                              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            />
                            <input
                              type="number"
                              value={option.price}
                              onChange={(e) =>
                                updateVariantOption(
                                  vIndex,
                                  oIndex,
                                  "price",
                                  e.target.value
                                )
                              }
                              placeholder="Price"
                              style={{
                                padding: "8px 12px",
                                border: "1px solid #d1d5db",
                                borderRadius: "6px",
                                backgroundColor: "#ffffff",
                                color: "#111827",
                              }}
                              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            />
                            <input
                              type="number"
                              value={option.quantity}
                              onChange={(e) =>
                                updateVariantOption(
                                  vIndex,
                                  oIndex,
                                  "quantity",
                                  e.target.value
                                )
                              }
                              placeholder="Qty"
                              style={{
                                padding: "8px 12px",
                                border: "1px solid #d1d5db",
                                borderRadius: "6px",
                                backgroundColor: "#ffffff",
                                color: "#111827",
                              }}
                              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            />
                            <input
                              type="text"
                              value={option.sku}
                              onChange={(e) =>
                                updateVariantOption(
                                  vIndex,
                                  oIndex,
                                  "sku",
                                  e.target.value
                                )
                              }
                              placeholder="SKU"
                              style={{
                                padding: "8px 12px",
                                border: "1px solid #d1d5db",
                                borderRadius: "6px",
                                backgroundColor: "#ffffff",
                                color: "#111827",
                              }}
                              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                removeVariantOption(vIndex, oIndex)
                              }
                              style={{ color: "#ef4444", padding: "4px" }}
                            >
                              <FiX style={{ width: "16px", height: "16px" }} />
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => addVariantOption(vIndex)}
                          style={{
                            ...buttonStyles.secondary,
                            padding: "6px 12px",
                            fontSize: "13px",
                            marginTop: "8px",
                          }}
                        >
                          <FiPlus style={{ width: "14px", height: "14px" }} />{" "}
                          Add Option
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Active Status */}
                  <div style={{ paddingBottom: "24px" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        style={{
                          width: "16px",
                          height: "16px",
                          cursor: "pointer",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "#374151",
                        }}
                        className="dark:text-gray-300"
                      >
                        Product is Active
                      </span>
                    </label>
                  </div>

                  {/* Form Actions */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "end",
                      gap: "12px",
                      paddingTop: "24px",
                      borderTop: "1px solid #e5e7eb",
                    }}
                    className="dark:border-gray-700"
                  >
                    <button
                      type="button"
                      onClick={closeModal}
                      style={buttonStyles.secondary}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={modalLoading}
                      style={{
                        ...buttonStyles.primary,
                        opacity: modalLoading ? 0.5 : 1,
                        cursor: modalLoading ? "not-allowed" : "pointer",
                      }}
                    >
                      {modalLoading && (
                        <div
                          style={{
                            animation: "spin 1s linear infinite",
                            borderRadius: "9999px",
                            width: "16px",
                            height: "16px",
                            borderBottom: "2px solid #ffffff",
                          }}
                        ></div>
                      )}
                      Update Product
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Product View Modal */}

        {selectedProduct && (
          <div
            style={{
              position: "fixed",
              inset: "0",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: "50",
              padding: "16px",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                width: "100%",
                maxWidth: "1200px",
                maxHeight: "95vh",
                overflowY: "auto",
                marginTop: "20px",
                marginBottom: "20px",
              }}
              className="dark:bg-gray-800"
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "24px",
                  borderBottom: "1px solid #e5e7eb",
                  position: "sticky",
                  top: 0,
                  backgroundColor: "#ffffff",
                  zIndex: 10,
                }}
                className="dark:border-gray-700 dark:bg-gray-800"
              >
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: "600",
                    color: "#111827",
                  }}
                  className="dark:text-white"
                >
                  Product Details
                </h2>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={() => {
                      closeProductView();
                      openEditModal(selectedProduct);
                    }}
                    style={{ ...buttonStyles.primary, padding: "8px 16px" }}
                  >
                    <FiEdit style={{ width: "16px", height: "16px" }} /> Edit
                  </button>
                  <button
                    onClick={closeProductView}
                    style={{
                      color: "#9ca3af",
                      padding: "4px",
                      borderRadius: "4px",
                    }}
                    className="hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <FiX style={{ width: "24px", height: "24px" }} />
                  </button>
                </div>
              </div>

              <div style={{ padding: "24px" }}>
                {/* Main Product Info with Image */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: "24px",
                    marginBottom: "32px",
                  }}
                  className="lg:grid-cols-3"
                >
                  <div className="lg:col-span-1">
                    <img
                      src={
                        (selectedProduct.images &&
                          selectedProduct.images[0] &&
                          selectedProduct.images[0].url) ||
                        "https://via.placeholder.com/400x400?text=No+Image"
                      }
                      alt={selectedProduct.name}
                      style={{
                        width: "100%",
                        borderRadius: "12px",
                        objectFit: "cover",
                        border: "1px solid #e5e7eb",
                      }}
                      className="dark:border-gray-700"
                    />

                    {/* Additional Images */}
                    {selectedProduct.images &&
                      selectedProduct.images.length > 1 && (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4, 1fr)",
                            gap: "8px",
                            marginTop: "12px",
                          }}
                        >
                          {selectedProduct.images
                            .slice(1, 5)
                            .map((img, idx) => (
                              <img
                                key={idx}
                                src={img.url}
                                alt={img.altText || `Product ${idx + 2}`}
                                style={{
                                  width: "100%",
                                  height: "80px",
                                  objectFit: "cover",
                                  borderRadius: "8px",
                                  border: "1px solid #e5e7eb",
                                  cursor: "pointer",
                                }}
                                className="dark:border-gray-700"
                              />
                            ))}
                        </div>
                      )}
                  </div>

                  <div className="lg:col-span-2">
                    <h3
                      style={{
                        fontSize: "28px",
                        fontWeight: "bold",
                        color: "#111827",
                        marginBottom: "12px",
                      }}
                      className="dark:text-white"
                    >
                      {selectedProduct.name}
                    </h3>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "16px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "24px",
                          fontWeight: "bold",
                          color: "#111827",
                        }}
                        className="dark:text-white"
                      >
                        {formatPrice(selectedProduct.price)}
                      </span>
                      {selectedProduct.oldPrice &&
                        selectedProduct.oldPrice > 0 && (
                          <span
                            style={{
                              fontSize: "18px",
                              color: "#6b7280",
                              textDecoration: "line-through",
                            }}
                            className="dark:text-gray-400"
                          >
                            {formatPrice(selectedProduct.oldPrice)}
                          </span>
                        )}
                      {selectedProduct.discountPercentage > 0 && (
                        <span
                          style={{
                            padding: "4px 12px",
                            fontSize: "14px",
                            fontWeight: "600",
                            backgroundColor: "#dcfce7",
                            color: "#16a34a",
                            borderRadius: "6px",
                          }}
                        >
                          {selectedProduct.discountPercentage}% OFF
                        </span>
                      )}
                      {getStatusBadge(selectedProduct.quantity)}
                    </div>

                    {selectedProduct.description && (
                      <div
                        style={{
                          padding: "16px",
                          backgroundColor: "#f9fafb",
                          borderRadius: "8px",
                          marginBottom: "16px",
                          maxHeight: "150px",
                          overflowY: "auto",
                        }}
                        className="dark:bg-gray-900"
                      >
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#4b5563",
                            lineHeight: "1.6",
                          }}
                          className="dark:text-gray-300"
                          dangerouslySetInnerHTML={{
                            __html: selectedProduct.description,
                          }}
                        />
                      </div>
                    )}

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "16px",
                      }}
                      className="md:grid-cols-3"
                    >
                      <div
                        style={{
                          padding: "12px",
                          backgroundColor: "#f0f9ff",
                          borderRadius: "8px",
                        }}
                        className="dark:bg-blue-900/20"
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#0369a1",
                            fontWeight: "500",
                          }}
                          className="dark:text-blue-300"
                        >
                          Brand
                        </span>
                        <p
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#0c4a6e",
                            marginTop: "4px",
                          }}
                          className="dark:text-blue-200"
                        >
                          {selectedProduct.brand || "N/A"}
                        </p>
                      </div>
                      <div
                        style={{
                          padding: "12px",
                          backgroundColor: "#f0fdf4",
                          borderRadius: "8px",
                        }}
                        className="dark:bg-green-900/20"
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#16a34a",
                            fontWeight: "500",
                          }}
                          className="dark:text-green-300"
                        >
                          Category
                        </span>
                        <p
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#14532d",
                            marginTop: "4px",
                          }}
                          className="dark:text-green-200"
                        >
                          {selectedProduct.category?.name ||
                            categories[selectedProduct.category] ||
                            "N/A"}
                        </p>
                      </div>
                      <div
                        style={{
                          padding: "12px",
                          backgroundColor: "#fef3c7",
                          borderRadius: "8px",
                        }}
                        className="dark:bg-yellow-900/20"
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#d97706",
                            fontWeight: "500",
                          }}
                          className="dark:text-yellow-300"
                        >
                          Stock Quantity
                        </span>
                        <p
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#92400e",
                            marginTop: "4px",
                          }}
                          className="dark:text-yellow-200"
                        >
                          {selectedProduct.quantity} units
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Information Sections */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                  }}
                >
                  {/* Pricing & Tax Details */}
                  <div
                    style={{
                      backgroundColor: "#f9fafb",
                      padding: "20px",
                      borderRadius: "12px",
                    }}
                    className="dark:bg-gray-900"
                  >
                    <h4
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#111827",
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                      className="dark:text-white"
                    >
                      <FiDollarSign
                        style={{
                          width: "20px",
                          height: "20px",
                          color: "#2563eb",
                        }}
                      />{" "}
                      Pricing & Tax Information
                    </h4>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "16px",
                      }}
                      className="md:grid-cols-4"
                    >
                      <div>
                        <span
                          style={{ fontSize: "13px", color: "#6b7280" }}
                          className="dark:text-gray-400"
                        >
                          Current Price:
                        </span>
                        <p
                          style={{
                            fontSize: "15px",
                            fontWeight: "600",
                            color: "#111827",
                          }}
                          className="dark:text-white"
                        >
                          {formatPrice(selectedProduct.price)}
                        </p>
                      </div>
                      <div>
                        <span
                          style={{ fontSize: "13px", color: "#6b7280" }}
                          className="dark:text-gray-400"
                        >
                          Old Price:
                        </span>
                        <p
                          style={{
                            fontSize: "15px",
                            fontWeight: "600",
                            color: "#111827",
                          }}
                          className="dark:text-white"
                        >
                          {selectedProduct.oldPrice
                            ? formatPrice(selectedProduct.oldPrice)
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <span
                          style={{ fontSize: "13px", color: "#6b7280" }}
                          className="dark:text-gray-400"
                        >
                          Discount:
                        </span>
                        <p
                          style={{
                            fontSize: "15px",
                            fontWeight: "600",
                            color: "#111827",
                          }}
                          className="dark:text-white"
                        >
                          {selectedProduct.discountPercentage || 0}%
                        </p>
                      </div>
                      <div>
                        <span
                          style={{ fontSize: "13px", color: "#6b7280" }}
                          className="dark:text-gray-400"
                        >
                          HSN Code:
                        </span>
                        <p
                          style={{
                            fontSize: "15px",
                            fontWeight: "600",
                            color: "#111827",
                          }}
                          className="dark:text-white"
                        >
                          {selectedProduct.hsnCode || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span
                          style={{ fontSize: "13px", color: "#6b7280" }}
                          className="dark:text-gray-400"
                        >
                          GST:
                        </span>
                        <p
                          style={{
                            fontSize: "15px",
                            fontWeight: "600",
                            color: "#111827",
                          }}
                          className="dark:text-white"
                        >
                          {selectedProduct.gstPercent || 0}%
                        </p>
                      </div>
                      <div>
                        <span
                          style={{ fontSize: "13px", color: "#6b7280" }}
                          className="dark:text-gray-400"
                        >
                          Tax Type:
                        </span>
                        <p
                          style={{
                            fontSize: "15px",
                            fontWeight: "600",
                            color: "#111827",
                            textTransform: "capitalize",
                          }}
                          className="dark:text-white"
                        >
                          {selectedProduct.taxType || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span
                          style={{ fontSize: "13px", color: "#6b7280" }}
                          className="dark:text-gray-400"
                        >
                          Unit:
                        </span>
                        <p
                          style={{
                            fontSize: "15px",
                            fontWeight: "600",
                            color: "#111827",
                          }}
                          className="dark:text-white"
                        >
                          {selectedProduct.unit || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span
                          style={{ fontSize: "13px", color: "#6b7280" }}
                          className="dark:text-gray-400"
                        >
                          Unit Value:
                        </span>
                        <p
                          style={{
                            fontSize: "15px",
                            fontWeight: "600",
                            color: "#111827",
                          }}
                          className="dark:text-white"
                        >
                          {selectedProduct.unitValue || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Inventory Details */}
                  <div
                    style={{
                      backgroundColor: "#f9fafb",
                      padding: "20px",
                      borderRadius: "12px",
                    }}
                    className="dark:bg-gray-900"
                  >
                    <h4
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#111827",
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                      className="dark:text-white"
                    >
                      <FiBox
                        style={{
                          width: "20px",
                          height: "20px",
                          color: "#2563eb",
                        }}
                      />{" "}
                      Inventory Management
                    </h4>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "16px",
                      }}
                      className="md:grid-cols-5"
                    >
                      <div>
                        <span
                          style={{ fontSize: "13px", color: "#6b7280" }}
                          className="dark:text-gray-400"
                        >
                          Current Stock:
                        </span>
                        <p
                          style={{
                            fontSize: "15px",
                            fontWeight: "600",
                            color: "#111827",
                          }}
                          className="dark:text-white"
                        >
                          {selectedProduct.quantity} units
                        </p>
                      </div>
                      <div>
                        <span
                          style={{ fontSize: "13px", color: "#6b7280" }}
                          className="dark:text-gray-400"
                        >
                          Min Order Qty:
                        </span>
                        <p
                          style={{
                            fontSize: "15px",
                            fontWeight: "600",
                            color: "#111827",
                          }}
                          className="dark:text-white"
                        >
                          {selectedProduct.minOrderQuantity || 1}
                        </p>
                      </div>
                      <div>
                        <span
                          style={{ fontSize: "13px", color: "#6b7280" }}
                          className="dark:text-gray-400"
                        >
                          Max Order Qty:
                        </span>
                        <p
                          style={{
                            fontSize: "15px",
                            fontWeight: "600",
                            color: "#111827",
                          }}
                          className="dark:text-white"
                        >
                          {selectedProduct.maxOrderQuantity || 10}
                        </p>
                      </div>
                      <div>
                        <span
                          style={{ fontSize: "13px", color: "#6b7280" }}
                          className="dark:text-gray-400"
                        >
                          Stock Status:
                        </span>
                        <p
                          style={{
                            fontSize: "15px",
                            fontWeight: "600",
                            color: "#111827",
                            textTransform: "capitalize",
                          }}
                          className="dark:text-white"
                        >
                          {selectedProduct.stockStatus || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span
                          style={{ fontSize: "13px", color: "#6b7280" }}
                          className="dark:text-gray-400"
                        >
                          Low Stock Alert:
                        </span>
                        <p
                          style={{
                            fontSize: "15px",
                            fontWeight: "600",
                            color: "#111827",
                          }}
                          className="dark:text-white"
                        >
                          {selectedProduct.lowStockThreshold || 10} units
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Shipping & Dimensions */}
                  <div
                    style={{
                      backgroundColor: "#f9fafb",
                      padding: "20px",
                      borderRadius: "12px",
                    }}
                    className="dark:bg-gray-900"
                  >
                    <h4
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#111827",
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                      className="dark:text-white"
                    >
                      <FiPackage
                        style={{
                          width: "20px",
                          height: "20px",
                          color: "#2563eb",
                        }}
                      />{" "}
                      Shipping & Dimensions
                    </h4>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "16px",
                      }}
                      className="md:grid-cols-3"
                    >
                      <div>
                        <span
                          style={{ fontSize: "13px", color: "#6b7280" }}
                          className="dark:text-gray-400"
                        >
                          Weight:
                        </span>
                        <p
                          style={{
                            fontSize: "15px",
                            fontWeight: "600",
                            color: "#111827",
                          }}
                          className="dark:text-white"
                        >
                          {selectedProduct.weight
                            ? `${selectedProduct.weight}${
                                selectedProduct.weightUnit || "g"
                              }`
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <span
                          style={{ fontSize: "13px", color: "#6b7280" }}
                          className="dark:text-gray-400"
                        >
                          Dimensions (L×W×H):
                        </span>
                        <p
                          style={{
                            fontSize: "15px",
                            fontWeight: "600",
                            color: "#111827",
                          }}
                          className="dark:text-white"
                        >
                          {selectedProduct.dimensions &&
                          (selectedProduct.dimensions.length ||
                            selectedProduct.dimensions.width ||
                            selectedProduct.dimensions.height)
                            ? `${selectedProduct.dimensions.length || 0}×${
                                selectedProduct.dimensions.width || 0
                              }×${selectedProduct.dimensions.height || 0} ${
                                selectedProduct.dimensions.unit || "cm"
                              }`
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Promotor Commission */}
                  {selectedProduct.promotor && selectedProduct.promotor.id && (
                    <div
                      style={{
                        backgroundColor: "#f9fafb",
                        padding: "20px",
                        borderRadius: "12px",
                      }}
                      className="dark:bg-gray-900"
                    >
                      <h4
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#111827",
                          marginBottom: "16px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                        className="dark:text-white"
                      >
                        <FiTrendingUp
                          style={{
                            width: "20px",
                            height: "20px",
                            color: "#2563eb",
                          }}
                        />{" "}
                        Promotor Commission
                      </h4>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(2, 1fr)",
                          gap: "16px",
                        }}
                        className="md:grid-cols-3"
                      >
                        <div>
                          <span
                            style={{ fontSize: "13px", color: "#6b7280" }}
                            className="dark:text-gray-400"
                          >
                            Commission Type:
                          </span>
                          <p
                            style={{
                              fontSize: "15px",
                              fontWeight: "600",
                              color: "#111827",
                              textTransform: "capitalize",
                            }}
                            className="dark:text-white"
                          >
                            {selectedProduct.promotor.commissionType || "N/A"}
                          </p>
                        </div>
                        <div>
                          <span
                            style={{ fontSize: "13px", color: "#6b7280" }}
                            className="dark:text-gray-400"
                          >
                            Commission Rate:
                          </span>
                          <p
                            style={{
                              fontSize: "15px",
                              fontWeight: "600",
                              color: "#111827",
                            }}
                            className="dark:text-white"
                          >
                            {selectedProduct.promotor.commissionRate || 0}%
                          </p>
                        </div>
                        <div>
                          <span
                            style={{ fontSize: "13px", color: "#6b7280" }}
                            className="dark:text-gray-400"
                          >
                            Commission Amount:
                          </span>
                          <p
                            style={{
                              fontSize: "15px",
                              fontWeight: "600",
                              color: "#111827",
                            }}
                            className="dark:text-white"
                          >
                            {formatPrice(
                              selectedProduct.promotor.commissionAmount || 0
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Warehouse Info */}
                  {selectedProduct.warehouse &&
                    selectedProduct.warehouse.id && (
                      <div
                        style={{
                          backgroundColor: "#f9fafb",
                          padding: "20px",
                          borderRadius: "12px",
                        }}
                        className="dark:bg-gray-900"
                      >
                        <h4
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#111827",
                            marginBottom: "16px",
                          }}
                          className="dark:text-white"
                        >
                          Warehouse Information
                        </h4>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: "16px",
                          }}
                          className="md:grid-cols-3"
                        >
                          <div>
                            <span
                              style={{ fontSize: "13px", color: "#6b7280" }}
                              className="dark:text-gray-400"
                            >
                              Warehouse Code:
                            </span>
                            <p
                              style={{
                                fontSize: "15px",
                                fontWeight: "600",
                                color: "#111827",
                              }}
                              className="dark:text-white"
                            >
                              {selectedProduct.warehouse.code || "N/A"}
                            </p>
                          </div>
                          <div>
                            <span
                              style={{ fontSize: "13px", color: "#6b7280" }}
                              className="dark:text-gray-400"
                            >
                              Storage Type:
                            </span>
                            <p
                              style={{
                                fontSize: "15px",
                                fontWeight: "600",
                                color: "#111827",
                              }}
                              className="dark:text-white"
                            >
                              {selectedProduct.warehouse.storageType || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Delivery Information */}
                  {selectedProduct.delivery && (
                    <div
                      style={{
                        backgroundColor: "#f9fafb",
                        padding: "20px",
                        borderRadius: "12px",
                      }}
                      className="dark:bg-gray-900"
                    >
                      <h4
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#111827",
                          marginBottom: "16px",
                        }}
                        className="dark:text-white"
                      >
                        Delivery Information
                      </h4>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(2, 1fr)",
                          gap: "16px",
                        }}
                        className="md:grid-cols-3"
                      >
                        <div>
                          <span
                            style={{ fontSize: "13px", color: "#6b7280" }}
                            className="dark:text-gray-400"
                          >
                            Est. Delivery Time:
                          </span>
                          <p
                            style={{
                              fontSize: "15px",
                              fontWeight: "600",
                              color: "#111827",
                            }}
                            className="dark:text-white"
                          >
                            {selectedProduct.delivery.estimatedDeliveryTime ||
                              "N/A"}
                          </p>
                        </div>
                        <div>
                          <span
                            style={{ fontSize: "13px", color: "#6b7280" }}
                            className="dark:text-gray-400"
                          >
                            Delivery Charges:
                          </span>
                          <p
                            style={{
                              fontSize: "15px",
                              fontWeight: "600",
                              color: "#111827",
                            }}
                            className="dark:text-white"
                          >
                            {formatPrice(
                              selectedProduct.delivery.deliveryCharges || 0
                            )}
                          </p>
                        </div>
                        <div>
                          <span
                            style={{ fontSize: "13px", color: "#6b7280" }}
                            className="dark:text-gray-400"
                          >
                            Free Delivery Above:
                          </span>
                          <p
                            style={{
                              fontSize: "15px",
                              fontWeight: "600",
                              color: "#111827",
                            }}
                            className="dark:text-white"
                          >
                            {formatPrice(
                              selectedProduct.delivery.freeDeliveryThreshold ||
                                0
                            )}
                          </p>
                        </div>
                      </div>

                      {selectedProduct.delivery.availablePincodes &&
                        selectedProduct.delivery.availablePincodes.length >
                          0 && (
                          <div style={{ marginTop: "16px" }}>
                            <span
                              style={{
                                fontSize: "13px",
                                color: "#6b7280",
                                display: "block",
                                marginBottom: "8px",
                              }}
                              className="dark:text-gray-400"
                            >
                              Available Pincodes:
                            </span>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "6px",
                              }}
                            >
                              {selectedProduct.delivery.availablePincodes.map(
                                (pin, idx) => (
                                  <span
                                    key={idx}
                                    style={{
                                      padding: "4px 10px",
                                      backgroundColor: "#e0f2fe",
                                      color: "#0369a1",
                                      borderRadius: "6px",
                                      fontSize: "13px",
                                      fontWeight: "500",
                                    }}
                                  >
                                    {pin}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Serviceable Pincodes */}
                  {selectedProduct.serviceablePincodes &&
                    selectedProduct.serviceablePincodes.length > 0 && (
                      <div
                        style={{
                          backgroundColor: "#f9fafb",
                          padding: "20px",
                          borderRadius: "12px",
                        }}
                        className="dark:bg-gray-900"
                      >
                        <h4
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#111827",
                            marginBottom: "12px",
                          }}
                          className="dark:text-white"
                        >
                          Serviceable Pincodes
                        </h4>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "6px",
                          }}
                        >
                          {selectedProduct.serviceablePincodes.map(
                            (pin, idx) => (
                              <span
                                key={idx}
                                style={{
                                  padding: "4px 10px",
                                  backgroundColor: "#dcfce7",
                                  color: "#16a34a",
                                  borderRadius: "6px",
                                  fontSize: "13px",
                                  fontWeight: "500",
                                }}
                              >
                                {pin}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* Product Variants */}
                  {selectedProduct.variants &&
                    selectedProduct.variants.length > 0 && (
                      <div
                        style={{
                          backgroundColor: "#f9fafb",
                          padding: "20px",
                          borderRadius: "12px",
                        }}
                        className="dark:bg-gray-900"
                      >
                        <h4
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#111827",
                            marginBottom: "16px",
                          }}
                          className="dark:text-white"
                        >
                          Product Variants
                        </h4>
                        {selectedProduct.variants.map((variant, vIdx) => (
                          <div key={vIdx} style={{ marginBottom: "20px" }}>
                            <h5
                              style={{
                                fontSize: "14px",
                                fontWeight: "600",
                                color: "#374151",
                                marginBottom: "12px",
                              }}
                              className="dark:text-gray-300"
                            >
                              {variant.name}
                            </h5>
                            <div
                              style={{
                                backgroundColor: "#ffffff",
                                borderRadius: "8px",
                                overflow: "hidden",
                              }}
                              className="dark:bg-gray-800"
                            >
                              <table
                                style={{ width: "100%", fontSize: "14px" }}
                              >
                                <thead
                                  style={{ backgroundColor: "#f3f4f6" }}
                                  className="dark:bg-gray-700"
                                >
                                  <tr>
                                    <th
                                      style={{
                                        padding: "10px",
                                        textAlign: "left",
                                        color: "#6b7280",
                                        fontWeight: "500",
                                      }}
                                      className="dark:text-gray-400"
                                    >
                                      Option
                                    </th>
                                    <th
                                      style={{
                                        padding: "10px",
                                        textAlign: "left",
                                        color: "#6b7280",
                                        fontWeight: "500",
                                      }}
                                      className="dark:text-gray-400"
                                    >
                                      Price
                                    </th>
                                    <th
                                      style={{
                                        padding: "10px",
                                        textAlign: "left",
                                        color: "#6b7280",
                                        fontWeight: "500",
                                      }}
                                      className="dark:text-gray-400"
                                    >
                                      Quantity
                                    </th>
                                    <th
                                      style={{
                                        padding: "10px",
                                        textAlign: "left",
                                        color: "#6b7280",
                                        fontWeight: "500",
                                      }}
                                      className="dark:text-gray-400"
                                    >
                                      SKU
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {variant.options.map((opt, oIdx) => (
                                    <tr
                                      key={oIdx}
                                      style={{ borderTop: "1px solid #e5e7eb" }}
                                      className="dark:border-gray-700"
                                    >
                                      <td
                                        style={{
                                          padding: "10px",
                                          color: "#111827",
                                        }}
                                        className="dark:text-white"
                                      >
                                        {opt.value}
                                      </td>
                                      <td
                                        style={{
                                          padding: "10px",
                                          color: "#111827",
                                        }}
                                        className="dark:text-white"
                                      >
                                        {opt.price
                                          ? formatPrice(opt.price)
                                          : "-"}
                                      </td>
                                      <td
                                        style={{
                                          padding: "10px",
                                          color: "#111827",
                                        }}
                                        className="dark:text-white"
                                      >
                                        {opt.quantity || 0}
                                      </td>
                                      <td
                                        style={{
                                          padding: "10px",
                                          color: "#6b7280",
                                        }}
                                        className="dark:text-gray-400"
                                      >
                                        {opt.sku || "-"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  {/* Video Information */}
                  {selectedProduct.video && selectedProduct.video.url && (
                    <div
                      style={{
                        backgroundColor: "#f9fafb",
                        padding: "20px",
                        borderRadius: "12px",
                      }}
                      className="dark:bg-gray-900"
                    >
                      <h4
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#111827",
                          marginBottom: "16px",
                        }}
                        className="dark:text-white"
                      >
                        Product Video
                      </h4>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(2, 1fr)",
                          gap: "16px",
                        }}
                        className="md:grid-cols-4"
                      >
                        <div>
                          <span
                            style={{ fontSize: "13px", color: "#6b7280" }}
                            className="dark:text-gray-400"
                          >
                            Video URL:
                          </span>
                          <a
                            href={selectedProduct.video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: "15px",
                              fontWeight: "600",
                              color: "#2563eb",
                              textDecoration: "underline",
                            }}
                          >
                            View Video
                          </a>
                        </div>
                        <div>
                          <span
                            style={{ fontSize: "13px", color: "#6b7280" }}
                            className="dark:text-gray-400"
                          >
                            Duration:
                          </span>
                          <p
                            style={{
                              fontSize: "15px",
                              fontWeight: "600",
                              color: "#111827",
                            }}
                            className="dark:text-white"
                          >
                            {selectedProduct.video.duration
                              ? `${selectedProduct.video.duration}s`
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <span
                            style={{ fontSize: "13px", color: "#6b7280" }}
                            className="dark:text-gray-400"
                          >
                            File Size:
                          </span>
                          <p
                            style={{
                              fontSize: "15px",
                              fontWeight: "600",
                              color: "#111827",
                            }}
                            className="dark:text-white"
                          >
                            {selectedProduct.video.fileSize
                              ? `${selectedProduct.video.fileSize}MB`
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recent Orders Section */}
                  <div
                    style={{
                      backgroundColor: "#f9fafb",
                      padding: "20px",
                      borderRadius: "12px",
                    }}
                    className="dark:bg-gray-900"
                  >
                    <h4
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#111827",
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                      className="dark:text-white"
                    >
                      <FiShoppingCart
                        style={{
                          width: "20px",
                          height: "20px",
                          color: "#2563eb",
                        }}
                      />{" "}
                      Recent Orders
                    </h4>
                    {ordersLoading ? (
                      <div style={{ textAlign: "center", padding: "20px" }}>
                        <div
                          style={{
                            animation: "spin 1s linear infinite",
                            borderRadius: "9999px",
                            width: "24px",
                            height: "24px",
                            borderBottom: "2px solid #2563eb",
                            margin: "0 auto 8px",
                          }}
                        ></div>
                        <span style={{ color: "#6b7280" }}>
                          Loading orders...
                        </span>
                      </div>
                    ) : productOrders.length > 0 ? (
                      <div
                        style={{
                          backgroundColor: "#ffffff",
                          borderRadius: "8px",
                          overflow: "hidden",
                        }}
                        className="dark:bg-gray-800"
                      >
                        <table style={{ width: "100%" }}>
                          <thead
                            style={{ backgroundColor: "#f3f4f6" }}
                            className="dark:bg-gray-700"
                          >
                            <tr>
                              <th
                                style={{
                                  padding: "12px 16px",
                                  textAlign: "left",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  color: "#6b7280",
                                }}
                                className="dark:text-gray-400"
                              >
                                Order ID
                              </th>
                              <th
                                style={{
                                  padding: "12px 16px",
                                  textAlign: "left",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  color: "#6b7280",
                                }}
                                className="dark:text-gray-400"
                              >
                                Customer
                              </th>
                              <th
                                style={{
                                  padding: "12px 16px",
                                  textAlign: "left",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  color: "#6b7280",
                                }}
                                className="dark:text-gray-400"
                              >
                                Quantity
                              </th>
                              <th
                                style={{
                                  padding: "12px 16px",
                                  textAlign: "left",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  color: "#6b7280",
                                }}
                                className="dark:text-gray-400"
                              >
                                Status
                              </th>
                              <th
                                style={{
                                  padding: "12px 16px",
                                  textAlign: "left",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  color: "#6b7280",
                                }}
                                className="dark:text-gray-400"
                              >
                                Date
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {productOrders.slice(0, 5).map((order) => (
                              <tr
                                key={order._id}
                                style={{ borderTop: "1px solid #e5e7eb" }}
                                className="dark:border-gray-700"
                              >
                                <td
                                  style={{
                                    padding: "12px 16px",
                                    fontSize: "14px",
                                    color: "#111827",
                                    fontWeight: "500",
                                  }}
                                  className="dark:text-white"
                                >
                                  {order.orderId}
                                </td>
                                <td
                                  style={{
                                    padding: "12px 16px",
                                    fontSize: "14px",
                                    color: "#111827",
                                  }}
                                  className="dark:text-white"
                                >
                                  {order.user?.name || "N/A"}
                                </td>
                                <td
                                  style={{
                                    padding: "12px 16px",
                                    fontSize: "14px",
                                    color: "#111827",
                                  }}
                                  className="dark:text-white"
                                >
                                  {order.items?.find(
                                    (item) =>
                                      item.product?._id === selectedProduct._id
                                  )?.quantity || 0}
                                </td>
                                <td style={{ padding: "12px 16px" }}>
                                  <span
                                    style={{
                                      padding: "4px 8px",
                                      fontSize: "12px",
                                      fontWeight: "500",
                                      borderRadius: "9999px",
                                      backgroundColor:
                                        order.status === "delivered"
                                          ? "#dcfce7"
                                          : order.status === "confirmed"
                                          ? "#fef3c7"
                                          : order.status === "picked-up"
                                          ? "#dbeafe"
                                          : "#fee2e2",
                                      color:
                                        order.status === "delivered"
                                          ? "#16a34a"
                                          : order.status === "confirmed"
                                          ? "#d97706"
                                          : order.status === "picked-up"
                                          ? "#2563eb"
                                          : "#dc2626",
                                    }}
                                  >
                                    {order.status}
                                  </span>
                                </td>
                                <td
                                  style={{
                                    padding: "12px 16px",
                                    fontSize: "14px",
                                    color: "#6b7280",
                                  }}
                                  className="dark:text-gray-400"
                                >
                                  {new Date(
                                    order.createdAt
                                  ).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "40px",
                          color: "#6b7280",
                        }}
                      >
                        <FiShoppingCart
                          style={{
                            width: "48px",
                            height: "48px",
                            margin: "0 auto 16px",
                            color: "#9ca3af",
                          }}
                        />
                        <p>No orders found for this product.</p>
                      </div>
                    )}
                  </div>

                  {/* Product Status */}
                  <div
                    style={{
                      backgroundColor: "#f9fafb",
                      padding: "20px",
                      borderRadius: "12px",
                    }}
                    className="dark:bg-gray-900"
                  >
                    <h4
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#111827",
                        marginBottom: "12px",
                      }}
                      className="dark:text-white"
                    >
                      Product Status
                    </h4>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <span
                        style={{
                          padding: "8px 16px",
                          fontSize: "14px",
                          fontWeight: "600",
                          borderRadius: "8px",
                          backgroundColor: selectedProduct.isActive
                            ? "#dcfce7"
                            : "#fee2e2",
                          color: selectedProduct.isActive
                            ? "#16a34a"
                            : "#dc2626",
                        }}
                      >
                        {selectedProduct.isActive ? "✓ Active" : "✗ Inactive"}
                      </span>
                      <span
                        style={{ fontSize: "14px", color: "#6b7280" }}
                        className="dark:text-gray-400"
                      >
                        Created:{" "}
                        {new Date(
                          selectedProduct.createdAt
                        ).toLocaleDateString()}
                      </span>
                      {selectedProduct.updatedAt && (
                        <span
                          style={{ fontSize: "14px", color: "#6b7280" }}
                          className="dark:text-gray-400"
                        >
                          • Last Updated:{" "}
                          {new Date(
                            selectedProduct.updatedAt
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;