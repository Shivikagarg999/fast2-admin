import { useState, useEffect, useRef } from "react";
import { FiPlus, FiPackage, FiMapPin, FiThermometer, FiHash, FiUser, FiMap } from "react-icons/fi";
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = 'pk.eyJ1IjoiZmFzdDIiLCJhIjoiY21mbW9qbzZlMDQ5dzJpcXhlOW82ODdlcSJ9.HYJxZbPDCZHD8_Q5faa6ig';

const CreateWarehouse = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [promotors, setPromotors] = useState([]);
  const [loadingPromotors, setLoadingPromotors] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    warehouseManager: "",
    contact: "",
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
    currentStock: "0"
  });

  useEffect(() => {
    fetchPromotors();
  }, []);

  useEffect(() => {
    if (showMap && mapContainer.current && !map.current) {
      initializeMap();
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [showMap]);

  const fetchPromotors = async () => {
    try {
      setLoadingPromotors(true);
      const response = await fetch('https://api.fast2.in/api/admin/promotor/');

      if (!response.ok) {
        throw new Error(`Failed to fetch promotors: ${response.status}`);
      }
      const data = await response.json();
      setPromotors(data);
      setLoadingPromotors(false);
    } catch (error) {
      console.error("Error fetching promotors:", error);
      setError("Failed to load promotors");
      setLoadingPromotors(false);
    }
  };

  const initializeMap = () => {
    // Use default coordinates if available, otherwise use Delhi, India
    const defaultLat = formData.location.coordinates.lat || 28.6139;
    const defaultLng = formData.location.coordinates.lng || 77.2090;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [defaultLng, defaultLat],
      zoom: 10
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl());

    // Add geolocate control
    map.current.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserLocation: true
    }));

    // Create a marker if coordinates exist
    if (formData.location.coordinates.lat && formData.location.coordinates.lng) {
      marker.current = new mapboxgl.Marker()
        .setLngLat([formData.location.coordinates.lng, formData.location.coordinates.lat])
        .addTo(map.current);
    }

    // Add click event to set marker
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;

      // Update form data with new coordinates
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          coordinates: {
            lat: lat.toFixed(6),
            lng: lng.toFixed(6)
          }
        }
      }));

      // Remove existing marker if any
      if (marker.current) {
        marker.current.remove();
      }

      // Add new marker
      marker.current = new mapboxgl.Marker()
        .setLngLat([lng, lat])
        .addTo(map.current);
    });
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

  // Function to get coordinates from address (geocoding)
  const handleGeocodeAddress = async () => {
    const { address, city, state, pincode } = formData.location;
    const fullAddress = `${address}, ${city}, ${state}, ${pincode}`.trim().replace(/^,\s*|,\s*$/g, '');

    if (!fullAddress || fullAddress.length < 3) {
      setError("Please enter a more complete address for geocoding");
      return;
    }

    try {
      setLoading(true);

      // Use Mapbox Geocoding API
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=${mapboxgl.accessToken}`
      );

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;

        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: {
              lat: lat.toFixed(6),
              lng: lng.toFixed(6)
            }
          }
        }));

        // Update map if it's visible
        if (showMap && map.current) {
          // Remove existing marker if any
          if (marker.current) {
            marker.current.remove();
          }

          // Add new marker
          marker.current = new mapboxgl.Marker()
            .setLngLat([lng, lat])
            .addTo(map.current);

          // Fly to the location
          map.current.flyTo({
            center: [lng, lat],
            zoom: 14,
            essential: true
          });
        }

        setLoading(false);
        alert(`Coordinates found for "${fullAddress}"`);
      } else {
        setError("No coordinates found for this address");
        setLoading(false);
      }
    } catch (error) {
      setError("Failed to get coordinates from address");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate required fields
    if (!formData.name || !formData.warehouseManager || !formData.contact || !formData.location.city) {
      setError("Please fill in all required fields (Name, Manager, Contact, and City)");
      setLoading(false);
      return;
    }

    // Validate coordinates
    if (!formData.location.coordinates.lat || !formData.location.coordinates.lng) {
      setError("Please select warehouse location coordinates using the map or geocoding");
      setLoading(false);
      return;
    }

    // Validate promotor
    if (!formData.promotor) {
      setError("Please select a promotor");
      setLoading(false);
      return;
    }

    try {
      // Prepare data for API
      const submitData = {
        name: formData.name,
        code: formData.code,
        warehouseManager: formData.warehouseManager,
        contact: formData.contact,
        promotor: formData.promotor,
        location: {
          address: formData.location.address,
          city: formData.location.city,
          state: formData.location.state,
          pincode: formData.location.pincode,
          coordinates: {
            lat: Number(formData.location.coordinates.lat),
            lng: Number(formData.location.coordinates.lng)
          }
        },
        storageType: formData.storageType,
        capacity: formData.capacity ? Number(formData.capacity) : 0,
        currentStock: formData.currentStock ? Number(formData.currentStock) : 0
      };

      // Call the real API
      const response = await fetch('https://api.fast2.in/api/admin/warehouse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      alert('Warehouse created successfully!');

      // Reset form
      setFormData({
        name: "",
        code: "",
        warehouseManager: "",
        contact: "",
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
        currentStock: "0"
      });
      setShowMap(false);

    } catch (error) {
      console.error('Error creating warehouse:', error);
      setError('Error creating warehouse: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const storageTypes = [
    { value: 'ambient', label: 'Ambient Storage', icon: FiPackage, color: 'text-green-500' },
    { value: 'cold-storage', label: 'Cold Storage', icon: FiThermometer, color: 'text-blue-500' },
    { value: 'frozen', label: 'Frozen Storage', icon: FiThermometer, color: 'text-cyan-500' }
  ];

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-black mb-6 flex items-center">
            <FiPackage className="mr-2" /> Create New Warehouse
          </h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Basic Information Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-black mb-4">Basic Information</h2>

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
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-black
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
                          bg-white dark:bg-gray-700 text-gray-900 dark:text-black
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Warehouse Manager *
                  </label>
                  <input
                    type="text"
                    name="warehouseManager"
                    value={formData.warehouseManager}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-black
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Warehouse Contact *
                  </label>
                  <input
                    type="text"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-black
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
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
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-black
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
              <h2 className="text-lg font-medium text-gray-900 dark:text-black mb-4 flex items-center">
                <FiMapPin className="mr-2" /> Location Information
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Address Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      name="location.address"
                      value={formData.location.address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-black
                        focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                          bg-white dark:bg-gray-700 text-gray-900 dark:text-black
                          focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        State
                      </label>
                      <select
                        name="location.state"
                        value={formData.location.state}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
      focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select a state</option>
                        {[
                          "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
                          "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
                          "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
                          "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
                          "Uttar Pradesh", "Uttarakhand", "West Bengal"
                        ].map((state) => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>  <select
                    name="location.state"
                    value={formData.location.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a state</option>
                    {[
                      "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
                      "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
                      "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
                      "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
                      "Uttar Pradesh", "Uttarakhand", "West Bengal"
                    ].map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Pincode
                    </label>
                    <input
                      type="text"
                      name="location.pincode"
                      value={formData.location.pincode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-black
                        focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Coordinates Section */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-md font-medium text-gray-900 dark:text-black mb-3 flex items-center">
                      <FiMap className="mr-2" /> Coordinates *
                    </h3>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Latitude
                        </label>
                        <input
                          type="number"
                          step="any"
                          name="location.coordinates.lat"
                          value={formData.location.coordinates.lat}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-600 text-gray-900 dark:text-black text-sm
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 28.6139"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Longitude
                        </label>
                        <input
                          type="number"
                          step="any"
                          name="location.coordinates.lng"
                          value={formData.location.coordinates.lng}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                            bg-white dark:bg-gray-600 text-gray-900 dark:text-black text-sm
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 77.2090"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleGeocodeAddress}
                        disabled={loading}
                        className="flex-1 min-w-0 px-3 py-2 bg-green-600 text-black rounded-md hover:bg-green-700 
                          disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                            Finding...
                          </>
                        ) : (
                          <>
                            <FiMapPin className="mr-1" /> Get from Address
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowMap(!showMap)}
                        className="flex-1 min-w-0 px-3 py-2 bg-blue-600 text-black rounded-md hover:bg-blue-700 
                          text-sm flex items-center justify-center"
                      >
                        <FiMap className="mr-1" />
                        {showMap ? 'Hide Map' : 'Show Map'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Map Section */}
                {showMap && (
                  <div className="space-y-4">
                    <h3 className="text-md font-medium text-gray-900 dark:text-black">
                      Select Location on Map
                    </h3>
                    <div ref={mapContainer} className="w-full h-96 rounded-lg overflow-hidden"></div>
                    {formData.location.coordinates.lat && formData.location.coordinates.lng && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 bg-green-50 dark:bg-green-900/20 p-3 rounded">
                        <strong>Selected Coordinates:</strong><br />
                        Lat: {formData.location.coordinates.lat}<br />
                        Lng: {formData.location.coordinates.lng}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Storage Information Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-black mb-4 flex items-center">
                <FiThermometer className="mr-2" /> Storage Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {storageTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <div
                      key={type.value}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${formData.storageType === type.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                      onClick={() => setFormData(prev => ({ ...prev, storageType: type.value }))}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent className={`w-5 h-5 ${type.color}`} />
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 dark:text-black">
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
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-black
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
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-black
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
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-md 
                  bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300
                  hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || loadingPromotors}
                className="px-6 py-3 bg-blue-600 text-black rounded-md hover:bg-blue-700 
                  disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <FiPlus className="mr-2" /> Create Warehouse
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateWarehouse;