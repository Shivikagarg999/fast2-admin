import { useState, useEffect } from "react";
import { FiGift, FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";

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
    <div className="p-6 bg-gold-50 min-h-screen">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <FiGift className="w-6 h-6" />
            Referrals
          </span>
        }
        subtitle="Every user gets a referral code to share. This shows how many people signed up with each user's code, and how many of those actually went on to place an order — use it to decide who to pay for referrals."
        actions={
          <Button variant="outline" onClick={fetchReferrals}>
            <FiRefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        }
      />

      {error && (
        <div className="mb-4 p-3 rounded-xl flex items-center gap-2 text-sm bg-red-50 text-red-800 border border-red-200">
          <FiAlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-gray-500">No one has referred anyone yet.</div>
      ) : (
        <Card padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Contact</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Referral Code</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Signups</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Ordered</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Wallet</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.referrerId} className="border-b border-gray-50 hover:bg-gold-50/50 transition-colors">
                    <td className="px-4 py-3.5 font-medium text-gray-900">{row.name || '—'}</td>
                    <td className="px-4 py-3.5 text-gray-600">{row.email || row.phone || '—'}</td>
                    <td className="px-4 py-3.5 font-mono text-xs bg-gray-50 rounded w-fit">{row.referralCode}</td>
                    <td className="px-4 py-3.5 text-right font-semibold text-gray-900">{row.totalSignups}</td>
                    <td className="px-4 py-3.5 text-right font-semibold text-emerald-700">{row.totalOrdered}</td>
                    <td className="px-4 py-3.5 text-right text-gray-700">₹{row.wallet}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ReferralsPage;
