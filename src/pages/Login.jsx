import { useState } from "react";

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
      const res = await fetch("https://fast2-backend.onrender.com/api/admin/login", {
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
        // Redirect to dashboard
        window.location.href = "/dashboard";
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex flex-col lg:flex-row items-center justify-center lg:justify-between p-4 lg:p-8 overflow-hidden">
      {/* Background Pattern */}
      <div className="fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/3 -right-4 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Mobile: Form First, Then Branding */}
      <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col lg:grid lg:grid-cols-2 items-center">
        {/* Login Form - Appears First on Mobile */}
        <div className="order-2 lg:order-1 w-full flex items-center justify-center px-4 py-8 lg:px-8 lg:py-0">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-6 lg:p-8 w-full max-w-md">
            <div className="text-center mb-6">
              <h3 className="text-2xl lg:text-3xl font-bold text-white mb-2">Welcome Back</h3>
              <p className="text-blue-200 text-sm lg:text-base">Sign in to your admin account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-blue-100">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-blue-200 transition-all duration-200"
                  placeholder="admin@fast2.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-blue-100">
                  Password
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-blue-200 transition-all duration-200"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-400/50 text-red-200 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                  loading
                    ? "bg-blue-500/50 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
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

            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-center text-xs text-blue-200">
                © {new Date().getFullYear()} Fast2 Delivery. All rights reserved.
              </p>
            </div>
          </div>
        </div>

        {/* Branding Section - Appears Second on Mobile */}
        <div className="order-1 lg:order-2 text-white space-y-6 lg:space-y-8 px-4 lg:px-8 mb-8 lg:mb-0 text-center lg:text-left">
          <div className="space-y-3">
            <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Fast2
            </h1>
            <h2 className="text-xl lg:text-2xl font-light text-blue-100">
              Admin Portal
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mx-auto lg:mx-0"></div>
          </div>
          
          <div className="space-y-4 text-blue-100">
            <p className="text-base lg:text-lg leading-relaxed">
              Streamline your delivery operations with our comprehensive admin dashboard.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs lg:text-sm">
              <div className="flex items-center space-x-2 justify-center lg:justify-start">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Real-time tracking</span>
              </div>
              <div className="flex items-center space-x-2 justify-center lg:justify-start">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Analytics dashboard</span>
              </div>
              <div className="flex items-center space-x-2 justify-center lg:justify-start">
                <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                <span>Order management</span>
              </div>
              <div className="flex items-center space-x-2 justify-center lg:justify-start">
                <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                <span>Customer insights</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add custom CSS for animation delays */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.3; }
        }
        .animate-pulse {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}