import { useEffect, useState } from "react";
import axios from "axios";
import { FiKey, FiSearch, FiX, FiEye, FiEyeOff, FiUser, FiPhone, FiMail, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

const BASE_URL = import.meta.env.VITE_BASE_URL || "https://admin.fast2.in/proxy";

const getToken = () => localStorage.getItem("adminToken") || localStorage.getItem("token");

const TABS = [
  { key: "drivers", label: "Drivers" },
  { key: "sellers", label: "Sellers" },
  { key: "promotors", label: "Promotors" },
];

const fetchList = async (tab) => {
  const token = getToken();
  const headers = { Authorization: `Bearer ${token}` };

  if (tab === "drivers") {
    const res = await axios.get(`${BASE_URL}/api/admin/drivers/getall`, { headers });
    return res.data.data?.drivers || res.data.data || [];
  }
  if (tab === "sellers") {
    const res = await axios.get(`${BASE_URL}/api/admin/seller/sellers?limit=1000`, { headers });
    return res.data.data?.sellers || res.data.sellers || res.data.data || [];
  }
  if (tab === "promotors") {
    const res = await axios.get(`${BASE_URL}/api/admin/promotor`, { headers });
    return res.data || [];
  }
  return [];
};

const fetchPasswordStatus = async (tab, id) => {
  const token = getToken();
  const headers = { Authorization: `Bearer ${token}` };
  const urlMap = {
    drivers: `${BASE_URL}/api/admin/drivers/${id}/password`,
    sellers: `${BASE_URL}/api/admin/seller/${id}/password`,
    promotors: `${BASE_URL}/api/admin/promotor/${id}/password`,
  };
  const res = await axios.get(urlMap[tab], { headers });
  return res.data;
};

const resetPassword = async (tab, id, newPassword) => {
  const token = getToken();
  const headers = { Authorization: `Bearer ${token}` };
  const urlMap = {
    drivers: `${BASE_URL}/api/admin/drivers/${id}/password`,
    sellers: `${BASE_URL}/api/admin/seller/${id}/password`,
    promotors: `${BASE_URL}/api/admin/promotor/${id}/password`,
  };
  await axios.patch(urlMap[tab], { newPassword }, { headers });
};

const getItemId = (tab, item) => item._id || item.id;
const getItemName = (item) => item.personalInfo?.name || item.name || item.fullName || `${item.firstName || ""} ${item.lastName || ""}`.trim() || "—";
const getItemPhone = (item) => item.personalInfo?.phone || item.phone || item.phoneNumber || item.mobile || "—";
const getItemEmail = (item) => item.personalInfo?.email || item.email || "—";

export default function PasswordPage() {
  const [activeTab, setActiveTab] = useState("drivers");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 15;

  const [modal, setModal] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadList = async () => {
    setLoading(true);
    setItems([]);
    try {
      const data = await fetchList(activeTab);
      setItems(data);
    } catch (err) {
      alert("Failed to load list: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearch("");
    setCurrentPage(1);
    loadList();
  }, [activeTab]);

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    return (
      getItemName(item).toLowerCase().includes(q) ||
      getItemPhone(item).toLowerCase().includes(q) ||
      getItemEmail(item).toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const openModal = async (item) => {
    const id = getItemId(activeTab, item);
    setModal({ item, id, tab: activeTab });
    setNewPassword("");
    setShowPassword(false);
    setSaveError("");
    setSaveSuccess(false);
    setPasswordStatus(null);
    setStatusLoading(true);
    try {
      const status = await fetchPasswordStatus(activeTab, id);
      setPasswordStatus(status);
    } catch (err) {
      setPasswordStatus({ hasPassword: null });
    } finally {
      setStatusLoading(false);
    }
  };

  const closeModal = () => {
    setModal(null);
    setPasswordStatus(null);
    setNewPassword("");
    setSaveError("");
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!newPassword.trim()) {
      setSaveError("Password cannot be empty.");
      return;
    }
    if (newPassword.length < 4) {
      setSaveError("Password must be at least 4 characters.");
      return;
    }
    setSaveError("");
    setSaving(true);
    try {
      await resetPassword(modal.tab, modal.id, newPassword);
      setSaveSuccess(true);
      setPasswordStatus((prev) => ({ ...prev, hasPassword: true }));
      setNewPassword("");
    } catch (err) {
      setSaveError(err.response?.data?.message || "Failed to update password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "24px", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#111827", margin: 0 }}>
          Password Management
        </h1>
        <p style={{ color: "#6b7280", marginTop: "4px", fontSize: "14px" }}>
          View and reset passwords for drivers, sellers, and promotors.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px", borderBottom: "2px solid #e5e7eb" }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: "600",
              border: "none",
              background: "none",
              cursor: "pointer",
              color: activeTab === tab.key ? "#111827" : "#6b7280",
              borderBottom: activeTab === tab.key ? "2px solid #111827" : "2px solid transparent",
              marginBottom: "-2px",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "360px" }}>
          <FiSearch
            style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}
          />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder={`Search ${activeTab}…`}
            style={{
              width: "100%",
              paddingLeft: "36px",
              paddingRight: "12px",
              paddingTop: "9px",
              paddingBottom: "9px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              outline: "none",
              background: "#fff",
              boxSizing: "border-box",
            }}
          />
        </div>
        <span style={{ fontSize: "13px", color: "#9ca3af" }}>
          {filtered.length} record{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#9ca3af" }}>Loading…</div>
        ) : paginated.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#9ca3af" }}>No records found.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["Name", "Phone", "Email", "Action"].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((item, idx) => (
                <tr
                  key={getItemId(activeTab, item) || idx}
                  style={{
                    borderBottom: idx < paginated.length - 1 ? "1px solid #f3f4f6" : "none",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "34px",
                          height: "34px",
                          borderRadius: "50%",
                          background: "#f3f4f6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <FiUser size={15} color="#9ca3af" />
                      </div>
                      <span style={{ fontSize: "14px", fontWeight: "500", color: "#111827" }}>
                        {getItemName(item)}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: "14px", color: "#374151" }}>
                    {getItemPhone(item)}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: "14px", color: "#374151" }}>
                    {getItemEmail(item)}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <button
                      onClick={() => openModal(item)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "7px 14px",
                        background: "#111827",
                        color: "#fff",
                        border: "none",
                        borderRadius: "7px",
                        fontSize: "13px",
                        fontWeight: "500",
                        cursor: "pointer",
                      }}
                    >
                      <FiKey size={13} />
                      Set Password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "16px" }}>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            style={{
              padding: "6px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              background: currentPage === 1 ? "#f9fafb" : "#fff",
              color: currentPage === 1 ? "#d1d5db" : "#374151",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              fontSize: "13px",
            }}
          >
            Previous
          </button>
          <span style={{ fontSize: "13px", color: "#6b7280" }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            style={{
              padding: "6px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              background: currentPage === totalPages ? "#f9fafb" : "#fff",
              color: currentPage === totalPages ? "#d1d5db" : "#374151",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              fontSize: "13px",
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "14px",
              width: "100%",
              maxWidth: "440px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              overflow: "hidden",
            }}
          >
            {/* Modal header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "#111827",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FiKey size={16} color="#fff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#111827" }}>
                    Set Password
                  </h3>
                  <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>
                    {TABS.find((t) => t.key === modal.tab)?.label}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "4px" }}
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: "24px" }}>
              {/* User info */}
              <div
                style={{
                  background: "#f9fafb",
                  borderRadius: "10px",
                  padding: "14px 16px",
                  marginBottom: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <FiUser size={14} color="#9ca3af" />
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}>
                    {getItemName(modal.item)}
                  </span>
                </div>
                {getItemPhone(modal.item) !== "—" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FiPhone size={13} color="#9ca3af" />
                    <span style={{ fontSize: "13px", color: "#374151" }}>{getItemPhone(modal.item)}</span>
                  </div>
                )}
                {getItemEmail(modal.item) !== "—" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FiMail size={13} color="#9ca3af" />
                    <span style={{ fontSize: "13px", color: "#374151" }}>{getItemEmail(modal.item)}</span>
                  </div>
                )}

                {/* Password status badge */}
                <div style={{ marginTop: "4px" }}>
                  {statusLoading ? (
                    <span style={{ fontSize: "12px", color: "#9ca3af" }}>Checking password status…</span>
                  ) : passwordStatus?.hasPassword === true ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "3px 10px",
                        background: "#dcfce7",
                        color: "#15803d",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "500",
                      }}
                    >
                      <FiCheckCircle size={11} /> Has password
                    </span>
                  ) : passwordStatus?.hasPassword === false ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "3px 10px",
                        background: "#fef3c7",
                        color: "#92400e",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "500",
                      }}
                    >
                      <FiAlertCircle size={11} /> No password set
                    </span>
                  ) : null}
                </div>
              </div>

              {/* New password input */}
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                New Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setSaveError(""); setSaveSuccess(false); }}
                  placeholder="Enter new password"
                  onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                  style={{
                    width: "100%",
                    padding: "10px 44px 10px 12px",
                    border: saveError ? "1px solid #ef4444" : "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9ca3af",
                    padding: 0,
                  }}
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>

              {saveError && (
                <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "6px", margin: "6px 0 0" }}>
                  {saveError}
                </p>
              )}

              {saveSuccess && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "10px",
                    padding: "8px 12px",
                    background: "#dcfce7",
                    borderRadius: "8px",
                    color: "#15803d",
                    fontSize: "13px",
                    fontWeight: "500",
                  }}
                >
                  <FiCheckCircle size={14} /> Password updated successfully.
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                padding: "16px 24px",
                borderTop: "1px solid #f3f4f6",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={closeModal}
                style={{
                  padding: "9px 18px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  background: "#fff",
                  color: "#374151",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !newPassword.trim()}
                style={{
                  padding: "9px 18px",
                  border: "none",
                  borderRadius: "8px",
                  background: saving || !newPassword.trim() ? "#9ca3af" : "#111827",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: saving || !newPassword.trim() ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <FiKey size={14} />
                {saving ? "Saving…" : "Update Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
