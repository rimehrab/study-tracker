export default function SessionLog({ sessions }) {
  function formatDuration(ms) {
    if (!ms) return "0h 0m 0s";
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}h ${m}m ${s}s`;
  }

  function formatDateTime(timestamp) {
    if (!timestamp) return "--";
    const date = timestamp.toDate();
    return date.toLocaleString("en-BD", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  if (sessions.length === 0) {
    return <p style={styles.empty}>No sessions yet. Start your first session!</p>;
  }

  return (
    <div style={styles.container}>
      {sessions.map((session, index) => (
        <div key={session.id} style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.sessionNumber}>Session #{sessions.length - index}</span>
            <span
              style={{
                ...styles.badge,
                backgroundColor: session.status === "auto-stopped" ? "#f59e0b" : "#10b981",
              }}
            >
              {session.status === "auto-stopped" ? "Auto Stopped" : "Completed"}
            </span>
          </div>

          <div style={styles.row}>
            <span style={styles.label}>Started</span>
            <span style={styles.value}>{formatDateTime(session.startTime)}</span>
          </div>

          <div style={styles.row}>
            <span style={styles.label}>Stopped</span>
            <span style={styles.value}>{formatDateTime(session.stopTime)}</span>
          </div>

          <div style={styles.row}>
            <span style={styles.label}>Total Study Time</span>
            <span style={{ ...styles.value, fontWeight: "700", color: "#4f46e5" }}>
              {formatDuration(session.totalStudyMs)}
            </span>
          </div>

          {session.pauses && session.pauses.length > 0 && (
            <div style={styles.pauseSection}>
              <p style={styles.pauseTitle}>Pauses ({session.pauses.length})</p>
              {session.pauses.map((pause, i) => (
                <div key={i} style={styles.pauseRow}>
                  <span>Pause {i + 1}:</span>
                  <span>{formatDateTime(pause.pausedAt)}</span>
                  <span>→</span>
                  <span>{formatDateTime(pause.resumedAt)}</span>
                  <span style={{ color: "#f59e0b" }}>({formatDuration(pause.durationMs)})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: { display: "flex", flexDirection: "column", gap: "1rem" },
  empty: { textAlign: "center", color: "#999", marginTop: "2rem" },
  card: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "1.25rem",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  sessionNumber: { fontWeight: "700", color: "#1a1a2e", fontSize: "1rem" },
  badge: {
    padding: "0.25rem 0.75rem",
    borderRadius: "20px",
    color: "#fff",
    fontSize: "0.75rem",
    fontWeight: "600",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "0.5rem",
    flexWrap: "wrap",
    gap: "0.25rem",
  },
  label: { color: "#888", fontSize: "0.9rem" },
  value: { color: "#1a1a2e", fontSize: "0.9rem" },
  pauseSection: {
    marginTop: "1rem",
    borderTop: "1px solid #f0f0f0",
    paddingTop: "0.75rem",
  },
  pauseTitle: { fontWeight: "600", color: "#1a1a2e", marginBottom: "0.5rem" },
  pauseRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.4rem",
    fontSize: "0.8rem",
    color: "#555",
    marginBottom: "0.4rem",
  },
};
