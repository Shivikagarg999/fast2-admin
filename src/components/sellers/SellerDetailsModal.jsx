import { X, Mail, Phone, MapPin, Package, Calendar, CheckCircle, XCircle } from 'lucide-react';

const SellerDetailsModal = ({ seller, onClose, onApprove, onReject }) => {
  if (!seller) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Seller Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Name</label>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{seller.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Business Name</label>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{seller.businessName || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Email</label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{seller.email || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Phone</label>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{seller.phone || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          {seller.address && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Address</h3>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">{seller.address.street || ''}</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {seller.address.city || ''}, {seller.address.state || ''} {seller.address.pinCode || ''}
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">{seller.address.country || ''}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Products ({seller.products?.length || 0})
            </h3>
            {seller.products && seller.products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {seller.products.slice(0, 6).map((product) => (
                  <div key={product._id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400">₹{product.price}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        product.stockStatus === 'in-stock' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {product.stockStatus}
                      </span>
                    </div>
                  </div>
                ))}
                {seller.products.length > 6 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    +{seller.products.length - 6} more products
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No products yet</p>
            )}
          </div>

          {/* Status Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Status Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Approval Status</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    seller.approvalStatus === 'approved' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : seller.approvalStatus === 'rejected'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {seller.approvalStatus}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Active Status</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    seller.isActive 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {seller.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Joined Date</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(seller.createdAt)}
                  </p>
                </div>
              </div>
              {seller.approvedAt && (
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Approved Date</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(seller.approvedAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rejection Reason */}
          {seller.rejectionReason && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Rejection Reason</h3>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">{seller.rejectionReason}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {seller.approvalStatus === 'pending' && (
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => onReject(seller._id)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 
                bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800
                rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
            <button
              onClick={() => onApprove(seller._id)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white
                bg-green-600 rounded-md hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDetailsModal;