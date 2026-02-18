import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import Navbar from "../components/Navbar";
import SessionLog from "../components/SessionLog";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "sessions"),
      where("userId", "==", currentUser.uid),
      orderBy("startTime", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allSessions = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      const active = allSessions.find(
        (s) => s.status === "active" || s.status === "paused"
      );

      if (active) {
        const startTime = active.startTime?.toDate();
        if (startTime) {
          const hoursElapsed = (Date.now() - startTime.getTime()) / 1000 / 3600;
          if (hoursElapsed >= 10) {
            autoStop(active);
            return;
          }
        }
        setActiveSession(active);
        setStatus(active.status);
      } else {
        setActiveSession(null);
        setStatus("idle");
      }

      setSessions(allSessions.filter((s) => s.status === "stopped" || s.status === "auto-stopped"));
    });

    return unsubscribe;
  }, [currentUser]);

  useEffect(() => {
    if (status !== "active" || !activeSession) return;

    const startTime = activeSession.startTime?.toDate();
    const pausedDuration = activeSession.totalPausedMs || 0;

    const interval = setInterval(() => {
      const now = Date.now();
      const raw = now - startTime.getTime() - pausedDuration;
      setElapsed(Math.floor(raw / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [status, activeSession]);

  async function autoStop(session) {
    const stopTime = Timestamp.now();
    const startTime = session.startTime.toDate();
    const totalMs = stopTime.toDate() - startTime - (session.totalPausedMs || 0);

    await updateDoc(doc(db, "sessions", session.id), {
      status: "auto-stopped",
      stopTime,
      totalStudyMs: totalMs,
    });
  }

  async function handleStart() {
    await addDoc(collection(db, "sessions"), {
      userId: currentUser.uid,
      startTime: serverTimestamp(),
      status: "active",
      pauses: [],
      totalPausedMs: 0,
    });
    setStatus("active");
  }

  async function handlePause() {
    if (!activeSession) return;
    const pausedAt = Timestamp.now();
    await updateDoc(doc(db, "sessions", activeSession.id), {
      status: "paused",
      currentPauseStart: pausedAt,
    });
    setStatus("paused");
  }

  async function handleResume() {
    if (!activeSession) return;
    const resumedAt = Timestamp.now();
    const pausedAt = activeSession.currentPauseStart.toDate();
    const pauseDurationMs = resumedAt.toDate() - pausedAt;

    const updatedPauses = [
      ...(activeSession.pauses || []),
      {
        pausedAt: activeSession.currentPauseStart,
        resumedAt,
        durationMs: pauseDurationMs,
      },
    ];

    await updateDoc(doc(db, "sessions", activeSession.id), {
      status: "active",
      pauses: updatedPauses,
      totalPausedMs: (activeSession.totalPausedMs || 0) + pauseDurationMs,
      currentPauseStart: null,
    });
    setStatus("active");
  }

  async function handleStop() {
    if (!activeSession) return;
    const stopTime = Timestamp.now();
    const startTime = activeSession.startTime.toDate();
    const totalMs = stopTime.toDate() - startTime - (activeSession.totalPausedMs || 0);

    await updateDoc(doc(db, "sessions", activeSession.id), {
      status: "stopped",
      stopTime,
      totalStudyMs: totalMs,
    });
    setActiveSession(null);
    setStatus("idle");
    setElapsed(0);
  }

  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  }

  return (
    <div style={styles.container}>
      <Navbar />
      <div style={styles.content}>
        <h2 style={styles.greeting}>Hey, {currentUser?.email?.split("@")[0]} 👋</h2>

        <div style={styles.timerCard}>
          <p style={styles.timerLabel}>
            {status === "idle" && "Ready to study?"}
            {status === "active" && "Study session in progress"}
            {status === "paused" && "Session paused"}
          </p>
          <h1 style={styles.timerDisplay}>
            {status === "idle" ? "00:00:00" : formatTime(elapsed)}
          </h1>

          <div style={styles.buttonRow}>
            {status === "idle" && (
              <button style={{ ...styles.btn, backgroundColor: "#4f46e5" }} onClick={handleStart}>
                Start
              </button>
            )}
            {status === "active" && (
              <>
                <button style={{ ...styles.btn, backgroundColor: "#f59e0b" }} onClick={handlePause}>
                  Pause
                </button>
                <button style={{ ...styles.btn, backgroundColor: "#ef4444" }} onClick={handleStop}>
                  Stop
                </button>
              </>
            )}
            {status === "paused" && (
              <>
                <button style={{ ...styles.btn, backgroundColor: "#10b981" }} onClick={handleResume}>
                  Resume
                </button>
                <button style={{ ...styles.btn, backgroundColor: "#ef4444" }} onClick={handleStop}>
                  Stop
                </button>
              </>
            )}
          </div>
        </div>

        <h3 style={styles.sectionTitle}>Your Sessions</h3>
        <SessionLog sessions={sessions} />
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", backgroundColor: "#f0f4f8" },
  content: { padding: "1rem", maxWidth: "600px", margin: "0 auto" },
  greeting: { fontSize: "1.4rem", color: "#1a1a2e", marginBottom: "1rem" },
  timerCard: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: "2rem",
    textAlign: "center",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    marginBottom: "2rem",
  },
  timerLabel: { color: "#666", marginBottom: "0.5rem" },
  timerDisplay: { fontSize: "3.5rem", fontWeight: "700", color: "#1a1a2e", margin: "0.5rem 0 1.5rem" },
  buttonRow: { display: "flex", gap: "1rem", justifyContent: "center" },
  btn: {
    padding: "0.75rem 2rem",
    borderRadius: "10px",
    border: "none",
    color: "#fff",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
  },
  sectionTitle: { color: "#1a1a2e", marginBottom: "1rem" },
};
