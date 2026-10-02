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
  freeDeliveryThreshold: '199',
  deliverySlabs: [{ fromKm: 0, toKm: 5, chargeType: 'flat', rate: 20 }],
  headerGradientStart: '',
  headerGradientEnd: '',
};

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

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
          freeDeliveryThreshold: String(result.freeDeliveryThreshold ?? 199),
          deliverySlabs: result.deliverySlabs?.length
            ? result.deliverySlabs
            : [{ fromKm: 0, toKm: 5, chargeType: 'flat', rate: 20 }],
          headerGradientStart: result.headerGradientStart || '',
          headerGradientEnd: result.headerGradientEnd || '',
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

  const handleSlabChange = (index, field, value) => {
    setForm((prev) => {
      const slabs = prev.deliverySlabs.map((slab, i) => {
        if (i !== index) return slab;
        return { ...slab, [field]: field === 'chargeType' ? value : Number(value) };
      });
      // Keep each row's "From" locked to the previous row's "To" so slabs stay contiguous.
      for (let i = 1; i < slabs.length; i++) {
        slabs[i] = { ...slabs[i], fromKm: slabs[i - 1].toKm };
      }
      return { ...prev, deliverySlabs: slabs };
    });
  };

  const handleAddSlab = () => {
    setForm((prev) => {
      const lastToKm = prev.deliverySlabs[prev.deliverySlabs.length - 1]?.toKm ?? 0;
      return {
        ...prev,
        deliverySlabs: [
          ...prev.deliverySlabs,
          { fromKm: lastToKm, toKm: lastToKm + 5, chargeType: 'per_km', rate: 5 },
        ],
      };
    });
  };

  const handleRemoveSlab = (index) => {
    setForm((prev) => {
      if (prev.deliverySlabs.length <= 1) return prev;
      const slabs = prev.deliverySlabs.filter((_, i) => i !== index);
      for (let i = 1; i < slabs.length; i++) {
        slabs[i] = { ...slabs[i], fromKm: slabs[i - 1].toKm };
      }
      return { ...prev, deliverySlabs: slabs };
    });
  };

  const validateSlabs = (slabs) => {
    if (!slabs.length) return 'Add at least one delivery slab.';
    if (slabs[0].fromKm !== 0) return 'The first slab must start at 0 km.';
    for (let i = 0; i < slabs.length; i++) {
      const slab = slabs[i];
      if (!(slab.toKm > slab.fromKm)) return `Slab ${i + 1}: "To" must be greater than "From".`;
      if (!(slab.rate >= 0)) return `Slab ${i + 1}: rate must be 0 or greater.`;
      if (i > 0 && slab.fromKm !== slabs[i - 1].toKm) return `Slab ${i + 1} must start where slab ${i} ends.`;
    }
    return null;
  };

  const handleSave = async () => {
    if (!form.minVersionCode || isNaN(Number(form.minVersionCode))) {
      showToast('Minimum required version code must be a number.', 'error');
      return;
    }
    if (selectedApp === 'customer' &&
        (form.freeDeliveryThreshold === '' || Number(form.freeDeliveryThreshold) < 0)) {
      showToast('Free delivery threshold must be 0 or greater.', 'error');
      return;
    }
    if (selectedApp === 'customer') {
      const slabError = validateSlabs(form.deliverySlabs);
      if (slabError) {
        showToast(slabError, 'error');
        return;
      }
      if (form.headerGradientStart && !HEX_COLOR_PATTERN.test(form.headerGradientStart)) {
        showToast('Header gradient start must be a valid hex color.', 'error');
        return;
      }
      if (form.headerGradientEnd && !HEX_COLOR_PATTERN.test(form.headerGradientEnd)) {
        showToast('Header gradient end must be a valid hex color.', 'error');
        return;
      }
      if (!!form.headerGradientStart !== !!form.headerGradientEnd) {
        showToast('Set both header gradient colors, or clear both.', 'error');
        return;
      }
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
          ...(selectedApp === 'customer' && {
            freeDeliveryThreshold: Number(form.freeDeliveryThreshold),
            deliverySlabs: form.deliverySlabs,
            headerGradientStart: form.headerGradientStart,
            headerGradientEnd: form.headerGradientEnd
          }),
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
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Delivery Charge Slabs
                </label>
                <p className="text-xs text-gray-600 mb-3">
                  Delivery charge is based on the customer's distance from the shop. Rates are
                  cumulative across bands (like tax brackets). The last band's "To" also sets
                  how far customers can be to see this shop's products.
                </p>
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_1fr_1.2fr_1fr_auto] gap-2 text-xs font-semibold text-gray-600 px-1">
                    <span>From (km)</span>
                    <span>To (km)</span>
                    <span>Type</span>
                    <span>Rate (₹)</span>
                    <span></span>
                  </div>
                  {form.deliverySlabs.map((slab, index) => (
                    <div key={index} className="grid grid-cols-[1fr_1fr_1.2fr_1fr_auto] gap-2 items-center">
                      <input
                        type="number"
                        value={slab.fromKm}
                        disabled
                        className="w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded-lg text-gray-500"
                      />
                      <input
                        type="number"
                        min={slab.fromKm}
                        step="0.1"
                        value={slab.toKm}
                        onChange={(e) => handleSlabChange(index, 'toKm', e.target.value)}
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <select
                        value={slab.chargeType}
                        onChange={(e) => handleSlabChange(index, 'chargeType', e.target.value)}
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="flat">Flat</option>
                        <option value="per_km">Per km</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={slab.rate}
                        onChange={(e) => handleSlabChange(index, 'rate', e.target.value)}
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSlab(index)}
                        disabled={form.deliverySlabs.length <= 1}
                        style={{ backgroundColor: form.deliverySlabs.length <= 1 ? '#e5e7eb' : '#dc2626' }}
                        className="px-3 py-2 rounded-lg text-white text-xs font-medium disabled:cursor-not-allowed disabled:text-gray-400"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddSlab}
                  style={{ backgroundColor: 'blue' }}
                  className="mt-3 px-4 py-2 rounded-lg text-white text-xs font-medium"
                >
                  + Add Slab
                </button>
                <p className="text-xs text-gray-600 mt-3">
                  Customers within <strong>{form.deliverySlabs[form.deliverySlabs.length - 1]?.toKm ?? 0} km</strong> will see this shop's products.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Free Delivery Above
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.freeDeliveryThreshold}
                  onChange={(e) => handleChange('freeDeliveryThreshold', e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-600 mt-1">Applied per shop. Set 0 to disable default free delivery.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  App Header Gradient
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.headerGradientStart || '#F0FAFF'}
                    onChange={(e) => handleChange('headerGradientStart', e.target.value)}
                    className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
                  />
                  <span className="text-xs text-gray-500">Start</span>
                  <input
                    type="color"
                    value={form.headerGradientEnd || '#D6F0FB'}
                    onChange={(e) => handleChange('headerGradientEnd', e.target.value)}
                    className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
                  />
                  <span className="text-xs text-gray-500">End</span>
                  <div
                    className="h-10 flex-1 rounded-lg border border-gray-300"
                    style={{
                      background: `linear-gradient(135deg, ${form.headerGradientStart || '#F0FAFF'}, ${form.headerGradientEnd || '#D6F0FB'})`
                    }}
                  />
                  {(form.headerGradientStart || form.headerGradientEnd) && (
                    <button
                      type="button"
                      onClick={() => {
                        handleChange('headerGradientStart', '');
                        handleChange('headerGradientEnd', '');
                      }}
                      className="text-xs font-medium text-gray-500 hover:text-gray-700 underline whitespace-nowrap"
                    >
                      Reset to default
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Colors the customer app's home header background (like Blinkit's seasonal header colors). Leave unset to use the app's built-in default.
                </p>
              </div>
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
