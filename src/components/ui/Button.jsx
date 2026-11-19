const VARIANTS = {
  primary: "bg-gold-500 hover:bg-gold-600 text-black border border-gold-500",
  secondary: "bg-black hover:bg-gray-800 text-white border border-black",
  outline: "bg-white hover:bg-gray-50 text-gray-900 border border-gray-200",
  danger: "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200",
  ghost: "bg-transparent hover:bg-gray-100 text-gray-700 border border-transparent",
};

const Button = ({ children, variant = "primary", className = "", ...props }) => (
  <button
    className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant] || VARIANTS.primary} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default Button;
