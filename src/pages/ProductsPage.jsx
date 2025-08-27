import { useEffect, useState } from "react";
import axios from "axios";
import { FiEdit, FiTrash2, FiPlus, FiPackage } from "react-icons/fi";

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("");
  const productsPerPage = 10;

  // Sample grocery products data (replace with actual API call)
  const sampleProducts = [
    { _id: "1", name: "White Bread", category: "Bakery", price: 35, stock: 50, unit: "piece", status: "active" },
    { _id: "2", name: "Brown Bread", category: "Bakery", price: 45, stock: 30, unit: "piece", status: "active" },
    { _id: "3", name: "Potato", category: "Vegetables", price: 25, stock: 100, unit: "kg", status: "active" },
    { _id: "4", name: "Tomato", category: "Vegetables", price: 40, stock: 80, unit: "kg", status: "active" },
    { _id: "5", name: "Onion", category: "Vegetables", price: 30, stock: 90, unit: "kg", status: "active" },
    { _id: "6", name: "Carrot", category: "Vegetables", price: 35, stock: 60, unit: "kg", status: "active" },
    { _id: "7", name: "Milk", category: "Dairy", price: 60, stock: 40, unit: "liter", status: "active" },
    { _id: "8", name: "Paneer", category: "Dairy", price: 120, stock: 25, unit: "250g", status: "active" },
    { _id: "9", name: "Curd", category: "Dairy", price: 45, stock: 35, unit: "500g", status: "active" },
    { _id: "10", name: "Rice", category: "Grains", price: 80, stock: 70, unit: "kg", status: "active" },
    { _id: "11", name: "Wheat Flour", category: "Grains", price: 55, stock: 60, unit: "kg", status: "active" },
    { _id: "12", name: "Basmati Rice", category: "Grains", price: 150, stock: 40, unit: "kg", status: "active" },
    { _id: "13", name: "Banana", category: "Fruits", price: 60, stock: 50, unit: "dozen", status: "active" },
    { _id: "14", name: "Apple", category: "Fruits", price: 180, stock: 30, unit: "kg", status: "active" },
    { _id: "15", name: "Orange", category: "Fruits", price: 100, stock: 45, unit: "kg", status: "active" },
    { _id: "16", name: "Cooking Oil", category: "Oil & Ghee", price: 140, stock: 35, unit: "liter", status: "active" },
    { _id: "17", name: "Ghee", category: "Oil & Ghee", price: 480, stock: 20, unit: "500g", status: "active" },
    { _id: "18", name: "Sugar", category: "Pantry", price: 42, stock: 80, unit: "kg", status: "active" },
    { _id: "19", name: "Salt", category: "Pantry", price: 20, stock: 100, unit: "kg", status: "active" },
    { _id: "20", name: "Tea", category: "Beverages", price: 180, stock: 25, unit: "250g", status: "low" },
    { _id: "21", name: "Coffee", category: "Beverages", price: 250, stock: 15, unit: "200g", status: "low" },
    { _id: "22", name: "Biscuits", category: "Snacks", price: 25, stock: 60, unit: "pack", status: "active" },
    { _id: "23", name: "Chips", category: "Snacks", price: 20, stock: 80, unit: "pack", status: "active" },
    { _id: "24", name: "Detergent", category: "Household", price: 85, stock: 40, unit: "kg", status: "active" },
    { _id: "25", name: "Soap", category: "Household", price: 35, stock: 70, unit: "piece", status: "active" },
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Replace with actual API call
      // const token = localStorage.getItem("token");
      // const res = await axios.get(
      //   "https://fast2-backend.onrender.com/api/admin/products",
      //   { headers: { Authorization: `Bearer ${token}` } }
      // );
      // setProducts(res.data.products);
      
      // Simulate API delay
      setTimeout(() => {
        setProducts(sampleProducts);
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // Get unique categories for filter
  const categories = [...new Set(products.map(p => p.category))].sort();

  // Filtered and paginated products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = 
      product.name?.toLowerCase().includes(search.toLowerCase()) ||
      product.category?.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const getStatusBadge = (status, stock) => {
    if (stock === 0) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
          Out of Stock
        </span>
      );
    }
    if (stock < 30 || status === 'low') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
          Low Stock
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
        In Stock
      </span>
    );
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 w-full min-h-screen lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center mb-4 sm:mb-0">
            <FiPackage className="w-6 h-6 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
            <span className="ml-3 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
              {filteredProducts.length} items
            </span>
          </div>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
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
                    Product Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {product.name || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                          {product.category || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          ₹{product.price}
                          <span className="text-gray-500 dark:text-gray-400 ml-1">
                            /{product.unit}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {product.stock} {product.unit}
                          {product.stock < 30 && product.stock > 0 && (
                            <span className="text-xs text-yellow-600 dark:text-yellow-400 block">
                              Running low
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(product.status, product.stock)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
                            title="Edit Product"
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                          <button 
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
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      currentPage === pageNum
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
  );
};

export default ProductsPage;