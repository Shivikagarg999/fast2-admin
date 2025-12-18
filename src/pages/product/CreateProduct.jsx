import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPackage, FiHash, FiUser, FiMapPin, FiThermometer, FiPlus, FiTrash2, FiX, FiImage, FiVideo } from 'react-icons/fi';
import { Editor } from '@tinymce/tinymce-react';

const ProductCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [promotors, setPromotors] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingPromotors, setLoadingPromotors] = useState(true);
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const editorRef = useRef(null);

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
    
    // Physical Attributes
    weight: '',
    weightUnit: 'g',
    
    // Warehouse Information
    warehouseId: '',
    
    // Delivery Information
    estimatedDeliveryTime: '',
    deliveryCharges: '0',
    freeDeliveryThreshold: '0',
    serviceablePincodes: [],
    
    // Images (up to 5)
    images: [],
    
    // Video (1 max)
    video: null,

    // Variants
    variants: []
  });

  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodeError, setPincodeError] = useState('');

  // Common variant types
  const commonVariantTypes = [
    { name: 'Color', options: ['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow'] },
    { name: 'Size', options: ['S', 'M', 'L', 'XL', 'XXL'] },
    { name: 'Material', options: ['Cotton', 'Polyester', 'Silk', 'Wool', 'Linen'] },
    { name: 'Storage', options: ['64GB', '128GB', '256GB', '512GB', '1TB'] },
    { name: 'Style', options: ['Classic', 'Modern', 'Vintage', 'Sport'] }
  ];

  // Storage types for warehouse
  const storageTypes = [
    { value: 'ambient', label: 'Ambient Storage', icon: FiThermometer, color: 'text-green-500' },
    { value: 'cold-storage', label: 'Cold Storage', icon: FiThermometer, color: 'text-blue-500' },
    { value: 'frozen', label: 'Frozen Storage', icon: FiThermometer, color: 'text-indigo-500' },
  ];

  // Fetch data on component mount
  useEffect(() => {
    fetchPromotors();
    fetchWarehouses();
    fetchCategories();
  }, []);

  // Fetch promotors from API
  const fetchPromotors = async () => {
    try {
      setLoadingPromotors(true);
      const response = await fetch(`${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/promotor/`);
      if (!response.ok) throw new Error('Failed to fetch promotors');
      const data = await response.json();
      setPromotors(data);
    } catch (error) {
      console.error('Error fetching promotors:', error);
      setError('Failed to load promotors');
    } finally {
      setLoadingPromotors(false);
    }
  };

  // Fetch warehouses from API
  const fetchWarehouses = async () => {
    try {
      setLoadingWarehouses(true);
      const response = await fetch(`${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/warehouse/`);
      if (!response.ok) throw new Error('Failed to fetch warehouses');
      const data = await response.json();
      setWarehouses(data);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      setError('Failed to load warehouses');
    } finally {
      setLoadingWarehouses(false);
    }
  };

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await fetch(`${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/category/getall`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDescriptionChange = (content) => {
    setFormData(prev => ({
      ...prev,
      description: content
    }));
  };

  const handleImageChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const currentImages = formData.images;
    
    // Check if adding new files would exceed the limit
    if (currentImages.length + newFiles.length > 5) {
      setError(`Maximum 5 images allowed. You can add ${5 - currentImages.length} more image(s).`);
      e.target.value = ''; // Reset input
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newFiles]
    }));
    
    // Reset the input so the same file can be selected again if needed
    e.target.value = '';
    setError('');
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError('Video file size should not exceed 50MB');
        return;
      }
      setFormData(prev => ({
        ...prev,
        video: file
      }));
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const removeVideo = () => {
    setFormData(prev => ({
      ...prev,
      video: null
    }));
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

  // Pincode management functions
  const validatePincode = (pincode) => {
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode);
  };

  const addPincode = () => {
    const trimmedPincode = pincodeInput.trim();
    
    if (!trimmedPincode) {
      setPincodeError('Please enter a pincode');
      return;
    }

    if (!validatePincode(trimmedPincode)) {
      setPincodeError('Invalid pincode format. Must be 6 digits.');
      return;
    }

    if (formData.serviceablePincodes.includes(trimmedPincode)) {
      setPincodeError('Pincode already added');
      return;
    }

    setFormData(prev => ({
      ...prev,
      serviceablePincodes: [...prev.serviceablePincodes, trimmedPincode]
    }));
    
    setPincodeInput('');
    setPincodeError('');
  };

  const removePincode = (pincodeToRemove) => {
    setFormData(prev => ({
      ...prev,
      serviceablePincodes: prev.serviceablePincodes.filter(p => p !== pincodeToRemove)
    }));
  };

  const handlePincodeKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addPincode();
    }
  };

  // Form validation
  const validateForm = () => {
    const errors = [];

    // Check required fields
    if (!formData.name.trim()) errors.push('Product name is required');
    if (!formData.brand.trim()) errors.push('Brand is required');
    if (!formData.category) errors.push('Category is required');
    if (!formData.price) errors.push('Price is required');
    if (!formData.promotor) errors.push('Promotor is required');
    if (formData.images.length === 0) errors.push('At least one product image is required');
    if (formData.images.length > 5) errors.push('Maximum 5 images allowed');
    if (!formData.unitValue) errors.push('Unit value is required');
    if (!formData.weight) errors.push('Weight is required');

    // Validate variants
    formData.variants.forEach((variant, index) => {
      if (!variant.name.trim()) {
        errors.push(`Variant ${index + 1} name is required`);
      }
      variant.options.forEach((option, optIndex) => {
        if (!option.value.trim()) {
          errors.push(`Variant ${index + 1} option ${optIndex + 1} value is required`);
        }
      });
    });

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      
      // Append all form fields to FormData
      Object.keys(formData).forEach(key => {
        if (key === 'images' && formData[key].length > 0) {
          // Append all images
          formData[key].forEach((image) => {
            formDataToSend.append('images', image);
          });
        } else if (key === 'video' && formData[key]) {
          // Append video if present
          formDataToSend.append('video', formData[key]);
        } else if (key === 'variants') {
          // Clean variants data before sending
          const cleanedVariants = formData.variants.map(variant => ({
            name: variant.name.trim(),
            options: variant.options.map(option => ({
              value: option.value.trim(),
              price: option.price ? parseFloat(option.price) : undefined,
              quantity: option.quantity ? parseInt(option.quantity) : undefined,
              sku: option.sku.trim() || undefined
            })).filter(option => option.value) // Remove empty options
          })).filter(variant => variant.name && variant.options.length > 0); // Remove empty variants
          
          console.log('Sending variants:', cleanedVariants);
          formDataToSend.append(key, JSON.stringify(cleanedVariants));
        } else if (key === 'serviceablePincodes') {
          // Send pincodes as JSON array
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });

      console.log('Form data being sent:');
      for (let [key, value] of formDataToSend.entries()) {
        if (key === 'images' || key === 'video') {
          console.log(key, 'File:', value.name, value.size, 'bytes');
        } else {
          console.log(key, value);
        }
      }

      const response = await fetch(`${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/product/create`, {
        method: 'POST',
        body: formDataToSend,
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Server returned non-JSON response:', text.substring(0, 500));
        throw new Error(`Server error: ${response.status} ${response.statusText}. Check server logs for details.`);
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create product');
      }

      navigate('/admin/products');
    } catch (error) {
      console.error('Error creating product:', error);
      setError(error.message || 'Failed to create product. Please check all required fields and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <FiPackage className="mr-2" /> Create New Product
          </h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
            {/* Basic Information Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h2>
              
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
                    placeholder="Enter product name"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <Editor
                    apiKey="xw0haeefepmen4923ro5m463eb97qhseuprfkpbuan5t10u5" 
                    onInit={(evt, editor) => editorRef.current = editor}
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
                    placeholder="Enter brand name"
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
                    disabled={loadingCategories}
                  >
                    <option value="">{loadingCategories ? "Loading categories..." : "Select a category"}</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Pricing Information Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Pricing Information</h2>
              
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
                    placeholder="0.00"
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
                    placeholder="0.00"
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
                    placeholder="1"
                  />
                </div>
              </div>
            </div>

            {/* Variants Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Product Variants</h2>
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
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FiPackage className="mx-auto text-4xl mb-2" />
                  <p>No variants added yet. Add variants like size, color, etc.</p>
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
            
            {/* Promotor Information Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <FiUser className="mr-2" /> Promotor Information
              </h2>
              
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
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            
            {/* Inventory Information Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Inventory Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    placeholder="0"
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
                    placeholder="1"
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
                    placeholder="10"
                  />
                </div>
              </div>
            </div>
            
            {/* Physical Attributes Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Physical Attributes</h2>
              
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
                    placeholder="0.00"
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
            
            {/* Warehouse Information Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <FiMapPin className="mr-2" /> Warehouse Information
              </h2>
              
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
                    disabled={loadingWarehouses}
                  >
                    <option value="">{loadingWarehouses ? "Loading warehouses..." : "Select a warehouse"}</option>
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
            
            {/* Delivery Information Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Delivery Information</h2>
              
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
                    placeholder="0.00"
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
                    placeholder="0.00"
                  />
                </div>
                
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Serviceable Pincodes
                  </label>
                  
                  {/* Pincode Input */}
                  <div className="flex gap-2 mb-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={pincodeInput}
                        onChange={(e) => {
                          setPincodeInput(e.target.value);
                          setPincodeError('');
                        }}
                        onKeyPress={handlePincodeKeyPress}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                          bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                          focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter 6-digit pincode (e.g., 110001)"
                        maxLength="6"
                      />
                      {pincodeError && (
                        <p className="text-red-500 text-sm mt-1">{pincodeError}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={addPincode}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                        flex items-center whitespace-nowrap"
                    >
                      <FiPlus className="mr-1" /> Add Pincode
                    </button>
                  </div>

                  {/* Pincode Tags Display */}
                  {formData.serviceablePincodes.length > 0 ? (
                    <div className="border border-gray-300 dark:border-gray-600 rounded-md p-3 
                      bg-gray-50 dark:bg-gray-700/50 min-h-[60px]">
                      <div className="flex flex-wrap gap-2">
                        {formData.serviceablePincodes.map((pincode, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm 
                              bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200
                              border border-blue-300 dark:border-blue-700"
                          >
                            <FiMapPin className="mr-1" size={14} />
                            {pincode}
                            <button
                              type="button"
                              onClick={() => removePincode(pincode)}
                              className="ml-2 text-blue-600 dark:text-blue-300 hover:text-blue-800 
                                dark:hover:text-blue-100"
                            >
                              <FiX size={16} />
                            </button>
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {formData.serviceablePincodes.length} pincode{formData.serviceablePincodes.length !== 1 ? 's' : ''} added
                      </p>
                    </div>
                  ) : (
                    <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-md p-4 
                      text-center text-gray-500 dark:text-gray-400">
                      <FiMapPin className="mx-auto mb-2" size={24} />
                      <p className="text-sm">No pincodes added yet. Add pincodes where this product can be delivered.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Images and Video Upload Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <FiImage className="mr-2" /> Product Images & Video
              </h2>
              
              {/* Images Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Images * ({formData.images.length}/5)
                </label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    name="images"
                    onChange={handleImageChange}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    accept="image/*"
                    multiple
                    disabled={formData.images.length >= 5}
                  />
                  {formData.images.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, images: [] }))}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 
                        flex items-center whitespace-nowrap"
                    >
                      <FiTrash2 className="mr-1" /> Clear All
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {formData.images.length >= 5 
                    ? 'Maximum 5 images reached. Remove some to add more.' 
                    : `Upload up to 5 product images. You can add ${5 - formData.images.length} more. First image will be the primary image.`
                  }
                </p>
                
                {/* Image Preview */}
                {formData.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 
                            opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FiX size={16} />
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Video Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <FiVideo className="mr-2" /> Product Video (Optional)
                </label>
                <input
                  type="file"
                  name="video"
                  onChange={handleVideoChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                    focus:outline-none focus:ring-2 focus:ring-blue-500"
                  accept="video/*"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Upload a product video (Max 50MB). Supported formats: MP4, MOV, AVI
                </p>
                
                {/* Video Preview */}
                {formData.video && (
                  <div className="mt-4">
                    <div className="relative inline-block">
                      <div className="rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600 max-w-md">
                        <video
                          src={URL.createObjectURL(formData.video)}
                          controls
                          className="w-full"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={removeVideo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 
                          hover:bg-red-600 transition-colors"
                      >
                        <FiX size={16} />
                      </button>
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {formData.video.name} ({(formData.video.size / (1024 * 1024)).toFixed(2)} MB)
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/admin/products')}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-md 
                  bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300
                  hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || loadingPromotors || loadingWarehouses || loadingCategories}
                className="px-6 py-3 bg-blue-600 rounded-md hover:bg-blue-700 
                  disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-white"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <FiPlus className="mr-2" /> Create Product
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductCreate;