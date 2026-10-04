const Tabs = ({ tabs, active, onChange }) => (
  <div style={{
    display: "flex",
    gap: "4px",
    borderBottom: "1px solid #e5e7eb",
    marginBottom: "20px",
    overflowX: "auto",
  }}>
    {tabs.map((tab) => {
      const isActive = active === tab.key;
      return (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            padding: "10px 14px",
            fontSize: "13px",
            fontWeight: "600",
            background: "none",
            border: "none",
            borderBottom: isActive ? "2px solid #111827" : "2px solid transparent",
            color: isActive ? "#111827" : "#6b7280",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {tab.label}
        </button>
      );
    })}
  </div>
);

export default Tabs;
