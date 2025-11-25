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
      transition: 'all 0.2s ease'
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
      transition: 'all 0.2s ease'
    },
    success: {
      backgroundColor: '#16a34a',
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
      transition: 'all 0.2s ease'
    }
  };

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
      <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', padding: '24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
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

  const activeTerms = terms.filter(t => t.isActive);
  const totalVersions = terms.length;

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
              Terms & Conditions Management
            </h1>
            <p style={{ 
              fontSize: '14px',
              color: '#6b7280'
            }}>
              Create and manage terms and conditions for your platform
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}></div>
            <button
              onClick={openModal}
              style={{
                ...buttonStyles.primary,
                marginTop: '16px'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#374151';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#000000';
              }}
            >
              <FiPlus style={{ width: '16px', height: '16px' }} />
              Create New Version
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
            }}>Total Versions</div>
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
              {activeTerms.length > 0 ? activeTerms[0].version : 'None'}
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
              {terms.filter(t => !t.isActive).length}
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#6b7280' 
            }}>Inactive Versions</div>
          </div>
        </div>

        {/* Terms Grid */}
        {terms.length === 0 ? (
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
              No terms and conditions yet
            </h3>
            <p style={{ 
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '24px'
            }}>
              Create your first terms and conditions to get started
            </p>
            <button
              onClick={openModal}
              style={{
                ...buttonStyles.primary,
                display: 'inline-flex'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#374151';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#000000';
              }}
            >
              <FiPlus style={{ width: '16px', height: '16px' }} />
              Create First Version
            </button>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '24px' 
          }}>
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

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
};

export default TermsAndConditions;