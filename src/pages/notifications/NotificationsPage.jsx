import React, { useEffect, useState } from "react";
import { FiSend, FiBell, FiUsers, FiUser, FiAlertCircle, FiCheck } from "react-icons/fi";

const BASE_URL = `${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.gmkart.com/proxy'}/api/admin/notifications`;

const emptyForm = { audience: 'all', title: '', body: '', phone: '', userId: '' };

const NotificationsPage = () => {
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState([]);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token') || ''}`,
    'Content-Type': 'application/json'
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchHistory = async (p = 1) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`${BASE_URL}/campaigns?page=${p}&limit=10`, { headers: getHeaders() });
      const result = await res.json();
      if (result.success) {
        setCampaigns(result.data || []);
        setTotalPages(result.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory(page);
  }, [page]);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    const errs = [];
    if (!form.title.trim()) errs.push('Title is required');
    if (form.title.trim().length > 80) errs.push('Title must be 80 characters or less');
    if (!form.body.trim()) errs.push('Message is required');
    if (form.body.trim().length > 300) errs.push('Message must be 300 characters or less');
    if (form.audience === 'user' && !form.phone.trim() && !form.userId.trim()) {
      errs.push('Enter a customer phone number or user ID');
    }
    return errs;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setErrors([]);
    const errs = validate();
    if (errs.length) {
      setErrors(errs);
      return;
    }

    const confirmText = form.audience === 'all'
      ? 'Send this notification to ALL customers?'
      : 'Send this notification to the selected customer?';
    if (!window.confirm(confirmText)) return;

    setSending(true);
    try {
      const payload = {
        audience: form.audience,
        title: form.title.trim(),
        body: form.body.trim(),
        ...(form.audience === 'user' && (form.userId.trim()
          ? { userId: form.userId.trim() }
          : { phone: form.phone.trim() })),
      };
      const res = await fetch(`${BASE_URL}/send`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        showToast(result.message || 'Notification sent');
        setForm(emptyForm);
        setPage(1);
        fetchHistory(1);
      } else {
        setErrors([result.message || 'Failed to send notification']);
      }
    } catch {
      setErrors(['Failed to send notification. Please try again.']);
    } finally {
      setSending(false);
    }
  };

  const fmt = (d) => new Date(d).toLocaleString();
  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400";

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Push Notifications</h1>
        <p className="text-gray-500 mt-1 text-sm">Send Firebase push notifications to all customers or one customer. They also appear in the app's notification inbox.</p>
      </div>

      {toast && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${toast.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
          {toast.type === 'error' ? <FiAlertCircle className="w-4 h-4" /> : <FiCheck className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSend} className="bg-white rounded-xl shadow p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FiBell className="w-5 h-5" /> Compose
          </h2>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <ul className="list-disc list-inside space-y-1">
                {errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Audience</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleChange('audience', 'all')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium ${form.audience === 'all' ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                <FiUsers className="w-4 h-4" /> All customers
              </button>
              <button
                type="button"
                onClick={() => handleChange('audience', 'user')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium ${form.audience === 'user' ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                <FiUser className="w-4 h-4" /> One customer
              </button>
            </div>
          </div>

          {form.audience === 'user' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (10 digits)</label>
                <input type="text" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="9876543210" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">or User ID</label>
                <input type="text" value={form.userId} onChange={(e) => handleChange('userId', e.target.value)} placeholder="Mongo user ID" className={inputClass} />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-gray-400 text-xs">({form.title.length}/80)</span></label>
            <input type="text" maxLength={80} value={form.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="e.g. Flat ₹50 off today" className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message <span className="text-gray-400 text-xs">({form.body.length}/300)</span></label>
            <textarea rows={3} maxLength={300} value={form.body} onChange={(e) => handleChange('body', e.target.value)} placeholder="Use code WELCOME at checkout" className={inputClass} />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: 'black' }}
          >
            <FiSend className="w-4 h-4" /> {sending ? 'Sending...' : 'Send notification'}
          </button>
        </form>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sent history</h2>
          {loadingHistory ? (
            <p className="text-sm text-gray-400 py-8 text-center">Loading...</p>
          ) : campaigns.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No notifications sent yet</p>
          ) : (
            <div className="space-y-3">
              {campaigns.map((c) => (
                <div key={c._id} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex justify-between items-start gap-3">
                    <p className="font-semibold text-gray-900 text-sm">{c.title}</p>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{fmt(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{c.body}</p>
                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
                    <span className="px-2 py-1 bg-gray-100 rounded-full">{c.targetLabel || (c.audience === 'all' ? 'All customers' : 'Customer')}</span>
                    <span>Inbox: {c.recipientCount}</span>
                    {c.audience === 'all' && (
                      <>
                        <span className="text-green-700">Push delivered: {c.pushSent}</span>
                        <span className="text-red-600">Failed: {c.pushFailed}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {totalPages > 1 && (
                <div className="flex justify-between items-center pt-2 text-sm">
                  <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border rounded disabled:opacity-40">Prev</button>
                  <span className="text-gray-500">Page {page} of {totalPages}</span>
                  <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded disabled:opacity-40">Next</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
