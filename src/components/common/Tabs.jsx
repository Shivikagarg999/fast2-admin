const Tabs = ({ tabs, active, onChange }) => (
  <div style={{
    display: "flex",
    gap: "4px",
    backgroundColor: "#f9fafb",
    borderRadius: "9999px",
    padding: "4px",
    marginBottom: "20px",
    overflowX: "auto",
    width: "fit-content",
    maxWidth: "100%",
  }}>
    {tabs.map((tab) => {
      const isActive = active === tab.key;
      return (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: "600",
            borderRadius: "9999px",
            border: "none",
            backgroundColor: isActive ? "#ffffff" : "transparent",
            color: isActive ? "#111827" : "#6b7280",
            boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "all 0.15s",
          }}
        >
          {tab.label}
        </button>
      );
    })}
  </div>
);

export default Tabs;
