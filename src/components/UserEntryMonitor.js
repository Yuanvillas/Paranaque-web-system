import React, { useEffect, useState } from 'react';
import './App.css';

const UserEntryMonitor = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, today, week

  useEffect(() => {
    fetchUserEntries();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchUserEntries, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUserEntries = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://paranaque-web-system.onrender.com/api/logs');
      const data = await response.json();
      
      if (response.ok) {
        // Filter for login/logout related logs
        const userEntries = data.logs
          .filter(log => 
            log.action.toLowerCase().includes('login') || 
            log.action.toLowerCase().includes('logout') ||
            log.action.toLowerCase().includes('registered')
          )
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        setEntries(userEntries);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch user entries');
      }
    } catch (err) {
      setError('Error connecting to server. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEntries = () => {
    const now = new Date();
    return entries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      
      if (filter === 'today') {
        return entryDate.toDateString() === now.toDateString();
      } else if (filter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return entryDate >= weekAgo;
      }
      return true; // 'all'
    });
  };

  const filteredEntries = getFilteredEntries();

  if (loading && entries.length === 0) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>User Entry Monitor</h2>
        <p style={styles.loadingText}>Loading user entries...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>User Entry Monitor</h2>
        <div style={styles.filterContainer}>
          <button
            onClick={() => setFilter('all')}
            style={{
              ...styles.filterButton,
              ...(filter === 'all' ? styles.filterButtonActive : {})
            }}
          >
            All Time
          </button>
          <button
            onClick={() => setFilter('today')}
            style={{
              ...styles.filterButton,
              ...(filter === 'today' ? styles.filterButtonActive : {})
            }}
          >
            Today
          </button>
          <button
            onClick={() => setFilter('week')}
            style={{
              ...styles.filterButton,
              ...(filter === 'week' ? styles.filterButtonActive : {})
            }}
          >
            Last 7 Days
          </button>
          <button
            onClick={fetchUserEntries}
            style={styles.refreshButton}
            title="Refresh data"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && <div style={styles.errorMessage}>{error}</div>}

      {!error && filteredEntries.length === 0 ? (
        <div style={styles.noDataMessage}>
          <p>No user entries found for the selected period.</p>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>User Email</th>
                <th style={styles.th}>Action</th>
                <th style={styles.th}>Date & Time</th>
                <th style={styles.th}>Time Ago</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry, idx) => {
                const entryTime = new Date(entry.timestamp);
                const now = new Date();
                const diffMs = now - entryTime;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMs / 3600000);
                const diffDays = Math.floor(diffMs / 86400000);
                
                let timeAgo = '';
                if (diffMins < 1) timeAgo = 'Just now';
                else if (diffMins < 60) timeAgo = `${diffMins}m ago`;
                else if (diffHours < 24) timeAgo = `${diffHours}h ago`;
                else timeAgo = `${diffDays}d ago`;

                return (
                  <tr key={idx} style={styles.tableRow}>
                    <td style={styles.td}>{entry.userEmail}</td>
                    <td style={{ 
                      ...styles.td, 
                      color: entry.action.toLowerCase().includes('logout') ? '#ff6b6b' : '#1dbf73', 
                      fontWeight: '500' 
                    }}>
                      {entry.action}
                    </td>
                    <td style={styles.td}>
                      {entryTime.toLocaleString()}
                    </td>
                    <td style={{ ...styles.td, color: '#666', fontSize: '0.9rem' }}>
                      {timeAgo}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Entries</div>
          <div style={styles.statValue}>{entries.length}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Today's Entries</div>
          <div style={styles.statValue}>
            {entries.filter(e => new Date(e.timestamp).toDateString() === new Date().toDateString()).length}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Last 7 Days</div>
          <div style={styles.statValue}>
            {entries.filter(e => new Date(e.timestamp) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginTop: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#333',
    margin: 0,
  },
  filterContainer: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  filterButton: {
    padding: '8px 16px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    background: '#f9f9f9',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    transition: 'all 0.3s ease',
  },
  filterButtonActive: {
    background: '#1dbf73',
    color: '#fff',
    borderColor: '#1dbf73',
  },
  refreshButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    background: '#e3f2fd',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#1976d2',
    transition: 'all 0.3s ease',
  },
  errorMessage: {
    padding: '12px 16px',
    background: '#ffebee',
    color: '#c62828',
    borderRadius: '6px',
    marginBottom: '16px',
    border: '1px solid #ef5350',
  },
  noDataMessage: {
    padding: '32px 16px',
    textAlign: 'center',
    color: '#999',
    fontSize: '16px',
  },
  tableWrapper: {
    overflowX: 'auto',
    marginBottom: '24px',
    maxHeight: '500px',
    overflowY: 'auto',
    borderRadius: '6px',
    border: '1px solid #e0e0e0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  tableHeader: {
    background: '#f5f5f5',
    borderBottom: '2px solid #e0e0e0',
    position: 'sticky',
    top: 0,
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#555',
    borderRight: '1px solid #e0e0e0',
  },
  tableRow: {
    borderBottom: '1px solid #f0f0f0',
    transition: 'background-color 0.2s ease',
  },
  td: {
    padding: '12px 16px',
    color: '#333',
    borderRight: '1px solid #f0f0f0',
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginTop: '24px',
  },
  statCard: {
    padding: '16px',
    background: '#f9f9f9',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
    fontWeight: '600',
    marginBottom: '8px',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1dbf73',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontSize: '16px',
  },
};

export default UserEntryMonitor;
