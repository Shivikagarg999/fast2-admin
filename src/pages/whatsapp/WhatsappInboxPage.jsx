import { useEffect, useRef, useState, useCallback } from "react";
import { FiSend, FiPlay, FiPause, FiMessageCircle, FiFileText, FiPlus, FiCheck, FiClock, FiAlertCircle, FiUsers } from "react-icons/fi";
import Modal from "../../components/common/Modal";

const BASE_URL = `${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.gmkart.com/proxy'}/api`;

const emptyTemplateForm = { name: '', category: 'UTILITY', language: 'en_US', bodyText: '', buttons: [] };

const statusBadge = (status) => {
  const map = {
    APPROVED: { color: '#15803d', bg: '#f0fdf4', icon: FiCheck },
    PENDING: { color: '#b45309', bg: '#fffbeb', icon: FiClock },
    REJECTED: { color: '#b91c1c', bg: '#fef2f2', icon: FiAlertCircle },
  };
  return map[status] || map.PENDING;
};

const WhatsappInboxPage = () => {
  const [conversations, setConversations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [templateForm, setTemplateForm] = useState(emptyTemplateForm);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateError, setTemplateError] = useState('');

  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [pickedTemplate, setPickedTemplate] = useState(null);
  const [templateParams, setTemplateParams] = useState([]);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkSelected, setBulkSelected] = useState([]);
  const [bulkMode, setBulkMode] = useState('template');
  const [bulkBody, setBulkBody] = useState('');
  const [bulkTemplate, setBulkTemplate] = useState(null);
  const [bulkTemplateParams, setBulkTemplateParams] = useState([]);
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkError, setBulkError] = useState('');

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token') || ''}`,
    'Content-Type': 'application/json',
  });

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/whatsapp/conversations`, { headers: getHeaders() });
      const result = await res.json();
      if (result.success) setConversations(result.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  }, []);

  const fetchMessages = useCallback(async (phone, silent = false) => {
    if (!phone) return;
    if (!silent) setLoadingMessages(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/whatsapp/conversations/${phone}/messages`, { headers: getHeaders() });
      const result = await res.json();
      if (result.success) {
        setMessages(result.data.messages || []);
        setSelectedConversation(result.data.conversation);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  useEffect(() => {
    if (!selectedPhone) return;
    fetchMessages(selectedPhone);
    const interval = setInterval(() => fetchMessages(selectedPhone, true), 3000);
    return () => clearInterval(interval);
  }, [selectedPhone, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConversation = (phone) => {
    setSelectedPhone(phone);
    setMessages([]);
    setConversations((prev) => prev.map((c) => (c.phone === phone ? { ...c, unreadByAdmin: 0 } : c)));
  };

  const handleSend = async () => {
    if (!draft.trim() || !selectedPhone || sending) return;
    setSending(true);
    const body = draft.trim();
    setDraft('');
    try {
      const res = await fetch(`${BASE_URL}/admin/whatsapp/conversations/${selectedPhone}/send`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ body }),
      });
      const result = await res.json();
      if (result.success) {
        fetchMessages(selectedPhone, true);
        fetchConversations();
      } else {
        alert(result.message || 'Failed to send message');
      }
    } catch {
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/whatsapp/templates`, { headers: getHeaders() });
      const result = await res.json();
      if (result.success) setTemplates(result.data || []);
      else setTemplateError(result.message || 'Failed to load templates');
    } catch {
      setTemplateError('Failed to load templates');
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  const openTemplatesModal = () => {
    setShowTemplatesModal(true);
    setTemplateError('');
    fetchTemplates();
  };

  const addTemplateButton = () => {
    setTemplateForm((p) => ({
      ...p,
      buttons: p.buttons.length >= 3 ? p.buttons : [...p.buttons, { type: 'QUICK_REPLY', text: '', url: '' }],
    }));
  };

  const updateTemplateButton = (index, field, value) => {
    setTemplateForm((p) => ({
      ...p,
      buttons: p.buttons.map((b, i) => (i === index ? { ...b, [field]: value } : b)),
    }));
  };

  const removeTemplateButton = (index) => {
    setTemplateForm((p) => ({ ...p, buttons: p.buttons.filter((_, i) => i !== index) }));
  };

  const handleCreateTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.bodyText.trim()) {
      setTemplateError('Name and message body are required');
      return;
    }
    for (const b of templateForm.buttons) {
      if (!b.text.trim()) {
        setTemplateError('Every button needs text');
        return;
      }
      if (b.type === 'URL' && !/^https?:\/\//.test(b.url)) {
        setTemplateError('URL buttons need a valid http(s) link');
        return;
      }
    }
    setSavingTemplate(true);
    setTemplateError('');
    try {
      const res = await fetch(`${BASE_URL}/admin/whatsapp/templates`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(templateForm),
      });
      const result = await res.json();
      if (result.success) {
        setTemplateForm(emptyTemplateForm);
        setShowCreateForm(false);
        fetchTemplates();
      } else {
        setTemplateError(result.message || 'Failed to create template');
      }
    } catch {
      setTemplateError('Failed to create template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const openTemplatePicker = () => {
    setShowTemplatePicker(true);
    setPickedTemplate(null);
    setTemplateParams([]);
    if (!templates.length) fetchTemplates();
  };

  const selectTemplateToSend = (tpl) => {
    const bodyComponent = tpl.components?.find((c) => c.type === 'BODY');
    const count = (bodyComponent?.text?.match(/\{\{\d+\}\}/g) || []).length;
    setPickedTemplate(tpl);
    setTemplateParams(Array(count).fill(''));
  };

  const handleSendTemplate = async () => {
    if (!pickedTemplate || !selectedPhone || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/whatsapp/conversations/${selectedPhone}/send-template`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name: pickedTemplate.name, language: pickedTemplate.language, bodyParams: templateParams }),
      });
      const result = await res.json();
      if (result.success) {
        setShowTemplatePicker(false);
        fetchMessages(selectedPhone, true);
        fetchConversations();
      } else {
        alert(result.message || 'Failed to send template');
      }
    } catch {
      alert('Failed to send template');
    } finally {
      setSending(false);
    }
  };

  const openBulkModal = () => {
    setShowBulkModal(true);
    setBulkSelected([]);
    setBulkMode('template');
    setBulkBody('');
    setBulkTemplate(null);
    setBulkTemplateParams([]);
    setBulkResult(null);
    setBulkError('');
    if (!templates.length) fetchTemplates();
  };

  const toggleBulkRecipient = (phone) => {
    setBulkSelected((prev) => (prev.includes(phone) ? prev.filter((p) => p !== phone) : [...prev, phone]));
  };

  const toggleBulkSelectAll = () => {
    setBulkSelected((prev) => (prev.length === conversations.length ? [] : conversations.map((c) => c.phone)));
  };

  const selectBulkTemplate = (tpl) => {
    const bodyComponent = tpl.components?.find((c) => c.type === 'BODY');
    const count = (bodyComponent?.text?.match(/\{\{\d+\}\}/g) || []).length;
    setBulkTemplate(tpl);
    setBulkTemplateParams(Array(count).fill(''));
  };

  const handleBulkSend = async () => {
    if (!bulkSelected.length) {
      setBulkError('Pick at least one recipient');
      return;
    }
    if (bulkMode === 'text' && !bulkBody.trim()) {
      setBulkError('Message body is required');
      return;
    }
    if (bulkMode === 'template' && !bulkTemplate) {
      setBulkError('Pick a template');
      return;
    }
    setBulkSending(true);
    setBulkError('');
    setBulkResult(null);
    try {
      const payload = bulkMode === 'template'
        ? { phones: bulkSelected, mode: 'template', templateName: bulkTemplate.name, templateLanguage: bulkTemplate.language, bodyParams: bulkTemplateParams }
        : { phones: bulkSelected, mode: 'text', body: bulkBody.trim() };

      const res = await fetch(`${BASE_URL}/admin/whatsapp/bulk-send`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        setBulkResult(result.data || []);
        fetchConversations();
      } else {
        setBulkError(result.message || 'Failed to send bulk messages');
      }
    } catch {
      setBulkError('Failed to send bulk messages');
    } finally {
      setBulkSending(false);
    }
  };

  const toggleBotPause = async () => {
    if (!selectedConversation) return;
    const nextPaused = !selectedConversation.isBotPaused;
    try {
      const res = await fetch(`${BASE_URL}/admin/whatsapp/conversations/${selectedPhone}/bot-pause`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ paused: nextPaused }),
      });
      const result = await res.json();
      if (result.success) setSelectedConversation(result.data);
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const initials = (name, phone) => {
    const source = (name || phone || '?').trim();
    return source.charAt(0).toUpperCase();
  };

  const avatarColors = ['#0C831F', '#2563eb', '#9333ea', '#c2410c', '#0891b2', '#be185d'];
  const avatarColor = (key) => {
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
    return avatarColors[Math.abs(hash) % avatarColors.length];
  };

  return (
    <div className="h-[calc(100vh-80px)] flex bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Conversation list */}
      <div className="w-[340px] border-r border-gray-100 flex flex-col bg-white">
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#25D366' }}
            >
              <FiMessageCircle className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-tight">WhatsApp Inbox</h2>
              <p className="text-xs text-gray-400">{conversations.length} conversation{conversations.length === 1 ? '' : 's'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3.5">
            <button
              onClick={openBulkModal}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#111827', color: 'white' }}
            >
              <FiUsers className="w-3.5 h-3.5" /> Bulk Message
            </button>
            <button
              onClick={openTemplatesModal}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors hover:bg-gray-50"
              style={{ border: '1px solid #e5e7eb', color: '#374151' }}
            >
              <FiFileText className="w-3.5 h-3.5" /> Templates
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <p className="text-sm text-gray-400 text-center py-12">Loading...</p>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <FiMessageCircle className="w-9 h-9 text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-500">No conversations yet</p>
              <p className="text-xs text-gray-400 mt-1">Messages customers send will show up here automatically.</p>
            </div>
          ) : (
            conversations.map((c) => {
              const isSelected = selectedPhone === c.phone;
              return (
                <button
                  key={c.phone}
                  onClick={() => openConversation(c.phone)}
                  className="w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors"
                  style={{
                    backgroundColor: isSelected ? '#F0FDF4' : 'transparent',
                    borderLeft: isSelected ? '3px solid #0C831F' : '3px solid transparent',
                    borderBottom: '1px solid #f3f4f6',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm"
                    style={{ backgroundColor: avatarColor(c.phone) }}
                  >
                    {initials(c.customerName, c.phone)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-gray-900 truncate">
                        {c.customerName || c.phone}
                      </span>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">{formatTime(c.lastMessageAt)}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{c.lastMessagePreview || '—'}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {c.unreadByAdmin > 0 && (
                        <span
                          className="text-white text-[10px] font-bold rounded-full px-1.5 min-w-[16px] h-4 flex items-center justify-center"
                          style={{ backgroundColor: '#25D366' }}
                        >
                          {c.unreadByAdmin}
                        </span>
                      )}
                      {c.isBotPaused && (
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ color: '#c2410c', backgroundColor: '#fff7ed' }}
                        >
                          Manual
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 flex flex-col bg-[#F7F8FA]">
        {!selectedPhone ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <FiMessageCircle className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">Select a conversation</p>
            <p className="text-xs text-gray-400 mt-1">Pick someone from the list to see their messages</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm"
                  style={{ backgroundColor: avatarColor(selectedPhone) }}
                >
                  {initials(selectedConversation?.customerName, selectedPhone)}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{selectedConversation?.customerName || selectedPhone}</p>
                  <p className="text-xs text-gray-400">{selectedPhone}</p>
                </div>
              </div>
              <button
                onClick={toggleBotPause}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{
                  backgroundColor: selectedConversation?.isBotPaused ? '#f0fdf4' : '#fff7ed',
                  color: selectedConversation?.isBotPaused ? '#15803d' : '#c2410c',
                }}
              >
                {selectedConversation?.isBotPaused ? (
                  <><FiPlay className="w-3.5 h-3.5" /> Resume bot</>
                ) : (
                  <><FiPause className="w-3.5 h-3.5" /> Handling manually</>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
              {loadingMessages ? (
                <p className="text-sm text-gray-400 text-center">Loading...</p>
              ) : (
                messages.map((m) => (
                  <div key={m._id} className={`flex ${m.direction === 'out' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className="max-w-[65%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm"
                      style={{
                        backgroundColor: m.direction === 'out' ? (m.sentBy === 'admin' ? '#111827' : '#DCF8C6') : 'white',
                        color: m.direction === 'out' && m.sentBy === 'admin' ? 'white' : '#111827',
                        borderBottomRightRadius: m.direction === 'out' ? 4 : 16,
                        borderBottomLeftRadius: m.direction === 'in' ? 4 : 16,
                      }}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
                      <div className="flex items-center gap-1.5 mt-1 justify-end">
                        <span className="text-[10px] opacity-60">{formatTime(m.createdAt)}</span>
                        {m.direction === 'out' && (
                          <span className="text-[10px] opacity-60 capitalize">· {m.sentBy}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2 bg-white">
              <button
                onClick={openTemplatePicker}
                title="Send a template (needed outside the 24-hour reply window)"
                className="p-2.5 rounded-full flex-shrink-0 hover:bg-gray-50"
                style={{ border: '1px solid #e5e7eb', color: '#374151' }}
              >
                <FiFileText className="w-4 h-4" />
              </button>
              <input
                className="flex-1 border border-gray-200 bg-gray-50 rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-200 focus:border-green-400 focus:bg-white outline-none transition-colors"
                placeholder="Type a message..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={sending}
              />
              <button
                onClick={handleSend}
                disabled={sending || !draft.trim()}
                className="p-2.5 rounded-full flex-shrink-0 transition-opacity"
                style={{ backgroundColor: '#0C831F', color: 'white', opacity: sending || !draft.trim() ? 0.4 : 1 }}
              >
                <FiSend className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>

      {showTemplatesModal && (
        <Modal title="Message Templates" onClose={() => setShowTemplatesModal(false)} maxWidth="640px">
          <div className="space-y-4">
            {templateError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                {templateError}
              </div>
            )}

            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: 'black', color: 'white' }}
              >
                <FiPlus className="w-4 h-4" /> New Template
              </button>
            ) : (
              <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Name (lowercase, no spaces)</label>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      placeholder="e.g. order_confirmation"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={templateForm.category}
                      onChange={(e) => setTemplateForm((p) => ({ ...p, category: e.target.value }))}
                    >
                      <option value="UTILITY">Utility (order updates, reminders)</option>
                      <option value="MARKETING">Marketing (offers, promotions)</option>
                      <option value="AUTHENTICATION">Authentication (OTP)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Language</label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={templateForm.language}
                    onChange={(e) => setTemplateForm((p) => ({ ...p, language: e.target.value }))}
                  >
                    <option value="en_US">English</option>
                    <option value="hi">Hindi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Message body — use {'{{1}}'}, {'{{2}}'}... for variables (e.g. customer name, order ID)
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    rows={4}
                    placeholder="Hi {{1}}, your order {{2}} has been shipped!"
                    value={templateForm.bodyText}
                    onChange={(e) => setTemplateForm((p) => ({ ...p, bodyText: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Buttons (optional, up to 3) — a Quick Reply button named "View Catalog" automatically shows products when tapped
                  </label>
                  <div className="space-y-2">
                    {templateForm.buttons.map((button, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <select
                          className="border border-gray-300 rounded-md px-2 py-2 text-sm"
                          value={button.type}
                          onChange={(e) => updateTemplateButton(index, 'type', e.target.value)}
                        >
                          <option value="QUICK_REPLY">Quick Reply</option>
                          <option value="URL">Website Link</option>
                        </select>
                        <input
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                          placeholder="Button text"
                          value={button.text}
                          onChange={(e) => updateTemplateButton(index, 'text', e.target.value)}
                        />
                        {button.type === 'URL' && (
                          <input
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                            placeholder="https://..."
                            value={button.url}
                            onChange={(e) => updateTemplateButton(index, 'url', e.target.value)}
                          />
                        )}
                        <button
                          onClick={() => removeTemplateButton(index)}
                          className="px-2 py-2 text-sm text-red-600"
                          title="Remove button"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  {templateForm.buttons.length < 3 && (
                    <button
                      onClick={addTemplateButton}
                      className="mt-2 flex items-center gap-1 text-xs font-medium text-gray-700"
                    >
                      <FiPlus className="w-3 h-3" /> Add button
                    </button>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => { setShowCreateForm(false); setTemplateForm(emptyTemplateForm); setTemplateError(''); }}
                    className="px-3 py-1.5 rounded-md text-sm"
                    style={{ border: '1px solid #d1d5db', color: '#374151' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTemplate}
                    disabled={savingTemplate}
                    className="px-4 py-1.5 rounded-md text-sm font-medium"
                    style={{ backgroundColor: 'black', color: 'white', opacity: savingTemplate ? 0.5 : 1 }}
                  >
                    {savingTemplate ? 'Submitting...' : 'Submit for approval'}
                  </button>
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Existing templates</p>
              {loadingTemplates ? (
                <p className="text-sm text-gray-400">Loading...</p>
              ) : templates.length === 0 ? (
                <p className="text-sm text-gray-400">No templates yet</p>
              ) : (
                <div className="space-y-2">
                  {templates.map((t) => {
                    const badge = statusBadge(t.status);
                    const Icon = badge.icon;
                    return (
                      <div key={t.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-gray-900">{t.name}</span>
                          <span
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ color: badge.color, backgroundColor: badge.bg }}
                          >
                            <Icon className="w-3 h-3" /> {t.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{t.category} · {t.language}</p>
                        <p className="text-sm text-gray-700 mt-1">
                          {t.components?.find((c) => c.type === 'BODY')?.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {showTemplatePicker && (
        <Modal title="Send a Template" onClose={() => setShowTemplatePicker(false)} maxWidth="520px">
          <div className="space-y-4">
            {!pickedTemplate ? (
              loadingTemplates ? (
                <p className="text-sm text-gray-400">Loading...</p>
              ) : templates.filter((t) => t.status === 'APPROVED').length === 0 ? (
                <p className="text-sm text-gray-500">No approved templates yet. Create one from the Templates button and wait for Meta's approval.</p>
              ) : (
                <div className="space-y-2">
                  {templates.filter((t) => t.status === 'APPROVED').map((t) => (
                    <button
                      key={t.id}
                      onClick={() => selectTemplateToSend(t)}
                      className="w-full text-left border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                    >
                      <p className="font-medium text-sm text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{t.components?.find((c) => c.type === 'BODY')?.text}</p>
                    </button>
                  ))}
                </div>
              )
            ) : (
              <div className="space-y-3">
                <button onClick={() => setPickedTemplate(null)} className="text-xs text-gray-500">← Back to list</button>
                <p className="text-sm font-medium text-gray-900">{pickedTemplate.name}</p>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  {pickedTemplate.components?.find((c) => c.type === 'BODY')?.text}
                </p>
                {templateParams.map((val, i) => (
                  <div key={i}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{`{{${i + 1}}}`}</label>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={val}
                      onChange={(e) => setTemplateParams((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))}
                    />
                  </div>
                ))}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowTemplatePicker(false)}
                    className="px-3 py-1.5 rounded-md text-sm"
                    style={{ border: '1px solid #d1d5db', color: '#374151' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendTemplate}
                    disabled={sending || templateParams.some((v) => !v.trim())}
                    className="px-4 py-1.5 rounded-md text-sm font-medium"
                    style={{ backgroundColor: 'black', color: 'white', opacity: sending || templateParams.some((v) => !v.trim()) ? 0.5 : 1 }}
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {showBulkModal && (
        <Modal title="Bulk WhatsApp Message" onClose={() => setShowBulkModal(false)} maxWidth="640px">
          <div className="space-y-4">
            {bulkError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                {bulkError}
              </div>
            )}

            {bulkResult ? (
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Sent to {bulkResult.filter((r) => r.success).length}/{bulkResult.length} recipients
                </p>
                <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {bulkResult.map((r) => (
                    <div key={r.phone} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span>{r.phone}</span>
                      {r.success ? (
                        <span className="text-green-600 flex items-center gap-1 text-xs"><FiCheck className="w-3.5 h-3.5" /> Sent</span>
                      ) : (
                        <span className="text-red-600 flex items-center gap-1 text-xs"><FiAlertCircle className="w-3.5 h-3.5" /> {r.error || 'Failed'}</span>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="mt-4 px-4 py-1.5 rounded-md text-sm font-medium"
                  style={{ backgroundColor: 'black', color: 'white' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-gray-700">
                      Recipients ({bulkSelected.length} selected)
                    </label>
                    <button onClick={toggleBulkSelectAll} className="text-xs font-medium text-gray-600 underline">
                      {bulkSelected.length === conversations.length ? 'Deselect all' : 'Select all'}
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {conversations.length === 0 ? (
                      <p className="text-sm text-gray-400 px-3 py-4 text-center">No conversations yet</p>
                    ) : (
                      conversations.map((c) => (
                        <label key={c.phone} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                          <input type="checkbox" checked={bulkSelected.includes(c.phone)} onChange={() => toggleBulkRecipient(c.phone)} />
                          <span className="truncate">{c.customerName || c.phone}</span>
                          <span className="ml-auto text-xs text-gray-400">{c.phone}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Message type</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBulkMode('template')}
                      className="flex-1 px-3 py-2 rounded-lg text-sm font-medium"
                      style={{
                        backgroundColor: bulkMode === 'template' ? 'black' : 'white',
                        color: bulkMode === 'template' ? 'white' : '#374151',
                        border: bulkMode === 'template' ? '1px solid black' : '1px solid #d1d5db',
                      }}
                    >
                      Template (safe for anyone)
                    </button>
                    <button
                      onClick={() => setBulkMode('text')}
                      className="flex-1 px-3 py-2 rounded-lg text-sm font-medium"
                      style={{
                        backgroundColor: bulkMode === 'text' ? 'black' : 'white',
                        color: bulkMode === 'text' ? 'white' : '#374151',
                        border: bulkMode === 'text' ? '1px solid black' : '1px solid #d1d5db',
                      }}
                    >
                      Free text (recent chats only)
                    </button>
                  </div>
                  {bulkMode === 'text' && (
                    <p className="text-xs text-amber-600 mt-1.5">
                      WhatsApp only delivers free text to customers who messaged in the last 24 hours — anyone outside that window won't receive it. Use a template to reach everyone reliably.
                    </p>
                  )}
                </div>

                {bulkMode === 'text' ? (
                  <textarea
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    rows={4}
                    placeholder="Type your message..."
                    value={bulkBody}
                    onChange={(e) => setBulkBody(e.target.value)}
                  />
                ) : !bulkTemplate ? (
                  loadingTemplates ? (
                    <p className="text-sm text-gray-400">Loading templates...</p>
                  ) : templates.filter((t) => t.status === 'APPROVED').length === 0 ? (
                    <p className="text-sm text-gray-500">No approved templates yet. Create one from the Templates button and wait for Meta's approval.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {templates.filter((t) => t.status === 'APPROVED').map((t) => (
                        <button
                          key={t.id}
                          onClick={() => selectBulkTemplate(t)}
                          className="w-full text-left border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                        >
                          <p className="font-medium text-sm text-gray-900">{t.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{t.components?.find((c) => c.type === 'BODY')?.text}</p>
                        </button>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="space-y-3 border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{bulkTemplate.name}</p>
                      <button onClick={() => setBulkTemplate(null)} className="text-xs text-gray-500">Change</button>
                    </div>
                    <p className="text-sm text-gray-600 bg-white rounded-lg p-3">
                      {bulkTemplate.components?.find((c) => c.type === 'BODY')?.text}
                    </p>
                    {bulkTemplateParams.length > 0 && (
                      <p className="text-xs text-gray-500">Same values will be used for every recipient.</p>
                    )}
                    {bulkTemplateParams.map((val, i) => (
                      <div key={i}>
                        <label className="block text-xs font-medium text-gray-700 mb-1">{`{{${i + 1}}}`}</label>
                        <input
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          value={val}
                          onChange={(e) => setBulkTemplateParams((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setShowBulkModal(false)}
                    className="px-3 py-1.5 rounded-md text-sm"
                    style={{ border: '1px solid #d1d5db', color: '#374151' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkSend}
                    disabled={bulkSending}
                    className="px-4 py-1.5 rounded-md text-sm font-medium"
                    style={{ backgroundColor: 'black', color: 'white', opacity: bulkSending ? 0.5 : 1 }}
                  >
                    {bulkSending ? `Sending...` : `Send to ${bulkSelected.length}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default WhatsappInboxPage;
