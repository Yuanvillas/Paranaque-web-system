import React, { useState, useEffect, useContext } from 'react';
import { SearchContext } from "../layouts/UserLayout";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const TransactionsTable = () => {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      console.log('Fetching transactions...'); // Debug log
      const response = await fetch('https://paranaque-web-system.onrender.com/api/transactions?limit=10000');
      const data = await response.json();
      console.log('Transactions data:', data); // Debug log
      if (response.ok) {
        setTransactions(data.transactions);
      } else {
        console.error('Failed to fetch transactions:', data); // Debug log
        setError('Failed to fetch transactions');
      }
    } catch (err) {
      console.error('Error loading transactions:', err); // Debug log
      setError('Error loading transactions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#4caf50';
      case 'completed':
        return '#2196f3';
      case 'cancelled':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredBooks = transactions.filter((transaction) =>
    transaction.bookTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div>Loading transactions...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
     <div className="pending-container">
      <div className="header-row">
        <h2 className="page-title">🧾 Transactions</h2>
        <div className="search-container ">
          <input type="text" placeholder="Search analytics..." onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>
      <table className="styled-table">
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Book Title</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>User</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Type</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Status</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Start Date</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Due Date</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Return Date</th>
          </tr>
        </thead>
        <tbody>
          {filteredBooks.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                No transactions found
              </td>
            </tr>
          ) : (
            filteredBooks.map((transaction) => (
              <tr key={transaction._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px', fontWeight: '600' }}>{transaction.bookTitle}</td>
                <td style={{ padding: '12px' }}>{transaction.userEmail}</td>
                <td style={{ padding: '12px', textTransform: 'capitalize' }}>{transaction.type}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    backgroundColor: getStatusColor(transaction.status),
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: '12px',
                    fontSize: '0.85em'
                  }}>
                    {transaction.status}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>{formatDate(transaction.startDate)}</td>
                <td style={{ padding: '12px' }}>{formatDate(transaction.endDate)}</td>
                <td style={{ padding: '12px' }}>
                  {transaction.returnDate ? formatDate(transaction.returnDate) : '-'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionsTable;
