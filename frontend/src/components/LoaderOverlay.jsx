// components/LoaderOverlay.jsx
import { useLoading } from "../contexts/LoadingContext";

export default function LoaderOverlay() {
  const { active } = useLoading();
  if (!active) return null;

  return (
    <>
      {/* keyframes para el spinner */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={styles.backdrop}>
        <div style={styles.box}>
          <div style={styles.spinner} />
          <div>Cargando...</div>
        </div>
      </div>
    </>
  );
}

const styles = {
  backdrop: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
  },
  box: {
    background: "#fff", padding: "18px 22px", borderRadius: 12,
    display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
    boxShadow: "0 8px 30px rgba(0,0,0,0.2)"
  },
  spinner: {
    width: 32, height: 32, border: "3px solid #e5e7eb", borderTopColor: "#3b82f6",
    borderRadius: "50%", animation: "spin 1s linear infinite"
  }
};
