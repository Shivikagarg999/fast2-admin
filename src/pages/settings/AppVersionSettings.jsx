import { useState, useEffect } from "react";
import { FiSmartphone, FiCheck, FiAlertCircle } from "react-icons/fi";

const BASE_URL = `${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.gmkart.com/proxy'}/api/app-config`;

const APPS = [
  { value: 'customer', label: 'Customer App (GMKart)' },
  { value: 'driver', label: 'Driver App (GMKart Captain)' },
];

const emptyForm = {
  minVersionCode: '',
  latestVersionCode: '',
  playStoreUrl: '',
  updateMessage: '',
  productServiceRadiusKm: '5',
};

const AppVersionSettings = () => {
  const [selectedApp, setSelectedApp] = useState('customer');
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchConfig(selectedApp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedApp]);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token') || ''}`
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchConfig = async (app) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}?app=${app}`);
      const result = await res.json();
      if (result.success) {
        setForm({
          minVersionCode: String(result.minVersionCode ?? ''),
          latestVersionCode: String(result.latestVersionCode ?? ''),
          playStoreUrl: result.playStoreUrl || '',
          updateMessage: result.updateMessage || '',
          productServiceRadiusKm: String(result.productServiceRadiusKm ?? 5),
        });
      } else {
        showToast('Failed to load app version settings.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load app version settings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.minVersionCode || isNaN(Number(form.minVersionCode))) {
      showToast('Minimum required version code must be a number.', 'error');
      return;
    }
    if (selectedApp === 'customer' &&
        (!form.productServiceRadiusKm || Number(form.productServiceRadiusKm) < 0.1 || Number(form.productServiceRadiusKm) > 100)) {
      showToast('Product service radius must be between 0.1 and 100 km.', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(BASE_URL, {
        method: 'PUT',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app: selectedApp,
          minVersionCode: Number(form.minVersionCode),
          latestVersionCode: form.latestVersionCode ? Number(form.latestVersionCode) : undefined,
          playStoreUrl: form.playStoreUrl,
          updateMessage: form.updateMessage,
          ...(selectedApp === 'customer' && { productServiceRadiusKm: Number(form.productServiceRadiusKm) }),
        })
      });
      const result = await res.json();
      if (result.success) {
        showToast('App version settings updated successfully!');
      } else {
        showToast(result.error || 'Failed to update app version settings.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update app version settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FiSmartphone className="w-6 h-6" />
          App Version / Force Update
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Set the minimum app version users must have installed. Anyone on an older
          version will see a mandatory "Update Required" screen and won't be able to
          use the app until they update. Only raise this <strong>after</strong> the new
          version is live and downloadable on the Play Store — not right after building it.
        </p>
      </div>

      {toast && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${toast.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
          {toast.type === 'error' ? <FiAlertCircle className="w-4 h-4" /> : <FiCheck className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">App</label>
        <div className="flex gap-3">
          {APPS.map((app) => (
            <button
              key={app.value}
              onClick={() => setSelectedApp(app.value)}
              style={{ backgroundColor: "blue" }}
              className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all text-white ${
                selectedApp === app.value
                  ? 'border-black'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {app.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-5">
          {selectedApp === 'customer' && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Nearby Product Radius (km)
              </label>
              <input
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                value={form.productServiceRadiusKm}
                onChange={(e) => handleChange('productServiceRadiusKm', e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-600 mt-1">Customers will only see products from shops inside this distance.</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Required Version Code *
            </label>
            <input
              type="number"
              value={form.minVersionCode}
              onChange={(e) => handleChange('minVersionCode', e.target.value)}
              placeholder="e.g. 7"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              This is the build number (the number after the + in pubspec.yaml's version, e.g. 1.0.0+7 → 7).
              Anyone below this is forced to update.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Latest Version Code (informational)
            </label>
            <input
              type="number"
              value={form.latestVersionCode}
              onChange={(e) => handleChange('latestVersionCode', e.target.value)}
              placeholder="e.g. 7"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Play Store URL
            </label>
            <input
              type="text"
              value={form.playStoreUrl}
              onChange={(e) => handleChange('playStoreUrl', e.target.value)}
              placeholder="https://play.google.com/store/apps/details?id=..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Message
            </label>
            <textarea
              value={form.updateMessage}
              onChange={(e) => handleChange('updateMessage', e.target.value)}
              rows={3}
              placeholder="A new version of the app is available. Please update to continue."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'black' }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AppVersionSettings;
