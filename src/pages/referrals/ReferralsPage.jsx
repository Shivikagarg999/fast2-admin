import { useState, useEffect } from "react";
import { FiGift, FiAlertCircle, FiRefreshCw } from "react-icons/fi";

const BASE_URL = `${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.gmkart.com/proxy'}/api/admin/users/referrals`;

const ReferralsPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(BASE_URL, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const result = await res.json();
      if (result.success) {
        setRows(result.data);
      } else {
        setError(result.message || 'Failed to load referral data.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load referral data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiGift className="w-6 h-6" />
            Referrals
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Every user gets a referral code to share. This shows how many people signed up
            with each user's code, and how many of those actually went on to place an order —
            use it to decide who to pay for referrals.
          </p>
        </div>
        <button
          onClick={fetchReferrals}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50"
        >
          <FiRefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg flex items-center gap-2 text-sm bg-red-50 text-red-800 border border-red-200">
          <FiAlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-gray-500">No one has referred anyone yet.</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Referral Code</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Signups</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Ordered</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Wallet</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.referrerId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{row.email || row.phone || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs bg-gray-50 rounded w-fit">{row.referralCode}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{row.totalSignups}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-700">{row.totalOrdered}</td>
                  <td className="px-4 py-3 text-right text-gray-700">₹{row.wallet}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReferralsPage;
