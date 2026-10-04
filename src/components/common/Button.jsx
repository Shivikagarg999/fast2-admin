const variants = {
  primary: { backgroundColor: "#111827", color: "#ffffff", borderColor: "#111827" },
  secondary: { backgroundColor: "#ffffff", color: "#374151", borderColor: "#d1d5db" },
  danger: { backgroundColor: "#ffffff", color: "#dc2626", borderColor: "#fca5a5" },
};

const sizes = {
  sm: { padding: "6px 12px", fontSize: "12px" },
  md: { padding: "8px 14px", fontSize: "13px" },
};

const Button = ({ variant = "secondary", size = "md", icon: Icon, children, style, disabled, ...rest }) => (
  <button
    disabled={disabled}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      borderRadius: "8px",
      fontWeight: "600",
      border: "1px solid transparent",
      whiteSpace: "nowrap",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      transition: "background-color 0.15s, color 0.15s",
      ...sizes[size],
      ...variants[variant],
      ...style,
    }}
    {...rest}
  >
    {Icon && <Icon style={{ width: "14px", height: "14px" }} />}
    {children}
  </button>
);

export default Button;
