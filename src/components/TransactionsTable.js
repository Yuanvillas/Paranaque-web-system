import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const TransactionsTable = () => {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  
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
    if (!date) return 'Invalid Date';
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return 'Invalid Date';
    return parsedDate.toLocaleDateString('en-US', {
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

  const exportToExcel = () => {
    const data = filteredBooks.map(transaction => ({
      'Book Title': transaction.bookTitle,
      'User': transaction.userEmail,
      'Type': transaction.type,
      'Status': transaction.status,
      'Start Date': formatDate(transaction.startDate),
      'Due Date': formatDate(transaction.endDate),
      'Return Date': transaction.returnDate ? formatDate(transaction.returnDate) : '-'
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, `Transactions_Report_${new Date().toLocaleDateString()}.xlsx`);
    setShowExportModal(false);
  };

  const exportToPDF = () => {
    const data = filteredBooks.map(transaction => [
      transaction.bookTitle,
      transaction.userEmail,
      transaction.type,
      transaction.status,
      formatDate(transaction.startDate),
      formatDate(transaction.endDate),
      transaction.returnDate ? formatDate(transaction.returnDate) : '-'
    ]);
    
    const doc = new jsPDF();
    doc.autoTable({
      head: [['Book Title', 'User', 'Type', 'Status', 'Start Date', 'Due Date', 'Return Date']],
      body: data,
      startY: 10,
      margin: { top: 10 }
    });
    
    doc.text('Transactions Report', 14, doc.internal.pageSize.getHeight() - 10);
    doc.save(`Transactions_Report_${new Date().toLocaleDateString()}.pdf`);
    setShowExportModal(false);
  };

  if (loading) return <div>Loading transactions...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
     <div className="pending-container">
      <div className="header-row">
        <h2 className="page-title">🧾 Transactions</h2>
        <div className="search-container ">
          <input type="text" placeholder="Search analytics..." onChange={(e) => setSearchTerm(e.target.value)} />
          <button onClick={() => setShowExportModal(true)} className="um-btn um-edit" style={{ paddingTop: "10px", paddingBottom: "10px" }} title="Export to Excel or PDF" type="button">
            📥 Export
          </button>
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

      {/* Export Format Modal */}
      {showExportModal && (
        <div 
          className="add-book-modal-overlay" 
          onClick={() => setShowExportModal(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}
        >
          <div 
            className="add-book-modal" 
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxWidth: '500px', width: '90%' }}
          >
            <h2 style={{ marginTop: 0, marginBottom: '20px', textAlign: 'center' }}>📥 Choose Export Format</h2>
            
            <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
              Export all transactions as Excel or PDF
            </p>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={exportToPDF}
                style={{
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  padding: '12px 30px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                📄 Export as PDF
              </button>
              <button
                onClick={exportToExcel}
                style={{
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  padding: '12px 30px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                📊 Export as Excel
              </button>
            </div>

            <button
              onClick={() => setShowExportModal(false)}
              style={{
                width: '100%',
                marginTop: '20px',
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                padding: '12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsTable;
