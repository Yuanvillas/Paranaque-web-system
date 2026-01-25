import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './App.css';
import AddBook from '../pages/AddBook';

const BooksTable = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showExportModal, setShowExportModal] = useState(false);

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
    
    // Search across all fields
    return (
      (book.title?.toLowerCase().includes(searchLower) || false) ||
      (book.author?.toLowerCase().includes(searchLower) || false) ||
      (book.accessionNumber?.toLowerCase().includes(searchLower) || false) ||
      (book.callNumber?.toLowerCase().includes(searchLower) || false) ||
      (book.category?.toLowerCase().includes(searchLower) || false) ||
      (book.publisher?.toLowerCase().includes(searchLower) || false) ||
      (book.year?.toString().includes(searchLower) || false) ||
      (book.stock?.toString().includes(searchLower) || false) ||
      (book.availableStock?.toString().includes(searchLower) || false) ||
      (book.status?.toLowerCase().includes(searchLower) || false) ||
      (book.location?.genreCode?.toLowerCase().includes(searchLower) || false) ||
      (book.location?.shelf?.toString().includes(searchLower) || false) ||
      (book.location?.level?.toString().includes(searchLower) || false)
    );
  });

  const archiveBook = async (bookId) => {
    if (window.confirm("Are you sure you want to archive this book?")) {
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
          alert("Book archived successfully!");
          const updatedList = books.filter((book) => book._id !== bookId);
          setBooks(updatedList);
        } else {
          console.error("❌ Archive failed - Full response:", data);
          const errorMsg = data.error || data.message || 'Unknown error';
          const errorDetails = data.details ? `\nDetails: ${data.details}` : '';
          alert(`Failed to archive book:\n${errorMsg}${errorDetails}`);
        }
      } catch (err) {
        console.error("❌ Error archiving book:", err);
        alert("Error archiving book: " + err.message);
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

  return (
    <div className="pending-container">
      <div className="header-row">
        <h2 className="page-title">📗 Books</h2>

        <div className="search-container ">
          <input type="text" placeholder="Search by title, author, accession #, call #, category, year, stock..." onChange={(e) => setSearchTerm(e.target.value)} />
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
          <button onClick={() => navigate('/admin-dashboard')} className="um-btn um-edit" style={{ paddingTop: "10px", paddingBottom: "10px" }} title="Go to Resources" type="button">
            📚 Resources
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
      ) : (
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
              {filteredBooks.map((book) => (
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
                    )}                    )}
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
                  <td style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={() => startEdit(book)} className="um-btn um-edit" style={{ paddingTop: "10px", paddingBottom: "10px", backgroundColor: '#4CAF50' }}>✏️ Edit</button>
                    <button onClick={() => archiveBook(book._id)} className="um-btn um-edit" style={{ paddingTop: "10px", paddingBottom: "10px", backgroundColor: '#dab43bff' }}>Archive</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
