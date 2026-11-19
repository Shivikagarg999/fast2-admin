const VARIANTS = {
  dark: "bg-black text-white",
  gold: "bg-gold-400 text-black",
  pale: "bg-gold-100 text-gold-800",
  outline: "bg-white text-gray-700 border border-gray-200",
  success: "bg-emerald-100 text-emerald-700",
  danger: "bg-red-100 text-red-700",
};

const Badge = ({ children, variant = "pale", className = "" }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${VARIANTS[variant] || VARIANTS.pale} ${className}`}
  >
    {children}
  </span>
);

export default Badge;
