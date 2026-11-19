const StatCard = ({ label, value, hint, icon, highlight = false, className = "" }) => (
  <div
    className={`rounded-2xl p-5 shadow-sm shadow-black/5 border ${
      highlight ? "bg-gold-400 border-gold-400 text-black" : "bg-white border-gray-100 text-gray-900"
    } ${className}`}
  >
    <div className="flex items-center justify-between gap-2">
      <span className={`text-xs font-semibold uppercase tracking-wide ${highlight ? "text-black/70" : "text-gray-500"}`}>
        {label}
      </span>
      {icon && (
        <span className={`flex-shrink-0 ${highlight ? "text-black/60" : "text-gold-600"}`}>{icon}</span>
      )}
    </div>
    <div className="text-2xl font-bold mt-2">{value}</div>
    {hint && <div className={`text-xs mt-1 ${highlight ? "text-black/60" : "text-gray-400"}`}>{hint}</div>}
  </div>
);

export default StatCard;
