import { useEffect, useRef, useState, useCallback } from "react";
import { FiSend, FiPlay, FiPause, FiMessageCircle, FiFileText, FiPlus, FiX, FiCheck, FiClock, FiAlertCircle } from "react-icons/fi";
import Modal from "../../components/common/Modal";

const BASE_URL = `${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.gmkart.com/proxy'}/api`;

const emptyTemplateForm = { name: '', category: 'UTILITY', language: 'en_US', bodyText: '' };

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

  const handleCreateTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.bodyText.trim()) {
      setTemplateError('Name and message body are required');
      return;
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

  return (
    <div className="h-[calc(100vh-80px)] flex bg-white rounded-xl shadow overflow-hidden">
      {/* Conversation list */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FiMessageCircle className="w-5 h-5" /> WhatsApp Inbox
          </h2>
          <button
            onClick={openTemplatesModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium"
            style={{ border: '1px solid #d1d5db', color: '#374151' }}
          >
            <FiFileText className="w-3.5 h-3.5" /> Templates
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <p className="text-sm text-gray-400 text-center py-8">Loading...</p>
          ) : conversations.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No conversations yet</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.phone}
                onClick={() => openConversation(c.phone)}
                className="w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                style={{ backgroundColor: selectedPhone === c.phone ? '#f3f4f6' : 'transparent' }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-gray-900 truncate">
                    {c.customerName || c.phone}
                  </span>
                  {c.unreadByAdmin > 0 && (
                    <span className="bg-green-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                      {c.unreadByAdmin}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{c.phone}</p>
                <p className="text-xs text-gray-500 truncate mt-1">{c.lastMessagePreview || '—'}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-gray-400">{formatTime(c.lastMessageAt)}</span>
                  {c.isBotPaused && (
                    <span className="text-[10px] font-medium text-orange-600">Manual</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 flex flex-col">
        {!selectedPhone ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Select a conversation to view messages
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{selectedConversation?.customerName || selectedPhone}</p>
                <p className="text-xs text-gray-400">{selectedPhone}</p>
              </div>
              <button
                onClick={toggleBotPause}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium"
                style={{
                  border: '1px solid #d1d5db',
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

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {loadingMessages ? (
                <p className="text-sm text-gray-400 text-center">Loading...</p>
              ) : (
                messages.map((m) => (
                  <div key={m._id} className={`flex ${m.direction === 'out' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className="max-w-[70%] rounded-lg px-3 py-2 text-sm"
                      style={{
                        backgroundColor: m.direction === 'out' ? (m.sentBy === 'admin' ? '#111827' : '#dcfce7') : 'white',
                        color: m.direction === 'out' && m.sentBy === 'admin' ? 'white' : '#111827',
                        border: m.direction === 'in' ? '1px solid #e5e7eb' : 'none',
                      }}
                    >
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <div className="flex items-center gap-2 mt-1">
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

            <div className="p-3 border-t border-gray-200 flex items-center gap-2">
              <button
                onClick={openTemplatePicker}
                title="Send a template (needed outside the 24-hour reply window)"
                className="p-2.5 rounded-lg flex-shrink-0"
                style={{ border: '1px solid #d1d5db', color: '#374151' }}
              >
                <FiFileText className="w-4 h-4" />
              </button>
              <input
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                placeholder="Type a message..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={sending}
              />
              <button
                onClick={handleSend}
                disabled={sending || !draft.trim()}
                className="p-2.5 rounded-lg"
                style={{ backgroundColor: 'black', color: 'white', opacity: sending || !draft.trim() ? 0.5 : 1 }}
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
    </div>
  );
};

export default WhatsappInboxPage;
