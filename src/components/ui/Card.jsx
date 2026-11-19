const Card = ({ children, className = "", padded = true, solid = false }) => (
  <div
    className={`rounded-2xl border ${
      solid
        ? "bg-gold-400 border-gold-400 text-black"
        : "bg-white border-gray-100 text-gray-900"
    } shadow-sm shadow-black/5 ${padded ? "p-6" : ""} ${className}`}
  >
    {children}
  </div>
);

export default Card;
