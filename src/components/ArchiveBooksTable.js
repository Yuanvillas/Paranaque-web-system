import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import './App.css';

const ArchiveBooksTable = () => {
  const [archivedBooks, setArchivedBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

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
    <div className="books-table-container">
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Archived Books</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by title, author, or accession number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              width: '300px',
              fontSize: '14px'
            }}
          />
          <span style={{ fontWeight: 'bold', color: '#666' }}>
            Total: {filteredBooks.length}
          </span>
        </div>
      </div>

      {filteredBooks.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#999',
          fontSize: '16px'
        }}>
          No archived books found.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="books-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Book Title</th>
                <th>Author</th>
                <th>Year</th>
                <th>Category</th>
                <th>Accession Number</th>
                <th>Call Number</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.map((book) => (
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
                  <td style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleReturnToStocks(book._id, book.title)}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap'
                      }}
                      title="Return this book to active stocks"
                    >
                      ↩️ Return
                    </button>
                    <button
                      onClick={() => handleDeletePermanently(book._id, book.title)}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap'
                      }}
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
      )}
    </div>
  );
};

export default ArchiveBooksTable;
