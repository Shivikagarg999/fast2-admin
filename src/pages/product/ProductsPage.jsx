import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { FiEdit, FiTrash2, FiPlus, FiPackage, FiX, FiUser, FiMapPin, FiHash, FiPlusCircle, FiMinusCircle } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { Editor } from '@tinymce/tinymce-react';

const ProductsPage = () => {
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
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    description: '',
    brand: '',
    category: '',
    
    // Pricing Information
    price: '',
    oldPrice: '',
    unit: 'piece',
    unitValue: '',
    
    // Promotor Information
    promotor: '',
    commissionRate: '',
    commissionType: 'percentage',
    
    // Inventory & Stock
    quantity: '',
    minOrderQuantity: '1',
    maxOrderQuantity: '10',
    lowStockThreshold: '10',
    
    // Physical Attributes
    weight: '',
    weightUnit: 'g',
    
    // Warehouse Information
    warehouseId: '',
    storageType: '',
    
    // Delivery Information
    estimatedDeliveryTime: '',
    deliveryCharges: '0',
    freeDeliveryThreshold: '0',
    availablePincodes: [],
    
    // Tax Information
    hsnCode: '',
    gstPercent: '',
    taxType: 'inclusive',
    
    // Status
    isActive: true,

    // Variants
    variants: []
  });

  const [newPincode, setNewPincode] = useState("");
  const [imageFile, setImageFile] = useState(null);

  // Common variant types
  const commonVariantTypes = [
    { name: 'Color', options: ['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow'] },
    { name: 'Size', options: ['S', 'M', 'L', 'XL', 'XXL'] },
    { name: 'Material', options: ['Cotton', 'Polyester', 'Silk', 'Wool', 'Linen'] },
    { name: 'Storage', options: ['64GB', '128GB', '256GB', '512GB', '1TB'] },
    { name: 'Style', options: ['Classic', 'Modern', 'Vintage', 'Sport'] }
  ];

  const PRODUCTS_PER_PAGE = 10;

  // Fetch initial data
  useEffect(() => {
    fetchProducts();
    fetchPromotors();
    fetchWarehouses();
    fetchAllCategories();
  }, []);

  // Fetch functions
  const fetchPromotors = async () => {
    try {
      const response = await axios.get("https://api.fast2.in/api/admin/promotor/");
      setPromotors(response.data || []);
    } catch (error) {
      console.error("Error fetching promotors:", error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await axios.get("https://api.fast2.in/api/admin/warehouse/");
      setWarehouses(response.data || []);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };

  const fetchAllCategories = async () => {
    try {
      const response = await axios.get("https://api.fast2.in/api/category/getall");
      setAllCategories(response.data || []);

      const categoryMap = {};
      response.data.forEach(cat => {
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
      const { data: productData } = await axios.get("https://api.fast2.in/api/product");
      setProducts(productData || []);

      const categoryMap = {};
      productData.forEach(product => {
        if (product.category && product.category._id) {
          categoryMap[product.category._id] = product.category.name;
        }
      });

      setCategories(categoryMap);
    } catch (error) {
      console.error("Error fetching products:", error);
      alert("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      brand: '',
      category: '',
      price: '',
      oldPrice: '',
      unit: 'piece',
      unitValue: '',
      promotor: '',
      commissionRate: '',
      commissionType: 'percentage',
      quantity: '',
      minOrderQuantity: '1',
      maxOrderQuantity: '10',
      lowStockThreshold: '10',
      weight: '',
      weightUnit: 'g',
      warehouseId: '',
      storageType: '',
      estimatedDeliveryTime: '',
      deliveryCharges: '0',
      freeDeliveryThreshold: '0',
      availablePincodes: [],
      hsnCode: '',
      gstPercent: '',
      taxType: 'inclusive',
      isActive: true,
      variants: []
    });
    setImagePreview("");
    setImageFile(null);
    setNewPincode("");
  };

  const openAddModal = () => {
    navigate("/admin/createProduct");
  };

  const openEditModal = (product) => {
    const productData = {
      name: product.name || '',
      description: product.description || '',
      brand: product.brand || '',
      category: product.category?._id || product.category || '',
      price: product.price || '',
      oldPrice: product.oldPrice || '',
      unit: product.unit || 'piece',
      unitValue: product.unitValue || '',
      promotor: product.promotor?.id || '',
      commissionRate: product.promotor?.commissionRate || '',
      commissionType: product.promotor?.commissionType || 'percentage',
      quantity: product.quantity || '',
      minOrderQuantity: product.minOrderQuantity || '1',
      maxOrderQuantity: product.maxOrderQuantity || '10',
      lowStockThreshold: product.lowStockThreshold || '10',
      weight: product.weight || '',
      weightUnit: product.weightUnit || 'g',
      warehouseId: product.warehouse?.id || '',
      storageType: product.warehouse?.storageType || '',
      estimatedDeliveryTime: product.delivery?.estimatedDeliveryTime || '',
      deliveryCharges: product.delivery?.deliveryCharges || '0',
      freeDeliveryThreshold: product.delivery?.freeDeliveryThreshold || '0',
      availablePincodes: product.delivery?.availablePincodes || [],
      hsnCode: product.hsnCode || '',
      gstPercent: product.gstPercent || '',
      taxType: product.taxType || 'inclusive',
      isActive: product.isActive !== undefined ? product.isActive : true,
      variants: product.variants || []
    };

    setFormData(productData);
    setImagePreview((product.images && product.images[0] && product.images[0].url) || "");
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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDescriptionChange = (content) => {
    setFormData(prev => ({
      ...prev,
      description: content
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

  // Variant Functions
  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { name: '', options: [{ value: '', price: '', quantity: '', sku: '' }] }]
    }));
  };

  const removeVariant = (index) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const updateVariantName = (index, name) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === index ? { ...variant, name } : variant
      )
    }));
  };

  const addVariantOption = (variantIndex) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === variantIndex 
          ? { ...variant, options: [...variant.options, { value: '', price: '', quantity: '', sku: '' }] }
          : variant
      )
    }));
  };

  const removeVariantOption = (variantIndex, optionIndex) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === variantIndex 
          ? { ...variant, options: variant.options.filter((_, j) => j !== optionIndex) }
          : variant
      )
    }));
  };

  const updateVariantOption = (variantIndex, optionIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === variantIndex 
          ? { 
              ...variant, 
              options: variant.options.map((option, j) => 
                j === optionIndex ? { ...option, [field]: value } : option
              )
            }
          : variant
      )
    }));
  };

  const applyCommonVariant = (variantType) => {
    const variant = commonVariantTypes.find(v => v.name === variantType);
    if (variant) {
      setFormData(prev => ({
        ...prev,
        variants: [...prev.variants, { 
          name: variant.name, 
          options: variant.options.map(opt => ({ value: opt, price: '', quantity: '', sku: '' }))
        }]
      }));
    }
  };

  // Pincode Functions
  const addPincode = () => {
    if (newPincode && !formData.availablePincodes.includes(newPincode)) {
      setFormData(prev => ({
        ...prev,
        availablePincodes: [...prev.availablePincodes, newPincode]
      }));
      setNewPincode("");
    }
  };

  const removePincode = (pincode) => {
    setFormData(prev => ({
      ...prev,
      availablePincodes: prev.availablePincodes.filter(p => p !== pincode)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const submitData = new FormData();
      
      // Append all form data
      Object.keys(formData).forEach(key => {
        if (key === 'availablePincodes') {
          submitData.append(key, JSON.stringify(formData[key]));
        } else if (key === 'variants') {
          submitData.append(key, JSON.stringify(formData[key]));
        } else if (key === 'image' && imageFile) {
          submitData.append('images', imageFile);
        } else if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });

      await axios.put(`https://api.fast2.in/api/product/${editingProduct._id}`, submitData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      alert("Product updated successfully!");
      closeModal();
      fetchProducts();
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Error updating product: " + (error.response?.data?.message || error.message));
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (productId, productName) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"?`)) {
      try {
        await axios.delete(`https://api.fast2.in/api/product/${productId}`);
        alert("Product deleted successfully!");
        fetchProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Error deleting product: " + (error.response?.data?.message || error.message));
      }
    }
  };

  const getStatusBadge = (stock) => {
    if (stock === 0) return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Out of Stock</span>;
    if (stock < 10) return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Low Stock</span>;
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">In Stock</span>;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);
  };

  // Filtering
  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      (p.name?.toLowerCase().includes(search.toLowerCase()) ||
        (categories[p.category] || "").toLowerCase().includes(search.toLowerCase())) &&
      (categoryFilter ? p.category === categoryFilter : true)
    );
  }, [products, search, categoryFilter, categories]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const indexOfLastProduct = currentPage * PRODUCTS_PER_PAGE;
  const indexOfFirstProduct = indexOfLastProduct - PRODUCTS_PER_PAGE;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  return (
    <div className="bg-gray-100 dark:bg-gray-900 w-full min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center mb-4 sm:mb-0">
            <FiPackage className="w-6 h-6 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
            <span className="ml-3 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
              {filteredProducts.length} items
            </span>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <FiPlus className="w-4 h-4 mr-2" />
            Add Product
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search products by name or category..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="sm:w-48">
            <select
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {allCategories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Weight/Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-500 dark:text-gray-400">Loading products...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center">
                        <FiPackage className="w-12 h-12 text-gray-400 mb-2" />
                        <span className="text-gray-500 dark:text-gray-400">No products found.</span>
                        {search && (
                          <button
                            onClick={() => setSearch("")}
                            className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentProducts.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <img
                            src={(product.images && product.images[0] && product.images[0].url) || "https://via.placeholder.com/40?text=No+Image"}
                            alt={product.name}
                            className="w-10 h-10 rounded-md object-cover mr-3"
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/40?text=No+Image";
                            }}
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {product.name || "-"}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                          {product.category && product.category._id
                            ? (categories[product.category._id] || product.category.name || "Uncategorized")
                            : "Uncategorized"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatPrice(product.price)}
                          {product.oldPrice && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 line-through">
                              {formatPrice(product.oldPrice)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {product.weight ? `${product.weight}${product.weightUnit || 'g'}` : (product.unitValue ? `${product.unitValue}${product.unit}` : "N/A")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(product.quantity)}
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            ({product.quantity})
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
                            title="Edit Product"
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product._id, product.name)}
                            className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                            title="Delete Product"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {indexOfFirstProduct + 1} to {Math.min(indexOfLastProduct, filteredProducts.length)} of {filteredProducts.length} products
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                  hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors"
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
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${currentPage === pageNum
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                  hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Edit Product Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Edit Product
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Product Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Description
                        </label>
                        <Editor
                          apiKey="xw0haeefepmen4923ro5m463eb97qhseuprfkpbuan5t10u5"
                          value={formData.description}
                          onEditorChange={handleDescriptionChange}
                          init={{
                            height: 300,
                            menubar: 'file edit view insert format tools table help',
                            plugins: [
                              'advlist autolink lists link image charmap print preview anchor',
                              'searchreplace visualblocks code fullscreen',
                              'insertdatetime media table paste code help wordcount'
                            ],
                            toolbar: 'undo redo | formatselect | ' +
                              'bold italic backcolor | alignleft aligncenter ' +
                              'alignright alignjustify | bullist numlist outdent indent | ' +
                              'removeformat | help | image',
                            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                            skin: 'oxide-dark',
                            content_css: 'dark',
                          }}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Brand *
                        </label>
                        <input
                          type="text"
                          name="brand"
                          value={formData.brand}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Category *
                        </label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select Category</option>
                          {allCategories.map(category => (
                            <option key={category._id} value={category._id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Information */}
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Pricing Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Price (₹) *
                        </label>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Old Price (₹)
                        </label>
                        <input
                          type="number"
                          name="oldPrice"
                          value={formData.oldPrice}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Unit *
                        </label>
                        <select
                          name="unit"
                          value={formData.unit}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="piece">Piece</option>
                          <option value="kg">Kilogram (kg)</option>
                          <option value="g">Gram (g)</option>
                          <option value="l">Liter (l)</option>
                          <option value="ml">Milliliter (ml)</option>
                          <option value="pack">Pack</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Unit Value *
                        </label>
                        <input
                          type="number"
                          name="unitValue"
                          value={formData.unitValue}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Variants Section */}
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Product Variants</h3>
                      <div className="flex gap-2">
                        <select
                          onChange={(e) => e.target.value && applyCommonVariant(e.target.value)}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Quick Add Variant</option>
                          {commonVariantTypes.map((variant, index) => (
                            <option key={index} value={variant.name}>
                              {variant.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={addVariant}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 
                            flex items-center text-sm"
                        >
                          <FiPlus className="mr-1" /> Add Variant
                        </button>
                      </div>
                    </div>

                    {formData.variants.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        <p>No variants added yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {formData.variants.map((variant, variantIndex) => (
                          <div key={variantIndex} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-3">
                              <input
                                type="text"
                                value={variant.name}
                                onChange={(e) => updateVariantName(variantIndex, e.target.value)}
                                placeholder="Variant name (e.g., Size, Color)"
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => removeVariant(variantIndex)}
                                className="ml-2 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                              >
                                <FiTrash2 />
                              </button>
                            </div>

                            <div className="space-y-2">
                              <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <div className="col-span-4">Option Value *</div>
                                <div className="col-span-2">Price (₹)</div>
                                <div className="col-span-2">Quantity</div>
                                <div className="col-span-3">SKU</div>
                                <div className="col-span-1"></div>
                              </div>

                              {variant.options.map((option, optionIndex) => (
                                <div key={optionIndex} className="grid grid-cols-12 gap-2">
                                  <div className="col-span-4">
                                    <input
                                      type="text"
                                      value={option.value}
                                      onChange={(e) => updateVariantOption(variantIndex, optionIndex, 'value', e.target.value)}
                                      placeholder="e.g., Red, Large"
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                                        focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      required
                                    />
                                  </div>
                                  <div className="col-span-2">
                                    <input
                                      type="number"
                                      value={option.price}
                                      onChange={(e) => updateVariantOption(variantIndex, optionIndex, 'price', e.target.value)}
                                      placeholder="0.00"
                                      min="0"
                                      step="0.01"
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                                        focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div className="col-span-2">
                                    <input
                                      type="number"
                                      value={option.quantity}
                                      onChange={(e) => updateVariantOption(variantIndex, optionIndex, 'quantity', e.target.value)}
                                      placeholder="0"
                                      min="0"
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                                        focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div className="col-span-3">
                                    <input
                                      type="text"
                                      value={option.sku}
                                      onChange={(e) => updateVariantOption(variantIndex, optionIndex, 'sku', e.target.value)}
                                      placeholder="SKU code"
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                                        focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <button
                                      type="button"
                                      onClick={() => removeVariantOption(variantIndex, optionIndex)}
                                      className="w-full p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                                      disabled={variant.options.length === 1}
                                    >
                                      <FiX />
                                    </button>
                                  </div>
                                </div>
                              ))}

                              <button
                                type="button"
                                onClick={() => addVariantOption(variantIndex)}
                                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                                  rounded hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center"
                              >
                                <FiPlus className="mr-1" /> Add Option
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Promotor Information */}
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                      <FiUser className="mr-2" /> Promotor Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Promotor *
                        </label>
                        <select
                          name="promotor"
                          value={formData.promotor}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select a promotor</option>
                          {promotors.map((promotor) => (
                            <option key={promotor._id} value={promotor._id}>
                              {promotor.name} - {promotor.email}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Commission Type *
                        </label>
                        <select
                          name="commissionType"
                          value={formData.commissionType}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="percentage">Percentage</option>
                          <option value="fixed">Fixed Amount</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Commission Rate *
                        </label>
                        <input
                          type="number"
                          name="commissionRate"
                          value={formData.commissionRate}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Inventory Information */}
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Inventory Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          name="quantity"
                          value={formData.quantity}
                          onChange={handleInputChange}
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Min Order Quantity
                        </label>
                        <input
                          type="number"
                          name="minOrderQuantity"
                          value={formData.minOrderQuantity}
                          onChange={handleInputChange}
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Max Order Quantity
                        </label>
                        <input
                          type="number"
                          name="maxOrderQuantity"
                          value={formData.maxOrderQuantity}
                          onChange={handleInputChange}
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Low Stock Threshold
                        </label>
                        <input
                          type="number"
                          name="lowStockThreshold"
                          value={formData.lowStockThreshold}
                          onChange={handleInputChange}
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Physical Attributes */}
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Physical Attributes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Weight *
                        </label>
                        <input
                          type="number"
                          name="weight"
                          value={formData.weight}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Weight Unit *
                        </label>
                        <select
                          name="weightUnit"
                          value={formData.weightUnit}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="g">Gram (g)</option>
                          <option value="kg">Kilogram (kg)</option>
                          <option value="ml">Milliliter (ml)</option>
                          <option value="l">Liter (l)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Tax Information */}
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Tax Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          HSN Code
                        </label>
                        <input
                          type="text"
                          name="hsnCode"
                          value={formData.hsnCode}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          GST Percentage
                        </label>
                        <input
                          type="number"
                          name="gstPercent"
                          value={formData.gstPercent}
                          onChange={handleInputChange}
                          min="0"
                          max="100"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tax Type
                        </label>
                        <select
                          name="taxType"
                          value={formData.taxType}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="inclusive">Inclusive</option>
                          <option value="exclusive">Exclusive</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Warehouse Information */}
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                      <FiMapPin className="mr-2" /> Warehouse Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Warehouse
                        </label>
                        <select
                          name="warehouseId"
                          value={formData.warehouseId}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select a warehouse</option>
                          {warehouses.map((warehouse) => (
                            <option key={warehouse._id} value={warehouse._id}>
                              {warehouse.name} - {warehouse.location?.city}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Storage Type
                        </label>
                        <select
                          name="storageType"
                          value={formData.storageType}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select storage type</option>
                          <option value="ambient">Ambient Storage</option>
                          <option value="cold-storage">Cold Storage</option>
                          <option value="frozen">Frozen Storage</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Information */}
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Delivery Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Estimated Delivery Time
                        </label>
                        <input
                          type="text"
                          name="estimatedDeliveryTime"
                          value={formData.estimatedDeliveryTime}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 2-3 days"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Delivery Charges (₹)
                        </label>
                        <input
                          type="number"
                          name="deliveryCharges"
                          value={formData.deliveryCharges}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Free Delivery Threshold (₹)
                        </label>
                        <input
                          type="number"
                          name="freeDeliveryThreshold"
                          value={formData.freeDeliveryThreshold}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Available Pincodes
                        </label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={newPincode}
                            onChange={(e) => setNewPincode(e.target.value)}
                            placeholder="Enter pincode"
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                              bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                              focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={addPincode}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                          >
                            Add
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.availablePincodes.map((pincode, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-200 dark:bg-gray-700 
                                text-gray-800 dark:text-gray-200 rounded-full text-sm"
                            >
                              {pincode}
                              <button
                                type="button"
                                onClick={() => removePincode(pincode)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <FiX className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Product Image</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Product Image
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                              bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                              focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        {imagePreview && (
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-16 h-16 rounded-md object-cover border border-gray-300"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Status</h3>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 
                          dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Product is active and visible to customers
                      </label>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                      bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 
                      rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="px-4 py-2 text-sm font-medium bg-blue-600 text-white
                      rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed 
                      transition-colors flex items-center gap-2"
                  >
                    {modalLoading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    Update Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;