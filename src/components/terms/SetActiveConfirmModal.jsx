import { FiCheckCircle } from "react-icons/fi";
import Button from "../common/Button";

const SetActiveConfirmModal = ({ term, onConfirm, onCancel }) => {
  if (!term) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-gold-100 rounded-full">
              <FiCheckCircle className="w-6 h-6 text-gold-700" />
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
            <Button variant="secondary" size="md" onClick={onCancel}>Cancel</Button>
            <Button variant="primary" size="md" onClick={onConfirm}>Set as Active</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetActiveConfirmModal;