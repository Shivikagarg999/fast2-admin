import { useState, useEffect } from "react";
import axios from "axios";
import { FiUser, FiPhone, FiMail, FiMapPin, FiCalendar, FiCreditCard, FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";

const EditDriver = () => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    personalInfo: {
      name: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      gender: "male"
    },
    address: {
      currentAddress: {
        addressLine: "",
        city: "",
        state: "",
        pinCode: ""
      }
    },
    vehicle: {
      type: "bike",
      make: "",
      model: "",
      color: "",
      registrationNumber: "",
      rcDocument: ""
    },
    documents: {
      aadharCard: {
        number: "",
        frontImage: "",
        backImage: ""
      },
      drivingLicense: {
        number: "",
        expiryDate: "",
        frontImage: "",
        backImage: ""
      }
    },
    bankDetails: {
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      bankName: ""
    },
    workInfo: {
      driverId: ""
    }
  });

  useEffect(() => {
    if (id) {
      fetchDriver();
    } else {
      setFetching(false);
    }
  }, [id]);

  const fetchDriver = async () => {
    try {
      setFetching(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/drivers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const driver = response.data.data;
      
      setFormData({
        personalInfo: {
          name: driver.personalInfo?.name || "",
          email: driver.personalInfo?.email || "",
          phone: driver.personalInfo?.phone || "",
          dateOfBirth: driver.personalInfo?.dateOfBirth ? new Date(driver.personalInfo.dateOfBirth).toISOString().split('T')[0] : "",
          gender: driver.personalInfo?.gender || "male"
        },
        address: {
          currentAddress: {
            addressLine: driver.address?.currentAddress?.addressLine || "",
            city: driver.address?.currentAddress?.city || "",
            state: driver.address?.currentAddress?.state || "",
            pinCode: driver.address?.currentAddress?.pinCode || ""
          }
        },
        vehicle: {
          type: driver.vehicle?.type || "bike",
          make: driver.vehicle?.make || "",
          model: driver.vehicle?.model || "",
          registrationNumber: driver.vehicle?.registrationNumber || "",
          color: driver.vehicle?.color || "",
          rcDocument: driver.vehicle?.rcDocument || ""
        },
        documents: {
          aadharCard: {
            number: driver.documents?.aadharCard?.number || "",
            frontImage: driver.documents?.aadharCard?.frontImage || "",
            backImage: driver.documents?.aadharCard?.backImage || ""
          },
          drivingLicense: {
            number: driver.documents?.drivingLicense?.number || "",
            expiryDate: driver.documents?.drivingLicense?.expiryDate ? new Date(driver.documents.drivingLicense.expiryDate).toISOString().split('T')[0] : "",
            frontImage: driver.documents?.drivingLicense?.frontImage || "",
            backImage: driver.documents?.drivingLicense?.backImage || ""
          }
        },
        bankDetails: {
          accountHolderName: driver.bankDetails?.accountHolderName || "",
          accountNumber: driver.bankDetails?.accountNumber || "",
          ifscCode: driver.bankDetails?.ifscCode || "",
          bankName: driver.bankDetails?.bankName || ""
        },
        workInfo: {
          driverId: driver.workInfo?.driverId || ""
        }
      });
    } catch (error) {
      console.error('Error fetching driver:', error);
      setError('Error fetching driver: ' + (error.response?.data?.message || error.message));
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
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
              [keys[3]]: type === 'checkbox' ? checked : value
            } : type === 'checkbox' ? checked : value
          } : type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem('adminToken');
      
      const submitData = {
        personalInfo: {
          name: formData.personalInfo.name,
          email: formData.personalInfo.email,
          phone: formData.personalInfo.phone,
          gender: formData.personalInfo.gender,
          dateOfBirth: formData.personalInfo.dateOfBirth
        },
        address: {
          currentAddress: {
            addressLine: formData.address.currentAddress.addressLine,
            city: formData.address.currentAddress.city,
            state: formData.address.currentAddress.state,
            pinCode: formData.address.currentAddress.pinCode
          }
        },
        vehicle: {
          type: formData.vehicle.type,
          make: formData.vehicle.make,
          model: formData.vehicle.model,
          color: formData.vehicle.color,
          registrationNumber: formData.vehicle.registrationNumber,
          rcDocument: formData.vehicle.rcDocument || "https://example.com/rc-doc.png"
        },
        documents: {
          aadharCard: {
            number: formData.documents.aadharCard.number,
            frontImage: formData.documents.aadharCard.frontImage || "https://example.com/aadhar-front.png",
            backImage: formData.documents.aadharCard.backImage || "https://example.com/aadhar-back.png"
          },
          drivingLicense: {
            number: formData.documents.drivingLicense.number,
            expiryDate: formData.documents.drivingLicense.expiryDate,
            frontImage: formData.documents.drivingLicense.frontImage || "https://example.com/dl-front.png",
            backImage: formData.documents.drivingLicense.backImage || "https://example.com/dl-back.png"
          }
        },
        bankDetails: {
          accountNumber: formData.bankDetails.accountNumber,
          accountHolderName: formData.bankDetails.accountHolderName,
          ifscCode: formData.bankDetails.ifscCode,
          bankName: formData.bankDetails.bankName
        },
        workInfo: {
          driverId: formData.workInfo.driverId || `DRV${Date.now()}`
        }
      };

      if (id) {
        await axios.put(`${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/drivers/edit/${id}`, submitData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        await axios.post(`${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/drivers/create`, submitData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error saving driver:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message;
      setError('Error saving driver: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    navigate('/admin/drivers');
  };

  const vehicleTypes = [
    { value: 'bike', label: 'Motorcycle', emoji: '🏍️' },
    { value: 'scooter', label: 'Scooter', emoji: '🛵' },
    { value: 'bicycle', label: 'Bicycle', emoji: '🚲' },
    { value: 'car', label: 'Car', emoji: '🚗' }
  ];

  if (fetching && id) {
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
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate('/admin/drivers')}
              className="flex items-center text-blue-600 hover:text-blue-700 mr-4"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-black dark:text-white flex items-center">
              <FiUser className="mr-2" /> {id ? 'Edit Driver' : 'Add New Driver'}
            </h1>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Personal Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="personalInfo.name"
                      value={formData.personalInfo.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                        focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
                      required
                    />
                    <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="personalInfo.email"
                      value={formData.personalInfo.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                        focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
                      required
                    />
                    <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="personalInfo.phone"
                      value={formData.personalInfo.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                        focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
                      required
                    />
                    <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date of Birth *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="personalInfo.dateOfBirth"
                      value={formData.personalInfo.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                        focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
                      required
                    />
                    <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gender *
                  </label>
                  <select
                    name="personalInfo.gender"
                    value={formData.personalInfo.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <FiMapPin className="mr-2" /> Address Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address Line
                  </label>
                  <input
                    type="text"
                    name="address.currentAddress.addressLine"
                    value={formData.address.currentAddress.addressLine}
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
                    name="address.currentAddress.city"
                    value={formData.address.currentAddress.city}
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
                    name="address.currentAddress.state"
                    value={formData.address.currentAddress.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    name="address.currentAddress.pinCode"
                    value={formData.address.currentAddress.pinCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Vehicle Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vehicle Type *
                  </label>
                  <select
                    name="vehicle.type"
                    value={formData.vehicle.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {vehicleTypes.map(vehicle => (
                      <option key={vehicle.value} value={vehicle.value}>
                        {vehicle.emoji} {vehicle.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Make *
                  </label>
                  <input
                    type="text"
                    name="vehicle.make"
                    value={formData.vehicle.make}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Model *
                  </label>
                  <input
                    type="text"
                    name="vehicle.model"
                    value={formData.vehicle.model}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Registration Number *
                  </label>
                  <input
                    type="text"
                    name="vehicle.registrationNumber"
                    value={formData.vehicle.registrationNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color
                  </label>
                  <input
                    type="text"
                    name="vehicle.color"
                    value={formData.vehicle.color}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    RC Document URL
                  </label>
                  <input
                    type="text"
                    name="vehicle.rcDocument"
                    value={formData.vehicle.rcDocument}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/rc-doc.png"
                  />
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Aadhar Card Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Aadhar Number *
                  </label>
                  <input
                    type="text"
                    name="documents.aadharCard.number"
                    value={formData.documents.aadharCard.number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Front Image URL
                  </label>
                  <input
                    type="text"
                    name="documents.aadharCard.frontImage"
                    value={formData.documents.aadharCard.frontImage}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/aadhar-front.png"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Back Image URL
                  </label>
                  <input
                    type="text"
                    name="documents.aadharCard.backImage"
                    value={formData.documents.aadharCard.backImage}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/aadhar-back.png"
                  />
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Driving License Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    License Number *
                  </label>
                  <input
                    type="text"
                    name="documents.drivingLicense.number"
                    value={formData.documents.drivingLicense.number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    name="documents.drivingLicense.expiryDate"
                    value={formData.documents.drivingLicense.expiryDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Front Image URL
                  </label>
                  <input
                    type="text"
                    name="documents.drivingLicense.frontImage"
                    value={formData.documents.drivingLicense.frontImage}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/dl-front.png"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Back Image URL
                  </label>
                  <input
                    type="text"
                    name="documents.drivingLicense.backImage"
                    value={formData.documents.drivingLicense.backImage}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/dl-back.png"
                  />
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <FiCreditCard className="mr-2" /> Bank Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Account Holder Name *
                  </label>
                  <input
                    type="text"
                    name="bankDetails.accountHolderName"
                    value={formData.bankDetails.accountHolderName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    name="bankDetails.accountNumber"
                    value={formData.bankDetails.accountNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    name="bankDetails.ifscCode"
                    value={formData.bankDetails.ifscCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bankDetails.bankName"
                    value={formData.bankDetails.bankName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="pb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Work Information</h2>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Driver ID
                  </label>
                  <input
                    type="text"
                    name="workInfo.driverId"
                    value={formData.workInfo.driverId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="DRV12345"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/admin/drivers')}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-md 
                  bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300
                  hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 rounded-md hover:bg-blue-700 
                  disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-black"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {id ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="mr-2" /> {id ? 'Update Driver' : 'Create Driver'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex flex-col items-center text-center">
              <div className="bg-green-100 p-3 rounded-full mb-4">
                <FiCheckCircle className="text-green-600 text-3xl" />
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {id ? 'Driver Updated Successfully!' : 'Driver Created Successfully!'}
              </h2>
              
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {id ? 'The driver details have been updated.' : 'New driver has been added to the system.'}
              </p>
              
              <button
                onClick={closeSuccessModal}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Back to Drivers
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditDriver;