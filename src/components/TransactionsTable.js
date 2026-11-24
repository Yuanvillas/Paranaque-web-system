import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const TransactionsTable = () => {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  
  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter, dateFrom, dateTo]);

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
    if (!date) return '-';
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return '-';
    return parsedDate.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const search = searchTerm.trim().toLowerCase();
    const matchesSearch = !search || [
      transaction.bookTitle,
      transaction.userEmail,
      transaction.type,
      transaction.status
    ].some(value => String(value || '').toLowerCase().includes(search));
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    const transactionDate = transaction.startDate ? new Date(transaction.startDate) : null;

    if (!matchesSearch || !matchesType || !matchesStatus) return false;
    if ((dateFrom || dateTo) && (!transactionDate || isNaN(transactionDate.getTime()))) return false;

    if (dateFrom && transactionDate < new Date(`${dateFrom}T00:00:00`)) return false;
    if (dateTo) {
      const endExclusive = new Date(`${dateTo}T00:00:00`);
      endExclusive.setDate(endExclusive.getDate() + 1);
      if (transactionDate >= endExclusive) return false;
    }

    return true;
  });

  const activeFilters = [
    searchTerm.trim() && `Search: ${searchTerm.trim()}`,
    typeFilter !== 'all' && `Type: ${typeFilter}`,
    statusFilter !== 'all' && `Status: ${statusFilter}`,
    dateFrom && `From: ${dateFrom}`,
    dateTo && `To: ${dateTo}`
  ].filter(Boolean);

  const exportToExcel = () => {
    const data = filteredTransactions.map(transaction => ({
      'Book Title': transaction.bookTitle || '-',
      'User': transaction.userEmail || '-',
      'Type': transaction.type || '-',
      'Status': transaction.status || '-',
      'Start Date': formatDate(transaction.startDate),
      'Due Date': formatDate(transaction.endDate),
      'Return Date': transaction.returnDate ? formatDate(transaction.returnDate) : '-'
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 40 },
      { wch: 32 },
      { wch: 14 },
      { wch: 14 },
      { wch: 24 },
      { wch: 24 },
      { wch: 24 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, `Transactions_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    setShowExportModal(false);
  };

  const exportToPDF = () => {
    const data = filteredTransactions.map(transaction => [
      transaction.bookTitle || '-',
      transaction.userEmail || '-',
      transaction.type || '-',
      transaction.status || '-',
      formatDate(transaction.startDate),
      formatDate(transaction.endDate),
      transaction.returnDate ? formatDate(transaction.returnDate) : '-'
    ]);
    
    const doc = new jsPDF('landscape', 'mm', 'a4');
    doc.setFontSize(14);
    doc.text('Transactions Report', 14, 12);
    doc.setFontSize(8);
    doc.text(`Records: ${filteredTransactions.length} | Filters: ${activeFilters.join(' | ') || 'None'}`, 14, 18);
    doc.autoTable({
      head: [['Book Title', 'User', 'Type', 'Status', 'Start Date', 'Due Date', 'Return Date']],
      body: data,
      startY: 23,
      margin: { top: 23, left: 10, right: 10, bottom: 12 },
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 48 },
        1: { cellWidth: 46 },
        2: { cellWidth: 18 },
        3: { cellWidth: 20 },
        4: { cellWidth: 38 },
        5: { cellWidth: 38 },
        6: { cellWidth: 38 }
      },
      didDrawPage: () => {
        doc.setFontSize(8);
        doc.text(
          `Page ${doc.internal.getNumberOfPages()}`,
          doc.internal.pageSize.getWidth() - 20,
          doc.internal.pageSize.getHeight() - 5
        );
      }
    });
    
    doc.save(`Transactions_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    setShowExportModal(false);
  };

  if (loading) return <div>Loading transactions...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
     <div className="pending-container">
      <div className="header-row">
        <h2 className="page-title">🧾 Transactions</h2>
        <button
          onClick={() => setShowExportModal(true)}
          className="um-btn um-edit"
          style={{ paddingTop: "10px", paddingBottom: "10px" }}
          title="Export filtered transactions to Excel or PDF"
          type="button"
          disabled={filteredTransactions.length === 0}
        >
            📥 Export
        </button>
      </div>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        alignItems: 'end',
        marginBottom: '18px',
        padding: '15px',
        backgroundColor: '#f5f5f5',
        borderRadius: '6px'
      }}>
        <input
          type="search"
          aria-label="Search book title or user email"
          placeholder="Search book title or user email"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ minWidth: '220px', flex: '1 1 220px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <select
          aria-label="Filter by transaction type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          <option value="all">All types</option>
          <option value="borrow">Borrow</option>
          <option value="reserve">Reserve</option>
        </select>
        <select
          aria-label="Filter by transaction status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          <option value="all">All statuses</option>
          {['active', 'pending', 'approved', 'completed', 'rejected', 'cancelled', 'expired'].map(status => (
            <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
          ))}
        </select>
        <label style={{ display: 'grid', gap: '4px', fontSize: '12px', color: '#555' }}>
          Start date from
          <input
            type="date"
            aria-label="Start date from"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </label>
        <label style={{ display: 'grid', gap: '4px', fontSize: '12px', color: '#555' }}>
          Start date to
          <input
            type="date"
            aria-label="Start date to"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            setSearchTerm('');
            setTypeFilter('all');
            setStatusFilter('all');
            setDateFrom('');
            setDateTo('');
          }}
          disabled={activeFilters.length === 0}
          style={{ padding: '10px 14px', border: '1px solid #ccc', borderRadius: '4px', cursor: activeFilters.length === 0 ? 'not-allowed' : 'pointer' }}
        >
          Clear filters
        </button>
        <span role="status" style={{ marginLeft: 'auto', color: '#555', fontSize: '14px' }}>
          {filteredTransactions.length} of {transactions.length} transactions
        </span>
      </div>

      {(() => {
        // Calculate pagination
        const totalPages = Math.ceil(filteredTransactions.length / pageSize);
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

        return (
          <>
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#f5f5f5',
                borderRadius: '5px'
              }}>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: currentPage === 1 ? '#ccc' : '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  ← Previous
                </button>

                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                  Page {currentPage} of {totalPages} (Showing {Math.min(pageSize, filteredTransactions.length - (currentPage - 1) * pageSize)} of {filteredTransactions.length} transactions)
                </span>

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: currentPage === totalPages ? '#ccc' : '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Next →
                </button>
              </div>
            )}

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
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                      No transactions match these filters
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((transaction) => (
                    <tr key={transaction._id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px', fontWeight: '600' }}>{transaction.bookTitle || '-'}</td>
                      <td style={{ padding: '12px' }}>{transaction.userEmail || '-'}</td>
                      <td style={{ padding: '12px', textTransform: 'capitalize' }}>{transaction.type || '-'}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          backgroundColor: getStatusColor(transaction.status),
                          color: 'white',
                          padding: '5px 10px',
                          borderRadius: '12px',
                          fontSize: '0.85em'
                        }}>
                          {transaction.status || '-'}
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
          </>
        );
      })()}

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
              Export {filteredTransactions.length} matching transaction{filteredTransactions.length === 1 ? '' : 's'}.
              {activeFilters.length > 0 && ` Active filters: ${activeFilters.join(' | ')}`}
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
