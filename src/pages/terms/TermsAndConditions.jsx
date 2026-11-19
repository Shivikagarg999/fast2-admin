import { useState, useEffect, useRef } from "react";
import Button from "../../components/common/Button";
import { FiPlus, FiFileText, FiEye, FiEyeOff } from "react-icons/fi";
import { Editor } from '@tinymce/tinymce-react';
import TermCard from "../../components/terms/TermCard";
import DeleteConfirmModal from "../../components/terms/DeleteConfirmModal";
import SetActiveConfirmModal from "../../components/terms/SetActiveConfirmModal";
import PreviewModal from "../../components/terms/PreviewModal";
import usePermissions from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../config/permissions";
import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import PageHeader from "../../components/ui/PageHeader";

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

  const API_BASE_URL = `${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.gmkart.com/proxy'}/api/policy`;

  const policyTypes = [
    { value: "terms", label: "Terms & Conditions", icon: "📜" },
    { value: "return", label: "Return Policy", icon: "🔄" },
    { value: "cancellation", label: "Cancellation Policy", icon: "❌" },
    { value: "refund", label: "Refund Policy", icon: "💰" },
    { value: "privacy", label: "Privacy Policy", icon: "🔒" }
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
    switch (selectedPolicyType) {
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
      case 'privacy':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Privacy Contact Email
            </label>
            <input
              type="email"
              name="contactEmail"
              value={formData.metadata.contactEmail || ''}
              onChange={handleMetadataChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="privacy@example.com"
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="bg-gold-50 min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 bg-gray-200 rounded-lg w-64 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
          </div>
          <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-8 bg-gray-200 rounded-md w-20"></div>
                  <div className="h-8 bg-gray-200 rounded-md w-20"></div>
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
    <div className="bg-gold-50 min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Legal Policies Management"
          subtitle="Create and manage all legal policies for your platform"
        />

        {/* Policy Type Filter */}
        <div className="flex gap-3 flex-wrap items-center mb-6">
          {policyTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedPolicyType(type.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                selectedPolicyType === type.value
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              <span>{type.icon}</span>
              {type.label}
            </button>
          ))}

          <div className="flex-1"></div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowActiveOnly(!showActiveOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
              showActiveOnly
                ? 'bg-gold-400 text-black border-gold-400'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {showActiveOnly ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            {showActiveOnly ? 'Show All' : 'Active Only'}
          </button>

          {/* Create Button */}
          <Button variant="primary" size="md" onClick={openModal}>
            <FiPlus size={16} />
            Create New {currentPolicyType}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <StatCard label={`Total ${currentPolicyType} Versions`} value={totalVersions} />
          <StatCard
            label="Active Version"
            value={activePolicies.length > 0 ? activePolicies[0].version : 'None'}
            highlight
          />
          <StatCard label="Inactive Versions" value={policies.filter(p => !p.isActive).length} />
          <StatCard label="Current Policy Type" value={currentPolicyType} />
        </div>

        {/* Policies Grid */}
        {policies.length === 0 ? (
          <Card className="text-center py-12">
            <FiFileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No {currentPolicyType.toLowerCase()} versions yet
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Create your first {currentPolicyType.toLowerCase()} to get started
            </p>
            <Button variant="primary" size="md" onClick={openModal}>
              <FiPlus size={16} />
              Create First Version
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingPolicy ? 'Edit' : 'Create New'} {getPolicyTypeLabel(selectedPolicyType)}
                </h2>
                <button onClick={closeModal} className="text-2xl text-gray-400 hover:text-gray-600 leading-none">
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-5">
                  {/* Left Column */}
                  <div>
                    <div className="mb-5">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Policy Title *</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-100 transition-colors"
                        placeholder="e.g., Terms & Conditions v2.0"
                        required
                      />
                    </div>

                    <div className="mb-5">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Version Number *</label>
                      <input
                        type="text"
                        name="version"
                        value={formData.version}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-100 transition-colors"
                        placeholder="e.g., 2.0.0 or v2"
                        required
                      />
                    </div>

                    <div className="mb-5">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Effective Date *</label>
                      <input
                        type="date"
                        name="effectiveDate"
                        value={formData.effectiveDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-100 transition-colors"
                        required
                      />
                    </div>

                    <div className="mb-5">
                      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleInputChange}
                          className="w-4 h-4 accent-gold-500"
                        />
                        Set as active version
                        <span className="text-xs text-gray-500">(Will deactivate current active policy)</span>
                      </label>
                    </div>

                    {/* Metadata Fields */}
                    {renderMetadataFields()}
                  </div>

                  {/* Right Column - TinyMCE Editor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Policy Content *</label>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <Editor
                        apiKey="xw0haeefepmen4923ro5m463eb97qhseuprfkpbuan5t10u5"
                        onInit={(_evt, editor) => editorRef.current = editor}
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
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
                  <Button type="button" variant="secondary" size="md" onClick={closeModal}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="md">
                    {editingPolicy ? 'Update Policy' : 'Create Policy'}
                  </Button>
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
          button:hover {
            opacity: 0.9;
          }
        `}
      </style>
    </div>
  );
};

export default PoliciesManagement;