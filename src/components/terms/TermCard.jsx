import { FiEdit, FiTrash2, FiEye, FiCheckCircle, FiCircle } from "react-icons/fi";

const TermCard = ({ term, onEdit, onDelete, onPreview, onSetActive }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {term.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Version {term.version}
            </p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            term.isActive 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
          }`}>
            {term.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          <p>Effective: {formatDate(term.effectiveDate)}</p>
          <p>Created: {formatDate(term.createdAt)}</p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onPreview(term)}
            className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            title="Preview"
          >
            <FiEye className="w-4 h-4" />
          </button>
          
          <div className="flex gap-1">
            {!term.isActive && (
              <button
                onClick={() => onSetActive(term)}
                className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                title="Set as Active"
              >
                <FiCheckCircle className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onEdit(term)}
              className="p-2 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors"
              title="Edit"
            >
              <FiEdit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(term)}
              className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              title="Delete"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermCard;