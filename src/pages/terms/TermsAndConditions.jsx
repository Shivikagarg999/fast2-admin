import { useState, useEffect, useRef } from "react";
import { FiPlus, FiFileText, FiFilter, FiEye, FiEyeOff } from "react-icons/fi";
import { Editor } from '@tinymce/tinymce-react';
import TermCard from "../../components/terms/TermCard";
import DeleteConfirmModal from "../../components/terms/DeleteConfirmModal";
import SetActiveConfirmModal from "../../components/terms/SetActiveConfirmModal";
import PreviewModal from "../../components/terms/PreviewModal";
import usePermissions from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../config/permissions";

const PoliciesManagement = () => {
  const { hasPermission } = usePermissions();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [previewPolicy, setPreviewPolicy] = useState(null);
  const [activeConfirm, setActiveConfirm] = useState(null);
  const [selectedPolicyType, setSelectedPolicyType] = useState("terms");
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    version: "",
    effectiveDate: "",
    isActive: false,
    metadata: {}
  });
  const editorRef = useRef(null);

  const API_BASE_URL = `${import.meta.env.VITE_BASE_URL || 'http://localhost:5000'}/api/policy`;

  const policyTypes = [
    { value: "terms", label: "Terms & Conditions", icon: "📜" },
    { value: "return", label: "Return Policy", icon: "🔄" },
    { value: "cancellation", label: "Cancellation Policy", icon: "❌" },
    { value: "refund", label: "Refund Policy", icon: "💰" }
  ];

  // Button Styles
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
      fontWeight: '500',
      transition: 'all 0.2s ease',
      '&:hover': { backgroundColor: '#374151' }
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
      fontWeight: '500',
      transition: 'all 0.2s ease',
      '&:hover': { backgroundColor: '#f9fafb' }
    },
    danger: {
      backgroundColor: '#dc2626',
      color: '#ffffff',
      border: 'none',
      borderRadius: '8px',
      padding: '10px 20px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      '&:hover': { backgroundColor: '#b91c1c' }
    }
  };

  // Get policy type label
  const getPolicyTypeLabel = (type) => {
    const policy = policyTypes.find(p => p.value === type);
    return policy ? `${policy.icon} ${policy.label}` : type;
  };

  useEffect(() => {
    fetchPolicies();
  }, [selectedPolicyType, showActiveOnly]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        policyType: selectedPolicyType,
        ...(showActiveOnly && { isActive: 'true' })
      });

      const response = await fetch(`${API_BASE_URL}?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setPolicies(data.data || []);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
      alert(`Failed to fetch policies: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!hasPermission(PERMISSIONS.TERMS_EDIT)) {
      alert("You don't have permission to modify policies");
      return;
    }

    // Validate form
    if (!formData.title.trim() || !formData.content.trim() || !formData.version.trim() || !formData.effectiveDate) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const url = editingPolicy 
        ? `${API_BASE_URL}/${editingPolicy._id}`
        : `${API_BASE_URL}`;
      
      const method = editingPolicy ? 'PUT' : 'POST';
      
      const payload = {
        ...formData,
        policyType: selectedPolicyType
      };

      // If setting as active, show confirmation
      if (payload.isActive && !editingPolicy?.isActive) {
        if (!window.confirm(`Set "${payload.title}" as active ${getPolicyTypeLabel(selectedPolicyType)}? This will deactivate the current active policy.`)) {
          payload.isActive = false;
        }
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(editingPolicy ? 'Policy updated successfully!' : 'Policy created successfully!');
        setShowModal(false);
        setEditingPolicy(null);
        resetForm();
        fetchPolicies();
      } else {
        alert(data.message || 'Failed to save policy');
      }
    } catch (error) {
      console.error('Error saving policy:', error);
      alert('Failed to save policy');
    }
  };

  const handleEdit = (policy) => {
    if (!hasPermission(PERMISSIONS.TERMS_EDIT)) {
      alert("You don't have permission to edit policies");
      return;
    }
    setEditingPolicy(policy);
    setFormData({
      title: policy.title,
      content: policy.content,
      version: policy.version,
      effectiveDate: new Date(policy.effectiveDate).toISOString().split('T')[0],
      isActive: policy.isActive,
      metadata: policy.metadata || {}
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    if (!hasPermission(PERMISSIONS.TERMS_EDIT)) {
      alert("You don't have permission to delete policies");
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/${deleteConfirm._id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Policy deleted successfully!');
        setDeleteConfirm(null);
        fetchPolicies();
      } else {
        alert(data.message || 'Failed to delete policy');
      }
    } catch (error) {
      console.error('Error deleting policy:', error);
      alert('Failed to delete policy');
    }
  };

  const handleSetActive = async () => {
    if (!activeConfirm) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/${activeConfirm._id}/activate`, {
        method: 'PATCH'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Policy set as active successfully!');
        setActiveConfirm(null);
        fetchPolicies();
      } else {
        alert(data.message || 'Failed to set policy as active');
      }
    } catch (error) {
      console.error('Error setting active policy:', error);
      alert('Failed to set policy as active');
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      version: "",
      effectiveDate: "",
      isActive: false,
      metadata: {}
    });
    if (editorRef.current) {
      editorRef.current.setContent("");
    }
  };

  const openModal = () => {
    setEditingPolicy(null);
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPolicy(null);
    resetForm();
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleContentChange = (content) => {
    setFormData(prev => ({
      ...prev,
      content
    }));
  };

  const handleMetadataChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [name]: value
      }
    }));
  };

  const renderMetadataFields = () => {
    switch(selectedPolicyType) {
      case 'return':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Return Period (Days)
              </label>
              <input
                type="number"
                name="returnPeriod"
                value={formData.metadata.returnPeriod || ''}
                onChange={handleMetadataChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 30"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Return Contact Email
              </label>
              <input
                type="email"
                name="contactEmail"
                value={formData.metadata.contactEmail || ''}
                onChange={handleMetadataChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="returns@example.com"
              />
            </div>
          </div>
        );
      case 'cancellation':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cancellation Fee (%)
              </label>
              <input
                type="number"
                name="cancellationFee"
                value={formData.metadata.cancellationFee || ''}
                onChange={handleMetadataChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 10"
                min="0"
                max="100"
                step="0.01"
              />
            </div>
          </div>
        );
      case 'refund':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refund Processing Days
              </label>
              <input
                type="number"
                name="refundProcessingDays"
                value={formData.metadata.refundProcessingDays || ''}
                onChange={handleMetadataChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 7"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Finance Contact Email
              </label>
              <input
                type="email"
                name="contactEmail"
                value={formData.metadata.contactEmail || ''}
                onChange={handleMetadataChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="finance@example.com"
              />
            </div>
          </div>
        );
      case 'terms':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Legal Contact Email
            </label>
            <input
              type="email"
              name="contactEmail"
              value={formData.metadata.contactEmail || ''}
              onChange={handleMetadataChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="legal@example.com"
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', padding: '24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          {/* Loading skeleton */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '24px' 
          }}>
            <div style={{ 
              height: '32px', 
              backgroundColor: '#e5e7eb', 
              borderRadius: '8px', 
              width: '256px',
              animation: 'pulse 2s infinite'
            }}></div>
            <div style={{ 
              height: '40px', 
              backgroundColor: '#e5e7eb', 
              borderRadius: '8px', 
              width: '128px',
              animation: 'pulse 2s infinite'
            }}></div>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '24px' 
          }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ 
                backgroundColor: '#ffffff', 
                borderRadius: '8px', 
                padding: '24px',
                animation: 'pulse 2s infinite'
              }}>
                <div style={{ 
                  height: '16px', 
                  backgroundColor: '#e5e7eb', 
                  borderRadius: '4px', 
                  marginBottom: '8px' 
                }}></div>
                <div style={{ 
                  height: '16px', 
                  backgroundColor: '#e5e7eb', 
                  borderRadius: '4px', 
                  width: '75%', 
                  marginBottom: '16px' 
                }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ 
                    height: '32px', 
                    backgroundColor: '#e5e7eb', 
                    borderRadius: '6px', 
                    width: '80px' 
                  }}></div>
                  <div style={{ 
                    height: '32px', 
                    backgroundColor: '#e5e7eb', 
                    borderRadius: '6px', 
                    width: '80px' 
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activePolicies = policies.filter(p => p.isActive);
  const totalVersions = policies.length;
  const currentPolicyType = policyTypes.find(p => p.value === selectedPolicyType)?.label || selectedPolicyType;

  return (
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px', 
          marginBottom: '24px' 
        }}>
          <div>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#111827',
              marginBottom: '4px'
            }}>
              Legal Policies Management
            </h1>
            <p style={{ 
              fontSize: '14px',
              color: '#6b7280'
            }}>
              Create and manage all legal policies for your platform
            </p>
          </div>
          
          {/* Policy Type Filter */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            {policyTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedPolicyType(type.value)}
                style={{
                  backgroundColor: selectedPolicyType === type.value ? '#3b82f6' : '#ffffff',
                  color: selectedPolicyType === type.value ? '#ffffff' : '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>{type.icon}</span>
                {type.label}
              </button>
            ))}
            
            <div style={{ flex: 1 }}></div>
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowActiveOnly(!showActiveOnly)}
              style={{
                backgroundColor: showActiveOnly ? '#3b82f6' : '#ffffff',
                color: showActiveOnly ? '#ffffff' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              {showActiveOnly ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              {showActiveOnly ? 'Show All' : 'Active Only'}
            </button>
            
            {/* Create Button */}
            <button
              onClick={openModal}
              style={{
                ...buttonStyles.primary,
                marginTop: 0
              }}
            >
              <FiPlus size={16} />
              Create New {currentPolicyType}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px', 
          marginBottom: '24px' 
        }}>
          <div style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '8px', 
            padding: '16px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#111827' 
            }}>
              {totalVersions}
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#6b7280' 
            }}>Total {currentPolicyType} Versions</div>
          </div>
          <div style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '8px', 
            padding: '16px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#16a34a' 
            }}>
              {activePolicies.length > 0 ? activePolicies[0].version : 'None'}
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#6b7280' 
            }}>Active Version</div>
          </div>
          <div style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '8px', 
            padding: '16px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#2563eb' 
            }}>
              {policies.filter(p => !p.isActive).length}
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#6b7280' 
            }}>Inactive Versions</div>
          </div>
          <div style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '8px', 
            padding: '16px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#9333ea' 
            }}>
              {currentPolicyType}
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#6b7280' 
            }}>Current Policy Type</div>
          </div>
        </div>

        {/* Policies Grid */}
        {policies.length === 0 ? (
          <div style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            padding: '48px',
            textAlign: 'center'
          }}>
            <FiFileText style={{ 
              width: '64px', 
              height: '64px', 
              color: '#9ca3af',
              margin: '0 auto 16px'
            }} />
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#111827',
              marginBottom: '8px'
            }}>
              No {currentPolicyType.toLowerCase()} versions yet
            </h3>
            <p style={{ 
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '24px'
            }}>
              Create your first {currentPolicyType.toLowerCase()} to get started
            </p>
            <button
              onClick={openModal}
              style={{
                ...buttonStyles.primary,
                display: 'inline-flex'
              }}
            >
              <FiPlus size={16} />
              Create First Version
            </button>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '24px' 
          }}>
            {policies.map((policy) => (
              <TermCard
                key={policy._id}
                term={policy}
                policyType={selectedPolicyType}
                onEdit={handleEdit}
                onDelete={setDeleteConfirm}
                onPreview={setPreviewPolicy}
                onSetActive={setActiveConfirm}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#111827'
                }}>
                  {editingPolicy ? 'Edit' : 'Create New'} {getPolicyTypeLabel(selectedPolicyType)}
                </h2>
                <button
                  onClick={closeModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  &times;
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '20px'
                }}>
                  {/* Left Column */}
                  <div>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        Policy Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                        placeholder="e.g., Terms & Conditions v2.0"
                        required
                      />
                    </div>
                    
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        Version Number *
                      </label>
                      <input
                        type="text"
                        name="version"
                        value={formData.version}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                        placeholder="e.g., 2.0.0 or v2"
                        required
                      />
                    </div>
                    
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        Effective Date *
                      </label>
                      <input
                        type="date"
                        name="effectiveDate"
                        value={formData.effectiveDate}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                        required
                      />
                    </div>
                    
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        color: '#374151',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleInputChange}
                          style={{
                            width: '16px',
                            height: '16px'
                          }}
                        />
                        Set as active version
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                          (Will deactivate current active policy)
                        </span>
                      </label>
                    </div>
                    
                    {/* Metadata Fields */}
                    {renderMetadataFields()}
                  </div>
                  
                  {/* Right Column - TinyMCE Editor */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Policy Content *
                    </label>
                    <div style={{ 
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      overflow: 'hidden'
                    }}>
                      <Editor
                        apiKey="xw0haeefepmen4923ro5m463eb97qhseuprfkpbuan5t10u5"
                        onInit={(evt, editor) => editorRef.current = editor}
                        value={formData.content}
                        onEditorChange={handleContentChange}
                        init={{
                          height: 300,
                          menubar: true,
                          plugins: [
                            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor',
                            'searchreplace', 'visualblocks', 'code', 'fullscreen',
                            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                          ],
                          toolbar: 'undo redo | blocks | ' +
                            'bold italic forecolor | alignleft aligncenter ' +
                            'alignright alignjustify | bullist numlist outdent indent | ' +
                            'removeformat | help | image media table link',
                          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                          skin: 'oxide',
                          content_css: 'default',
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Form Actions */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '24px',
                  paddingTop: '24px',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <button
                    type="button"
                    onClick={closeModal}
                    style={{
                      ...buttonStyles.secondary
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      ...buttonStyles.primary
                    }}
                  >
                    {editingPolicy ? 'Update Policy' : 'Create Policy'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <PreviewModal
        term={previewPolicy}
        onClose={() => setPreviewPolicy(null)}
      />
      <DeleteConfirmModal
        term={deleteConfirm}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
      <SetActiveConfirmModal
        term={activeConfirm}
        onConfirm={handleSetActive}
        onCancel={() => setActiveConfirm(null)}
      />

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          
          button:hover {
            opacity: 0.9;
          }
        `}
      </style>
    </div>
  );
};

export default PoliciesManagement;