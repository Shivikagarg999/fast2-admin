import { FiCheckCircle } from "react-icons/fi";

const SetActiveConfirmModal = ({ term, onConfirm, onCancel }) => {
  if (!term) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
              <FiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Set as Active
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This will deactivate other versions
              </p>
            </div>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Are you sure you want to set "<strong>{term.title}</strong>" (Version {term.version}) as the active terms and conditions? This will deactivate all other versions.
          </p>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Set as Active
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetActiveConfirmModal;