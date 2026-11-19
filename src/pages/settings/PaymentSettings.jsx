import { useState, useEffect } from "react";
import { FiCreditCard, FiCheck, FiAlertCircle } from "react-icons/fi";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import PageHeader from "../../components/ui/PageHeader";

const BASE_URL = `${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.gmkart.com/proxy'}/api/admin/payment-settings`;

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
    <div className="p-6 max-w-2xl bg-gold-50 min-h-screen">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <FiCreditCard className="w-6 h-6" />
            Payment Settings
          </span>
        }
        subtitle="Choose which online payment gateway is active at checkout. Cash on Delivery is always available to customers."
      />

      {toast && (
        <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-sm ${toast.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
          {toast.type === 'error' ? <FiAlertCircle className="w-4 h-4" /> : <FiCheck className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      <div className="space-y-3">
        {GATEWAY_OPTIONS.map((option) => (
          <div
            key={option.value}
            onClick={() => setSelected(option.value)}
            className={`cursor-pointer border-2 rounded-2xl p-5 transition-all bg-white shadow-sm shadow-black/5 ${selected === option.value
              ? 'border-gold-400 bg-gold-50'
              : 'border-gray-100 hover:border-gray-200'
              }`}
          >
            <div className="flex items-center">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${selected === option.value ? 'border-black bg-black' : 'border-gray-300'}`}>
                {selected === option.value && <FiCheck className="w-3 h-3 text-white" />}
              </div>
              <span className="font-semibold text-gray-900">{option.title}</span>
              {activeGateway === option.value && (
                <Badge variant="success" className="ml-2">Active</Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-2 ml-8">{option.description}</p>
          </div>
        ))}
      </div>

      <Button
        onClick={handleSave}
        disabled={saving || !selected || selected === activeGateway}
        variant="primary"
        className="mt-6"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
};

export default PaymentSettings;
