import { FiX } from "react-icons/fi";

const PreviewModal = ({ term, onClose }) => {
  if (!term) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {term.title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Version {term.version} • Effective {formatDate(term.effectiveDate)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {term.content.includes('<') ? (
              <div dangerouslySetInnerHTML={{ __html: term.content }} />
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300">
                {term.content}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;