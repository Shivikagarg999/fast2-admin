import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { FiTag, FiPercent, FiPackage, FiX, FiSearch, FiCalendar, FiPlus, FiEdit, FiTrash2, FiClock } from "react-icons/fi";

const DiscountPage = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingDiscount, setCreatingDiscount] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateDiscountModal, setShowCreateDiscountModal] = useState(false);
  const [showActiveDiscountsModal, setShowActiveDiscountsModal] = useState(false);
  
  const [discountForm, setDiscountForm] = useState({
    name: "",
    discountPercentage: "",
    categoryId: "",
    productIds: [],
    startDate: new Date().toISOString().split('T')[0],
    endDate: ""
  });

  const [selectedProducts, setSelectedProducts] = useState([]);

  const DISCOUNTS_PER_PAGE = 10;

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchActiveDiscounts();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get("https://api.fast2.in/api/category/getall");
      setCategories(response.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get("https://api.fast2.in/api/product");
      setProducts(response.data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchActiveDiscounts = async () => {
    try {
      setLoading(true);
      const response = await axios.get("https://api.fast2.in/api/admin/discount/active");
      setDiscounts(response.data.discounts || []);
    } catch (error) {
      console.error("Error fetching active discounts:", error);
      alert("Failed to fetch active discounts");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiscount = async (e) => {
    e.preventDefault();
    
    if (!discountForm.name || !discountForm.discountPercentage) {
      alert("Please enter discount name and percentage");
      return;
    }

    if (discountForm.discountPercentage <= 0 || discountForm.discountPercentage > 100) {
      alert("Discount percentage must be between 1 and 100");
      return;
    }

    if (!discountForm.categoryId && discountForm.productIds.length === 0) {
      alert("Please select either a category or specific products");
      return;
    }

    try {
      setCreatingDiscount(true);
      const response = await axios.post("https://api.fast2.in/api/admin/discount", discountForm);
      alert(`Successfully created discount: ${response.data.discount.name}`);
      setShowCreateDiscountModal(false);
      resetDiscountForm();
      fetchActiveDiscounts(); // Refresh the discounts list
    } catch (error) {
      console.error("Error creating discount:", error);
      alert("Error creating discount: " + (error.response?.data?.message || error.message));
    } finally {
      setCreatingDiscount(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDiscountForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProductSelection = (productId) => {
    setDiscountForm(prev => {
      const isSelected = prev.productIds.includes(productId);
      if (isSelected) {
        return {
          ...prev,
          productIds: prev.productIds.filter(id => id !== productId)
        };
      } else {
        return {
          ...prev,
          productIds: [...prev.productIds, productId]
        };
      }
    });
  };

  const handleCategoryChange = (categoryId) => {
    setDiscountForm(prev => ({
      ...prev,
      categoryId: categoryId,
      productIds: [] // Clear products when category is selected
    }));
  };

  const resetDiscountForm = () => {
    setDiscountForm({
      name: "",
      discountPercentage: "",
      categoryId: "",
      productIds: [],
      startDate: new Date().toISOString().split('T')[0],
      endDate: ""
    });
    setSelectedProducts([]);
  };

  const openCreateDiscountModal = () => {
    setShowCreateDiscountModal(true);
  };

  const openActiveDiscountsModal = () => {
    setShowActiveDiscountsModal(true);
  };

  const closeModals = () => {
    setShowCreateDiscountModal(false);
    setShowActiveDiscountsModal(false);
    resetDiscountForm();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", { 
      style: "currency", 
      currency: "INR", 
      maximumFractionDigits: 0 
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No end date";
    return new Date(dateString).toLocaleDateString();
  };

  const isDiscountActive = (discount) => {
    const now = new Date();
    const startDate = new Date(discount.startDate);
    const endDate = discount.endDate ? new Date(discount.endDate) : null;
    
    return startDate <= now && (!endDate || endDate >= now);
  };

  const getDiscountStatus = (discount) => {
    const now = new Date();
    const startDate = new Date(discount.startDate);
    const endDate = discount.endDate ? new Date(discount.endDate) : null;

    if (startDate > now) {
      return { status: "Upcoming", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" };
    } else if (endDate && endDate < now) {
      return { status: "Expired", color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300" };
    } else {
      return { status: "Active", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" };
    }
  };

  // Filtering for discounts
  const filteredDiscounts = useMemo(() => {
    return discounts.filter(discount =>
      discount.name?.toLowerCase().includes(search.toLowerCase()) ||
      (discount.category?.name || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [discounts, search]);

  const totalPages = Math.ceil(filteredDiscounts.length / DISCOUNTS_PER_PAGE);
  const indexOfLastDiscount = currentPage * DISCOUNTS_PER_PAGE;
  const indexOfFirstDiscount = indexOfLastDiscount - DISCOUNTS_PER_PAGE;
  const currentDiscounts = filteredDiscounts.slice(indexOfFirstDiscount, indexOfLastDiscount);

  return (
    <div className="bg-gray-100 dark:bg-gray-900 w-full min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center mb-4 sm:mb-0">
            <FiTag className="w-6 h-6 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Discount Management</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={openActiveDiscountsModal}
              className="flex items-center px-4 py-2 bg-white text-black border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiClock className="w-4 h-4 mr-2" />
              View Active Discounts
            </button>
            <button
              onClick={openCreateDiscountModal}
              className="flex items-center px-4 py-2 bg-black text-black rounded-lg hover:bg-gray-800 transition-colors"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Create New Discount
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                <FiTag className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Categories</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{categories.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400">
                <FiPackage className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Products</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{products.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400">
                <FiPercent className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Discounts</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {discounts.filter(d => isDiscountActive(d)).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400">
                <FiCalendar className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Discounts</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{discounts.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={openCreateDiscountModal}
              className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors text-center"
            >
              <FiPlus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Create Category Discount</p>
            </button>
            
            <button
              onClick={openCreateDiscountModal}
              className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors text-center"
            >
              <FiPackage className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Create Product Discount</p>
            </button>
            
            <button
              onClick={openActiveDiscountsModal}
              className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors text-center"
            >
              <FiClock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">View Active Discounts</p>
            </button>
            
            <button
              onClick={openActiveDiscountsModal}
              className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors text-center"
            >
              <FiCalendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Manage All Discounts</p>
            </button>
          </div>
        </div>

        {/* Create Discount Modal */}
        {showCreateDiscountModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Create New Discount
                </h2>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateDiscount} className="p-6">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Discount Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={discountForm.name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter discount name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Discount Percentage *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            name="discountPercentage"
                            value={discountForm.discountPercentage}
                            onChange={handleInputChange}
                            min="1"
                            max="100"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                              bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                              focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter percentage (1-100)"
                            required
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <FiPercent className="text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scope Selection */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Discount Scope</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Apply to Category
                        </label>
                        <select
                          value={discountForm.categoryId}
                          onChange={(e) => handleCategoryChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select a category (optional)</option>
                          {categories.map(category => (
                            <option key={category._id} value={category._id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Selecting a category will apply discount to all products in that category
                        </p>
                      </div>

                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Or Select Specific Products
                        </label>
                        <div className="max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md">
                          {products.map(product => (
                            <div key={product._id} className="flex items-center p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                              <input
                                type="checkbox"
                                checked={discountForm.productIds.includes(product._id)}
                                onChange={() => handleProductSelection(product._id)}
                                disabled={!!discountForm.categoryId}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 
                                  dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                              />
                              <div className="ml-3 flex-1">
                                <div className="flex items-center">
                                  <img
                                    src={(product.images && product.images[0] && product.images[0].url) || "https://via.placeholder.com/40?text=No+Image"}
                                    alt={product.name}
                                    className="w-8 h-8 rounded-md object-cover mr-3"
                                    onError={(e) => {
                                      e.target.src = "https://via.placeholder.com/40?text=No+Image";
                                    }}
                                  />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      {product.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatPrice(product.price)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {discountForm.categoryId 
                            ? "Product selection is disabled when a category is selected" 
                            : `Selected ${discountForm.productIds.length} products`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Date Range */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Date Range</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Start Date *
                        </label>
                        <input
                          type="date"
                          name="startDate"
                          value={discountForm.startDate}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          End Date (Optional)
                        </label>
                        <input
                          type="date"
                          name="endDate"
                          value={discountForm.endDate}
                          onChange={handleInputChange}
                          min={discountForm.startDate}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={closeModals}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                      bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 
                      rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingDiscount}
                    className="px-4 py-2 text-sm font-medium bg-black text-black
                      rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed 
                      transition-colors flex items-center gap-2"
                  >
                    {creatingDiscount && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    Create Discount
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Active Discounts Modal */}
        {showActiveDiscountsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Active Discounts ({filteredDiscounts.length})
                </h2>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                {/* Search */}
                <div className="mb-6">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiSearch className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search discounts..."
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                        focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Discounts Grid */}
                {loading ? (
                  <div className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-500 dark:text-gray-400">Loading discounts...</span>
                    </div>
                  </div>
                ) : currentDiscounts.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="flex flex-col items-center">
                      <FiTag className="w-12 h-12 text-gray-400 mb-2" />
                      <span className="text-gray-500 dark:text-gray-400">No discounts found.</span>
                      {search && (
                        <button
                          onClick={() => setSearch("")}
                          className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentDiscounts.map((discount) => {
                      const status = getDiscountStatus(discount);
                      return (
                        <div key={discount._id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {discount.name}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                              {status.status}
                            </span>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Discount:</span>
                              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                {discount.discountPercentage}% OFF
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Scope:</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {discount.category ? `Category: ${discount.category.name}` : `Products: ${discount.products.length}`}
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Start Date:</span>
                              <span className="text-sm text-gray-900 dark:text-white">
                                {formatDate(discount.startDate)}
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">End Date:</span>
                              <span className="text-sm text-gray-900 dark:text-white">
                                {formatDate(discount.endDate)}
                              </span>
                            </div>
                            
                            {discount.products && discount.products.length > 0 && (
                              <div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">Products:</span>
                                <div className="mt-1 space-y-1 max-h-20 overflow-y-auto">
                                  {discount.products.slice(0, 3).map(product => (
                                    <div key={product._id} className="text-xs text-gray-900 dark:text-white truncate">
                                      • {product.name}
                                    </div>
                                  ))}
                                  {discount.products.length > 3 && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      +{discount.products.length - 3} more products
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Created: {new Date(discount.createdAt).toLocaleDateString()}
                            </span>
                            <div className="flex gap-2">
                              <button className="p-1 text-blue-600 hover:text-blue-800 dark:hover:text-blue-400">
                                <FiEdit className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-red-600 hover:text-red-800 dark:hover:text-red-400">
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Showing {indexOfFirstDiscount + 1} to {Math.min(indexOfLastDiscount, filteredDiscounts.length)} of {filteredDiscounts.length} discounts
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
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscountPage;