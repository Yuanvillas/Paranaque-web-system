import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './OverdueNotificationPanel.css';

/**
 * Admin Panel Component for Managing Overdue Book Notifications
 * Features:
 * - View overdue books statistics
 * - Trigger notifications with one click
 * - Dry-run mode to preview emails
 * - Monitor notification results
 */

const OverdueNotificationPanel = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dryRun, setDryRun] = useState(true);
  const [daysMinimum, setDaysMinimum] = useState(1);
  const [showResult, setShowResult] = useState(false);

  // Fetch statistics on component mount
  useEffect(() => {
    fetchStatistics();
    // Refresh every 5 minutes
    const interval = setInterval(fetchStatistics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await axios.get('https://paranaque-web-system.onrender.com/api/transactions/overdue/all');
      
      // Process data for statistics
      const overdue = response.data.overdue || [];
      const byUser = {};
      const byDaysOverdue = {};

      overdue.forEach(item => {
        // Count by user
        if (!byUser[item.userEmail]) {
          byUser[item.userEmail] = 0;
        }
        byUser[item.userEmail]++;

        // Count by days overdue
        const dayRange = Math.ceil(item.daysOverdue / 7) * 7;
        if (!byDaysOverdue[dayRange]) {
          byDaysOverdue[dayRange] = 0;
        }
        byDaysOverdue[dayRange]++;
      });

      setStats({
        total: response.data.count,
        byUser: Object.keys(byUser).length,
        byDaysOverdue,
        requiresNotification: overdue.filter(o => !o.reminderSent).length
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('Failed to fetch overdue statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotifications = async () => {
    setSending(true);
    setShowResult(true);
    setResult(null);

    try {
      const response = await axios.post(
        'https://paranaque-web-system.onrender.com/api/transactions/overdue/notify-all',
        {
          sendEmails: !dryRun,
          markReminderSent: !dryRun,
          daysOverdueMinimum: daysMinimum
        }
      );

      setResult({
        success: true,
        data: response.data,
        isDryRun: dryRun
      });

      // Refresh statistics after sending
      setTimeout(fetchStatistics, 2000);
    } catch (err) {
      console.error('Error sending notifications:', err);
      setResult({
        success: false,
        error: err.response?.data?.message || err.message,
        isDryRun: dryRun
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="overdue-panel">
        <div className="loading">Loading statistics...</div>
      </div>
    );
  }

  return (
    <div className="overdue-panel">
      <div className="panel-header">
        <h2>📚 Overdue Book Notifications</h2>
        <button 
          className="refresh-btn" 
          onClick={fetchStatistics}
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="statistics-section">
        <div className="stat-card">
          <div className="stat-number">{stats?.total || 0}</div>
          <div className="stat-label">Total Overdue</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats?.byUser || 0}</div>
          <div className="stat-label">Users Affected</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats?.requiresNotification || 0}</div>
          <div className="stat-label">Require Notification</div>
        </div>
      </div>

      {/* Days Overdue Breakdown */}
      {stats?.byDaysOverdue && Object.keys(stats.byDaysOverdue).length > 0 && (
        <div className="breakdown-section">
          <h3>Distribution by Days Overdue</h3>
          <div className="breakdown-list">
            {Object.entries(stats.byDaysOverdue).map(([days, count]) => (
              <div key={days} className="breakdown-item">
                <span className="days-label">{days} days</span>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${(count / stats.total) * 100}%` }}
                  ></div>
                </div>
                <span className="count-label">{count} books</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Control Section */}
      <div className="control-section">
        <h3>Send Notifications</h3>

        <div className="controls">
          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                disabled={sending}
              />
              <span className="checkbox-label">
                Dry Run (Preview without sending)
              </span>
            </label>
            <p className="help-text">
              {dryRun 
                ? '✓ No emails will be sent. Use this to preview what would happen.'
                : '⚠️ Real emails will be sent to all users with overdue books.'}
            </p>
          </div>

          <div className="control-group">
            <label htmlFor="daysMinimum">
              Minimum Days Overdue:
            </label>
            <input
              id="daysMinimum"
              type="number"
              min="0"
              max="365"
              value={daysMinimum}
              onChange={(e) => setDaysMinimum(parseInt(e.target.value) || 0)}
              disabled={sending}
              className="input-field"
            />
            <p className="help-text">
              Only notify for books overdue {daysMinimum} or more day(s)
            </p>
          </div>
        </div>

        <button
          className={`send-btn ${sending ? 'loading' : ''} ${dryRun ? 'dry-run' : 'real'}`}
          onClick={handleSendNotifications}
          disabled={sending || stats?.total === 0}
          title={stats?.total === 0 ? 'No overdue books to notify' : ''}
        >
          {sending ? (
            <>
              <span className="spinner"></span>
              {dryRun ? 'Running Preview...' : 'Sending Notifications...'}
            </>
          ) : (
            <>
              {dryRun ? '👁️ Preview Notifications' : '📧 Send Notifications'}
            </>
          )}
        </button>
      </div>

      {/* Result Section */}
      {showResult && result && (
        <div className={`result-section ${result.success ? 'success' : 'error'}`}>
          <div className="result-header">
            <h3>
              {result.isDryRun ? '👁️ Preview Results' : '📧 Notification Results'}
            </h3>
            <button 
              className="close-btn"
              onClick={() => setShowResult(false)}
            >
              ×
            </button>
          </div>

          {result.success ? (
            <>
              <div className="result-message success-message">
                ✅ {result.data.message}
              </div>

              <div className="result-details">
                <div className="detail-row">
                  <span className="detail-label">Total Overdue Books:</span>
                  <span className="detail-value">{result.data.overdueCount}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Users Notified:</span>
                  <span className="detail-value">{result.data.notificationsQueued}</span>
                </div>
                {result.data.results && (
                  <div className="detail-row">
                    <span className="detail-label">Successful:</span>
                    <span className="detail-value">
                      {result.data.results.filter(r => r.success).length}
                    </span>
                  </div>
                )}
              </div>

              {result.data.results && result.data.results.length > 0 && (
                <div className="results-list">
                  <h4>Details by User:</h4>
                  <div className="user-results">
                    {result.data.results.slice(0, 10).map((userResult, idx) => (
                      <div key={idx} className="user-result-item">
                        <div className="user-info">
                          <span className="user-email">{userResult.userEmail}</span>
                          <span className={`status ${userResult.success ? 'success' : 'error'}`}>
                            {userResult.success ? '✓' : '✗'}
                          </span>
                        </div>
                        <div className="user-details">
                          {userResult.bookCount} book{userResult.bookCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                  {result.data.results.length > 10 && (
                    <p className="more-results">
                      ... and {result.data.results.length - 10} more
                    </p>
                  )}
                </div>
              )}

              {result.data.errors && result.data.errors.length > 0 && (
                <div className="errors-list">
                  <h4>Errors ({result.data.errors.length}):</h4>
                  {result.data.errors.slice(0, 5).map((err, idx) => (
                    <div key={idx} className="error-item">
                      <span>{err.userEmail}: {err.error}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="result-message error-message">
              ❌ Error: {result.error}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};

export default OverdueNotificationPanel;
