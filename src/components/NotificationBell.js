import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import "./NotificationBell.css";

const NotificationBell = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const userEmail = localStorage.getItem("userEmail");

  const fetchTransactions = useCallback(async () => {
    if (!userEmail) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://paranaque-web-system.onrender.com/api/transactions/user/${userEmail}`
      );
      const data = await response.json();

      if (data.transactions) {
        // Get the 5 most recent transactions
        const recentTransactions = data.transactions.slice(0, 5);
        setTransactions(recentTransactions);

        // Count unread transactions (pending, approved, rejected - those that need user attention)
        const unread = data.transactions.filter(
          (t) =>
            t.status === "pending" ||
            t.status === "approved" ||
            t.status === "rejected"
        ).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  // Fetch user transactions when the component mounts or dropdown opens
  useEffect(() => {
    if (isOpen || true) {
      // Always check for new transactions
      fetchTransactions();
    }
  }, [isOpen, fetchTransactions]);

  // Set up interval to check for new transactions every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTransactions();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchTransactions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "#4CAF50";
      case "pending":
        return "#FF9800";
      case "approved":
        return "#2196F3";
      case "rejected":
        return "#F44336";
      case "completed":
        return "#9C27B0";
      default:
        return "#757575";
    }
  };

  const getTransactionMessage = (transaction) => {
    const actions = {
      borrow: {
        active: `Borrowed "${transaction.bookTitle}"`,
        pending: `Waiting approval to borrow "${transaction.bookTitle}"`,
        approved: `Approved to borrow "${transaction.bookTitle}"`,
        rejected: `Request rejected for "${transaction.bookTitle}"`,
        completed: `Returned "${transaction.bookTitle}"`,
      },
      reserve: {
        pending: `Reserved "${transaction.bookTitle}"`,
        approved: `Reservation approved for "${transaction.bookTitle}"`,
        rejected: `Reservation rejected for "${transaction.bookTitle}"`,
        completed: `Reservation completed for "${transaction.bookTitle}"`,
      },
    };

    return (
      actions[transaction.type]?.[transaction.status] ||
      `${transaction.type} - ${transaction.status}`
    );
  };

  const dismissNotification = async (e, transactionId, index) => {
    e.stopPropagation();
    try {
      const response = await fetch(
        `https://paranaque-web-system.onrender.com/api/transactions/${transactionId}/dismiss`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      if (response.ok) {
        // Remove from local state after successful API call
        setTransactions(transactions.filter((_, idx) => idx !== index));
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        className="bell-button"
        onClick={() => setIsOpen(!isOpen)}
        title="View your transactions"
      >
        <FontAwesomeIcon icon={faBell} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Transactions</h3>
            {unreadCount > 0 && (
              <span className="unread-label">{unreadCount} new</span>
            )}
          </div>

          <div className="notification-content">
            {loading ? (
              <div className="notification-item">
                <p className="loading-text">Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="notification-item">
                <p className="empty-text">No transactions yet</p>
              </div>
            ) : (
              <ul className="transaction-list">
                {transactions.map((transaction, idx) => (
                  <li
                    key={idx}
                    className="notification-item"
                    style={{
                      borderLeftColor: getStatusColor(transaction.status),
                      cursor: "pointer"
                    }}
                    onClick={() => {
                      navigate("/user-home/shelf");
                      setIsOpen(false);
                    }}
                  >
                    <div className="notification-message">
                      <p className="message-text">
                        {getTransactionMessage(transaction)}
                      </p>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: getStatusColor(
                            transaction.status
                          ),
                        }}
                      >
                        {transaction.status}
                      </span>
                      <button
                        className="notification-delete-btn"
                        onClick={(e) => dismissNotification(e, transaction._id, idx)}
                        title="Dismiss notification"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="transaction-date">
                      {new Date(transaction.createdAt).toLocaleString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            onClick={() => {
              navigate("/user-home/shelf");
              setIsOpen(false);
            }}
            className="notification-footer"
          >
            View all transactions
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
