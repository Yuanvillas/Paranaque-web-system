import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import './App.css';

const ArchiveBooksTable = () => {
  const [archivedBooks, setArchivedBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  useEffect(() => {
    console.log("📚 ArchiveBooksTable mounted, fetching archived books");
    fetchArchivedBooks();
  }, []);

  const fetchArchivedBooks = async () => {
    try {
      setLoading(true);
      console.log("📖 Starting fetch of archived books...");
      const timestamp = new Date().getTime();
      const url = `https://paranaque-web-system.onrender.com/api/books/archived/all?_t=${timestamp}`;
      console.log("📖 Fetching archived books from URL:", url);
      
      const response = await fetch(url);
      console.log("📖 Response status:", response.status, response.statusText);
      
      const data = await response.json();
      console.log("📖 Response data:", data);
      
      if (response.ok) {
        console.log("✅ ArchiveBooksTable fetched books:", data.books?.length || 0, "archived books");
        setArchivedBooks(data.books || []);
        setFilteredBooks(data.books || []);
        setError(null);
      } else {
        console.error("❌ API error:", data);
        setError(data.error || 'Failed to fetch archived books');
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError('Error connecting to server. Please try again.');
    } finally {
      console.log("📖 Setting loading to false");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredBooks(archivedBooks);
    } else {
      const lowercasedQuery = searchTerm.toLowerCase();
      setFilteredBooks(
        archivedBooks.filter((book) =>
          book.title?.toLowerCase().includes(lowercasedQuery) ||
          book.author?.toLowerCase().includes(lowercasedQuery) ||
          book.accessionNumber?.toLowerCase().includes(lowercasedQuery) ||
          false
        )
      );
    }
  }, [searchTerm, archivedBooks]);

  const handleReturnToStocks = async (bookId, bookTitle) => {
    const result = await Swal.fire({
      title: 'Return Book to Stocks?',
      text: `Are you sure you want to return "${bookTitle}" to active stocks?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4CAF50',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Return it',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        console.log("📤 Returning archived book to stocks:", bookId);
        const res = await fetch(`https://paranaque-web-system.onrender.com/api/books/archived/return/${bookId}`, {
          method: 'PUT',
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        console.log("Return response:", res.status, data);
        
        if (res.ok) {
          const updatedList = archivedBooks.filter((book) => book._id !== bookId);
          setArchivedBooks(updatedList);
          setFilteredBooks(updatedList);
          
          Swal.fire({
            title: 'Success!',
            text: 'Book returned to stocks successfully!',
            icon: 'success',
            confirmButtonColor: '#4CAF50'
          });
        } else {
          Swal.fire({
            title: 'Error!',
            text: data.error || "Failed to return book to stocks.",
            icon: 'error',
            confirmButtonColor: '#d33'
          });
        }
      } catch (err) {
        console.error("❌ Error returning book:", err);
        Swal.fire({
          title: 'Error!',
          text: "Error returning book: " + err.message,
          icon: 'error',
          confirmButtonColor: '#d33'
        });
      }
    }
  };

  const handleDeletePermanently = async (bookId, bookTitle) => {
    const result = await Swal.fire({
      title: 'Permanently Delete Book?',
      text: `Are you sure you want to permanently delete "${bookTitle}"? This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#666',
      confirmButtonText: 'Yes, Delete Permanently',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        console.log("🗑️ Permanently deleting archived book:", bookId);
        const res = await fetch(`https://paranaque-web-system.onrender.com/api/books/archived/${bookId}`, {
          method: "DELETE",
        });
        const data = await res.json();
        console.log("Delete response:", res.status, data);
        
        if (res.ok) {
          const updatedList = archivedBooks.filter((book) => book._id !== bookId);
          setArchivedBooks(updatedList);
          setFilteredBooks(updatedList);
          
          Swal.fire({
            title: 'Deleted!',
            text: 'Book deleted permanently!',
            icon: 'success',
            confirmButtonColor: '#4CAF50'
          });
        } else {
          Swal.fire({
            title: 'Error!',
            text: data.error || "Failed to delete book.",
            icon: 'error',
            confirmButtonColor: '#d33'
          });
        }
      } catch (err) {
        console.error("❌ Error deleting book:", err);
        Swal.fire({
          title: 'Error!',
          text: "Error deleting book: " + err.message,
          icon: 'error',
          confirmButtonColor: '#d33'
        });
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading archived books...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="archive-books-container">
      <div className="archive-header">
        <h2>📦 Archived Books</h2>
        <div className="archive-search-bar">
          <input
            type="text"
            placeholder="Search by title, author, or accession number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="archive-search-input"
          />
          <span className="archive-total-badge">
            Total: {filteredBooks.length}
          </span>
        </div>
      </div>

      {filteredBooks.length === 0 ? (
        <div className="archive-no-books">
          <img src="https://via.placeholder.com/100?text=No+Books" alt="No books" style={{ opacity: 0.5, marginBottom: '10px' }} />
          <p>No archived books found.</p>
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
            <div className="archive-table-wrapper">
              <table className="archive-books-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Image</th>
                    <th style={{ width: '20%', minWidth: '150px' }}>Book Title</th>
                    <th style={{ width: '15%', minWidth: '120px' }}>Author</th>
                    <th style={{ width: '70px' }}>Year</th>
                    <th style={{ width: '12%', minWidth: '100px' }}>Category</th>
                    <th style={{ width: '12%', minWidth: '110px' }}>Accession #</th>
                    <th style={{ width: '12%', minWidth: '110px' }}>Call #</th>
                    <th style={{ width: '15%', minWidth: '100px' }}>Location</th>
                    <th style={{ width: '140px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBooks.map((book) => (
                    <tr key={book._id}>
                      <td>
                        <img
                          src={book.image || 'https://via.placeholder.com/50x75?text=No+Image'}
                          alt={book.title}
                          style={{
                            width: '40px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '3px'
                          }}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/50x75?text=No+Image';
                          }}
                        />
                      </td>
                      <td>{book.title}</td>
                      <td>{book.author}</td>
                      <td>{book.year}</td>
                      <td>{book.category}</td>
                      <td>{book.accessionNumber}</td>
                      <td>{book.callNumber}</td>
                      <td>
                        {book.location
                          ? `${book.location.genreCode}-${book.location.shelf}-${book.location.level}`
                          : 'N/A'}
                      </td>
                      <td style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap' }}>
                        <button
                          onClick={() => handleReturnToStocks(book._id, book.title)}
                          className="archive-btn-return"
                          title="Return this book to active stocks"
                        >
                          ↩️ Return
                        </button>
                        <button
                          onClick={() => handleDeletePermanently(book._id, book.title)}
                          className="archive-btn-delete"
                          title="Permanently delete this book (cannot be undone)"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '20px',
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
          </div>
        );
      })()}
    </div>
  );
};

export default ArchiveBooksTable;
