import { useState, useEffect } from "react";
import { FiPlus, FiFileText } from "react-icons/fi";
import TermCard from "../../components/terms/TermCard";
import TermFormModal from "../../components/terms/TermFormModal";
import PreviewModal from "../../components/terms/PreviewModal";
import DeleteConfirmModal from "../../components/terms/DeleteConfirmModal";
import SetActiveConfirmModal from "../../components/terms/SetActiveConfirmModal";
import usePermissions from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../config/permissions";

const TermsAndConditions = () => {
  const { hasPermission } = usePermissions();
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [previewTerm, setPreviewTerm] = useState(null);
  const [activeConfirm, setActiveConfirm] = useState(null);

  const API_BASE_URL = `${import.meta.env.VITE_BASE_URL || 'https://api.fast2.in'}/api/admin/terms`;

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/getall`);
      const data = await response.json();
      
      if (data.success) {
        setTerms(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching terms:', error);
      alert('Failed to fetch terms and conditions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    if (!hasPermission(PERMISSIONS.TERMS_EDIT)) {
      alert("You don't have permission to modify terms and conditions");
      return;
    }
    try {
      const url = editingTerm 
        ? `${API_BASE_URL}/update/${editingTerm._id}`
        : `${API_BASE_URL}/create`;
      
      const method = editingTerm ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(editingTerm ? 'Terms updated successfully!' : 'Terms created successfully!');
        setShowModal(false);
        setEditingTerm(null);
        fetchTerms();
      } else {
        alert(data.message || 'Failed to save terms');
      }
    } catch (error) {
      console.error('Error saving terms:', error);
      alert('Failed to save terms');
    }
  };

  const handleEdit = (term) => {
    if (!hasPermission(PERMISSIONS.TERMS_EDIT)) {
      alert("You don't have permission to edit terms and conditions");
      return;
    }
    setEditingTerm(term);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    if (!hasPermission(PERMISSIONS.TERMS_EDIT)) {
      alert("You don't have permission to delete terms and conditions");
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/delete/${deleteConfirm._id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Terms deleted successfully!');
        setDeleteConfirm(null);
        fetchTerms();
      } else {
        alert(data.message || 'Failed to delete terms');
      }
    } catch (error) {
      console.error('Error deleting terms:', error);
      alert('Failed to delete terms');
    }
  };

  const handleSetActive = async () => {
    if (!activeConfirm) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/set-active/${activeConfirm._id}`, {
        method: 'PUT'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Terms set as active successfully!');
        setActiveConfirm(null);
        fetchTerms();
      } else {
        alert(data.message || 'Failed to set terms as active');
      }
    } catch (error) {
      console.error('Error setting active terms:', error);
      alert('Failed to set terms as active');
    }
  };

  const openModal = () => {
    setEditingTerm(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTerm(null);
  };

  if (loading) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeTerms = terms.filter(t => t.isActive);
  const totalVersions = terms.length;

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Terms & Conditions Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Create and manage terms and conditions for your platform
            </p>
          </div>
          <button
            onClick={openModal}
            className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            Create New Version
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalVersions}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Versions</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {activeTerms.length > 0 ? activeTerms[0].version : 'None'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Active Version</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {terms.filter(t => !t.isActive).length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Inactive Versions</div>
          </div>
        </div>

        {/* Terms Grid */}
        {terms.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <FiFileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No terms and conditions yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Create your first terms and conditions to get started
            </p>
            <button
              onClick={openModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              Create First Version
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {terms.map((term) => (
              <TermCard
                key={term._id}
                term={term}
                onEdit={handleEdit}
                onDelete={setDeleteConfirm}
                onPreview={setPreviewTerm}
                onSetActive={setActiveConfirm}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <TermFormModal
        show={showModal}
        editingTerm={editingTerm}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
      <PreviewModal
        term={previewTerm}
        onClose={() => setPreviewTerm(null)}
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
    </div>
  );
};

export default TermsAndConditions;