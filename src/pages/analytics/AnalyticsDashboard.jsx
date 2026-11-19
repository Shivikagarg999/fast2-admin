import React, { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  FiUsers, FiActivity, FiEye, FiMousePointer, FiShoppingCart, FiLogIn, FiUserCheck, FiPackage, FiAlertCircle,
  FiDownload, FiSmartphone, FiClock, FiZap
} from "react-icons/fi";

const BASE_URL = `${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.gmkart.com/proxy'}/api/admin/analytics`;

const RANGES = [
  { label: 'Today', days: 1 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

const PLATFORMS = [
  { label: 'All', value: 'all' },
  { label: 'Website', value: 'web' },
  { label: 'App', value: 'app' },
];

const fmt = (n) => (n || 0).toLocaleString('en-IN');
const pct = (part, whole) => (whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : '0%');
const fmtDuration = (seconds) => {
  const s = seconds || 0;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return m > 0 ? `${m}m ${rem}s` : `${rem}s`;
};

const StatCard = ({ icon, label, value, hint }) => (
  <div className="bg-white rounded-xl shadow p-4">
    <div className="flex items-center gap-2 text-gray-500 text-xs font-medium uppercase tracking-wide">
      {icon}
      {label}
    </div>
    <div className="text-2xl font-bold text-gray-900 mt-2">{typeof value === 'string' ? value : fmt(value)}</div>
    {hint && <div className="text-xs text-gray-400 mt-1">{hint}</div>}
  </div>
);

const Card = ({ title, children }) => (
  <div className="bg-white rounded-xl shadow p-5">
    <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>
    {children}
  </div>
);

const EmptyRow = () => <p className="text-sm text-gray-400 py-4 text-center">No data for this period yet</p>;

const AnalyticsDashboard = () => {
  const [days, setDays] = useState(7);
  const [platform, setPlatform] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fbData, setFbData] = useState(null);
  const [fbLoading, setFbLoading] = useState(true);
  const [fbError, setFbError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${BASE_URL}/summary?days=${days}&platform=${platform}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const result = await res.json();
        if (cancelled) return;
        if (result.success) setData(result);
        else setError(result.message || 'Failed to load analytics');
      } catch {
        if (!cancelled) setError('Failed to load analytics. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [days, platform]);

  useEffect(() => {
    let cancelled = false;
    const loadFirebase = async () => {
      setFbLoading(true);
      setFbError('');
      try {
        const res = await fetch(`${BASE_URL}/firebase-summary?days=${days}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const result = await res.json();
        if (cancelled) return;
        if (result.success) setFbData(result);
        else setFbError(result.message || 'Failed to load Firebase Analytics');
      } catch {
        if (!cancelled) setFbError('Failed to load Firebase Analytics. Please try again.');
      } finally {
        if (!cancelled) setFbLoading(false);
      }
    };
    loadFirebase();
    return () => { cancelled = true; };
  }, [days]);

  const totals = data?.totals;
  const funnel = data?.funnel || [];
  const funnelTop = funnel[0]?.visitors || 0;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Anonymous visitor activity on gmkart.com and the app. Counts start from when tracking went live.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {PLATFORMS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPlatform(p.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  platform === p.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {RANGES.map((range) => (
              <button
                key={range.days}
                onClick={() => setDays(range.days)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  days === range.days ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg flex items-center gap-2 text-sm bg-red-50 text-red-800 border border-red-200">
          <FiAlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
        </div>
      ) : data && (
        <div className={`space-y-6 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<FiUsers />} label="Visitors" value={totals.visitors} hint="Unique people" />
            <StatCard icon={<FiActivity />} label="Sessions" value={totals.sessions} />
            <StatCard icon={<FiEye />} label="Page views" value={totals.pageViews} />
            <StatCard icon={<FiMousePointer />} label="Product clicks" value={totals.productClicks} hint={`${fmt(totals.productClickVisitors)} visitors`} />
            <StatCard icon={<FiShoppingCart />} label="Add to cart" value={totals.addToCart} />
            <StatCard icon={<FiLogIn />} label="Opened login page" value={totals.loginPageVisitors} hint="Unique visitors" />
            <StatCard icon={<FiUserCheck />} label="Logged in" value={totals.loginSuccess} hint="Unique visitors" />
            <StatCard icon={<FiPackage />} label="Orders placed" value={totals.ordersPlaced} />
            <StatCard icon={<FiDownload />} label="App installs" value={totals.appInstalls} />
            <StatCard icon={<FiSmartphone />} label="App opens" value={totals.appOpens} />
            <StatCard icon={<FiClock />} label="Avg time per session" value={fmtDuration(totals.avgSessionDurationSec)} hint={`${fmt(totals.avgSessionDurationSec)} sec`} />
          </div>

          {/* Funnel */}
          <Card title="Visitor journey (unique visitors at each step)">
            <div className="space-y-3">
              {funnel.map((step, i) => {
                const width = funnelTop > 0 ? Math.max((step.visitors / funnelTop) * 100, step.visitors > 0 ? 2 : 0) : 0;
                const prev = i > 0 ? funnel[i - 1].visitors : null;
                return (
                  <div key={step.key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{step.label}</span>
                      <span className="text-gray-500">
                        <span className="font-semibold text-gray-900">{fmt(step.visitors)}</span>
                        {' · '}{pct(step.visitors, funnelTop)} of visitors
                        {prev !== null && prev > 0 && <span className="text-gray-400"> · {pct(step.visitors, prev)} of previous</span>}
                      </span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-800 rounded-full" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Steps are counted independently, so a step can exceed the one before it (for example someone who was already logged in never opens the login page).
            </p>
          </Card>

          {/* Trend */}
          <Card title="Visitors and page views per day">
            {data.daily.length === 0 ? <EmptyRow /> : (
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <LineChart data={data.daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="visitors" name="Visitors" stroke="#0c831f" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="pageViews" name="Page views" stroke="#6b7280" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Most clicked products">
              {data.topProducts.length === 0 ? <EmptyRow /> : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase">
                      <th className="pb-2 font-medium">Product</th>
                      <th className="pb-2 font-medium text-right">Clicks</th>
                      <th className="pb-2 font-medium text-right">Visitors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.topProducts.map((row) => (
                      <tr key={row.ref}>
                        <td className="py-2 pr-2 text-gray-800">{row.name}</td>
                        <td className="py-2 text-right font-semibold">{fmt(row.clicks)}</td>
                        <td className="py-2 text-right text-gray-500">{fmt(row.visitors)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card title="Top pages">
              {data.topPages.length === 0 ? <EmptyRow /> : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase">
                      <th className="pb-2 font-medium">Page</th>
                      <th className="pb-2 font-medium text-right">Views</th>
                      <th className="pb-2 font-medium text-right">Visitors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.topPages.map((row) => (
                      <tr key={row.path}>
                        <td className="py-2 pr-2 text-gray-800 truncate max-w-[16rem]">{row.path || '/'}</td>
                        <td className="py-2 text-right font-semibold">{fmt(row.views)}</td>
                        <td className="py-2 text-right text-gray-500">{fmt(row.visitors)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card title="Popular searches">
              {data.topSearches.length === 0 ? <EmptyRow /> : (
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100">
                    {data.topSearches.map((row) => (
                      <tr key={row.query}>
                        <td className="py-2 pr-2 text-gray-800">{row.query}</td>
                        <td className="py-2 text-right font-semibold">{fmt(row.searches)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card title="Most clicked categories">
              {data.topCategories.length === 0 ? <EmptyRow /> : (
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100">
                    {data.topCategories.map((row) => (
                      <tr key={row.ref}>
                        <td className="py-2 pr-2 text-gray-800">{row.ref}</td>
                        <td className="py-2 text-right font-semibold">{fmt(row.clicks)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card title="Popups">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Login popup shown</span>
                  <span className="font-semibold">{fmt(data.popups.loginPopupShown)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Entered number in login popup</span>
                  <span className="font-semibold">
                    {fmt(data.popups.loginPopupSubmitted)}
                    <span className="text-gray-400 font-normal"> ({pct(data.popups.loginPopupSubmitted, data.popups.loginPopupShown)})</span>
                  </span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="text-gray-600">Offer popup shown</span>
                  <span className="font-semibold">{fmt(data.popups.offerPopupShown)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Offer popup button clicked</span>
                  <span className="font-semibold">
                    {fmt(data.popups.offerPopupClicked)}
                    <span className="text-gray-400 font-normal"> ({pct(data.popups.offerPopupClicked, data.popups.offerPopupShown)})</span>
                  </span>
                </div>
              </div>
            </Card>

            <Card title="Visitors by location">
              {!data.locations || data.locations.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No location data yet — visitors' saved delivery locations appear here</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase">
                      <th className="pb-2 font-medium">Area</th>
                      <th className="pb-2 font-medium">Pincode</th>
                      <th className="pb-2 font-medium text-right">Visitors</th>
                      <th className="pb-2 font-medium text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.locations.map((row) => {
                      const total = data.locations.reduce((sum, r) => sum + r.visitors, 0);
                      return (
                        <tr key={`${row.pincode}-${row.area}`}>
                          <td className="py-2 pr-2 text-gray-800">{row.area || '—'}</td>
                          <td className="py-2 pr-2 text-gray-600">{row.pincode}</td>
                          <td className="py-2 text-right font-semibold">{fmt(row.visitors)}</td>
                          <td className="py-2 text-right text-gray-500">{pct(row.visitors, total)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </Card>

            <Card title="Website vs App (unique visitors)">
              {!data.platforms || data.platforms.length === 0 ? <EmptyRow /> : (
                <div className="space-y-3">
                  {data.platforms.map((row) => {
                    const total = data.platforms.reduce((sum, p) => sum + p.visitors, 0);
                    const maxVal = Math.max(...data.platforms.map((p) => p.visitors), 1);
                    return (
                      <div key={row.platform}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize text-gray-700">{row.platform === 'app' ? 'App' : 'Website'}</span>
                          <span className="text-gray-500">{fmt(row.visitors)} · {pct(row.visitors, total)}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gray-800 rounded-full" style={{ width: `${(row.visitors / maxVal) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card title="Devices (unique visitors)">
              {data.devices.length === 0 ? <EmptyRow /> : (
                <div className="space-y-3">
                  {data.devices.map((row) => (
                    <div key={row.device}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize text-gray-700">{row.device}</span>
                        <span className="text-gray-500">{fmt(row.visitors)} · {pct(row.visitors, data.devices.reduce((sum, d) => sum + d.visitors, 0))}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gray-800 rounded-full"
                          style={{ width: `${(row.visitors / Math.max(...data.devices.map((d) => d.visitors))) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Real Firebase Analytics (GA4) — separate data source, pulled live from Google */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-1">
          <FiZap className="text-gray-700" />
          <h2 className="text-lg font-bold text-gray-900">Firebase Analytics (live from Google)</h2>
        </div>
        <p className="text-gray-500 text-sm mb-4">
          Real GA4 event data from the website and app's Firebase project — a separate pipeline from the visitor tracking above.
        </p>

        {fbError && (
          <div className="mb-4 p-3 rounded-lg flex items-center gap-2 text-sm bg-red-50 text-red-800 border border-red-200">
            <FiAlertCircle className="w-4 h-4" />
            {fbError}
          </div>
        )}

        {fbLoading && !fbData ? (
          <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ) : fbData && fbData.configured === false ? (
          <div className="bg-white rounded-xl shadow p-5 text-sm text-gray-600">
            <p className="font-medium text-gray-900 mb-1">Not connected yet</p>
            <p>{fbData.message}</p>
          </div>
        ) : fbData && fbData.configured ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {(fbData.totals || []).map((row) => (
                <StatCard
                  key={row.platform}
                  icon={<FiSmartphone />}
                  label={`${row.platform} active users`}
                  value={row.activeUsers}
                  hint={`${fmt(row.eventCount)} events`}
                />
              ))}
            </div>

            <Card title="Events by name and platform">
              {!fbData.events || fbData.events.length === 0 ? <EmptyRow /> : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase">
                      <th className="pb-2 font-medium">Event</th>
                      <th className="pb-2 font-medium">Platform</th>
                      <th className="pb-2 font-medium text-right">Count</th>
                      <th className="pb-2 font-medium text-right">Users</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {fbData.events.map((row, i) => (
                      <tr key={`${row.event}-${row.platform}-${i}`}>
                        <td className="py-2 pr-2 text-gray-800">{row.event}</td>
                        <td className="py-2 pr-2 text-gray-500 capitalize">{row.platform}</td>
                        <td className="py-2 text-right font-semibold">{fmt(row.count)}</td>
                        <td className="py-2 text-right text-gray-500">{fmt(row.users)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
