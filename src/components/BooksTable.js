import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
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
    const data = filteredBooks.map(book => ({
      'Book Title': book.title,
      'Author': book.author,
      'Year': book.year,
      'Category': book.category,
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
  };


  if (loading) {
    return <div className="pending-container"><h2>Books</h2><p>Loading books...</p></div>;
  }

  const filteredBooks = books.filter(
    (book) =>
      (book.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (book.author?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (book.accessionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

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
      accessionNumber: book.accessionNumber || '',
      callNumber: book.callNumber || '',
      status: book.status || 'Available'
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: name === 'year' || name === 'stock' ? parseInt(value) : value
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
          <input type="text" placeholder="Search analytics..." onChange={(e) => setSearchTerm(e.target.value)} />
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
          <button onClick={exportToExcel} className="um-btn um-edit" style={{ paddingTop: "10px", paddingBottom: "10px" }} title="Export to Excel" type="button">
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
      ) : (
        <div className="table-wrapper">
          <table className="styled-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Book Title</th>
                <th>Year</th>
                <th>Category</th>
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
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Call Number (Optional)</label>
                  <input
                    type="text"
                    name="callNumber"
                    value={editForm.callNumber}
                    onChange={handleEditChange}
                    placeholder="e.g., FIC-ALI"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                      fontSize: '14px',
                      backgroundColor: '#f5f5f5',
                      color: '#999',
                      cursor: 'not-allowed'
                    }}
                  />
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
    </div>
  );
};

export default BooksTable;
