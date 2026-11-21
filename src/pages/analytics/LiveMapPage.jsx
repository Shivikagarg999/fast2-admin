import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { FiMapPin, FiRefreshCw } from "react-icons/fi";

mapboxgl.accessToken = "pk.eyJ1IjoiZmFzdDIiLCJhIjoiY21mbW9qbzZlMDQ5dzJpcXhlOW82ODdlcSJ9.HYJxZbPDCZHD8_Q5faa6ig";

const BASE_URL = `${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || "https://admin.gmkart.com/proxy"}/api/admin/analytics`;
const REFRESH_MS = 30000;
const WINDOWS = [
  { label: "Last 5 min", minutes: 5 },
  { label: "Last 15 min", minutes: 15 },
  { label: "Last 30 min", minutes: 30 },
];

const timeAgo = (iso) => {
  const sec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (sec < 60) return `${sec}s ago`;
  return `${Math.floor(sec / 60)}m ago`;
};

const LiveMapPage = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const [minutes, setMinutes] = useState(5);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (mapContainer.current && !map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [78.1828, 26.2183],
        zoom: 11,
      });
      map.current.addControl(new mapboxgl.NavigationControl());
    }
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const load = async () => {
    try {
      const res = await fetch(`${BASE_URL}/live-users?minutes=${minutes}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const result = await res.json();
      if (result.success) {
        setUsers(result.users || []);
        setError("");
        setLastUpdated(new Date());
      } else {
        setError(result.message || "Failed to load live users");
      }
    } catch {
      setError("Failed to load live users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minutes]);

  useEffect(() => {
    if (!map.current) return;
    markers.current.forEach((m) => m.remove());
    markers.current = [];

    users.forEach((u) => {
      const el = document.createElement("div");
      el.style.width = "14px";
      el.style.height = "14px";
      el.style.borderRadius = "9999px";
      el.style.background = "#f3bf2e";
      el.style.border = "2px solid #111827";
      el.style.boxShadow = "0 0 0 4px rgba(243,191,46,0.35)";

      const popup = new mapboxgl.Popup({ offset: 12 }).setHTML(
        `<div style="font-size:12px;line-height:1.5">
          <strong>${u.area || u.pincode || "Unknown area"}</strong><br/>
          Last seen: ${timeAgo(u.lastSeen)}<br/>
          Last action: ${u.event}
        </div>`
      );

      const marker = new mapboxgl.Marker(el).setLngLat([u.lng, u.lat]).setPopup(popup).addTo(map.current);
      markers.current.push(marker);
    });
  }, [users]);

  return (
    <div className="p-6 min-h-screen bg-gold-50">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiMapPin /> Live Activity Map
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            App users active recently, shown at their last saved delivery location. Not continuous GPS — refreshes every 30s.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-white p-1 rounded-full border border-gray-200">
            {WINDOWS.map((w) => (
              <button
                key={w.minutes}
                onClick={() => setMinutes(w.minutes)}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  minutes === w.minutes ? "bg-black text-white" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
          <div className="bg-white rounded-full px-4 py-2 border border-gray-200 text-sm font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
            {users.length} active
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm bg-red-50 text-red-800 border border-red-200">{error}</div>
      )}

      <div className="bg-white rounded-2xl shadow-sm shadow-black/5 border border-gray-100 overflow-hidden">
        <div ref={mapContainer} style={{ width: "100%", height: "600px" }} />
      </div>

      <div className="mt-2 text-xs text-gray-400 flex items-center gap-1.5">
        <FiRefreshCw className={loading ? "animate-spin" : ""} size={12} />
        {lastUpdated ? `Updated ${timeAgo(lastUpdated.toISOString())}` : "Loading..."}
      </div>
    </div>
  );
};

export default LiveMapPage;
