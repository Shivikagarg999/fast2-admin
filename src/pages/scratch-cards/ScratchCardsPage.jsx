import { useEffect, useState, useCallback } from "react";
import {
  FiGift,
  FiSearch,
  FiX,
  FiRefreshCw,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiTag,
  FiToggleLeft,
  FiToggleRight,
  FiCopy,
  FiInfo,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
} from "react-icons/fi";
import usePermissions from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../config/permissions";

const BASE_URL = import.meta.env.VITE_BASE_URL || "https://api.fast2.in";

const showToast = (message, type = "success") => {
  const toast = document.createElement("div");
  toast.style.cssText = `
    position: fixed; top: 20px; right: 20px;
    padding: 12px 20px; border-radius: 8px; color: white; font-weight: 500;
    z-index: 9999; background-color: ${
      type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#f59e0b"
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

// Reuse the same service path pattern as CouponCode.jsx
const couponRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  const url = `${BASE_URL}/api/admin/coupon${endpoint}`;
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
  return res.json();
};

const isEligible = (coupon) => {
  if (!coupon.isActive) return false;
  const now = new Date();
  if (coupon.startDate && new Date(coupon.startDate) > now) return false;
  if (coupon.endDate && new Date(coupon.endDate) < now) return false;
  return true;
};

const INITIAL_FORM = {
  code: "",
  description: "",
  discountType: "fixed",
  discountValue: "",
  minOrderAmount: "200",
  maxDiscountAmount: "",
  startDate: "",
  endDate: "",
  usageLimit: "",
  perUserLimit: "1",
  isActive: true,
};

const inputStyle = {
  border: "1px solid #d1d5db", borderRadius: "7px", padding: "8px 10px",
  fontSize: "13px", color: "#374151", backgroundColor: "#fff", outline: "none",
  width: "100%", boxSizing: "border-box",
};

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

export default function ScratchCardsPage() {
  const { hasPermission } = usePermissions();

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // "all" | "eligible" | "inactive" | "expired"
  const [copiedCode, setCopiedCode] = useState("");

  // Modal state (create / edit)
  const [modal, setModal] = useState(null); // null | "create" | "edit"
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Per-row loading (toggle / delete)
  const [rowLoading, setRowLoading] = useState(null);

  // ── Fetch coupons ─────────────────────────────────────────────────────────
  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const data = await couponRequest("/admin/coupons");
      setCoupons(data.coupons || data.data || data || []);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  // ── Open create modal ─────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingCoupon(null);
    setForm(INITIAL_FORM);
    setFormError("");
    setModal("create");
  };

  // ── Open edit modal ───────────────────────────────────────────────────────
  const openEdit = (coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code || "",
      description: coupon.description || "",
      discountType: coupon.discountType || "fixed",
      discountValue: coupon.discountValue != null ? String(coupon.discountValue) : "",
      minOrderAmount: coupon.minOrderAmount != null ? String(coupon.minOrderAmount) : "200",
      maxDiscountAmount: coupon.maxDiscountAmount != null ? String(coupon.maxDiscountAmount) : "",
      startDate: coupon.startDate ? coupon.startDate.slice(0, 10) : "",
      endDate: coupon.endDate ? coupon.endDate.slice(0, 10) : "",
      usageLimit: coupon.usageLimit != null ? String(coupon.usageLimit) : "",
      perUserLimit: coupon.perUserLimit != null ? String(coupon.perUserLimit) : "1",
      isActive: coupon.isActive ?? true,
    });
    setFormError("");
    setModal("edit");
  };

  const closeModal = () => { setModal(null); setEditingCoupon(null); };

  // ── Save (create or update) ───────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.code.trim()) { setFormError("Coupon code is required."); return; }
    if (!form.discountValue || Number(form.discountValue) <= 0) { setFormError("Discount value must be > 0."); return; }
    setFormError("");
    setFormSaving(true);
    try {
      const body = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : 1,
        isActive: form.isActive,
      };
      if (modal === "edit") {
        await couponRequest(`/admin/coupons/${editingCoupon._id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        showToast("Coupon updated successfully!");
      } else {
        await couponRequest("/admin/coupons", {
          method: "POST",
          body: JSON.stringify(body),
        });
        showToast("Coupon created and added to scratch card pool!");
      }
      closeModal();
      fetchCoupons();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setFormSaving(false);
    }
  };

  // ── Toggle active ─────────────────────────────────────────────────────────
  const handleToggle = async (coupon) => {
    setRowLoading(coupon._id + "_toggle");
    try {
      await couponRequest(`/admin/coupons/${coupon._id}/toggle`, { method: "PATCH" });
      setCoupons(prev =>
        prev.map(c => c._id === coupon._id ? { ...c, isActive: !c.isActive } : c)
      );
      showToast(`Coupon ${coupon.isActive ? "deactivated" : "activated"}`);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setRowLoading(null);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (coupon) => {
    if (!window.confirm(`Delete coupon "${coupon.code}"? This will remove it from the scratch card pool.`)) return;
    setRowLoading(coupon._id + "_delete");
    try {
      await couponRequest(`/admin/coupons/${coupon._id}`, { method: "DELETE" });
      setCoupons(prev => prev.filter(c => c._id !== coupon._id));
      showToast("Coupon deleted.");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setRowLoading(null);
    }
  };

  // ── Copy code ─────────────────────────────────────────────────────────────
  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      showToast("Copied!");
      setTimeout(() => setCopiedCode(""), 2000);
    } catch { showToast("Failed to copy", "error"); }
  };

  // ── Derived list ──────────────────────────────────────────────────────────
  const filtered = coupons.filter(c => {
    const matchSearch = !search ||
      c.code?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase());
    const now = new Date();
    const expired = c.endDate && new Date(c.endDate) < now;
    const eligible = isEligible(c);
    const matchFilter =
      filterStatus === "all" ||
      (filterStatus === "eligible" && eligible) ||
      (filterStatus === "inactive" && !c.isActive && !expired) ||
      (filterStatus === "expired" && expired);
    return matchSearch && matchFilter;
  });

  const eligibleCount = coupons.filter(isEligible).length;
  const expiredCount = coupons.filter(c => c.endDate && new Date(c.endDate) < new Date()).length;

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ backgroundColor: "#fef3c7", borderRadius: "10px", padding: "10px" }}>
            <FiGift style={{ width: "22px", height: "22px", color: "#d97706" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#111827", margin: 0 }} className="dark:text-white">
              Scratch Card Coupons
            </h1>
            <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }} className="dark:text-gray-400">
              Coupons in this pool are randomly assigned as scratch card rewards
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={fetchCoupons}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 12px", border: "1px solid #d1d5db", borderRadius: "7px", fontSize: "13px", backgroundColor: "#fff", cursor: "pointer" }}
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <FiRefreshCw style={{ width: "14px", height: "14px" }} /> Refresh
          </button>
          {hasPermission(PERMISSIONS.COUPONS_CREATE) && (
            <button onClick={openCreate}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", border: "none", borderRadius: "7px", fontSize: "13px", fontWeight: "600", backgroundColor: "#f59e0b", color: "#fff", cursor: "pointer" }}>
              <FiPlus style={{ width: "14px", height: "14px" }} /> Add Coupon
            </button>
          )}
        </div>
      </div>

      {/* How it works banner */}
      <div style={{
        backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px",
        padding: "14px 18px", marginBottom: "24px", display: "flex", gap: "12px", alignItems: "flex-start",
      }}>
        <FiInfo style={{ width: "16px", height: "16px", color: "#d97706", flexShrink: 0, marginTop: "1px" }} />
        <div>
          <p style={{ fontSize: "13px", fontWeight: "600", color: "#92400e", margin: "0 0 4px 0" }}>How Scratch Cards Work</p>
          <p style={{ fontSize: "13px", color: "#78350f", margin: 0, lineHeight: "1.6" }}>
            When a user places an order with subtotal &gt; ₹200, the system automatically picks a <strong>random active coupon</strong> from this pool and attaches it as a scratch card. The user can scratch and reveal the coupon code only after the order is delivered.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        <StatCard icon={<FiTag style={{ width: "18px", height: "18px", color: "#2563eb" }} />} label="Total Coupons" value={loading ? "..." : coupons.length} color="#2563eb" />
        <StatCard icon={<FiCheckCircle style={{ width: "18px", height: "18px", color: "#10b981" }} />} label="Eligible for Scratch" value={loading ? "..." : eligibleCount} color="#10b981" />
        <StatCard icon={<FiAlertCircle style={{ width: "18px", height: "18px", color: "#ef4444" }} />} label="Expired" value={loading ? "..." : expiredCount} color="#ef4444" />
        <StatCard icon={<FiClock style={{ width: "18px", height: "18px", color: "#6b7280" }} />} label="Inactive" value={loading ? "..." : coupons.filter(c => !c.isActive).length} color="#6b7280" />
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: "#fff", borderRadius: "10px", padding: "14px 20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: "20px",
        display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center",
      }} className="dark:bg-gray-800">
        <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
          <FiSearch style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", width: "14px", height: "14px" }} />
          <input type="text" placeholder="Search coupon code or description..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: "30px" }}
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>
        {[
          { val: "all", label: "All" },
          { val: "eligible", label: "Eligible" },
          { val: "inactive", label: "Inactive" },
          { val: "expired", label: "Expired" },
        ].map(({ val, label }) => (
          <button key={val} onClick={() => setFilterStatus(val)} style={{
            padding: "7px 14px", borderRadius: "7px", fontSize: "13px", fontWeight: "500", cursor: "pointer", border: "none",
            backgroundColor: filterStatus === val ? "#f59e0b" : "#f3f4f6",
            color: filterStatus === val ? "#fff" : "#374151",
          }} className={filterStatus !== val ? "dark:bg-gray-700 dark:text-gray-300" : ""}>
            {label}
          </button>
        ))}
        <span style={{ fontSize: "13px", color: "#6b7280", marginLeft: "auto" }} className="dark:text-gray-400">
          {filtered.length} coupon{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: "#fff", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden" }} className="dark:bg-gray-800">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }} className="dark:bg-gray-700">
                {["Code", "Description", "Discount", "Min. Order", "Valid Until", "Pool Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: "600", color: "#374151", whiteSpace: "nowrap" }} className="dark:text-gray-300">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>Loading coupons...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>No coupons found.</td></tr>
              ) : filtered.map(c => {
                const eligible = isEligible(c);
                const expired = c.endDate && new Date(c.endDate) < new Date();
                const isTogglingThis = rowLoading === c._id + "_toggle";
                const isDeletingThis = rowLoading === c._id + "_delete";
                return (
                  <tr key={c._id} style={{ borderBottom: "1px solid #f3f4f6" }} className="dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    {/* Code */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontFamily: "monospace", fontWeight: "700", fontSize: "13px", color: "#111827", backgroundColor: "#f3f4f6", padding: "3px 8px", borderRadius: "5px" }} className="dark:bg-gray-700 dark:text-white">
                          {c.code}
                        </span>
                        <button onClick={() => copyCode(c.code)} style={{ padding: "2px", border: "none", background: "none", color: copiedCode === c.code ? "#10b981" : "#9ca3af", cursor: "pointer" }}>
                          <FiCopy style={{ width: "13px", height: "13px" }} />
                        </button>
                      </div>
                    </td>

                    {/* Description */}
                    <td style={{ padding: "12px 16px", color: "#374151", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} className="dark:text-gray-300">
                      {c.description || "—"}
                    </td>

                    {/* Discount */}
                    <td style={{ padding: "12px 16px", fontWeight: "600", color: "#111827", whiteSpace: "nowrap" }} className="dark:text-white">
                      {c.discountType === "percentage"
                        ? `${c.discountValue}%${c.maxDiscountAmount ? ` (max ₹${c.maxDiscountAmount})` : ""}`
                        : `₹${c.discountValue}`}
                    </td>

                    {/* Min order */}
                    <td style={{ padding: "12px 16px", color: "#374151" }} className="dark:text-gray-300">
                      {c.minOrderAmount ? `₹${c.minOrderAmount}` : "—"}
                    </td>

                    {/* Valid until */}
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap", color: expired ? "#ef4444" : "#374151" }} className={!expired ? "dark:text-gray-300" : ""}>
                      {c.endDate ? new Date(c.endDate).toLocaleDateString("en-IN") : "No expiry"}
                    </td>

                    {/* Pool status */}
                    <td style={{ padding: "12px 16px" }}>
                      {eligible ? (
                        <span style={{ backgroundColor: "#d1fae5", color: "#065f46", padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" }}>
                          In Pool
                        </span>
                      ) : expired ? (
                        <span style={{ backgroundColor: "#fee2e2", color: "#991b1b", padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" }}>
                          Expired
                        </span>
                      ) : (
                        <span style={{ backgroundColor: "#f3f4f6", color: "#6b7280", padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" }} className="dark:bg-gray-600 dark:text-gray-300">
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        {/* Toggle */}
                        {hasPermission(PERMISSIONS.COUPONS_EDIT) && (
                          <button
                            onClick={() => handleToggle(c)}
                            disabled={!!rowLoading}
                            title={c.isActive ? "Deactivate" : "Activate"}
                            style={{ padding: "4px", border: "none", background: "none", color: c.isActive ? "#10b981" : "#9ca3af", cursor: rowLoading ? "not-allowed" : "pointer", opacity: isTogglingThis ? 0.5 : 1 }}>
                            {c.isActive
                              ? <FiToggleRight style={{ width: "18px", height: "18px" }} />
                              : <FiToggleLeft style={{ width: "18px", height: "18px" }} />}
                          </button>
                        )}
                        {/* Edit */}
                        {hasPermission(PERMISSIONS.COUPONS_EDIT) && (
                          <button onClick={() => openEdit(c)} disabled={!!rowLoading}
                            style={{ padding: "4px", border: "none", background: "none", color: "#2563eb", cursor: rowLoading ? "not-allowed" : "pointer" }} title="Edit">
                            <FiEdit style={{ width: "15px", height: "15px" }} />
                          </button>
                        )}
                        {/* Delete */}
                        {hasPermission(PERMISSIONS.COUPONS_DELETE) && (
                          <button onClick={() => handleDelete(c)} disabled={!!rowLoading}
                            style={{ padding: "4px", border: "none", background: "none", color: "#ef4444", cursor: rowLoading ? "not-allowed" : "pointer", opacity: isDeletingThis ? 0.5 : 1 }} title="Delete">
                            <FiTrash2 style={{ width: "15px", height: "15px" }} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: "16px" }}>
          <div style={{
            backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto",
          }} className="dark:bg-gray-800">
            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #f3f4f6" }} className="dark:border-gray-700">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ backgroundColor: "#fef3c7", borderRadius: "8px", padding: "8px" }}>
                  <FiGift style={{ width: "18px", height: "18px", color: "#d97706" }} />
                </div>
                <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#111827", margin: 0 }} className="dark:text-white">
                  {modal === "edit" ? "Edit Coupon" : "New Scratch Card Coupon"}
                </h2>
              </div>
              <button onClick={closeModal} style={{ padding: "4px", border: "none", background: "none", color: "#9ca3af", cursor: "pointer" }}>
                <FiX style={{ width: "20px", height: "20px" }} />
              </button>
            </div>

            <div style={{ padding: "24px" }}>
              {formError && (
                <div style={{ backgroundColor: "#fee2e2", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "#dc2626" }}>
                  {formError}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                {/* Code */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }} className="dark:text-gray-300">
                    Coupon Code *
                  </label>
                  <input type="text" value={form.code} onChange={e => setField("code", e.target.value.toUpperCase())}
                    placeholder="e.g. SAVE50NOW" style={{ ...inputStyle, fontFamily: "monospace", fontWeight: "600" }}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>

                {/* Description */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }} className="dark:text-gray-300">
                    Description
                  </label>
                  <input type="text" value={form.description} onChange={e => setField("description", e.target.value)}
                    placeholder="e.g. Flat ₹50 off on your next order"
                    style={inputStyle} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>

                {/* Discount type */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }} className="dark:text-gray-300">
                    Discount Type *
                  </label>
                  <select value={form.discountType} onChange={e => setField("discountType", e.target.value)}
                    style={{ ...inputStyle, cursor: "pointer" }} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="fixed">Fixed (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>

                {/* Discount value */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }} className="dark:text-gray-300">
                    Discount Value *
                  </label>
                  <input type="number" min="1" value={form.discountValue} onChange={e => setField("discountValue", e.target.value)}
                    placeholder={form.discountType === "percentage" ? "e.g. 10" : "e.g. 50"}
                    style={inputStyle} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>

                {/* Min order */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }} className="dark:text-gray-300">
                    Min. Order Amount (₹)
                  </label>
                  <input type="number" min="0" value={form.minOrderAmount} onChange={e => setField("minOrderAmount", e.target.value)}
                    placeholder="200" style={inputStyle} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>

                {/* Max discount (for percentage) */}
                {form.discountType === "percentage" && (
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }} className="dark:text-gray-300">
                      Max Discount (₹)
                    </label>
                    <input type="number" min="0" value={form.maxDiscountAmount} onChange={e => setField("maxDiscountAmount", e.target.value)}
                      placeholder="Optional cap" style={inputStyle} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                )}

                {/* Per-user limit */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }} className="dark:text-gray-300">
                    Per-User Limit
                  </label>
                  <input type="number" min="1" value={form.perUserLimit} onChange={e => setField("perUserLimit", e.target.value)}
                    placeholder="1" style={inputStyle} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>

                {/* Usage limit */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }} className="dark:text-gray-300">
                    Total Usage Limit
                  </label>
                  <input type="number" min="1" value={form.usageLimit} onChange={e => setField("usageLimit", e.target.value)}
                    placeholder="Unlimited" style={inputStyle} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>

                {/* Start date */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }} className="dark:text-gray-300">
                    Start Date
                  </label>
                  <input type="date" value={form.startDate} onChange={e => setField("startDate", e.target.value)}
                    style={inputStyle} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>

                {/* End date */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }} className="dark:text-gray-300">
                    End Date
                  </label>
                  <input type="date" value={form.endDate} onChange={e => setField("endDate", e.target.value)}
                    style={inputStyle} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>

                {/* Active toggle */}
                <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    onClick={() => setField("isActive", !form.isActive)}
                    style={{ padding: "0", border: "none", background: "none", color: form.isActive ? "#10b981" : "#9ca3af", cursor: "pointer" }}
                  >
                    {form.isActive
                      ? <FiToggleRight style={{ width: "24px", height: "24px" }} />
                      : <FiToggleLeft style={{ width: "24px", height: "24px" }} />}
                  </button>
                  <span style={{ fontSize: "13px", color: "#374151" }} className="dark:text-gray-300">
                    {form.isActive ? "Active — eligible for scratch card pool" : "Inactive — will not be assigned to scratch cards"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button onClick={handleSave} disabled={formSaving}
                  style={{ flex: 1, padding: "10px", border: "none", borderRadius: "8px", backgroundColor: formSaving ? "#fbbf24" : "#f59e0b", color: "#fff", fontWeight: "600", fontSize: "14px", cursor: formSaving ? "not-allowed" : "pointer" }}>
                  {formSaving ? "Saving..." : modal === "edit" ? "Save Changes" : "Create Coupon"}
                </button>
                <button onClick={closeModal}
                  style={{ padding: "10px 16px", border: "none", borderRadius: "8px", backgroundColor: "#f3f4f6", color: "#374151", fontSize: "14px", cursor: "pointer" }}
                  className="dark:bg-gray-700 dark:text-gray-300">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
