import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Swal from 'sweetalert2';
import './App.css';
import AddBook from '../pages/AddBook';

const BooksTable = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showExportModal, setShowExportModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedBookForHistory, setSelectedBookForHistory] = useState(null);
  const [filterType, setFilterType] = useState("all"); // all, borrow, reserve
  const [filterStatus, setFilterStatus] = useState("all"); // all, active, completed, cancelled, etc
  const [searchHistoryTerm, setSearchHistoryTerm] = useState("");

  useEffect(() => {
    console.log("🔍 BooksTable state - showAddBookModal:", showAddBookModal);
  }, [showAddBookModal]);

  useEffect(() => {
    console.log("📚 BooksTable mounted, fetching all books");
    fetchAllBooks();
  }, []);

  const fetchAllBooks = async () => {
    try {
      setLoading(true);
      console.log("📖 Starting fetch of all books...");
      const timestamp = new Date().getTime();
      const url = `https://paranaque-web-system.onrender.com/api/books/?limit=10000&_t=${timestamp}`;
      console.log("📖 Fetching all books from URL:", url);
      
      const response = await fetch(url);
      console.log("📖 Response status:", response.status, response.statusText);
      
      const data = await response.json();
      console.log("📖 Response data:", data);
      
      if (response.ok) {
        console.log("✅ BooksTable fetched books:", data.books?.length || 0, "books");
        setBooks(data.books || []);
        setError(null);
      } else {
        console.error("❌ API error:", data);
        setError(data.message || 'Failed to fetch reserved books');
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError('Error connecting to server. Please try again.');
    } finally {
      console.log("📖 Setting loading to false");
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const data = filteredBooks
      .sort((a, b) => {
        const aNum = parseInt(a.accessionNumber?.split('-')[1] || '0');
        const bNum = parseInt(b.accessionNumber?.split('-')[1] || '0');
        return aNum - bNum;
      })
      .map(book => ({
        'Book Title': book.title,
        'Author': book.author,
        'Year': book.year,
        'Category': book.category,
        'Subject': book.subject || book.category,
        'Collection Type': book.collectionType || 'Circulation',
        'Source of Funds': book.sourceOfFunds || 'Not specified',
        'Accession Number': book.accessionNumber,
        'Call Number': book.callNumber,
        'Stock': book.stock,
        'Available Stock': book.availableStock,
        'Location': book.location ? `${book.location.genreCode}-${book.location.shelf}-${book.location.level}` : 'N/A',
        'Status': book.status || 'Available'
      }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Books");
    XLSX.writeFile(wb, `Books_Report_${new Date().toLocaleDateString()}.xlsx`);
    setShowExportModal(false);
  };

  const exportToPDF = () => {
    const data = filteredBooks
      .sort((a, b) => {
        const aNum = parseInt(a.accessionNumber?.split('-')[1] || '0');
        const bNum = parseInt(b.accessionNumber?.split('-')[1] || '0');
        return aNum - bNum;
      })
      .map(book => [
        book.title,
        book.author,
        book.year,
        book.category,
        book.accessionNumber,
        book.callNumber,
        book.stock,
        book.availableStock,
        book.location ? `${book.location.genreCode}-${book.location.shelf}-${book.location.level}` : 'N/A',
        book.status || 'Available'
      ]);

    const pdf = new jsPDF('l', 'mm', 'a4'); // landscape
    pdf.autoTable({
      head: [['Title', 'Author', 'Year', 'Category', 'Accession #', 'Call #', 'Stock', 'Available', 'Location', 'Status']],
      body: data,
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [46, 125, 50],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      }
    });

    pdf.save(`Books_Report_${new Date().toLocaleDateString()}.pdf`);
    setShowExportModal(false);
  };


  if (loading) {
    return <div className="pending-container"><h2>Books</h2><p>Loading books...</p></div>;
  }

  const filteredBooks = books.filter((book) => {
    const searchLower = searchTerm.toLowerCase();
    
    // Search across all fields - comprehensive search
    return (
      (book.title?.toLowerCase().includes(searchLower) || false) ||
      (book.author?.toLowerCase().includes(searchLower) || false) ||
      (book.accessionNumber?.toLowerCase().includes(searchLower) || false) ||
      (book.callNumber?.toLowerCase().includes(searchLower) || false) ||
      (book.category?.toLowerCase().includes(searchLower) || false) ||
      (book.subject?.toLowerCase().includes(searchLower) || false) ||
      (book.publisher?.toLowerCase().includes(searchLower) || false) ||
      (book.genre?.toLowerCase().includes(searchLower) || false) ||
      (book.collectionType?.toLowerCase().includes(searchLower) || false) ||
      (book.sourceOfFunds?.toLowerCase().includes(searchLower) || false) ||
      (book.year?.toString().includes(searchLower) || false) ||
      (book.stock?.toString().includes(searchLower) || false) ||
      (book.availableStock?.toString().includes(searchLower) || false) ||
      (book.status?.toLowerCase().includes(searchLower) || false) ||
      (book.location?.genreCode?.toLowerCase().includes(searchLower) || false) ||
      (book.location?.shelf?.toString().includes(searchLower) || false) ||
      (book.location?.level?.toString().includes(searchLower) || false) ||
      (book.reservedBy?.toLowerCase().includes(searchLower) || false)
    );
  });

  const archiveBook = async (bookId) => {
    const result = await Swal.fire({
      title: 'Archive Book?',
      text: 'Are you sure you want to archive this book?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dab43b',
      cancelButtonColor: '#666',
      confirmButtonText: 'Yes, Archive it',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        console.log("📦 Archiving book with ID:", bookId);
        const res = await fetch(`https://paranaque-web-system.onrender.com/api/books/archive/${bookId}`, {
          method: 'PUT',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Archived" }),
        });
        const data = await res.json();
        console.log("Archive response status:", res.status, "Full Data:", data);
        
        if (res.ok) {
          Swal.fire({
            title: 'Success!',
            text: 'Book archived successfully!',
            icon: 'success',
            confirmButtonColor: '#4CAF50',
            timer: 2000,
            timerProgressBar: true
          });
          const updatedList = books.filter((book) => book._id !== bookId);
          setBooks(updatedList);
        } else {
          console.error("❌ Archive failed - Full response:", data);
          const errorMsg = data.error || data.message || 'Unknown error';
          Swal.fire({
            title: 'Error!',
            text: `Failed to archive book: ${errorMsg}`,
            icon: 'error',
            confirmButtonColor: '#d33'
          });
        }
      } catch (err) {
        console.error("❌ Error archiving book:", err);
        Swal.fire({
          title: 'Error!',
          text: "Error archiving book: " + err.message,
          icon: 'error',
          confirmButtonColor: '#d33'
        });
      }
    }
  };

  const startEdit = (book) => {
    setEditingBook(book._id);
    setEditForm({
      title: book.title,
      author: book.author || '',
      publisher: book.publisher || '',
      year: book.year,
      stock: book.stock,
      category: book.category || '',
      subject: book.subject || '',
      collectionType: book.collectionType || 'Circulation',
      sourceOfFunds: book.sourceOfFunds || '',
      accessionNumber: book.accessionNumber || '',
      callNumber: book.callNumber || '',
      status: book.status || 'Available'
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    
    // Validate stock - only positive integers allowed
    if (name === 'stock') {
      // Only allow digits and prevent negative numbers
      if (value === '') {
        setEditForm(prev => ({ ...prev, [name]: '' }));
        return;
      }
      
      const numValue = parseInt(value);
      // Reject if not a valid number or if negative
      if (isNaN(numValue) || numValue < 0) {
        return; // Don't update state
      }
      
      setEditForm(prev => ({ ...prev, [name]: numValue }));
      return;
    }
    
    setEditForm(prev => ({
      ...prev,
      [name]: name === 'year' ? parseInt(value) : value
    }));
  };

  const saveEdit = async () => {
    try {
      const res = await fetch(`https://paranaque-web-system.onrender.com/api/books/${editingBook}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        const updatedBooks = books.map(book =>
          book._id === editingBook ? { ...book, ...editForm } : book
        );
        setBooks(updatedBooks);
        setEditingBook(null);
        alert('Book updated successfully!');
      } else {
        alert('Failed to update book');
      }
    } catch (err) {
      alert('Error updating book: ' + err.message);
    }
  };

  const cancelEdit = () => {
    setEditingBook(null);
    setEditForm({});
  };

  const viewBookHistory = async (book) => {
    setSelectedBookForHistory(book);
    setShowHistoryModal(true);
    setFilterType("all");
    setFilterStatus("all");
    setSearchHistoryTerm("");
    setHistoryLoading(true);
    
    try {
      const response = await fetch(`https://paranaque-web-system.onrender.com/api/transactions/book-history/${book._id}`);
      if (response.ok) {
        const data = await response.json();
        setHistoryData(data);
      } else {
        setHistoryData(null);
        Swal.fire({
          title: 'No History',
          text: 'No borrowing or reservation history found for this book.',
          icon: 'info',
          confirmButtonColor: '#4CAF50'
        });
      }
    } catch (err) {
      console.error('Error fetching book history:', err);
      Swal.fire({
        title: 'Error',
        text: 'Failed to load book history: ' + err.message,
        icon: 'error',
        confirmButtonColor: '#d33'
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportHistoryToExcel = () => {
    if (!historyData || !historyData.transactions) return;

    const filteredTransactions = historyData.transactions.filter(transaction => {
      if (filterType !== 'all' && transaction.type !== filterType) return false;
      if (filterStatus !== 'all' && transaction.status !== filterStatus) return false;
      if (searchHistoryTerm && !transaction.userEmail.toLowerCase().includes(searchHistoryTerm.toLowerCase())) return false;
      return true;
    });

    const data = filteredTransactions.map(t => ({
      'Type': t.type === 'borrow' ? 'Borrow' : 'Reserve',
      'User Email': t.userEmail,
      'Status': t.status.charAt(0).toUpperCase() + t.status.slice(1),
      'Started': formatDate(t.startDate),
      'Due Date': formatDate(t.endDate),
      'Returned': formatDate(t.returnDate),
      'Approved By': t.approvedBy || 'Pending',
      'Notes': t.rejectionReason || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "History");
    XLSX.writeFile(wb, `Book_History_${selectedBookForHistory?.accessionNumber || 'Export'}_${new Date().toLocaleDateString()}.xlsx`);
  };

  const exportHistoryToPDF = () => {
    if (!historyData || !historyData.transactions) return;

    const filteredTransactions = historyData.transactions.filter(transaction => {
      if (filterType !== 'all' && transaction.type !== filterType) return false;
      if (filterStatus !== 'all' && transaction.status !== filterStatus) return false;
      if (searchHistoryTerm && !transaction.userEmail.toLowerCase().includes(searchHistoryTerm.toLowerCase())) return false;
      return true;
    });

    const data = filteredTransactions.map(t => [
      t.type === 'borrow' ? 'Borrow' : 'Reserve',
      t.userEmail,
      t.status.charAt(0).toUpperCase() + t.status.slice(1),
      formatDate(t.startDate),
      formatDate(t.endDate),
      formatDate(t.returnDate),
      t.approvedBy || 'Pending',
      t.rejectionReason || ''
    ]);

    const pdf = new jsPDF('l', 'mm', 'a4');
    pdf.setFontSize(14);
    pdf.text(`Book History - ${selectedBookForHistory?.title}`, 14, 15);
    pdf.setFontSize(10);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);

    pdf.autoTable({
      head: [['Type', 'User Email', 'Status', 'Started', 'Due Date', 'Returned', 'Approved By', 'Notes']],
      body: data,
      startY: 28,
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [46, 125, 50],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      }
    });

    pdf.save(`Book_History_${selectedBookForHistory?.accessionNumber || 'Export'}_${new Date().toLocaleDateString()}.pdf`);
  };

  return (
    <div className="pending-container">
      <div className="header-row">
        <h2 className="page-title">
          📗 Books 
          <span style={{ fontSize: '0.75em', color: '#666', marginLeft: '15px', fontWeight: 'normal' }}>
            (Total: {books.length})
          </span>
        </h2>

        <div className="search-container ">
          <input type="text" placeholder="Search by any field: title, author, subject, category, publisher, accession #, call #, collection type, source of funds, year, stock, shelf..." onChange={(e) => setSearchTerm(e.target.value)} />
          <button 
            onClick={() => {
              console.log("🔘 Add Books button clicked");
              setShowAddBookModal(true);
            }} 
            className="um-btn um-edit" 
            style={{ paddingTop: "10px", paddingBottom: "10px", cursor: "pointer", zIndex: 10 }} 
            type="button"
          >
            Add Books
          </button>
          <button onClick={() => setShowExportModal(true)} className="um-btn um-edit" style={{ paddingTop: "10px", paddingBottom: "10px" }} title="Export to Excel or PDF" type="button">
            📥 Export
          </button>
          <button onClick={fetchAllBooks} className="um-btn um-edit" style={{ paddingTop: "10px", paddingBottom: "10px" }} title="Refresh" type="button">
            🔄 Refresh
          </button>
        </div>

      </div>
      {error && <div className="error-message">{error}</div>}
      
      {/* Add Book Modal - OUTSIDE table wrapper so it always renders */}
      {showAddBookModal && (
        <div 
          className="add-book-modal-overlay" 
          onClick={() => setShowAddBookModal(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}
        >
          {console.log("🔵 Add Book Modal is rendering - OVERLAY VISIBLE")}
          <div 
            className="add-book-modal-content" 
            onClick={e => e.stopPropagation()} 
            style={{ maxWidth: 600, width: '95%', height: '90%', padding: '10px', background: '#fff', borderRadius: '10px', position: 'relative', zIndex: 10000, overflowY: 'auto', boxShadow: '0 4px 24px rgba(0,0,0,0.3)', border: '3px solid red' }}
          >
            {console.log("🟢 Add Book Modal Content is rendering - MODAL BOX VISIBLE")}
            <button
              onClick={() => setShowAddBookModal(false)}
              style={{ position: 'absolute', top: 10, right: 16, background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', zIndex: 10001, padding: '0' }}
              aria-label="Close"
            >
              ×
            </button>
            <div style={{ visibility: 'visible', display: 'block' }}>
              {console.log("📖 About to render AddBook component inside modal")}
              <AddBook 
                onBookAdded={() => { 
                  console.log("📖 Book added, closing modal"); 
                  setShowAddBookModal(false);
                  fetchAllBooks();
                }} 
              />
              {console.log("✅ AddBook component rendered inside modal")}
            </div>
          </div>
        </div>
      )}
      
      {!error && books.length === 0 ? (
        <div className="empty-state">
          <img src="/imgs/empty.png" alt="No Data" className="empty-img" />
          <p>No books found. Click "Add Books" to add your first book.</p>
        </div>
      ) : (() => {
        // Calculate pagination
        const totalPages = Math.ceil(filteredBooks.length / pageSize);
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedBooks = filteredBooks.slice(startIndex, endIndex);

        // Reset to page 1 if current page exceeds total pages
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(1);
        }

        return (
          <div>
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
                  Page {currentPage} of {totalPages} (Showing {paginatedBooks.length} of {filteredBooks.length} books)
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
            <div className="table-wrapper">
              <table className="styled-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Book Title</th>
                    <th>Year</th>
                    <th>Category</th>
                    <th>Subject</th>
                    <th>Collection Type</th>
                    <th>Source of Funds</th>
                    <th>Author</th>
                    <th>Accession Number</th>
                    <th>Call Number</th>
                    <th>Stock</th>
                    <th>Available Stock</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBooks.map((book) => (
                    <tr key={book._id}>
                      <td>
                        {book.image ? (
                          <img
                            src={book.image}
                            alt={book.title}
                            style={{ width: "60px", height: "80px", objectFit: "cover", borderRadius: "4px", border: "1px solid #ddd" }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextElementSibling) {
                                e.target.nextElementSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        {!book.image && (
                          <div 
                            style={{ 
                              width: "60px", 
                              height: "80px", 
                              backgroundColor: '#f0f0f0', 
                              borderRadius: "4px", 
                              border: "1px solid #ddd",
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '24px',
                              color: '#ccc'
                            }}
                          >
                            📖
                          </div>
                        )}
                      </td>
                      <td>{book.title}</td>
                      <td>{book.year}</td>
                      <td>{book.category}</td>
                      <td>{book.subject || book.category || '-'}</td>
                      <td>{book.collectionType || 'Circulation'}</td>
                      <td>{book.sourceOfFunds || 'Not specified'}</td>
                      <td>{book.author}</td>
                      <td>{book.accessionNumber}</td>
                      <td>{book.callNumber}</td>
                      <td>{book.stock || '-'}</td>
                      <td>{book.availableStock !== undefined ? book.availableStock : book.stock || '-'}</td>
                      <td>
                        {book.location
                          ? `${book.location.genreCode}-${book.location.shelf}-${book.location.level}`
                          : "N/A"}
                      </td>
                      <td>
                        {book.status ? book.status : "Available"}
                      </td>
                      <td style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        <button onClick={() => startEdit(book)} className="um-btn um-edit" style={{ paddingTop: "10px", paddingBottom: "10px", backgroundColor: '#4CAF50' }}>✏️ Edit</button>
                        <button onClick={() => viewBookHistory(book)} className="um-btn um-edit" style={{ paddingTop: "10px", paddingBottom: "10px", backgroundColor: '#2196F3' }}>📋 History</button>
                        <button onClick={() => archiveBook(book._id)} className="um-btn um-edit" style={{ paddingTop: "10px", paddingBottom: "10px", backgroundColor: '#dab43bff' }}>Archive</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Book History Modal */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 1100, width: '96%', maxHeight: '95vh', padding: '30px', background: '#fff', borderRadius: '12px', position: 'relative', overflowY: 'auto', boxShadow: '0 5px 40px rgba(0,0,0,0.2)' }}>
            <button
              onClick={() => setShowHistoryModal(false)}
              style={{ position: 'absolute', top: 12, right: 18, background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: '#666', transition: 'color 0.2s' }}
              onMouseOver={(e) => e.target.style.color = '#000'}
              onMouseOut={(e) => e.target.style.color = '#666'}
              aria-label="Close"
            >
              ×
            </button>
            
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ marginTop: 0, marginBottom: '8px', fontSize: '28px', color: '#1a1a1a' }}>
                📋 Book History
              </h2>
              <p style={{ margin: 0, fontSize: '16px', color: '#4CAF50', fontWeight: '500' }}>
                {selectedBookForHistory?.title}
              </p>
            </div>

            {historyLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
                <p style={{ fontSize: '16px' }}>Loading history...</p>
              </div>
            ) : historyData && historyData.transactions && historyData.transactions.length > 0 ? (
              <div>
                {/* Summary Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '35px' }}>
                  <div style={{ padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '10px', border: '2px solid #2196F3' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666', fontWeight: '600', textTransform: 'uppercase' }}>Total Transactions</p>
                    <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#2196F3' }}>{historyData.totalTransactions}</p>
                  </div>
                  <div style={{ padding: '20px', backgroundColor: '#e3f5e9', borderRadius: '10px', border: '2px solid #4CAF50' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666', fontWeight: '600', textTransform: 'uppercase' }}>Times Borrowed</p>
                    <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#4CAF50' }}>{historyData.totalBorrows}</p>
                  </div>
                  <div style={{ padding: '20px', backgroundColor: '#f3e5f5', borderRadius: '10px', border: '2px solid #9C27B0' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666', fontWeight: '600', textTransform: 'uppercase' }}>Times Reserved</p>
                    <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#9C27B0' }}>{historyData.totalReserves}</p>
                  </div>
                </div>

                <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', color: '#1a1a1a', fontWeight: '600', paddingBottom: '10px', borderBottom: '2px solid #f0f0f0' }}>Transaction Details</h3>
                
                {/* Filter Controls */}
                <div style={{ marginBottom: '25px', padding: '18px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', alignItems: 'flex-end' }}>
                    {/* Search */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>
                        Search User Email
                      </label>
                      <input
                        type="text"
                        placeholder="Search by email..."
                        value={searchHistoryTerm}
                        onChange={(e) => setSearchHistoryTerm(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '13px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* Filter by Type */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>
                        Transaction Type
                      </label>
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '13px',
                          boxSizing: 'border-box',
                          backgroundColor: 'white',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="all">All Types</option>
                        <option value="borrow">📥 Borrow</option>
                        <option value="reserve">⚠️ Reserve</option>
                      </select>
                    </div>

                    {/* Filter by Status */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>
                        Status
                      </label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '13px',
                          boxSizing: 'border-box',
                          backgroundColor: 'white',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="all">All Status</option>
                        <option value="completed">✅ Completed</option>
                        <option value="active">🔄 Active</option>
                        <option value="approved">👍 Approved</option>
                        <option value="pending">⏳ Pending</option>
                        <option value="cancelled">❌ Cancelled</option>
                      </select>
                    </div>

                    {/* Clear Filters Button */}
                    <button
                      onClick={() => {
                        setFilterType("all");
                        setFilterStatus("all");
                        setSearchHistoryTerm("");
                      }}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: '#999',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#777'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#999'}
                    >
                      Clear Filters
                    </button>

                    {/* Export to Excel Button */}
                    <button
                      onClick={exportHistoryToExcel}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        transition: 'background-color 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
                    >
                      📊 Excel
                    </button>

                    {/* Export to PDF Button */}
                    <button
                      onClick={exportHistoryToPDF}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        transition: 'background-color 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#da190b'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#f44336'}
                    >
                      📄 PDF
                    </button>
                  </div>
                </div>
                
                {/* Transaction Cards View */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {(() => {
                    const filteredTransactions = historyData.transactions.filter(transaction => {
                      // Filter by type
                      if (filterType !== 'all' && transaction.type !== filterType) {
                        return false;
                      }
                      
                      // Filter by status
                      if (filterStatus !== 'all' && transaction.status !== filterStatus) {
                        return false;
                      }
                      
                      // Filter by search term
                      if (searchHistoryTerm && !transaction.userEmail.toLowerCase().includes(searchHistoryTerm.toLowerCase())) {
                        return false;
                      }
                      
                      return true;
                    });

                    if (filteredTransactions.length === 0) {
                      return (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                          <p style={{ fontSize: '16px', marginBottom: '8px' }}>🔍 No matching transactions</p>
                          <p style={{ fontSize: '14px' }}>Try adjusting your filters</p>
                        </div>
                      );
                    }

                    return filteredTransactions.map((transaction) => (
                    <div key={transaction._id} style={{ 
                      padding: '18px', 
                      backgroundColor: transaction.type === 'borrow' ? '#f0f7ff' : '#faf5ff',
                      borderLeft: `5px solid ${transaction.type === 'borrow' ? '#2196F3' : '#9C27B0'}`,
                      borderRadius: '8px',
                      border: `1px solid ${transaction.type === 'borrow' ? '#b3e5fc' : '#e1bee7'}`,
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateX(4px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        {/* Type */}
                        <div>
                          <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>Type</p>
                          <span style={{ 
                            display: 'inline-block',
                            padding: '6px 12px', 
                            borderRadius: '6px',
                            backgroundColor: transaction.type === 'borrow' ? '#2196F3' : '#9C27B0',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '14px'
                          }}>
                            {transaction.type === 'borrow' ? '📥 Borrow' : '⚠️ Reserve'}
                          </span>
                        </div>

                        {/* Status */}
                        <div>
                          <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>Status</p>
                          <span style={{ 
                            display: 'inline-block',
                            padding: '6px 12px', 
                            borderRadius: '6px',
                            backgroundColor: transaction.status === 'completed' ? '#4CAF50' : 
                                           transaction.status === 'active' ? '#2196F3' :
                                           transaction.status === 'cancelled' ? '#f44336' :
                                           transaction.status === 'approved' ? '#8BC34A' :
                                           transaction.status === 'pending' ? '#FF9800' : '#999',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </span>
                        </div>

                        {/* User */}
                        <div>
                          <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>User</p>
                          <p style={{ margin: 0, fontSize: '14px', color: '#1a1a1a', wordBreak: 'break-word' }}>{transaction.userEmail}</p>
                        </div>

                        {/* Start Date */}
                        <div>
                          <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>Started</p>
                          <p style={{ margin: 0, fontSize: '14px', color: '#1a1a1a' }}>{formatDate(transaction.startDate)}</p>
                        </div>

                        {/* Due Date */}
                        <div>
                          <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>Due Date</p>
                          <p style={{ margin: 0, fontSize: '14px', color: transaction.endDate ? '#1a1a1a' : '#999' }}>{formatDate(transaction.endDate)}</p>
                        </div>

                        {/* Return Date */}
                        <div>
                          <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>Returned</p>
                          <p style={{ margin: 0, fontSize: '14px', color: transaction.returnDate ? '#4CAF50' : '#999', fontWeight: transaction.returnDate ? '600' : '400' }}>
                            {transaction.returnDate ? formatDate(transaction.returnDate) : 'Not yet'}
                          </p>
                        </div>

                        {/* Approved By */}
                        <div>
                          <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>Approved By</p>
                          <p style={{ margin: 0, fontSize: '14px', color: transaction.approvedBy ? '#1a1a1a' : '#999' }}>{transaction.approvedBy || 'Pending'}</p>
                        </div>

                        {/* Notes */}
                        {transaction.rejectionReason && (
                          <div style={{ gridColumn: '1 / -1' }}>
                            <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#999', fontWeight: '600', textTransform: 'uppercase' }}>Notes</p>
                            <p style={{ margin: 0, fontSize: '14px', color: '#f44336', backgroundColor: '#ffebee', padding: '8px 12px', borderRadius: '4px' }}>{transaction.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    ));
                  })()}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '80px 20px', color: '#999' }}>
                <p style={{ fontSize: '48px', marginBottom: '15px' }}>📭</p>
                <p style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#666' }}>No History Found</p>
                <p style={{ fontSize: '16px' }}>This book has not been borrowed or reserved yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Book Modal */}
      {editingBook && (
        <div className="modal-overlay" onClick={cancelEdit}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, width: '95%', height: '90%', padding: '20px', background: '#fff', borderRadius: '10px', position: 'relative', overflowY: 'auto' }}>
                <button
                  onClick={cancelEdit}
                  style={{ position: 'absolute', top: 10, right: 16, background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}

                  aria-label="Close"
                >
                  ×
                </button>
                <h2 style={{ marginTop: 0 }}>Edit Book Details</h2>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Title</label>
                  <input
                    type="text"
                    name="title"
                    value={editForm.title}
                    onChange={handleEditChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Author</label>
                  <input
                    type="text"
                    name="author"
                    value={editForm.author}
                    onChange={handleEditChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Publisher</label>
                  <input
                    type="text"
                    name="publisher"
                    value={editForm.publisher}
                    onChange={handleEditChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Year</label>
                    <input
                      type="number"
                      name="year"
                      value={editForm.year}
                      onChange={handleEditChange}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        boxSizing: 'border-box',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Stock</label>
                    <input
                      type="number"
                      name="stock"
                      value={editForm.stock}
                      onChange={handleEditChange}
                      min="0"
                      step="1"
                      placeholder="Enter positive number only"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        boxSizing: 'border-box',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Category</label>
                  <input
                    type="text"
                    name="category"
                    value={editForm.category}
                    onChange={handleEditChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Accession Number (Auto-Generated)</label>
                  <input
                    type="text"
                    name="accessionNumber"
                    value={editForm.accessionNumber}
                    disabled
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                      fontSize: '14px',
                      backgroundColor: '#f5f5f5'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Call Number (Auto-Generated)</label>
                  <input
                    type="text"
                    name="callNumber"
                    value={editForm.callNumber}
                    disabled
                    placeholder="Auto-generated"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                      fontSize: '14px',
                      backgroundColor: '#f5f5f5',
                      color: '#666',
                      cursor: 'not-allowed'
                    }}
                  />
                  <small style={{ color: '#999', marginTop: '3px', display: 'block' }}>Format: PREFIX.DDC-CUTTER-YEAR (e.g., F.500-SMI-2020). Regenerated from subject and author.</small>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={editForm.subject}
                    onChange={handleEditChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Collection Type</label>
                  <select
                    name="collectionType"
                    value={editForm.collectionType}
                    onChange={handleEditChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                      fontSize: '14px'
                    }}
                  >
                    <option value="Filipiniana">Filipiniana</option>
                    <option value="Reference">Reference</option>
                    <option value="Circulation">Circulation</option>
                  </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Source of Funds</label>
                  <select
                    name="sourceOfFunds"
                    value={editForm.sourceOfFunds}
                    onChange={handleEditChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Not specified</option>
                    <option value="Donation">Donation</option>
                    <option value="Locally funded">Locally funded</option>
                    <option value="National Library of the Philippines">National Library of the Philippines</option>
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Status</label>
                  <select
                    name="status"
                    value={editForm.status}
                    onChange={handleEditChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                      fontSize: '14px'
                    }}
                  >
                    <option value="Available">Available</option>
                    <option value="Archived">Archived</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={cancelEdit}
                    style={{
                      backgroundColor: '#757575',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEdit}
                    style={{
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

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
              Data will be sorted in ascending order by accession number
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

export default BooksTable;
