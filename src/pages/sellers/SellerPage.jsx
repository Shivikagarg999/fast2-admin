import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, RefreshCw, Plus, Filter, Search, X, Save, Loader2, 
  User, Building, Mail, Phone, MapPin, Lock, Eye, EyeOff,
  AlertCircle, Home, Globe, Briefcase, Shield, CreditCard,
  Edit, Trash2, CheckCircle, XCircle, ChevronLeft, ChevronRight,
  AlertTriangle
} from 'lucide-react';
import usePermissions, { PERMISSIONS } from '../../hooks/usePermissions';

const Bank = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
  </svg>
);

const CreateSellerModal = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [promotors, setPromotors] = useState([]);
  const [loadingPromotors, setLoadingPromotors] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    gstNumber: '',
    panNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      coordinates: {
        lat: '',
        lng: ''
      }
    },
    bankDetails: {
      accountHolder: '',
      accountNumber: '',
      ifscCode: '',
      bankName: ''
    },
    promotor: '',
    password: '',
    confirmPassword: '',
    approvalStatus: 'approved',
    isActive: true
  });

  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    fetchPromotors();
  }, []);

  const fetchPromotors = async () => {
    try {
      setLoadingPromotors(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/promotor/`,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && Array.isArray(response.data)) {
        setPromotors(response.data);
      } else {
        console.error('Unexpected promotors response format:', response.data);
        setPromotors([]);
      }
    } catch (error) {
      console.error('Error fetching promotors:', error);
      setPromotors([]);
      setApiError('Failed to load promotors. Please try again.');
    } finally {
      setLoadingPromotors(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const keys = name.split('.');
      setFormData(prev => {
        const newData = { ...prev };
        let current = newData;
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = type === 'checkbox' ? checked : value;
        return newData;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear field-specific error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear API error when user starts typing
    if (apiError) {
      setApiError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Basic info validation
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (formData.phone && !phoneRegex.test(cleanPhone)) {
      newErrors.phone = 'Invalid phone number (10-digit Indian number starting with 6-9)';
    }
    
    // GST validation
    if (formData.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNumber.toUpperCase())) {
      newErrors.gstNumber = 'Invalid GST number format';
    }
    
    // PAN validation
    if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber.toUpperCase())) {
      newErrors.panNumber = 'Invalid PAN number format';
    }
    
    // Account info validation
    if (!formData.promotor) newErrors.promotor = 'Promotor is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirm password is required';
    
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setApiError('');
    setSuccessMessage('');
    
    try {
      const token = localStorage.getItem('token');
      
      // Prepare data for API
      const submitData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.replace(/\D/g, ''), // Remove non-digits
        businessName: formData.businessName.trim(),
        gstNumber: formData.gstNumber ? formData.gstNumber.trim().toUpperCase() : '',
        panNumber: formData.panNumber ? formData.panNumber.trim().toUpperCase() : '',
        address: {
          street: formData.address.street.trim(),
          city: formData.address.city.trim(),
          state: formData.address.state.trim(),
          pincode: formData.address.pincode.trim(),
          coordinates: {
            lat: parseFloat(formData.address.coordinates.lat) || 0,
            lng: parseFloat(formData.address.coordinates.lng) || 0
          }
        },
        bankDetails: {
          accountHolder: formData.bankDetails.accountHolder.trim(),
          accountNumber: formData.bankDetails.accountNumber.trim(),
          ifscCode: formData.bankDetails.ifscCode.trim().toUpperCase(),
          bankName: formData.bankDetails.bankName.trim()
        },
        promotor: formData.promotor,
        password: formData.password,
        approvalStatus: formData.approvalStatus,
        isActive: formData.isActive
      };

      console.log('Submitting seller data:', submitData);

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/seller/sellers/create`,
        submitData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Create seller response:', response.data);

      if (response.data.success) {
        setSuccessMessage(response.data.message || 'Seller created successfully!');
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          businessName: '',
          gstNumber: '',
          panNumber: '',
          address: {
            street: '',
            city: '',
            state: '',
            pincode: '',
            coordinates: { lat: '', lng: '' }
          },
          bankDetails: {
            accountHolder: '',
            accountNumber: '',
            ifscCode: '',
            bankName: ''
          },
          promotor: '',
          password: '',
          confirmPassword: '',
          approvalStatus: 'approved',
          isActive: true
        });
        
        // Call success callback after a delay
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Error creating seller:', error);
      
      let errorMessage = 'Failed to create seller';
      
      if (error.response) {
        const { data } = error.response;
        console.error('Error response data:', data);
        
        if (data.message) {
          errorMessage = data.message;
        }
        
        if (data.errors && Array.isArray(data.errors)) {
          errorMessage = data.errors.join(', ');
        }
        
        // Handle validation errors
        if (error.response.status === 400 || error.response.status === 409) {
          const fieldErrors = {};
          
          if (data.message.includes('email')) {
            fieldErrors.email = data.message;
          } else if (data.message.includes('phone')) {
            fieldErrors.phone = data.message;
          } else if (data.message.includes('password')) {
            fieldErrors.password = data.message;
          } else if (data.message.includes('GST')) {
            fieldErrors.gstNumber = data.message;
          } else if (data.message.includes('PAN')) {
            fieldErrors.panNumber = data.message;
          }
          
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(prev => ({ ...prev, ...fieldErrors }));
          }
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
        console.error('Network error:', error.request);
      } else {
        errorMessage = error.message;
      }
      
      setApiError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: '0',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '50',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User style={{ width: '20px', height: '20px' }} />
            Create New Seller
          </h2>
          <button
            onClick={onClose}
            style={{ 
              color: '#9ca3af', 
              padding: '4px', 
              borderRadius: '4px', 
              border: 'none', 
              backgroundColor: 'transparent', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            disabled={loading}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        <div style={{ borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', padding: '0 24px' }}>
            {['basic', 'address', 'bank', 'account'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderBottom: '2px solid',
                  borderColor: activeTab === tab ? '#000000' : 'transparent',
                  color: activeTab === tab ? '#111827' : '#6b7280',
                  backgroundColor: 'transparent',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                disabled={loading}
              >
                {tab === 'basic' && 'Basic Info'}
                {tab === 'address' && 'Address'}
                {tab === 'bank' && 'Bank'}
                {tab === 'account' && 'Account'}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '24px' }}>
            {/* Error Message */}
            {apiError && (
              <div style={{
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '12px 16px',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertTriangle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                {apiError}
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div style={{
                backgroundColor: '#dcfce7',
                border: '1px solid #bbf7d0',
                color: '#16a34a',
                padding: '12px 16px',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                {successMessage}
              </div>
            )}

            {activeTab === 'basic' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter seller name"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${errors.name ? '#ef4444' : '#d1d5db'}`,
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      fontSize: '14px'
                    }}
                    disabled={loading}
                  />
                  {errors.name && <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>{errors.name}</p>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter seller email"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${errors.email ? '#ef4444' : '#d1d5db'}`,
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      fontSize: '14px'
                    }}
                    disabled={loading}
                  />
                  {errors.email && <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>{errors.email}</p>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter 10-digit phone number"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${errors.phone ? '#ef4444' : '#d1d5db'}`,
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      fontSize: '14px'
                    }}
                    disabled={loading}
                  />
                  {errors.phone && <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>{errors.phone}</p>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Business Name *
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    placeholder="Enter business name"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${errors.businessName ? '#ef4444' : '#d1d5db'}`,
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      fontSize: '14px'
                    }}
                    disabled={loading}
                  />
                  {errors.businessName && <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>{errors.businessName}</p>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    GST Number (Optional)
                  </label>
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleInputChange}
                    placeholder="Enter GST number"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${errors.gstNumber ? '#ef4444' : '#d1d5db'}`,
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      fontSize: '14px'
                    }}
                    disabled={loading}
                  />
                  {errors.gstNumber && <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>{errors.gstNumber}</p>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    PAN Number (Optional)
                  </label>
                  <input
                    type="text"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleInputChange}
                    placeholder="Enter PAN number"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${errors.panNumber ? '#ef4444' : '#d1d5db'}`,
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      fontSize: '14px'
                    }}
                    disabled={loading}
                  />
                  {errors.panNumber && <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>{errors.panNumber}</p>}
                </div>
              </div>
            )}

            {activeTab === 'address' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Street Address
                  </label>
                  <textarea
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleInputChange}
                    placeholder="Enter street address"
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                    disabled={loading}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      City
                    </label>
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      placeholder="Enter city"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#ffffff',
                        color: '#111827',
                        fontSize: '14px'
                      }}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      State
                    </label>
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleInputChange}
                      placeholder="Enter state"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#ffffff',
                        color: '#111827',
                        fontSize: '14px'
                      }}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Pincode
                    </label>
                    <input
                      type="text"
                      name="address.pincode"
                      value={formData.address.pincode}
                      onChange={handleInputChange}
                      placeholder="Enter pincode"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#ffffff',
                        color: '#111827',
                        fontSize: '14px'
                      }}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Latitude (Optional)
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="address.coordinates.lat"
                      value={formData.address.coordinates.lat}
                      onChange={handleInputChange}
                      placeholder="Enter latitude"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#ffffff',
                        color: '#111827',
                        fontSize: '14px'
                      }}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Longitude (Optional)
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="address.coordinates.lng"
                      value={formData.address.coordinates.lng}
                      onChange={handleInputChange}
                      placeholder="Enter longitude"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#ffffff',
                        color: '#111827',
                        fontSize: '14px'
                      }}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bank' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    name="bankDetails.accountHolder"
                    value={formData.bankDetails.accountHolder}
                    onChange={handleInputChange}
                    placeholder="Enter account holder name"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      fontSize: '14px'
                    }}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="bankDetails.accountNumber"
                    value={formData.bankDetails.accountNumber}
                    onChange={handleInputChange}
                    placeholder="Enter account number"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      fontSize: '14px'
                    }}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    name="bankDetails.ifscCode"
                    value={formData.bankDetails.ifscCode}
                    onChange={handleInputChange}
                    placeholder="Enter IFSC code"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      fontSize: '14px'
                    }}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bankDetails.bankName"
                    value={formData.bankDetails.bankName}
                    onChange={handleInputChange}
                    placeholder="Enter bank name"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      fontSize: '14px'
                    }}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Promotor *
                  </label>
                  <select
                    name="promotor"
                    value={formData.promotor}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${errors.promotor ? '#ef4444' : '#d1d5db'}`,
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      fontSize: '14px'
                    }}
                    disabled={loading || loadingPromotors}
                  >
                    <option value="">Select Promotor</option>
                    {promotors.map((promotor) => (
                      <option key={promotor._id} value={promotor._id}>
                        {promotor.name} - {promotor.email}
                      </option>
                    ))}
                  </select>
                  {errors.promotor && <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>{errors.promotor}</p>}
                  {loadingPromotors && <p style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>Loading promotors...</p>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Approval Status
                  </label>
                  <select
                    name="approvalStatus"
                    value={formData.approvalStatus}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      fontSize: '14px'
                    }}
                    disabled={loading}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter password (min. 6 characters)"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: `1px solid ${errors.password ? '#ef4444' : '#d1d5db'}`,
                        backgroundColor: '#ffffff',
                        color: '#111827',
                        fontSize: '14px'
                      }}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        color: '#9ca3af'
                      }}
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                    </button>
                  </div>
                  {errors.password && <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>{errors.password}</p>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Confirm Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm password"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: `1px solid ${errors.confirmPassword ? '#ef4444' : '#d1d5db'}`,
                        backgroundColor: '#ffffff',
                        color: '#111827',
                        fontSize: '14px'
                      }}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        color: '#9ca3af'
                      }}
                      disabled={loading}
                    >
                      {showConfirmPassword ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>{errors.confirmPassword}</p>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      border: '1px solid #d1d5db'
                    }}
                    disabled={loading}
                  />
                  <label htmlFor="isActive" style={{ fontSize: '14px', color: '#374151' }}>
                    Activate account immediately
                  </label>
                </div>
              </div>
            )}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              Step {['basic', 'address', 'bank', 'account'].indexOf(activeTab) + 1} of 4
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              {activeTab !== 'basic' && (
                <button
                  type="button"
                  onClick={() => {
                    const tabs = ['basic', 'address', 'bank', 'account'];
                    const currentIndex = tabs.indexOf(activeTab);
                    setActiveTab(tabs[currentIndex - 1]);
                  }}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#ffffff',
                    color: '#374151',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  disabled={loading}
                >
                  Previous
                </button>
              )}
              
              {activeTab !== 'account' ? (
                <button
                  type="button"
                  onClick={() => {
                    const tabs = ['basic', 'address', 'bank', 'account'];
                    const currentIndex = tabs.indexOf(activeTab);
                    setActiveTab(tabs[currentIndex + 1]);
                  }}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  disabled={loading}
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{
                        animation: 'spin 1s linear infinite',
                        borderRadius: '9999px',
                        width: '16px',
                        height: '16px',
                        borderBottom: '2px solid #ffffff'
                      }}></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save style={{ width: '16px', height: '16px' }} />
                      Create Seller
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const SellerPage = () => {
  const { hasPermission, isSuperAdmin } = usePermissions();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalSellers: 0
  });

  const [filters, setFilters] = useState({
    search: '',
    approvalStatus: '',
    isActive: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 10
  });

  useEffect(() => {
    fetchSellers();
  }, [filters]);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.approvalStatus) params.append('approvalStatus', filters.approvalStatus);
      if (filters.isActive) params.append('isActive', filters.isActive);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      params.append('page', filters.page);
      params.append('limit', filters.limit);

      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/seller/sellers?${params.toString()}`,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setSellers(response.data.data || []);
      setPagination(response.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalSellers: 0
      });
    } catch (error) {
      console.error('Error fetching sellers:', error);
      alert('Failed to fetch sellers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(prev => ({
      ...prev,
      search: searchQuery,
      page: 1
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilters({
      search: '',
      approvalStatus: '',
      isActive: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      limit: 10
    });
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({
      ...prev,
      page
    }));
  };

  const handleApprove = async (sellerId) => {
    if (!hasPermission(PERMISSIONS.SELLERS_APPROVE) && !isSuperAdmin()) {
      alert("You don't have permission to approve sellers");
      return;
    }
    
    if (!window.confirm('Are you sure you want to approve this seller?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const adminData = localStorage.getItem('adminData');
      const adminId = adminData ? JSON.parse(adminData)._id : null;
      
      await axios.patch(
        `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/seller/seller/${sellerId}/approval`,
        {
          action: 'approve',
          adminId: adminId
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      alert('Seller approved successfully');
      fetchSellers();
    } catch (error) {
      console.error('Error approving seller:', error);
      alert('Failed to approve seller: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleReject = async (sellerId) => {
    if (!hasPermission(PERMISSIONS.SELLERS_REJECT) && !isSuperAdmin()) {
      alert("You don't have permission to reject sellers");
      return;
    }
    
    const reason = window.prompt('Please enter rejection reason:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('token');
      const adminData = localStorage.getItem('adminData');
      const adminId = adminData ? JSON.parse(adminData)._id : null;
      
      await axios.patch(
        `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/seller/seller/${sellerId}/approval`,
        {
          action: 'reject',
          adminId: adminId,
          rejectionReason: reason
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      alert('Seller rejected successfully');
      fetchSellers();
    } catch (error) {
      console.error('Error rejecting seller:', error);
      alert('Failed to reject seller: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleToggleStatus = async (sellerId, currentStatus) => {
    if (!hasPermission(PERMISSIONS.SELLERS_TOGGLE_STATUS) && !isSuperAdmin()) {
      alert("You don't have permission to toggle seller status");
      return;
    }
    
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this seller?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/seller/seller/${sellerId}/status`,
        {
          isActive: !currentStatus
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      alert(`Seller ${action}d successfully`);
      fetchSellers();
    } catch (error) {
      console.error('Error toggling seller status:', error);
      alert('Failed to update seller status: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditSeller = (seller) => {
    // Implement edit functionality
    console.log('Edit seller:', seller);
  };

  const handleDeleteSeller = async (sellerId, sellerName) => {
    if (!hasPermission(PERMISSIONS.SELLERS_DELETE) && !isSuperAdmin()) {
      alert("You don't have permission to delete sellers");
      return;
    }
    
    if (!confirm(`Are you sure you want to delete seller: ${sellerName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(
        `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/seller/seller/${sellerId}`,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (res.data.success) {
        alert("Seller deleted successfully");
        fetchSellers();
      }
    } catch (err) {
      console.error("Error deleting seller:", err);
      alert(err.response?.data?.message || "Failed to delete seller");
    }
  };

  const handleRefresh = () => {
    fetchSellers();
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      approved: { backgroundColor: '#dcfce7', color: '#166534' },
      pending: { backgroundColor: '#fef3c7', color: '#92400e' },
      rejected: { backgroundColor: '#fee2e2', color: '#991b1b' },
    };
    
    const style = statusColors[status] || { backgroundColor: '#f3f4f6', color: '#374151' };
    
    return (
      <span style={{
        padding: '4px 12px',
        fontSize: '12px',
        fontWeight: '500',
        borderRadius: '9999px',
        ...style
      }}>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || "N/A"}
      </span>
    );
  };

  const getActiveBadge = (isActive) => {
    const style = isActive 
      ? { backgroundColor: '#dcfce7', color: '#166534' }
      : { backgroundColor: '#fee2e2', color: '#991b1b' };
    
    return (
      <span style={{
        padding: '4px 12px',
        fontSize: '12px',
        fontWeight: '500',
        borderRadius: '9999px',
        ...style
      }}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const buttonStyles = {
    primary: {
      backgroundColor: '#000000',
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      padding: '10px 20px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '500'
    },
    secondary: {
      backgroundColor: '#ffffff',
      color: '#374151',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      padding: '10px 20px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '500'
    }
  };

  const hasActiveFilters = filters.search || filters.approvalStatus || filters.isActive;

  return (
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', width: '100%', padding: '24px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users style={{ width: '24px', height: '24px', color: '#2563eb' }} />
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>All Sellers</h1>
            <span style={{
              padding: '4px 12px',
              fontSize: '12px',
              backgroundColor: '#e5e7eb',
              color: '#374151',
              borderRadius: '9999px'
            }}>
              {pagination.totalSellers} sellers
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '16px', flexDirection: 'column', width: '100%' }}>
              <div style={{ display: 'flex', gap: '16px', flexDirection: 'row' }}>
                {/* Search Input */}
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                    width: '16px',
                    height: '16px'
                  }} />
                  <input
                    type="text"
                    placeholder="Search by name, email, phone, business..."
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 40px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      fontSize: '14px'
                    }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                  />
                </div>

                {/* Status Filter */}
                <div style={{ width: '150px' }}>
                  <select
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      fontSize: '14px'
                    }}
                    value={filters.approvalStatus}
                    onChange={(e) => handleFilterChange('approvalStatus', e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Active Filter */}
                <div style={{ width: '150px' }}>
                  <select
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      fontSize: '14px'
                    }}
                    value={filters.isActive}
                    onChange={(e) => handleFilterChange('isActive', e.target.value)}
                  >
                    <option value="">All States</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                {/* Add Seller Button */}
                {(hasPermission(PERMISSIONS.SELLERS_CREATE) || isSuperAdmin()) && (
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    style={buttonStyles.primary}
                  >
                    <Plus style={{ width: '16px', height: '16px' }} />
                    Add Seller
                  </button>
                )}

                {/* Refresh Button */}
                <button 
                  onClick={handleRefresh}
                  style={buttonStyles.secondary}
                >
                  <RefreshCw style={{ width: '16px', height: '16px' }} />
                  Refresh
                </button>
              </div>
              
              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  {filters.search && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '4px 12px',
                      fontSize: '12px',
                      backgroundColor: '#e0e7ff',
                      color: '#3730a3',
                      borderRadius: '9999px',
                      border: '1px solid #c7d2fe'
                    }}>
                      Search: {filters.search}
                      <button
                        onClick={() => handleFilterChange('search', '')}
                        style={{
                          marginLeft: '4px',
                          background: 'none',
                          border: 'none',
                          color: '#3730a3',
                          cursor: 'pointer',
                          padding: '2px'
                        }}
                      >
                        <X style={{ width: '12px', height: '12px' }} />
                      </button>
                    </span>
                  )}
                  {filters.approvalStatus && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '4px 12px',
                      fontSize: '12px',
                      backgroundColor: '#f0f9ff',
                      color: '#0369a1',
                      borderRadius: '9999px',
                      border: '1px solid #bae6fd'
                    }}>
                      Status: {filters.approvalStatus}
                      <button
                        onClick={() => handleFilterChange('approvalStatus', '')}
                        style={{
                          marginLeft: '4px',
                          background: 'none',
                          border: 'none',
                          color: '#0369a1',
                          cursor: 'pointer',
                          padding: '2px'
                        }}
                      >
                        <X style={{ width: '12px', height: '12px' }} />
                      </button>
                    </span>
                  )}
                  {filters.isActive && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '4px 12px',
                      fontSize: '12px',
                      backgroundColor: '#f0fdf4',
                      color: '#166534',
                      borderRadius: '9999px',
                      border: '1px solid #bbf7d0'
                    }}>
                      Active: {filters.isActive === 'true' ? 'Yes' : 'No'}
                      <button
                        onClick={() => handleFilterChange('isActive', '')}
                        style={{
                          marginLeft: '4px',
                          background: 'none',
                          border: 'none',
                          color: '#166534',
                          cursor: 'pointer',
                          padding: '2px'
                        }}
                      >
                        <X style={{ width: '12px', height: '12px' }} />
                      </button>
                    </span>
                  )}
                  {hasActiveFilters && (
                    <button
                      onClick={handleClearFilters}
                      style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        backgroundColor: 'transparent',
                        color: '#6b7280',
                        border: '1px solid #d1d5db',
                        borderRadius: '9999px',
                        cursor: 'pointer'
                      }}
                    >
                      Clear All
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sellers Table */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Name
                  </th>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Email
                  </th>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Phone
                  </th>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Business
                  </th>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Status
                  </th>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Active
                  </th>
                  <th style={{
                    padding: '12px 24px',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <div style={{
                          animation: 'spin 1s linear infinite',
                          borderRadius: '9999px',
                          width: '24px',
                          height: '24px',
                          borderBottom: '2px solid #2563eb'
                        }}></div>
                        <span style={{ color: '#6b7280' }}>Loading sellers...</span>
                      </div>
                    </td>
                  </tr>
                ) : sellers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <Users style={{ width: '48px', height: '48px', color: '#9ca3af' }} />
                        <span style={{ color: '#6b7280' }}>No sellers found.</span>
                        {hasActiveFilters && (
                          <button 
                            onClick={handleClearFilters}
                            style={{ color: '#2563eb', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  sellers.map((seller) => (
                    <tr key={seller._id} style={{ borderTop: '1px solid #e5e7eb', transition: 'background-color 0.2s' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                          {seller.name || "N/A"}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontSize: '14px', color: '#111827' }}>
                          {seller.email || "N/A"}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontSize: '14px', color: '#111827' }}>
                          {seller.phone || "N/A"}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontSize: '14px', color: '#111827' }}>
                          {seller.businessName || "N/A"}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        {getStatusBadge(seller.approvalStatus)}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        {getActiveBadge(seller.isActive)}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          {seller.approvalStatus === 'pending' && (hasPermission(PERMISSIONS.SELLERS_APPROVE) || isSuperAdmin()) && (
                            <button 
                              style={{
                                color: '#16a34a',
                                padding: '8px',
                                borderRadius: '6px',
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: 'transparent',
                                transition: 'background-color 0.2s'
                              }}
                              title="Approve Seller"
                              onClick={() => handleApprove(seller._id)}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0fdf4'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <CheckCircle style={{ width: '16px', height: '16px' }} />
                            </button>
                          )}
                          
                          {seller.approvalStatus === 'pending' && (hasPermission(PERMISSIONS.SELLERS_REJECT) || isSuperAdmin()) && (
                            <button 
                              style={{
                                color: '#dc2626',
                                padding: '8px',
                                borderRadius: '6px',
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: 'transparent',
                                transition: 'background-color 0.2s'
                              }}
                              title="Reject Seller"
                              onClick={() => handleReject(seller._id)}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <XCircle style={{ width: '16px', height: '16px' }} />
                            </button>
                          )}
                          
                          {(hasPermission(PERMISSIONS.SELLERS_EDIT) || isSuperAdmin()) && (
                            <button 
                              style={{
                                color: '#2563eb',
                                padding: '8px',
                                borderRadius: '6px',
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: 'transparent',
                                transition: 'background-color 0.2s'
                              }}
                              title="Edit Seller"
                              onClick={() => handleEditSeller(seller)}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Edit style={{ width: '16px', height: '16px' }} />
                            </button>
                          )}
                          
                          {(hasPermission(PERMISSIONS.SELLERS_TOGGLE_STATUS) || isSuperAdmin()) && (
                            <button 
                              style={{
                                color: seller.isActive ? '#16a34a' : '#dc2626',
                                padding: '8px',
                                borderRadius: '6px',
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: 'transparent',
                                transition: 'background-color 0.2s'
                              }}
                              title={seller.isActive ? "Deactivate" : "Activate"}
                              onClick={() => handleToggleStatus(seller._id, seller.isActive)}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = seller.isActive ? '#f0fdf4' : '#fef2f2'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              {seller.isActive ? '🟢' : '🔴'}
                            </button>
                          )}
                          
                          {(hasPermission(PERMISSIONS.SELLERS_DELETE) || isSuperAdmin()) && (
                            <button 
                              style={{
                                color: '#dc2626',
                                padding: '8px',
                                borderRadius: '6px',
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: 'transparent',
                                transition: 'background-color 0.2s'
                              }}
                              title="Delete Seller"
                              onClick={() => handleDeleteSeller(seller._id, seller.name)}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Trash2 style={{ width: '16px', height: '16px' }} />
                            </button>
                          )}
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
        {pagination.totalPages > 1 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginTop: '24px'
          }}>
            <div style={{ fontSize: '14px', color: '#374151' }}>
              Showing {((pagination.currentPage - 1) * filters.limit) + 1} to {Math.min(pagination.currentPage * filters.limit, pagination.totalSellers)} of {pagination.totalSellers} sellers
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                style={{
                  ...buttonStyles.secondary,
                  opacity: pagination.currentPage === 1 ? 0.5 : 1,
                  cursor: pagination.currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                <ChevronLeft style={{ width: '16px', height: '16px' }} />
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    style={{
                      padding: '8px 12px',
                      fontSize: '14px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      backgroundColor: pagination.currentPage === pageNum ? '#000000' : '#ffffff',
                      color: pagination.currentPage === pageNum ? '#ffffff' : '#374151',
                      cursor: 'pointer',
                      minWidth: '40px'
                    }}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                style={{
                  ...buttonStyles.secondary,
                  opacity: pagination.currentPage === pagination.totalPages ? 0.5 : 1,
                  cursor: pagination.currentPage === pagination.totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next
                <ChevronRight style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          </div>
        )}

        {/* Create Seller Modal */}
        {showCreateModal && (
          <CreateSellerModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={fetchSellers}
          />
        )}
      </div>
    </div>
  );
};

export default SellerPage;