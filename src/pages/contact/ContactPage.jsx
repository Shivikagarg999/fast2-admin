import { useEffect, useState, useCallback } from "react";
import {
  FiMail,
  FiSearch,
  FiTrash2,
  FiEye,
  FiX,
  FiDownload,
  FiRefreshCw,
  FiFilter,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiUser,
  FiPhone,
  FiTag,
  FiMessageSquare,
  FiBarChart2,
} from "react-icons/fi";
import usePermissions from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../config/permissions";

const BASE_URL = import.meta.env.VITE_BASE_URL || "https://admin.fast2.in/proxy";

const showToast = (message, type = "success") => {
  const toast = document.createElement("div");
  toast.style.cssText = `
    position: fixed; top: 20px; right: 20px;
    padding: 12px 20px; border-radius: 8px; color: white; font-weight: 500;
    z-index: 9999; background-color: ${
      type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#3b82f6"
    };
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); transition: all 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    setTimeout(() => { if (document.body.contains(toast)) document.body.removeChild(toast); }, 300);
  }, 3000);
};

const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }
  return res;
};

const STATUS_COLORS = {
  pending: { bg: "#fef3c7", text: "#92400e", label: "Pending" },
  contacted: { bg: "#dbeafe", text: "#1e40af", label: "Contacted" },
  resolved: { bg: "#d1fae5", text: "#065f46", label: "Resolved" },
};

const PRIORITY_COLORS = {
  low: { bg: "#f3f4f6", text: "#374151", label: "Low" },
  medium: { bg: "#fef3c7", text: "#92400e", label: "Medium" },
  high: { bg: "#fee2e2", text: "#991b1b", label: "High" },
};

const SUBJECTS = [
  "General Inquiry",
  "Product Support",
  "Order Issue",
  "Delivery Problem",
  "Return/Refund",
  "Partnership Inquiry",
  "Feedback",
  "Other",
];

const Badge = ({ color, label }) => (
  <span style={{
    backgroundColor: color.bg, color: color.text,
    padding: "2px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "600",
    whiteSpace: "nowrap",
  }}>
    {label}
  </span>
);

const StatCard = ({ icon, label, value, color }) => (
  <div style={{
    backgroundColor: "#fff", borderRadius: "10px", padding: "16px 20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: "14px",
  }} className="dark:bg-gray-800">
    <div style={{ backgroundColor: color + "20", borderRadius: "8px", padding: "10px", flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "2px" }} className="dark:text-gray-400">{label}</p>
      <p style={{ fontSize: "22px", fontWeight: "700", color: "#111827" }} className="dark:text-white">{value ?? "—"}</p>
    </div>
  </div>
);

export default function ContactPage() {
  const { hasPermission } = usePermissions();

  // List state
  const [contacts, setContacts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "", status: "", priority: "", subject: "", startDate: "", endDate: "",
    page: 1, limit: 20, sortBy: "createdAt", sortOrder: "desc",
  });

  // Stats
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showStats, setShowStats] = useState(true);

  // Detail / edit modal
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editForm, setEditForm] = useState({ status: "", priority: "", response: "", tags: "" });
  const [saving, setSaving] = useState(false);

  // Export
  const [exporting, setExporting] = useState(false);

  // ── Fetch list ──────────────────────────────────────────────────────────────
  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v !== "") params.set(k, v); });
      const res = await authFetch(`${BASE_URL}/api/contact/admin/contacts?${params}`);
      const data = await res.json();
      setContacts(data.data || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 20, pages: 1 });
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  // ── Fetch stats ──────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await authFetch(`${BASE_URL}/api/contact/admin/stats`);
      const data = await res.json();
      setStats(data.data || null);
    } catch (e) {
      console.error("Stats error:", e.message);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ── Open detail ──────────────────────────────────────────────────────────────
  const openDetail = async (contact) => {
    setSelected({ ...contact, _loading: true });
    setDetailLoading(true);
    try {
      const res = await authFetch(`${BASE_URL}/api/contact/admin/contacts/${contact._id}`);
      const data = await res.json();
      const c = data.data || contact;
      setSelected(c);
      setEditForm({
        status: c.status || "pending",
        priority: c.priority || "low",
        response: c.response || "",
        tags: (c.tags || []).join(", "),
      });
    } catch (e) {
      showToast(e.message, "error");
      setSelected(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => { setSelected(null); };

  // ── Update contact ────────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!selected) return;
    if (editForm.status === "resolved" && !editForm.response.trim()) {
      showToast("A response is required when resolving a contact.", "error");
      return;
    }
    setSaving(true);
    try {
      const body = {
        status: editForm.status,
        priority: editForm.priority,
        ...(editForm.response.trim() && { response: editForm.response.trim() }),
        ...(editForm.tags.trim() && { tags: editForm.tags.split(",").map(t => t.trim()).filter(Boolean) }),
      };
      const res = await authFetch(`${BASE_URL}/api/contact/admin/contacts/${selected._id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      showToast("Contact updated successfully");
      closeDetail();
      fetchContacts();
      fetchStats();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm("Permanently delete this contact submission?")) return;
    try {
      await authFetch(`${BASE_URL}/api/contact/admin/contacts/${id}`, { method: "DELETE" });
      showToast("Contact deleted");
      if (selected?._id === id) closeDetail();
      fetchContacts();
      fetchStats();
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  // ── Export CSV ────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/contact/admin/export?${params}`, {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "contacts_export.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setExporting(false);
    }
  };

  // ── Inline status change ──────────────────────────────────────────────────────
  const [statusUpdating, setStatusUpdating] = useState(null); // contact _id being updated

  const handleInlineStatusChange = async (contactId, newStatus, e) => {
    e.stopPropagation();
    setStatusUpdating(contactId);
    try {
      await authFetch(`${BASE_URL}/api/contact/admin/contacts/${contactId}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      setContacts(prev => prev.map(c => c._id === contactId ? { ...c, status: newStatus } : c));
      fetchStats();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setStatusUpdating(null);
    }
  };

  // ── Filter helpers ────────────────────────────────────────────────────────────
  const setFilter = (key, value) => setFilters(f => ({ ...f, [key]: value, page: 1 }));
  const setPage = (p) => setFilters(f => ({ ...f, page: p }));
  const resetFilters = () => setFilters({
    search: "", status: "", priority: "", subject: "", startDate: "", endDate: "",
    page: 1, limit: 20, sortBy: "createdAt", sortOrder: "desc",
  });

  const inputStyle = {
    border: "1px solid #d1d5db", borderRadius: "7px", padding: "7px 10px",
    fontSize: "13px", color: "#374151", backgroundColor: "#fff", outline: "none",
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ backgroundColor: "#eff6ff", borderRadius: "10px", padding: "10px" }}>
            <FiMail style={{ width: "22px", height: "22px", color: "#2563eb" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#111827", margin: 0 }} className="dark:text-white">
              Contact Submissions
            </h1>
            <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }} className="dark:text-gray-400">
              {pagination.total} total submissions
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => setShowStats(s => !s)}
            style={{ ...inputStyle, display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
          >
            <FiBarChart2 style={{ width: "14px", height: "14px" }} />
            {showStats ? "Hide Stats" : "Show Stats"}
          </button>
          {hasPermission(PERMISSIONS.CONTACTS_VIEW) && (
            <button
              onClick={handleExport}
              disabled={exporting}
              style={{
                display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px",
                backgroundColor: exporting ? "#9ca3af" : "#2563eb", color: "#fff", border: "none",
                borderRadius: "7px", fontSize: "13px", fontWeight: "500", cursor: exporting ? "not-allowed" : "pointer",
              }}
            >
              <FiDownload style={{ width: "14px", height: "14px" }} />
              {exporting ? "Exporting..." : "Export CSV"}
            </button>
          )}
          <button
            onClick={() => { fetchContacts(); fetchStats(); }}
            style={{ ...inputStyle, display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
          >
            <FiRefreshCw style={{ width: "14px", height: "14px" }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      {showStats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "14px", marginBottom: "24px" }}>
          <StatCard
            icon={<FiMail style={{ width: "18px", height: "18px", color: "#2563eb" }} />}
            label="Total" value={statsLoading ? "..." : stats?.counts?.total}
            color="#2563eb"
          />
          <StatCard
            icon={<FiClock style={{ width: "18px", height: "18px", color: "#d97706" }} />}
            label="Pending" value={statsLoading ? "..." : stats?.counts?.pending}
            color="#d97706"
          />
          <StatCard
            icon={<FiUser style={{ width: "18px", height: "18px", color: "#2563eb" }} />}
            label="Contacted" value={statsLoading ? "..." : stats?.counts?.contacted}
            color="#2563eb"
          />
          <StatCard
            icon={<FiCheckCircle style={{ width: "18px", height: "18px", color: "#10b981" }} />}
            label="Resolved" value={statsLoading ? "..." : stats?.counts?.resolved}
            color="#10b981"
          />
          <StatCard
            icon={<FiAlertCircle style={{ width: "18px", height: "18px", color: "#ef4444" }} />}
            label="Unresolved" value={statsLoading ? "..." : stats?.counts?.unresolved}
            color="#ef4444"
          />
          {stats?.responseTime?.avgResponseHours != null && (
            <StatCard
              icon={<FiClock style={{ width: "18px", height: "18px", color: "#8b5cf6" }} />}
              label="Avg Response (hrs)" value={statsLoading ? "..." : stats.responseTime.avgResponseHours?.toFixed(1)}
              color="#8b5cf6"
            />
          )}
        </div>
      )}

      {/* Filters */}
      <div style={{
        backgroundColor: "#fff", borderRadius: "10px", padding: "16px 20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: "20px",
      }} className="dark:bg-gray-800">
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <FiFilter style={{ width: "14px", height: "14px", color: "#6b7280" }} />
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }} className="dark:text-gray-300">Filters</span>
          <button onClick={resetFilters} style={{ marginLeft: "auto", fontSize: "12px", color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}>
            Reset
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
            <FiSearch style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", width: "14px", height: "14px" }} />
            <input
              type="text"
              placeholder="Search name, email, subject..."
              value={filters.search}
              onChange={e => setFilter("search", e.target.value)}
              style={{ ...inputStyle, width: "100%", paddingLeft: "30px", boxSizing: "border-box" }}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <select value={filters.status} onChange={e => setFilter("status", e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="contacted">Contacted</option>
            <option value="resolved">Resolved</option>
          </select>
          <select value={filters.priority} onChange={e => setFilter("priority", e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select value={filters.subject} onChange={e => setFilter("subject", e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="">All Subjects</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="date" value={filters.startDate} onChange={e => setFilter("startDate", e.target.value)}
            style={{ ...inputStyle }} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" title="Start date" />
          <input type="date" value={filters.endDate} onChange={e => setFilter("endDate", e.target.value)}
            style={{ ...inputStyle }} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" title="End date" />
        </div>
      </div>

      {/* Table */}
      <div style={{
        backgroundColor: "#fff", borderRadius: "10px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden",
      }} className="dark:bg-gray-800">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }} className="dark:bg-gray-700">
                {["Name", "Email", "Phone", "Subject", "Status", "Priority", "Date", "Actions"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: "600", color: "#374151", whiteSpace: "nowrap" }} className="dark:text-gray-300">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
                    Loading...
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
                    No contact submissions found.
                  </td>
                </tr>
              ) : contacts.map((c, i) => (
                <tr
                  key={c._id}
                  style={{ borderBottom: "1px solid #f3f4f6", cursor: "pointer", transition: "background 0.15s" }}
                  className="dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => openDetail(c)}
                >
                  <td style={{ padding: "10px 14px", fontWeight: "500", color: "#111827" }} className="dark:text-white">
                    {c.name}
                  </td>
                  <td style={{ padding: "10px 14px", color: "#374151" }} className="dark:text-gray-300">
                    {c.email}
                  </td>
                  <td style={{ padding: "10px 14px", color: "#374151" }} className="dark:text-gray-300">
                    {c.phone}
                  </td>
                  <td style={{ padding: "10px 14px", color: "#374151", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} className="dark:text-gray-300">
                    {c.subject}
                  </td>
                  <td style={{ padding: "6px 14px" }} onClick={e => e.stopPropagation()}>
                    {hasPermission(PERMISSIONS.CONTACTS_EDIT) ? (
                      <select
                        value={c.status}
                        disabled={statusUpdating === c._id}
                        onChange={e => handleInlineStatusChange(c._id, e.target.value, e)}
                        style={{
                          appearance: "none",
                          border: "none",
                          borderRadius: "12px",
                          padding: "3px 10px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: statusUpdating === c._id ? "not-allowed" : "pointer",
                          backgroundColor: STATUS_COLORS[c.status]?.bg || "#f3f4f6",
                          color: STATUS_COLORS[c.status]?.text || "#374151",
                          outline: "none",
                          opacity: statusUpdating === c._id ? 0.6 : 1,
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="contacted">Contacted</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    ) : (
                      <Badge color={STATUS_COLORS[c.status] || STATUS_COLORS.pending} label={STATUS_COLORS[c.status]?.label || c.status} />
                    )}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <Badge color={PRIORITY_COLORS[c.priority] || PRIORITY_COLORS.low} label={PRIORITY_COLORS[c.priority]?.label || c.priority} />
                  </td>
                  <td style={{ padding: "10px 14px", color: "#6b7280", whiteSpace: "nowrap" }} className="dark:text-gray-400">
                    {new Date(c.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={e => { e.stopPropagation(); openDetail(c); }}
                        style={{ padding: "4px", borderRadius: "4px", border: "none", background: "none", color: "#2563eb", cursor: "pointer" }}
                        title="View"
                      >
                        <FiEye style={{ width: "15px", height: "15px" }} />
                      </button>
                      {hasPermission(PERMISSIONS.CONTACTS_DELETE) && (
                        <button
                          onClick={e => handleDelete(c._id, e)}
                          style={{ padding: "4px", borderRadius: "4px", border: "none", background: "none", color: "#ef4444", cursor: "pointer" }}
                          title="Delete"
                        >
                          <FiTrash2 style={{ width: "15px", height: "15px" }} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderTop: "1px solid #f3f4f6" }} className="dark:border-gray-700">
            <span style={{ fontSize: "13px", color: "#6b7280" }} className="dark:text-gray-400">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={() => setPage(pagination.page - 1)}
                disabled={pagination.page <= 1}
                style={{
                  padding: "5px 12px", borderRadius: "6px", border: "1px solid #d1d5db",
                  fontSize: "13px", cursor: pagination.page <= 1 ? "not-allowed" : "pointer",
                  opacity: pagination.page <= 1 ? 0.5 : 1, background: "#fff",
                }}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                Prev
              </button>
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const p = Math.max(1, pagination.page - 2) + i;
                if (p > pagination.pages) return null;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    style={{
                      padding: "5px 10px", borderRadius: "6px", fontSize: "13px", cursor: "pointer",
                      border: p === pagination.page ? "none" : "1px solid #d1d5db",
                      backgroundColor: p === pagination.page ? "#2563eb" : "#fff",
                      color: p === pagination.page ? "#fff" : "#374151",
                    }}
                    className={p !== pagination.page ? "dark:bg-gray-700 dark:border-gray-600 dark:text-white" : ""}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                style={{
                  padding: "5px 12px", borderRadius: "6px", border: "1px solid #d1d5db",
                  fontSize: "13px", cursor: pagination.page >= pagination.pages ? "not-allowed" : "pointer",
                  opacity: pagination.page >= pagination.pages ? 0.5 : 1, background: "#fff",
                }}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div style={{
          position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: "16px",
        }}>
          <div style={{
            backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto",
          }} className="dark:bg-gray-800">
            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #f3f4f6" }} className="dark:border-gray-700">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ backgroundColor: "#eff6ff", borderRadius: "8px", padding: "8px" }}>
                  <FiMail style={{ width: "18px", height: "18px", color: "#2563eb" }} />
                </div>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#111827", margin: 0 }} className="dark:text-white">
                    Contact Detail
                  </h2>
                  {selected.referenceNumber && (
                    <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }} className="dark:text-gray-400">
                      Ref: {selected.referenceNumber}
                    </p>
                  )}
                </div>
              </div>
              <button onClick={closeDetail} style={{ padding: "4px", border: "none", background: "none", color: "#9ca3af", cursor: "pointer" }}>
                <FiX style={{ width: "20px", height: "20px" }} />
              </button>
            </div>

            {detailLoading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading details...</div>
            ) : (
              <div style={{ padding: "24px" }}>
                {/* Submitter info */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                  <div style={{ backgroundColor: "#f9fafb", borderRadius: "8px", padding: "12px" }} className="dark:bg-gray-700">
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <FiUser style={{ width: "13px", height: "13px", color: "#6b7280" }} />
                      <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: "500" }} className="dark:text-gray-400">NAME</span>
                    </div>
                    <p style={{ fontSize: "14px", fontWeight: "500", color: "#111827", margin: 0 }} className="dark:text-white">{selected.name}</p>
                  </div>
                  <div style={{ backgroundColor: "#f9fafb", borderRadius: "8px", padding: "12px" }} className="dark:bg-gray-700">
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <FiMail style={{ width: "13px", height: "13px", color: "#6b7280" }} />
                      <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: "500" }} className="dark:text-gray-400">EMAIL</span>
                    </div>
                    <p style={{ fontSize: "14px", fontWeight: "500", color: "#111827", margin: 0, wordBreak: "break-all" }} className="dark:text-white">{selected.email}</p>
                  </div>
                  <div style={{ backgroundColor: "#f9fafb", borderRadius: "8px", padding: "12px" }} className="dark:bg-gray-700">
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <FiPhone style={{ width: "13px", height: "13px", color: "#6b7280" }} />
                      <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: "500" }} className="dark:text-gray-400">PHONE</span>
                    </div>
                    <p style={{ fontSize: "14px", fontWeight: "500", color: "#111827", margin: 0 }} className="dark:text-white">{selected.phone}</p>
                  </div>
                  <div style={{ backgroundColor: "#f9fafb", borderRadius: "8px", padding: "12px" }} className="dark:bg-gray-700">
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <FiTag style={{ width: "13px", height: "13px", color: "#6b7280" }} />
                      <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: "500" }} className="dark:text-gray-400">SUBJECT</span>
                    </div>
                    <p style={{ fontSize: "14px", fontWeight: "500", color: "#111827", margin: 0 }} className="dark:text-white">{selected.subject}</p>
                  </div>
                </div>

                {/* Message */}
                <div style={{ backgroundColor: "#f9fafb", borderRadius: "8px", padding: "14px", marginBottom: "20px" }} className="dark:bg-gray-700">
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <FiMessageSquare style={{ width: "13px", height: "13px", color: "#6b7280" }} />
                    <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: "500" }} className="dark:text-gray-400">MESSAGE</span>
                  </div>
                  <p style={{ fontSize: "14px", color: "#374151", margin: 0, lineHeight: "1.6" }} className="dark:text-gray-300">{selected.message}</p>
                </div>

                {/* Current badges + meta */}
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "20px" }}>
                  <Badge color={STATUS_COLORS[selected.status] || STATUS_COLORS.pending} label={STATUS_COLORS[selected.status]?.label || selected.status} />
                  <Badge color={PRIORITY_COLORS[selected.priority] || PRIORITY_COLORS.low} label={PRIORITY_COLORS[selected.priority]?.label || selected.priority} />
                  {selected.source && (
                    <span style={{ fontSize: "11px", color: "#6b7280", backgroundColor: "#f3f4f6", padding: "2px 8px", borderRadius: "12px" }} className="dark:bg-gray-600 dark:text-gray-300">
                      {selected.source}
                    </span>
                  )}
                  <span style={{ fontSize: "12px", color: "#9ca3af", marginLeft: "auto" }}>
                    {new Date(selected.createdAt).toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Existing tags */}
                {selected.tags?.length > 0 && (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
                    {selected.tags.map(tag => (
                      <span key={tag} style={{ fontSize: "11px", backgroundColor: "#eff6ff", color: "#1d4ed8", padding: "2px 8px", borderRadius: "12px" }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Existing response */}
                {selected.response && (
                  <div style={{ backgroundColor: "#f0fdf4", borderRadius: "8px", padding: "14px", marginBottom: "20px", borderLeft: "3px solid #10b981" }}>
                    <p style={{ fontSize: "11px", color: "#065f46", fontWeight: "600", marginBottom: "6px" }}>ADMIN RESPONSE</p>
                    <p style={{ fontSize: "13px", color: "#374151", margin: 0, lineHeight: "1.6" }}>{selected.response}</p>
                    {selected.respondedAt && (
                      <p style={{ fontSize: "11px", color: "#6b7280", marginTop: "6px", marginBottom: 0 }}>
                        {new Date(selected.respondedAt).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                )}

                {/* Edit form */}
                {hasPermission(PERMISSIONS.CONTACTS_EDIT) && (
                  <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "20px" }} className="dark:border-gray-700">
                    <p style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "14px" }} className="dark:text-gray-300">
                      Update Contact
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "#374151", marginBottom: "4px" }} className="dark:text-gray-400">
                          Status
                        </label>
                        <select
                          value={editForm.status}
                          onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                          style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          <option value="pending">Pending</option>
                          <option value="contacted">Contacted</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "#374151", marginBottom: "4px" }} className="dark:text-gray-400">
                          Priority
                        </label>
                        <select
                          value={editForm.priority}
                          onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))}
                          style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ marginBottom: "12px" }}>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "#374151", marginBottom: "4px" }} className="dark:text-gray-400">
                        Tags <span style={{ fontWeight: "400", color: "#9ca3af" }}>(comma-separated, merged with existing)</span>
                      </label>
                      <input
                        type="text"
                        value={editForm.tags}
                        onChange={e => setEditForm(f => ({ ...f, tags: e.target.value }))}
                        placeholder="e.g. urgent, refund, vip"
                        style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div style={{ marginBottom: "16px" }}>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "#374151", marginBottom: "4px" }} className="dark:text-gray-400">
                        Response {editForm.status === "resolved" && <span style={{ color: "#ef4444" }}>*</span>}
                      </label>
                      <textarea
                        rows={4}
                        value={editForm.response}
                        onChange={e => setEditForm(f => ({ ...f, response: e.target.value }))}
                        placeholder="Write your response to the user..."
                        style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical" }}
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        onClick={handleUpdate}
                        disabled={saving}
                        style={{
                          flex: 1, padding: "10px", backgroundColor: saving ? "#93c5fd" : "#2563eb",
                          color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600",
                          fontSize: "14px", cursor: saving ? "not-allowed" : "pointer",
                        }}
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                      {hasPermission(PERMISSIONS.CONTACTS_DELETE) && (
                        <button
                          onClick={() => handleDelete(selected._id)}
                          style={{
                            padding: "10px 16px", backgroundColor: "#fee2e2", color: "#dc2626",
                            border: "none", borderRadius: "8px", fontWeight: "600", fontSize: "14px", cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      )}
                      <button
                        onClick={closeDetail}
                        style={{
                          padding: "10px 16px", backgroundColor: "#f3f4f6", color: "#374151",
                          border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer",
                        }}
                        className="dark:bg-gray-700 dark:text-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
