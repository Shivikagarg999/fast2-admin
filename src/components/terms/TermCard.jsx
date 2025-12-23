// components/terms/TermCard.jsx
import { FiEdit, FiTrash2, FiEye, FiCheckCircle } from "react-icons/fi";

const TermCard = ({ term, policyType, onEdit, onDelete, onPreview, onSetActive }) => {
  const getPolicyTypeIcon = (type) => {
    switch(type) {
      case 'terms': return '📜';
      case 'return': return '🔄';
      case 'cancellation': return '❌';
      case 'refund': return '💰';
      default: return '📄';
    }
  };

  const getPolicyTypeColor = (type) => {
    switch(type) {
      case 'terms': return '#3b82f6';
      case 'return': return '#10b981';
      case 'cancellation': return '#ef4444';
      case 'refund': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      border: `1px solid ${term.isActive ? '#16a34a' : '#e5e7eb'}`,
      padding: '20px',
      position: 'relative',
      boxShadow: term.isActive ? '0 0 0 2px rgba(22, 163, 74, 0.1)' : 'none'
    }}>
      {/* Active Badge */}
      {term.isActive && (
        <div style={{
          position: 'absolute',
          top: '-8px',
          right: '16px',
          backgroundColor: '#16a34a',
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: '600',
          padding: '4px 12px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <FiCheckCircle size={12} />
          Active
        </div>
      )}
      
      {/* Policy Type */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <span style={{ fontSize: '18px' }}>
          {getPolicyTypeIcon(term.policyType || policyType)}
        </span>
        <span style={{
          fontSize: '12px',
          fontWeight: '600',
          color: getPolicyTypeColor(term.policyType || policyType),
          backgroundColor: `${getPolicyTypeColor(term.policyType || policyType)}15`,
          padding: '2px 8px',
          borderRadius: '12px'
        }}>
          {term.policyType || policyType}
        </span>
      </div>
      
      {/* Title */}
      <h3 style={{
        fontSize: '16px',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '8px'
      }}>
        {term.title}
      </h3>
      
      {/* Version */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <span style={{
          fontSize: '14px',
          color: '#6b7280'
        }}>
          Version:
        </span>
        <span style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#374151'
        }}>
          {term.version}
        </span>
      </div>
      
      {/* Date */}
      <div style={{
        fontSize: '12px',
        color: '#9ca3af',
        marginBottom: '16px'
      }}>
        Effective: {new Date(term.effectiveDate).toLocaleDateString()}
      </div>
      
      {/* Content Preview */}
      <div style={{
        fontSize: '14px',
        color: '#6b7280',
        marginBottom: '16px',
        maxHeight: '60px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical'
      }}
      dangerouslySetInnerHTML={{ __html: term.content.substring(0, 150) + '...' }}
      />
      
      {/* Metadata */}
      {term.metadata && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '16px',
          fontSize: '12px'
        }}>
          {term.metadata.returnPeriod && (
            <span style={{
              backgroundColor: '#f3f4f6',
              padding: '2px 8px',
              borderRadius: '4px',
              color: '#374151'
            }}>
              ⏱️ {term.metadata.returnPeriod} days return
            </span>
          )}
          {term.metadata.cancellationFee && (
            <span style={{
              backgroundColor: '#f3f4f6',
              padding: '2px 8px',
              borderRadius: '4px',
              color: '#374151'
            }}>
              💰 {term.metadata.cancellationFee}% fee
            </span>
          )}
          {term.metadata.refundProcessingDays && (
            <span style={{
              backgroundColor: '#f3f4f6',
              padding: '2px 8px',
              borderRadius: '4px',
              color: '#374151'
            }}>
              ⚡ {term.metadata.refundProcessingDays} days processing
            </span>
          )}
        </div>
      )}
      
      {/* Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        borderTop: '1px solid #e5e7eb',
        paddingTop: '16px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onPreview(term)}
            style={{
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: '500',
              color: '#374151'
            }}
          >
            <FiEye size={14} />
            Preview
          </button>
          
          {!term.isActive && (
            <button
              onClick={() => onSetActive(term)}
              style={{
                backgroundColor: '#dcfce7',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: '500',
                color: '#166534'
              }}
            >
              <FiCheckCircle size={14} />
              Set Active
            </button>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onEdit(term)}
            style={{
              backgroundColor: '#eff6ff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: '500',
              color: '#1d4ed8'
            }}
          >
            <FiEdit size={14} />
            Edit
          </button>
          
          {!term.isActive && (
            <button
              onClick={() => onDelete(term)}
              style={{
                backgroundColor: '#fef2f2',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: '500',
                color: '#dc2626'
              }}
            >
              <FiTrash2 size={14} />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TermCard;