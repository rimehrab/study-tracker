import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login, currentUser, role, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  // Redirect once Firebase restores session and role is known
  useEffect(() => {
    if (!loading && currentUser && role) {
      if (role === "superadmin") navigate("/superadmin");
      else if (role === "admin") navigate("/admin");
      else navigate("/dashboard");
    }
  }, [loading, currentUser, role]);

  // Show nothing while Firebase is restoring session
  if (loading) return null;

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoggingIn(true);
    try {
      await login(email, password);
      // Navigation handled by useEffect above once role loads
    } catch (err) {
      setError("Invalid email or password");
      setLoggingIn(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Study Tracker</h2>
        <p style={styles.subtitle}>Sign in to your account</p>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleLogin} style={styles.form}>
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button style={styles.button} type="submit" disabled={loggingIn}>
            {loggingIn ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f4f8",
  },
  card: {
    backgroundColor: "#fff",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "380px",
  },
  title: {
    margin: "0 0 0.25rem",
    fontSize: "1.8rem",
    textAlign: "center",
    color: "#1a1a2e",
  },
  subtitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: "1.5rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  input: {
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "1rem",
    outline: "none",
  },
  button: {
    padding: "0.75rem",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#4f46e5",
    color: "#fff",
    fontSize: "1rem",
    cursor: "pointer",
    fontWeight: "600",
  },
  error: {
    color: "red",
    textAlign: "center",
    marginBottom: "0.5rem",
  },
};
