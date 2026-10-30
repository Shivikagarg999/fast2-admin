import { useEffect, useRef, useState, useCallback } from "react";
import { FiSend, FiPlay, FiPause, FiMessageCircle } from "react-icons/fi";

const BASE_URL = `${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.gmkart.com/proxy'}/api`;

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
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FiMessageCircle className="w-5 h-5" /> WhatsApp Inbox
          </h2>
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
    </div>
  );
};

export default WhatsappInboxPage;
