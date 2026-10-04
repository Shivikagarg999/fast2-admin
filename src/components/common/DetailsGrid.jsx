const isIsoDate = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value);

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  if (isIsoDate(value)) return new Date(value).toLocaleString();
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.length ? `${value.length} item(s)` : "None";
  if (typeof value === "object") {
    if (value.url) return value.url;
    return JSON.stringify(value);
  }
  return String(value);
};

const flatten = (obj, prefix = "") =>
  Object.entries(obj || {}).flatMap(([key, value]) => {
    const label = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value) && !isIsoDate(value) && Object.keys(value).length && !(value instanceof Date)) {
      return flatten(value, label);
    }
    return [[label, value]];
  });

const DetailsGrid = ({ data, exclude = [], title = "All details" }) => {
  if (!data) return null;
  const rows = flatten(data).filter(([key]) => !exclude.includes(key) && !exclude.includes(key.split(".")[0]));

  return (
    <div style={{ marginTop: "20px" }}>
      <div style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
        {title}
      </div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden" }}>
        {rows.map(([key, value], index) => {
          const isId = key === "_id" || key.endsWith("Id") || key.endsWith(".id") || key === "id";
          return (
            <div
              key={key}
              style={{
                display: "grid",
                gridTemplateColumns: "200px 1fr",
                gap: "12px",
                padding: "8px 14px",
                borderTop: index === 0 ? "none" : "1px solid #f3f4f6",
                fontSize: "13px",
                alignItems: "start",
              }}
            >
              <span style={{ color: "#6b7280", wordBreak: "break-word" }}>{key}</span>
              <span
                style={{
                  color: "#111827",
                  wordBreak: "break-all",
                  fontFamily: isId ? "ui-monospace, SFMono-Regular, Menlo, monospace" : "inherit",
                  whiteSpace: "pre-wrap",
                }}
              >
                {formatValue(value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DetailsGrid;
