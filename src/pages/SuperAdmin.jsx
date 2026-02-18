import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import Navbar from "../components/Navbar";
import SessionLog from "../components/SessionLog";

export default function SuperAdmin() {
  const [userSessions, setUserSessions] = useState({});
  const [userNames, setUserNames] = useState({});
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("sessions");

  useEffect(() => {
    const q = query(collection(db, "sessions"), orderBy("startTime", "desc"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const allSessions = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      const grouped = {};
      for (const session of allSessions) {
        if (!grouped[session.userId]) grouped[session.userId] = [];
        grouped[session.userId].push(session);
      }
      setUserSessions(grouped);

      const newNames = { ...userNames };
      for (const userId of Object.keys(grouped)) {
        if (!newNames[userId]) {
          const userDoc = await getDoc(doc(db, "users", userId));
          if (userDoc.exists()) {
            newNames[userId] = userDoc.data().name || userDoc.data().email;
          } else {
            newNames[userId] = userId;
          }
        }
      }
      setUserNames(newNames);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const allUsers = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(allUsers);
    });
    return unsubscribe;
  }, []);

  async function handleRoleChange(userId, newRole) {
    await updateDoc(doc(db, "users", userId), { role: newRole });
  }

  async function handleDeleteUser(userId) {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    const q = query(collection(db, "sessions"));
    const snapshot = await getDocs(q);
    for (const d of snapshot.docs) {
      if (d.data().userId === userId) await deleteDoc(doc(db, "sessions", d.id));
    }
    await deleteDoc(doc(db, "users", userId));
  }

  return (
    <div style={styles.container}>
      <Navbar />
      <div style={styles.content}>
        <h2 style={styles.title}>Super Admin Panel</h2>

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(activeTab === "sessions" ? styles.activeTab : {}) }}
            onClick={() => setActiveTab("sessions")}
          >
            All Sessions
          </button>
          <button
            style={{ ...styles.tab, ...(activeTab === "users" ? styles.activeTab : {}) }}
            onClick={() => setActiveTab("users")}
          >
            Manage Users
          </button>
        </div>

        {activeTab === "sessions" && (
          <div>
            {Object.keys(userSessions).length === 0 && (
              <p style={styles.empty}>No sessions recorded yet.</p>
            )}
            {Object.entries(userSessions).map(([userId, sessions]) => (
              <div key={userId} style={styles.userBlock}>
                <h3 style={styles.userName}>👤 {userNames[userId] || userId}</h3>
                <p style={styles.sessionCount}>{sessions.length} session(s)</p>
                <SessionLog
                  sessions={sessions.filter(
                    (s) => s.status === "stopped" || s.status === "auto-stopped"
                  )}
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === "users" && (
          <div>
            {users.map((user) => (
              <div key={user.id} style={styles.userCard}>
                <div style={styles.userInfo}>
                  <p style={styles.userName}>{user.name}</p>
                  <p style={styles.userEmail}>{user.email}</p>
                </div>
                <div style={styles.userActions}>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    style={styles.select}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                  <button
                    style={styles.deleteBtn}
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", backgroundColor: "#f0f4f8" },
  content: { padding: "1rem", maxWidth: "700px", margin: "0 auto" },
  title: { fontSize: "1.6rem", color: "#1a1a2e", marginBottom: "1rem" },
  tabs: { display: "flex", gap: "0.5rem", marginBottom: "1.5rem" },
  tab: {
    padding: "0.5rem 1.25rem",
    borderRadius: "8px",
    border: "1px solid #ddd",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontSize: "0.9rem",
    color: "#555",
  },
  activeTab: {
    backgroundColor: "#4f46e5",
    color: "#fff",
    border: "1px solid #4f46e5",
  },
  empty: { textAlign: "center", color: "#999", marginTop: "2rem" },
  userBlock: {
    marginBottom: "2rem",
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "1.25rem",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  },
  userName: { color: "#1a1a2e", fontWeight: "600", marginBottom: "0.25rem" },
  sessionCount: { color: "#888", fontSize: "0.85rem", marginBottom: "1rem" },
  userCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "1rem 1.25rem",
    marginBottom: "0.75rem",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
    flexWrap: "wrap",
    gap: "0.5rem",
  },
  userInfo: { display: "flex", flexDirection: "column" },
  userEmail: { color: "#888", fontSize: "0.85rem" },
  userActions: { display: "flex", gap: "0.5rem", alignItems: "center" },
  select: {
    padding: "0.4rem 0.75rem",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "0.85rem",
    cursor: "pointer",
  },
  deleteBtn: {
    padding: "0.4rem 0.9rem",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#ef4444",
    color: "#fff",
    cursor: "pointer",
    fontSize: "0.85rem",
  },
};
