import React, { useEffect, useState } from "react";
import { FiSend, FiBell, FiUsers, FiUser, FiAlertCircle, FiCheck, FiClock, FiCalendar, FiPause, FiPlay, FiTrash2 } from "react-icons/fi";

const BASE_URL = `${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.gmkart.com/proxy'}/api/admin/notifications`;

const DAYS = [
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
  { value: 0, label: 'Sunday', short: 'Sun' },
];

// Fixed time-of-day presets — keeps the schedule grid simple and unambiguous
// for the admin instead of a free-form time picker per day.
const SLOTS = [
  { key: 'morning', label: 'Morning', time: '09:00', display: '9:00 AM' },
  { key: 'afternoon', label: 'Afternoon', time: '14:00', display: '2:00 PM' },
  { key: 'evening', label: 'Evening', time: '18:00', display: '6:00 PM' },
];
const SLOT_BY_TIME = Object.fromEntries(SLOTS.map((s) => [s.time, s]));

const emptySlotsByDay = () => ({ 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] });

const todayDateInput = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
  mode: 'now', // 'now' | 'schedule'
  audience: 'all',
  title: '',
  body: '',
  phone: '',
  userId: '',
  scheduleType: 'once', // 'once' | 'weekly'
  sendAt: '',
  slotsByDay: emptySlotsByDay(), // { [dayOfWeek]: ['morning', 'evening', ...] }
  startDate: todayDateInput(),
  hasEndDate: false,
  endDate: '',
};

