import { useEffect, useState } from "react";
import axios from "axios";
import { FiKey, FiSearch, FiX, FiEye, FiEyeOff, FiUser, FiPhone, FiMail, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import PageHeader from "../../components/ui/PageHeader";

const BASE_URL = (import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || "https://admin.gmkart.com/proxy";

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
    <div className="p-6 min-h-screen bg-gold-50">
      <PageHeader
        title="Password Management"
        subtitle="View and reset passwords for drivers, sellers, and promotors."
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-white rounded-full p-1 border border-gray-100 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
              activeTab === tab.key ? "bg-black text-white" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder={`Search ${activeTab}…`}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-full text-sm outline-none bg-white focus:border-gold-400 focus:ring-2 focus:ring-gold-100 transition-colors"
          />
        </div>
        <span className="text-xs text-gray-400">
          {filtered.length} record{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <Card padded={false} className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading…</div>
        ) : paginated.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No records found.</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Name", "Phone", "Email", "Action"].map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((item, idx) => (
                <tr
                  key={getItemId(activeTab, item) || idx}
                  className={`${idx < paginated.length - 1 ? "border-b border-gray-50" : ""} hover:bg-gold-50/50 transition-colors`}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <FiUser size={14} className="text-gray-400" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{getItemName(item)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-600">{getItemPhone(item)}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-600">{getItemEmail(item)}</td>
                  <td className="px-4 py-3.5">
                    <Button variant="secondary" onClick={() => openModal(item)} className="!px-3 !py-1.5 text-xs gap-1.5">
                      <FiKey size={12} />
                      Set Password
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className={`px-3 py-1.5 border border-gray-200 rounded-full text-xs font-medium transition-colors ${
              currentPage === 1 ? "bg-gray-50 text-gray-300 cursor-not-allowed" : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Previous
          </button>
          <span className="text-xs text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className={`px-3 py-1.5 border border-gray-200 rounded-full text-xs font-medium transition-colors ${
              currentPage === totalPages ? "bg-gray-50 text-gray-300 cursor-not-allowed" : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Next
          </button>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/45 z-[1000] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center">
                  <FiKey size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Set Password</h3>
                  <p className="text-xs text-gray-400">{TABS.find((t) => t.key === modal.tab)?.label}</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1">
                <FiX size={20} />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6">
              {/* User info */}
              <div className="bg-gray-50 rounded-xl px-4 py-3.5 mb-5 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <FiUser size={14} className="text-gray-400" />
                  <span className="text-sm font-semibold text-gray-900">{getItemName(modal.item)}</span>
                </div>
                {getItemPhone(modal.item) !== "—" && (
                  <div className="flex items-center gap-2">
                    <FiPhone size={13} className="text-gray-400" />
                    <span className="text-sm text-gray-600">{getItemPhone(modal.item)}</span>
                  </div>
                )}
                {getItemEmail(modal.item) !== "—" && (
                  <div className="flex items-center gap-2">
                    <FiMail size={13} className="text-gray-400" />
                    <span className="text-sm text-gray-600">{getItemEmail(modal.item)}</span>
                  </div>
                )}

                {/* Password status badge */}
                <div className="mt-1">
                  {statusLoading ? (
                    <span className="text-xs text-gray-400">Checking password status…</span>
                  ) : passwordStatus?.hasPassword === true ? (
                    <Badge variant="success">
                      <FiCheckCircle size={11} className="mr-1" /> Has password
                    </Badge>
                  ) : passwordStatus?.hasPassword === false ? (
                    <Badge variant="pale">
                      <FiAlertCircle size={11} className="mr-1" /> No password set
                    </Badge>
                  ) : null}
                </div>
              </div>

              {/* New password input */}
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setSaveError(""); setSaveSuccess(false); }}
                  placeholder="Enter new password"
                  onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                  className={`w-full pl-3 pr-11 py-2.5 rounded-lg text-sm outline-none border transition-colors ${
                    saveError ? "border-red-300 focus:ring-2 focus:ring-red-100" : "border-gray-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-100"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>

              {saveError && <p className="text-xs text-red-500 mt-1.5">{saveError}</p>}

              {saveSuccess && (
                <div className="flex items-center gap-1.5 mt-2.5 px-3 py-2 bg-emerald-50 rounded-lg text-emerald-700 text-sm font-medium">
                  <FiCheckCircle size={14} /> Password updated successfully.
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex gap-2.5 px-6 py-4 border-t border-gray-100 justify-end">
              <Button variant="outline" onClick={closeModal}>Close</Button>
              <Button
                variant="secondary"
                onClick={handleSave}
                disabled={saving || !newPassword.trim()}
                className="gap-1.5"
              >
                <FiKey size={14} />
                {saving ? "Saving…" : "Update Password"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
