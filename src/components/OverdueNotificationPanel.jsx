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
  const [reservationStats, setReservationStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendingReservation, setSendingReservation] = useState(false);
  const [result, setResult] = useState(null);
  const [reservationResult, setReservationResult] = useState(null);
  const [error, setError] = useState(null);
  const [dryRun, setDryRun] = useState(true);
  const [dryRunReservation, setDryRunReservation] = useState(true);
  const [daysMinimum, setDaysMinimum] = useState(1);
  const [showResult, setShowResult] = useState(false);
  const [showReservationResult, setShowReservationResult] = useState(false);
  const [showOverdueDetail, setShowOverdueDetail] = useState(false);
  const [showReservationDetail, setShowReservationDetail] = useState(false);
  const [overdueBooks, setOverdueBooks] = useState([]);
  const [pendingReservations, setPendingReservations] = useState([]);

  // Fetch statistics on component mount
  useEffect(() => {
    fetchStatistics();
    fetchReservationStatistics();
    // Refresh every 5 minutes
    const interval = setInterval(() => {
      fetchStatistics();
      fetchReservationStatistics();
    }, 5 * 60 * 1000);
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
      setOverdueBooks(overdue);
      setError(null);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('Failed to fetch overdue statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchReservationStatistics = async () => {
    try {
      const response = await axios.get('https://paranaque-web-system.onrender.com/api/transactions/reservation/pending');
      
      const reservations = response.data.reservations || [];
      const byUser = {};

      reservations.forEach(item => {
        // Count by user
        if (!byUser[item.userEmail]) {
          byUser[item.userEmail] = 0;
        }
        byUser[item.userEmail]++;
      });

      setReservationStats({
        total: reservations.length,
        byUser: Object.keys(byUser).length,
        requiresNotification: reservations.filter(r => !r.notificationSent).length
      });
      setPendingReservations(reservations);
    } catch (err) {
      console.error('Error fetching reservation statistics:', err);
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

  const handleSendReservationNotifications = async () => {
    setSendingReservation(true);
    setShowReservationResult(true);
    setReservationResult(null);

    try {
      const response = await axios.post(
        'https://paranaque-web-system.onrender.com/api/transactions/reservation/notify-pending',
        {
          sendEmails: !dryRunReservation,
          markNotificationSent: !dryRunReservation
        }
      );

      setReservationResult({
        success: true,
        data: response.data,
        isDryRun: dryRunReservation
      });

      // Refresh statistics after sending
      setTimeout(fetchReservationStatistics, 2000);
    } catch (err) {
      console.error('Error sending reservation notifications:', err);
      setReservationResult({
        success: false,
        error: err.response?.data?.message || err.message,
        isDryRun: dryRunReservation
      });
    } finally {
      setSendingReservation(false);
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
          onClick={() => {
            fetchStatistics();
            fetchReservationStatistics();
          }}
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Overdue Section */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px', color: '#333' }}>
          Overdue Books
        </h3>
        {/* Statistics Cards */}
        <div className="statistics-section">
        <div 
          className="stat-card" 
          style={{ cursor: 'pointer', transition: 'all 0.3s' }}
          onClick={() => setShowOverdueDetail(true)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          }}
        >
          <div className="stat-number">{stats?.total || 0}</div>
          <div className="stat-label">Total Overdue</div>
          <div style={{ fontSize: '12px', color: '#4CAF50', marginTop: '8px' }}>Click to view details →</div>
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
      </div>

      {/* Reservation Section */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px', color: '#333' }}>
          Pending Reservations
        </h3>
        {/* Reservation Statistics Cards */}
        <div className="statistics-section">
          <div 
            className="stat-card" 
            style={{ cursor: 'pointer', transition: 'all 0.3s', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            onClick={() => setShowReservationDetail(true)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
          >
            <div className="stat-number">{reservationStats?.total || 0}</div>
            <div className="stat-label">Pending Reservations</div>
            <div style={{ fontSize: '12px', color: '#fff', marginTop: '8px' }}>Click to view details →</div>
          </div>
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <div className="stat-number">{reservationStats?.byUser || 0}</div>
            <div className="stat-label">Users with Pending</div>
          </div>
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <div className="stat-number">{reservationStats?.requiresNotification || 0}</div>
            <div className="stat-label">Require Notification</div>
          </div>
        </div>

        {/* Control Section for Reservations */}
        <div className="control-section">
          <h3>Send Reservation Notifications</h3>

          <div className="controls">
            <div className="control-group">
              <label>
                <input
                  type="checkbox"
                  checked={dryRunReservation}
                  onChange={(e) => setDryRunReservation(e.target.checked)}
                  disabled={sendingReservation}
                />
                <span className="checkbox-label">
                  Dry Run (Preview without sending)
                </span>
              </label>
              <p className="help-text">
                {dryRunReservation 
                  ? '✓ No emails will be sent. Use this to preview what would happen.'
                  : '⚠️ Real emails will be sent to all users with pending reservations.'}
              </p>
            </div>
          </div>

          <button
            className={`send-btn ${sendingReservation ? 'loading' : ''} ${dryRunReservation ? 'dry-run' : 'real'}`}
            onClick={handleSendReservationNotifications}
            disabled={sendingReservation || reservationStats?.total === 0}
            title={reservationStats?.total === 0 ? 'No pending reservations to notify' : ''}
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            {sendingReservation ? (
              <>
                <span className="spinner"></span>
                {dryRunReservation ? 'Running Preview...' : 'Sending Notifications...'}
              </>
            ) : (
              <>
                {dryRunReservation ? '👁️ Preview Notifications' : '📧 Send Notifications'}
              </>
            )}
          </button>
        </div>
      </div>
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

      {/* Overdue Books Detail Modal */}
      {showOverdueDetail && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            maxWidth: '800px',
            width: '90%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '12px',
            backgroundColor: '#fff',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            zIndex: 10000
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#333' }}>
                📚 Overdue Books Details
              </h2>
              <button
                onClick={() => setShowOverdueDetail(false)}
                style={{
                  fontSize: '28px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#999',
                  padding: 0
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ 
              overflowY: 'auto', 
              flex: 1, 
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {overdueBooks.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                  No overdue books found.
                </p>
              ) : (
                overdueBooks.map((book, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '14px',
                      backgroundColor: '#f9f9f9',
                      borderRadius: '6px',
                      borderLeft: '4px solid #FF6B6B',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <p style={{ 
                        margin: '0 0 6px 0', 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        color: '#333' 
                      }}>
                        📖 {book.bookTitle || 'Unknown Book'}
                      </p>
                      <p style={{ 
                        margin: '4px 0', 
                        fontSize: '13px', 
                        color: '#666' 
                      }}>
                        👤 User: <strong>{book.userEmail}</strong>
                      </p>
                      <p style={{ 
                        margin: '4px 0', 
                        fontSize: '13px', 
                        color: '#666' 
                      }}>
                        📅 Due Date: <strong>{new Date(book.dueDate).toLocaleDateString()}</strong>
                      </p>
                    </div>
                    <div style={{
                      padding: '8px 12px',
                      backgroundColor: '#FFE5E5',
                      borderRadius: '6px',
                      textAlign: 'center',
                      marginLeft: '10px'
                    }}>
                      <p style={{
                        margin: 0,
                        fontSize: '24px',
                        fontWeight: '700',
                        color: '#FF6B6B'
                      }}>
                        {book.daysOverdue || 0}
                      </p>
                      <p style={{
                        margin: '4px 0 0 0',
                        fontSize: '11px',
                        color: '#FF6B6B',
                        fontWeight: '600'
                      }}>
                        Days Overdue
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '15px 20px',
              borderTop: '1px solid #eee',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button
                onClick={() => setShowOverdueDetail(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: '2px solid #ddd',
                  backgroundColor: '#fff',
                  color: '#333',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f0f0f0';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#fff';
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowOverdueDetail(false);
                  document.querySelector('.send-btn')?.click();
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#4CAF50',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#45a049';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#4CAF50';
                }}
              >
                Send Notifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reservation Result Section */}
      {showReservationResult && reservationResult && (
        <div className={`result-section ${reservationResult.success ? 'success' : 'error'}`}>
          <div className="result-header">
            <h3>
              {reservationResult.isDryRun ? '👁️ Preview Results' : '📧 Reservation Notification Results'}
            </h3>
            <button 
              className="close-btn"
              onClick={() => setShowReservationResult(false)}
            >
              ×
            </button>
          </div>

          {reservationResult.success ? (
            <>
              <div className="result-message success-message">
                ✅ {reservationResult.data.message}
              </div>

              <div className="result-details">
                <div className="detail-row">
                  <span className="detail-label">Total Reservations:</span>
                  <span className="detail-value">{reservationResult.data.reservationCount}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Users Notified:</span>
                  <span className="detail-value">{reservationResult.data.notificationsQueued}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="result-message error-message">
              ❌ Error: {reservationResult.error}
            </div>
          )}
        </div>
      )}

      {/* Reservation Detail Modal */}
      {showReservationDetail && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            maxWidth: '800px',
            width: '90%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '12px',
            backgroundColor: '#fff',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            zIndex: 10000
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#333' }}>
                📖 Pending Reservations Details
              </h2>
              <button
                onClick={() => setShowReservationDetail(false)}
                style={{
                  fontSize: '28px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#999',
                  padding: 0
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ 
              overflowY: 'auto', 
              flex: 1, 
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {pendingReservations.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                  No pending reservations found.
                </p>
              ) : (
                pendingReservations.map((reservation, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '14px',
                      backgroundColor: '#f9f9f9',
                      borderRadius: '6px',
                      borderLeft: '4px solid #667eea',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <p style={{ 
                        margin: '0 0 6px 0', 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        color: '#333' 
                      }}>
                        📖 {reservation.bookTitle || 'Unknown Book'}
                      </p>
                      <p style={{ 
                        margin: '4px 0', 
                        fontSize: '13px', 
                        color: '#666' 
                      }}>
                        👤 User: <strong>{reservation.userEmail}</strong>
                      </p>
                      <p style={{ 
                        margin: '4px 0', 
                        fontSize: '13px', 
                        color: '#666' 
                      }}>
                        📅 Requested: <strong>{new Date(reservation.startDate).toLocaleDateString()}</strong>
                      </p>
                    </div>
                    <div style={{
                      padding: '8px 12px',
                      backgroundColor: '#EDE7F6',
                      borderRadius: '6px',
                      textAlign: 'center',
                      marginLeft: '10px'
                    }}>
                      <p style={{
                        margin: 0,
                        fontSize: '14px',
                        fontWeight: '700',
                        color: '#667eea'
                      }}>
                        ⏳
                      </p>
                      <p style={{
                        margin: '4px 0 0 0',
                        fontSize: '11px',
                        color: '#667eea',
                        fontWeight: '600'
                      }}>
                        Pending
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '15px 20px',
              borderTop: '1px solid #eee',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button
                onClick={() => setShowReservationDetail(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: '2px solid #ddd',
                  backgroundColor: '#fff',
                  color: '#333',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f0f0f0';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#fff';
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowReservationDetail(false);
                  setTimeout(() => handleSendReservationNotifications(), 100);
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = '1';
                }}
              >
                Send Notifications
              </button>
            </div>
          </div>
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
