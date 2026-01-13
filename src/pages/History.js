import React, { useEffect, useState } from "react";

function History() {
  const userEmail = localStorage.getItem("userEmail");
  const [showHistory, setShowHistory] = useState(true);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [viewUserLogs, setViewUserLogs] = useState(userEmail);

  useEffect(() => {
    fetch("https://paranaque-web-system.onrender.com/api/logs")
      .then((res) => res.json())
      .then((data) => {
        console.log('Fetched logs:', data); // Debug log
        setLogs(data.logs);
      })
      .catch((err) => {
        console.error('Error fetching logs:', err); // Debug log
        setError("Failed to fetch logs.");
      });

  }, [viewUserLogs]);

  return (
    <div className="history-page" style={{ padding: "1rem" }}>
      <h1>History</h1>

      {(() => {
        const userLogs = logs.filter(log => log.userEmail === viewUserLogs);

        const relevantLogs = userLogs
          .filter(log =>
            log.action.includes("Requested to borrow book:") ||
            log.action.includes("Returned book:") ||
            log.action.includes("Reservation approved by") ||
            log.action.includes("Reservation requested for book:")
          )
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (relevantLogs.length === 0) {
          return <p>No history data available.</p>;
        }

        return (
          <div
            className="history-container"
            style={{
              maxHeight: "70vh",
              overflowY: "auto",
              paddingRight: "10px"
            }}
          >
            {relevantLogs.map((log, idx) => (
              <div key={idx} className="history-item" style={{ marginBottom: "1rem" }}>
                <p className="history-action">{log.action}</p>
                <p className="history-date">
                  {new Date(log.timestamp).toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );

}

export default History;
