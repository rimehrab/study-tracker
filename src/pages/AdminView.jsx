import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, query, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import Navbar from "../components/Navbar";
import SessionLog from "../components/SessionLog";

export default function AdminView() {
  const [userSessions, setUserSessions] = useState({});
  const [userNames, setUserNames] = useState({});

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

  return (
    <div style={styles.container}>
      <Navbar />
      <div style={styles.content}>
        <h2 style={styles.title}>Admin View</h2>
        <p style={styles.subtitle}>All users' study sessions</p>

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
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", backgroundColor: "#f0f4f8" },
  content: { padding: "1rem", maxWidth: "700px", margin: "0 auto" },
  title: { fontSize: "1.6rem", color: "#1a1a2e", marginBottom: "0.25rem" },
  subtitle: { color: "#888", marginBottom: "1.5rem" },
  empty: { textAlign: "center", color: "#999", marginTop: "2rem" },
  userBlock: {
    marginBottom: "2rem",
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "1.25rem",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  },
  userName: { color: "#1a1a2e", marginBottom: "0.25rem" },
  sessionCount: { color: "#888", fontSize: "0.85rem", marginBottom: "1rem" },
};
