import { FiX } from "react-icons/fi";

export const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(15, 23, 42, 0.45)",
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "16px",
  zIndex: 50,
};

const Modal = ({ title, onClose, children, maxWidth = "720px" }) => (
  <div style={modalOverlayStyle} onClick={onClose}>
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "20px",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.25)",
        width: "100%",
        maxWidth,
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 24px",
        borderBottom: "1px solid #f3f4f6",
      }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#111827", margin: 0 }}>{title}</h2>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ background: "#f9fafb", border: "none", borderRadius: "9999px", cursor: "pointer", color: "#6b7280", padding: "6px" }}
        >
          <FiX style={{ width: "18px", height: "18px" }} />
        </button>
      </div>
      <div style={{ padding: "20px", overflowY: "auto" }}>{children}</div>
    </div>
  </div>
);

export default Modal;