const NotificationsPage = () => {
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [rightTab, setRightTab] = useState('scheduled'); // 'scheduled' | 'history'
  const [campaigns, setCampaigns] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scheduled, setScheduled] = useState([]);
  const [loadingScheduled, setLoadingScheduled] = useState(true);
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

  const fetchScheduled = async () => {
    setLoadingScheduled(true);
    try {
      const res = await fetch(`${BASE_URL}/scheduled?limit=50`, { headers: getHeaders() });
      const result = await res.json();
      if (result.success) {
        setScheduled(result.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingScheduled(false);
    }
  };

  useEffect(() => {
    fetchHistory(page);
  }, [page]);

  useEffect(() => {
    fetchScheduled();
  }, []);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleSlot = (day, slotKey) => {
    setForm((prev) => {
      const current = prev.slotsByDay[day] || [];
      const next = current.includes(slotKey)
        ? current.filter((k) => k !== slotKey)
        : [...current, slotKey];
      return { ...prev, slotsByDay: { ...prev.slotsByDay, [day]: next } };
    });
  };

  // Clicking a slot's column header toggles it for every day at once — the
  // fast way to set up "every day at 6 PM" instead of clicking 7 times.
  const toggleSlotForAllDays = (slotKey) => {
    setForm((prev) => {
      const allHaveIt = DAYS.every((d) => prev.slotsByDay[d.value]?.includes(slotKey));
      const next = { ...prev.slotsByDay };
      DAYS.forEach((d) => {
        const current = next[d.value] || [];
        next[d.value] = allHaveIt
          ? current.filter((k) => k !== slotKey)
          : current.includes(slotKey) ? current : [...current, slotKey];
      });
      return { ...prev, slotsByDay: next };
    });
  };

  const totalSlotsSelected = Object.values(form.slotsByDay).reduce((sum, arr) => sum + arr.length, 0);

  const validate = () => {
    const errs = [];
    if (!form.title.trim()) errs.push('Title is required');
    if (form.title.trim().length > 80) errs.push('Title must be 80 characters or less');
    if (!form.body.trim()) errs.push('Message is required');
    if (form.body.trim().length > 300) errs.push('Message must be 300 characters or less');
    if (form.audience === 'user' && !form.phone.trim() && !form.userId.trim()) {
      errs.push('Enter a customer phone number or user ID');
    }
    if (form.mode === 'schedule') {
      if (form.scheduleType === 'once') {
        if (!form.sendAt) errs.push('Pick a date and time to send');
        else if (new Date(form.sendAt) <= new Date()) errs.push('Scheduled time must be in the future');
      } else {
        if (!totalSlotsSelected) errs.push('Pick at least one day and time slot in the grid below');
        if (form.hasEndDate && form.endDate && form.startDate && form.endDate < form.startDate) {
          errs.push('End date must be after the start date');
        }
      }
    }
    return errs;
  };

  const buildWeeklySlots = () => {
    const slots = [];
    DAYS.forEach((d) => {
      (form.slotsByDay[d.value] || []).forEach((slotKey) => {
        const slot = SLOTS.find((s) => s.key === slotKey);
        if (slot) slots.push({ dayOfWeek: d.value, time: slot.time });
      });
    });
    return slots;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setErrors([]);
    const errs = validate();
    if (errs.length) {
      setErrors(errs);
      return;
    }

    const isSchedule = form.mode === 'schedule';
    const confirmText = isSchedule
      ? 'Schedule this notification?'
      : form.audience === 'all'
        ? 'Send this notification to ALL customers?'
        : 'Send this notification to the selected customer?';
    if (!window.confirm(confirmText)) return;

    setSending(true);
    try {
      const basePayload = {
        audience: form.audience,
        title: form.title.trim(),
        body: form.body.trim(),
        ...(form.audience === 'user' && (form.userId.trim()
          ? { userId: form.userId.trim() }
          : { phone: form.phone.trim() })),
      };

      const payload = isSchedule
        ? {
            ...basePayload,
            scheduleType: form.scheduleType,
            ...(form.scheduleType === 'once'
              ? { sendAt: new Date(form.sendAt).toISOString() }
              : {
                  weeklySlots: buildWeeklySlots(),
                  startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
                  endDate: form.hasEndDate && form.endDate ? new Date(form.endDate).toISOString() : null,
                }),
          }
        : basePayload;

      const res = await fetch(`${BASE_URL}/${isSchedule ? 'schedule' : 'send'}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        showToast(result.message || (isSchedule ? 'Notification scheduled' : 'Notification sent'));
        setForm(emptyForm);
        if (isSchedule) {
          setRightTab('scheduled');
          fetchScheduled();
        } else {
          setPage(1);
          fetchHistory(1);
        }
      } else {
        setErrors([result.message || 'Failed to save notification']);
      }
    } catch {
      setErrors(['Failed to save notification. Please try again.']);
    } finally {
      setSending(false);
    }
  };

  const updateScheduledStatus = async (id, status) => {
    try {
      const res = await fetch(`${BASE_URL}/scheduled/${id}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });
      const result = await res.json();
      if (result.success) {
        showToast(status === 'cancelled' ? 'Schedule cancelled' : status === 'paused' ? 'Schedule paused' : 'Schedule resumed');
        fetchScheduled();
      } else {
        showToast(result.message || 'Failed to update schedule', 'error');
      }
    } catch {
      showToast('Failed to update schedule', 'error');
    }
  };

  const deleteScheduled = async (id) => {
    if (!window.confirm('Delete this scheduled notification? This cannot be undone.')) return;
    try {
      const res = await fetch(`${BASE_URL}/scheduled/${id}`, { method: 'DELETE', headers: getHeaders() });
      const result = await res.json();
      if (result.success) {
        showToast('Scheduled notification deleted');
        fetchScheduled();
      } else {
        showToast(result.message || 'Failed to delete', 'error');
      }
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const fmt = (d) => new Date(d).toLocaleString();
  const dayShort = (d) => DAYS.find((x) => x.value === d)?.short || d;

  const scheduleSummary = (s) => {
    if (s.scheduleType === 'once') {
      return `Once · ${fmt(s.sendAt)}`;
    }
    const byDay = {};
    (s.weeklySlots || []).forEach((slot) => {
      const label = SLOT_BY_TIME[slot.time]?.display || slot.time;
      (byDay[slot.dayOfWeek] = byDay[slot.dayOfWeek] || []).push(label);
    });
    const order = [1, 2, 3, 4, 5, 6, 0];
    const parts = order
      .filter((d) => byDay[d]?.length)
      .map((d) => `${dayShort(d)} ${byDay[d].join(', ')}`);
    const count = s.weeklySlots?.length || 0;
    return `${parts.join(' · ')} — ${count} time${count === 1 ? '' : 's'}/week${s.endDate ? ` · until ${new Date(s.endDate).toLocaleDateString()}` : ''}`;
  };

  const statusBadge = (status) => {
    const styles = {
      active: 'bg-green-50 text-green-700',
      paused: 'bg-yellow-50 text-yellow-700',
      completed: 'bg-gray-100 text-gray-500',
      cancelled: 'bg-red-50 text-red-600',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.completed}`}>{status}</span>;
  };

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400";

  const modeButton = (value, icon, label) => (
    <button
      type="button"
      onClick={() => handleChange('mode', value)}
      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
      style={{
        backgroundColor: form.mode === value ? 'black' : 'white',
        color: form.mode === value ? 'white' : '#374151',
        border: form.mode === value ? '1px solid black' : '1px solid #d1d5db'
      }}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Push Notifications</h1>
        <p className="text-gray-500 mt-1 text-sm">Send Firebase push notifications now, or schedule them for later — including recurring weekly sends. They also appear in the app's notification inbox.</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">When</label>
            <div className="flex gap-2">
              {modeButton('now', <FiSend className="w-4 h-4" />, 'Send now')}
              {modeButton('schedule', <FiClock className="w-4 h-4" />, 'Schedule')}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Audience</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleChange('audience', 'all')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: form.audience === 'all' ? 'black' : 'white',
                  color: form.audience === 'all' ? 'white' : '#374151',
                  border: form.audience === 'all' ? '1px solid black' : '1px solid #d1d5db'
                }}
              >
                <FiUsers className="w-4 h-4" /> All customers
              </button>
              <button
                type="button"
                onClick={() => handleChange('audience', 'user')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: form.audience === 'user' ? 'black' : 'white',
                  color: form.audience === 'user' ? 'white' : '#374151',
                  border: form.audience === 'user' ? '1px solid black' : '1px solid #d1d5db'
                }}
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

          {form.mode === 'schedule' && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Schedule type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleChange('scheduleType', 'once')}
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-medium"
                    style={{
                      backgroundColor: form.scheduleType === 'once' ? 'black' : 'white',
                      color: form.scheduleType === 'once' ? 'white' : '#374151',
                      border: form.scheduleType === 'once' ? '1px solid black' : '1px solid #d1d5db'
                    }}
                  >
                    One time
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('scheduleType', 'weekly')}
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-medium"
                    style={{
                      backgroundColor: form.scheduleType === 'weekly' ? 'black' : 'white',
                      color: form.scheduleType === 'weekly' ? 'white' : '#374151',
                      border: form.scheduleType === 'weekly' ? '1px solid black' : '1px solid #d1d5db'
                    }}
                  >
                    Recurring (day-wise)
                  </button>
                </div>
              </div>

              {form.scheduleType === 'once' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Send at</label>
                  <input type="datetime-local" value={form.sendAt} onChange={(e) => handleChange('sendAt', e.target.value)} className={inputClass} />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pick day + time of day</label>
                    <p className="text-xs text-gray-500 mb-2">Tap a cell to turn that day's slot on. Tap a column heading to toggle it for every day.</p>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="text-left px-3 py-2 font-medium text-gray-500">Day</th>
                            {SLOTS.map((slot) => (
                              <th key={slot.key} className="px-2 py-2">
                                <button
                                  type="button"
                                  onClick={() => toggleSlotForAllDays(slot.key)}
                                  className="text-center leading-tight hover:text-black"
                                >
                                  <span className="block font-semibold text-gray-700">{slot.label}</span>
                                  <span className="block font-normal text-gray-400">{slot.display}</span>
                                </button>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {DAYS.map((d) => (
                            <tr key={d.value} className="border-t border-gray-100">
                              <td className="px-3 py-2 font-medium text-gray-700">{d.short}</td>
                              {SLOTS.map((slot) => {
                                const isOn = form.slotsByDay[d.value]?.includes(slot.key);
                                return (
                                  <td key={slot.key} className="px-2 py-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() => toggleSlot(d.value, slot.key)}
                                      aria-label={`${d.label} ${slot.label}`}
                                      className="w-7 h-7 rounded-full inline-flex items-center justify-center"
                                      style={{
                                        backgroundColor: isOn ? 'black' : 'white',
                                        border: isOn ? '1px solid black' : '1px solid #d1d5db',
                                      }}
                                    >
                                      {isOn && <FiCheck className="w-3.5 h-3.5 text-white" />}
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {totalSlotsSelected > 0 && (
                      <p className="text-xs text-gray-500 mt-1.5">
                        Sends {totalSlotsSelected} time{totalSlotsSelected > 1 ? 's' : ''} a week.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
                      <input type="date" value={form.startDate} onChange={(e) => handleChange('startDate', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <input type="checkbox" checked={form.hasEndDate} onChange={(e) => handleChange('hasEndDate', e.target.checked)} />
                        End date
                      </label>
                      <input
                        type="date"
                        value={form.endDate}
                        onChange={(e) => handleChange('endDate', e.target.value)}
                        disabled={!form.hasEndDate}
                        className={`${inputClass} ${!form.hasEndDate ? 'opacity-50' : ''}`}
                      />
                      {!form.hasEndDate && (
                        <p className="text-xs text-gray-400 mt-1">Repeats indefinitely until paused or cancelled.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium"
            style={{ backgroundColor: 'black', color: 'white', opacity: sending ? 0.5 : 1 }}
          >
            {form.mode === 'schedule' ? <FiCalendar className="w-4 h-4" /> : <FiSend className="w-4 h-4" />}
            {sending ? 'Saving...' : form.mode === 'schedule' ? 'Schedule notification' : 'Send notification'}
          </button>
        </form>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setRightTab('scheduled')}
              className="px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: rightTab === 'scheduled' ? 'black' : 'white',
                color: rightTab === 'scheduled' ? 'white' : '#374151',
                border: rightTab === 'scheduled' ? '1px solid black' : '1px solid #d1d5db'
              }}
            >
              Scheduled
            </button>
            <button
              onClick={() => setRightTab('history')}
              className="px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: rightTab === 'history' ? 'black' : 'white',
                color: rightTab === 'history' ? 'white' : '#374151',
                border: rightTab === 'history' ? '1px solid black' : '1px solid #d1d5db'
              }}
            >
              Sent history
            </button>
          </div>

          {rightTab === 'scheduled' ? (
            loadingScheduled ? (
              <p className="text-sm text-gray-400 py-8 text-center">Loading...</p>
            ) : scheduled.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No scheduled notifications yet</p>
            ) : (
              <div className="space-y-3 max-h-[560px] overflow-y-auto">
                {scheduled.map((s) => (
                  <div key={s._id} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex justify-between items-start gap-3">
                      <p className="font-semibold text-gray-900 text-sm">{s.title}</p>
                      {statusBadge(s.status)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{s.body}</p>
                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500 items-center">
                      <span className="px-2 py-1 bg-gray-100 rounded-full">{s.targetLabel || (s.audience === 'all' ? 'All customers' : 'Customer')}</span>
                    </div>
                    <p className="flex items-start gap-1 text-xs text-gray-500 mt-2">
                      <FiClock className="w-3 h-3 mt-0.5 flex-shrink-0" /> {scheduleSummary(s)}
                    </p>
                    {s.status === 'active' && s.nextRunAt && (
                      <p className="text-xs text-gray-400 mt-1">Next send: {fmt(s.nextRunAt)}</p>
                    )}
                    {(s.status === 'active' || s.status === 'paused') && (
                      <div className="flex gap-2 mt-3">
                        {s.status === 'active' ? (
                          <button
                            onClick={() => updateScheduledStatus(s._id, 'paused')}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            <FiPause className="w-3 h-3" /> Pause
                          </button>
                        ) : (
                          <button
                            onClick={() => updateScheduledStatus(s._id, 'active')}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            <FiPlay className="w-3 h-3" /> Resume
                          </button>
                        )}
                        <button
                          onClick={() => updateScheduledStatus(s._id, 'cancelled')}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => deleteScheduled(s._id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-gray-300 text-gray-500 hover:bg-gray-50 ml-auto"
                        >
                          <FiTrash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : loadingHistory ? (
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
                    {c.scheduledNotification && <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full">Scheduled</span>}
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
                  <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 rounded" style={{ border: '1px solid #d1d5db', opacity: page === 1 ? 0.4 : 1 }}>Prev</button>
                  <span className="text-gray-500">Page {page} of {totalPages}</span>
                  <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded" style={{ border: '1px solid #d1d5db', opacity: page === totalPages ? 0.4 : 1 }}>Next</button>
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
