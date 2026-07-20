import { useState, useEffect } from "react";
import { FiCreditCard, FiCheck, FiAlertCircle } from "react-icons/fi";

const BASE_URL = `${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.fast2.in/proxy'}/api/admin/payment-settings`;

const GATEWAY_OPTIONS = [
  {
    value: 'razorpay',
    title: 'Razorpay',
    description: 'Accept online payments via UPI, Cards, Net Banking and Wallets through Razorpay.'
  },
  {
    value: 'cashfree',
    title: 'Cashfree',
    description: 'Accept online payments via UPI, Cards, Net Banking and Wallets through Cashfree.'
  },
  {
    value: 'none',
    title: 'Disabled (COD only)',
    description: 'Turn off online payments. Customers can only pay Cash on Delivery.'
  }
];

const PaymentSettings = () => {
  const [activeGateway, setActiveGateway] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(BASE_URL, {
        headers: { ...getHeaders(), 'Content-Type': 'application/json' }
      });
      const result = await res.json();
      if (result.success) {
        setActiveGateway(result.settings.activeGateway);
        setSelected(result.settings.activeGateway);
      } else {
        showToast('Failed to load payment settings.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load payment settings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selected || selected === activeGateway) return;
    setSaving(true);
    try {
      const res = await fetch(BASE_URL, {
        method: 'PUT',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeGateway: selected })
      });
      const result = await res.json();
      if (result.success) {
        setActiveGateway(result.settings.activeGateway);
        showToast('Payment settings updated successfully!');
      } else {
        showToast(result.error || 'Failed to update payment settings.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update payment settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading payment settings...</div>;
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FiCreditCard className="w-6 h-6" />
          Payment Settings
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Choose which online payment gateway is active at checkout. Cash on Delivery is always available to customers.
        </p>
      </div>

      {toast && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${toast.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
          {toast.type === 'error' ? <FiAlertCircle className="w-4 h-4" /> : <FiCheck className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      <div className="space-y-3">
        {GATEWAY_OPTIONS.map((option) => (
          <div
            key={option.value}
            onClick={() => setSelected(option.value)}
            className={`cursor-pointer border-2 rounded-xl p-5 transition-all ${selected === option.value
              ? 'border-black bg-gray-50'
              : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            <div className="flex items-center">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${selected === option.value ? 'border-black bg-black' : 'border-gray-300'}`}>
                {selected === option.value && <FiCheck className="w-3 h-3 text-white" />}
              </div>
              <span className="font-semibold text-gray-900">{option.title}</span>
              {activeGateway === option.value && (
                <span className="ml-2 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-2 ml-8">{option.description}</p>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !selected || selected === activeGateway}
        className="mt-6 px-5 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: 'black' }}
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
};

export default PaymentSettings;
