import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { currentUser, role, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div style={styles.navbar}>
      <span style={styles.logo}>📚 Study Tracker</span>
      <div style={styles.right}>
        {(role === "admin" || role === "superadmin") && (
          <button
            style={styles.navBtn}
            onClick={() => navigate(role === "superadmin" ? "/superadmin" : "/admin")}
          >
            {role === "superadmin" ? "Super Admin" : "Admin"}
          </button>
        )}
        {(role === "admin" || role === "superadmin") && (
          <button style={styles.navBtn} onClick={() => navigate("/dashboard")}>
            Dashboard
          </button>
        )}
        <span style={styles.email}>{currentUser?.email?.split("@")[0]}</span>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 1.5rem",
    backgroundColor: "#1a1a2e",
    color: "#fff",
    flexWrap: "wrap",
    gap: "0.5rem",
  },
  logo: { fontSize: "1.2rem", fontWeight: "700" },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    flexWrap: "wrap",
  },
  email: { fontSize: "0.9rem", color: "#aaa" },
  navBtn: {
    padding: "0.4rem 0.9rem",
    borderRadius: "8px",
    border: "1px solid #4f46e5",
    backgroundColor: "transparent",
    color: "#fff",
    cursor: "pointer",
    fontSize: "0.85rem",
  },
  logoutBtn: {
    padding: "0.4rem 0.9rem",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#ef4444",
    color: "#fff",
    cursor: "pointer",
    fontSize: "0.85rem",
  },
};
