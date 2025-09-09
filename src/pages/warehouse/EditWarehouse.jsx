import { useState, useEffect } from "react";
import axios from "axios";
import { FiPackage, FiMapPin, FiThermometer, FiHash, FiUser, FiCheckCircle, FiArrowLeft } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";

const EditWarehouse = () => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [promotors, setPromotors] = useState([]);
  const [loadingPromotors, setLoadingPromotors] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    promotor: "",
    location: {
      address: "",
      city: "",
      state: "",
      pincode: "",
      coordinates: {
        lat: "",
        lng: ""
      }
    },
    storageType: "ambient",
    capacity: "",
    currentStock: ""
  });

  useEffect(() => {
    fetchPromotors();
    if (id) {
      fetchWarehouse();
    }
  }, [id]);

  const fetchPromotors = async () => {
    try {
      setLoadingPromotors(true);
      const response = await axios.get('http://localhost:5000/api/admin/promotor');
      setPromotors(response.data || []);
    } catch (error) {
      console.error("Error fetching promotors:", error);
      setError("Failed to load promotors");
    } finally {
      setLoadingPromotors(false);
    }
  };

  const fetchWarehouse = async () => {
    try {
      setFetching(true);
      const response = await axios.get(`http://localhost:5000/api/admin/warehouse/${id}`);
      const warehouse = response.data;
      
      setFormData({
        name: warehouse.name || "",
        code: warehouse.code || "",
        promotor: warehouse.promotor?._id || warehouse.promotor || "",
        location: {
          address: warehouse.location?.address || "",
          city: warehouse.location?.city || "",
          state: warehouse.location?.state || "",
          pincode: warehouse.location?.pincode || "",
          coordinates: {
            lat: warehouse.location?.coordinates?.lat?.toString() || "",
            lng: warehouse.location?.coordinates?.lng?.toString() || ""
          }
        },
        storageType: warehouse.storageType || "ambient",
        capacity: warehouse.capacity?.toString() || "",
        currentStock: warehouse.currentStock?.toString() || ""
      });
    } catch (error) {
      console.error('Error fetching warehouse:', error);
      setError('Error fetching warehouse: ' + (error.response?.data?.message || error.message));
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested objects
    if (name.includes('.')) {
      const keys = name.split('.');
      setFormData(prev => ({
        ...prev,
        [keys[0]]: {
          ...prev[keys[0]],
          [keys[1]]: keys.length > 2 ? {
            ...prev[keys[0]][keys[1]],
            [keys[2]]: keys.length > 3 ? {
              ...prev[keys[0]][keys[1]][keys[2]],
              [keys[3]]: value
            } : value
          } : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const generateWarehouseCode = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `WH-${timestamp}-${random}`;
  };

  const handleGenerateCode = () => {
    setFormData(prev => ({
      ...prev,
      code: generateWarehouseCode()
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Convert numeric fields
      const submitData = {
        ...formData,
        capacity: formData.capacity ? Number(formData.capacity) : 0,
        currentStock: formData.currentStock ? Number(formData.currentStock) : 0,
        location: {
          ...formData.location,
          coordinates: {
            lat: formData.location.coordinates.lat ? Number(formData.location.coordinates.lat) : undefined,
            lng: formData.location.coordinates.lng ? Number(formData.location.coordinates.lng) : undefined
          }
        }
      };

      await axios.put(`http://localhost:5000/api/admin/warehouse/${id}`, submitData);
      
      // Show success modal
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error updating warehouse:', error);
      setError('Error updating warehouse: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    navigate('/admin/warehouses');
  };

  const storageTypes = [
    { value: 'ambient', label: 'Ambient Storage', icon: FiPackage, color: 'text-green-500' },
    { value: 'cold-storage', label: 'Cold Storage', icon: FiThermometer, color: 'text-blue-500' },
    { value: 'frozen', label: 'Frozen Storage', icon: FiThermometer, color: 'text-cyan-500' }
  ];

  if (fetching) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          {/* Header with back button */}
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate('/admin/warehouses')}
              className="flex items-center text-blue-600 hover:text-blue-700 mr-4"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <FiPackage className="mr-2" /> Edit Warehouse
            </h1>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Warehouse Name *
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Warehouse Code
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        placeholder="Auto-generate or enter custom code"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                          bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                          focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
                      />
                      <FiHash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateCode}
                      className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 
                        rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-sm"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Promotor *
                  </label>
                  <div className="relative">
                    <select
                      name="promotor"
                      value={formData.promotor}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                        focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
                      required
                      disabled={loadingPromotors}
                    >
                      <option value="">
                        {loadingPromotors ? "Loading promotors..." : "Select a promotor"}
                      </option>
                      {promotors.map((promotor) => (
                        <option key={promotor._id} value={promotor._id}>
                          {promotor.name} - {promotor.email}
                        </option>
                      ))}
                    </select>
                    <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Location Information Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <FiMapPin className="mr-2" /> Location Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    name="location.address"
                    value={formData.location.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="location.city"
                    value={formData.location.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    name="location.state"
                    value={formData.location.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="location.pincode"
                    value={formData.location.pincode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    name="location.coordinates.lat"
                    value={formData.location.coordinates.lat}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    name="location.coordinates.lng"
                    value={formData.location.coordinates.lng}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Storage Information Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <FiThermometer className="mr-2" /> Storage Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {storageTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <div
                      key={type.value}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        formData.storageType === type.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, storageType: type.value }))}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent className={`w-5 h-5 ${type.color}`} />
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {type.label}
                          </h3>
                          <input
                            type="radio"
                            name="storageType"
                            value={type.value}
                            checked={formData.storageType === type.value}
                            onChange={handleInputChange}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Total Capacity
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter capacity in units"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Stock
                  </label>
                  <input
                    type="number"
                    name="currentStock"
                    value={formData.currentStock}
                    onChange={handleInputChange}
                    min="0"
                    max={formData.capacity || undefined}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Current stock level"
                  />
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/admin/warehouses')}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-md 
                  bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300
                  hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || loadingPromotors}
                className="px-6 py-3 bg-blue-600 rounded-md hover:bg-blue-700 
                  disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-black"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="mr-2" /> Update Warehouse
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex flex-col items-center text-center">
              <div className="bg-green-100 p-3 rounded-full mb-4">
                <FiCheckCircle className="text-green-600 text-3xl" />
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Warehouse Updated Successfully!
              </h2>
              
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                The warehouse details have been updated.
              </p>
              
              <button
                onClick={closeSuccessModal}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Back to Warehouses
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditWarehouse;