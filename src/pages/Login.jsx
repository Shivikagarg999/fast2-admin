import { useState } from "react";
import Logo from "../assets/images/logo.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.fast2.in/proxy'}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        console.log("Login successful:", data);

        // Store admin data with permissions
        localStorage.setItem('token', data.token);
        localStorage.setItem('adminData', JSON.stringify({
          _id: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
          roleId: data.roleId,
          roleName: data.roleName,
          permissions: data.permissions || [],
          isSuperAdmin: data.isSuperAdmin || false,
        }));

        // Redirect to dashboard
        window.location.href = "/dashboard";
      } else {
        setError(data.message || "Login failed");
      }
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img
            src={Logo}
            alt="GMKart Logo"
            className="h-32 lg:h-36 object-contain"
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Admin login</h1>
            <p className="text-slate-500 text-sm mt-1">Sign in to your admin account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Email Address
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder-slate-400 transition-all duration-200"
                placeholder="admin@gmkart.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder-slate-400 transition-all duration-200"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: "blue" }}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${loading
                ? "cursor-not-allowed opacity-60"
                : "transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md"
                }`}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} GMKart Delivery. All rights reserved.
        </p>
      </div>
    </div>
  );
}
