import React, { useEffect, useState } from 'react';
import './App.css';

const BorrowedBooksTable = () => {
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  const fetchAllBooks = async () => {
    try {
      setLoading(true);

      // Fetch regular borrowed books
      const borrowedRes = await fetch("https://paranaque-web-system.onrender.com/api/books/borrowed?limit=10000");
      const borrowedData = await borrowedRes.json();

      if (borrowedRes.ok) {
        setBorrowedBooks(borrowedData.books || []);
        setError(null);
      } else {
        setError("Failed to fetch some book data.");
      }
    } catch (err) {
      console.error("Error fetching books:", err);
      setError("Error connecting to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBooks();
  }, []);

  const getDaysOverdue = (dueDate) => {
    if (!dueDate) return 0;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const allBooks = borrowedBooks.map(book => ({
    ...book,
    type: 'regular',
    borrowDate: book.borrowedAt || book.borrowDate,
    userEmail: book.borrowedBy || book.userEmail
  }));

  const filteredBooks = allBooks.filter((book) =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) && book.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  console.log("filteredBooks: ", filteredBooks)
  if (loading) {
    return (
      <div className="book-table-container">
        <h2>Borrowed Books</h2>
        <p>Loading borrowed books...</p>
      </div>
    );
  }

  return (
    <div className="pending-container">
      <div className="header-row">
        <h2 style={{ fontWeight: '600', fontSize: '25px', marginTop: "5px" }}>✅ Borrowed Books</h2>
        <div className="search-container ">
          <input type="text" placeholder="Search analytics..." onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!error && filteredBooks.length === 0 ? (
        <div className="no-books-message">
          <p>No active borrowed books found.</p>
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
            <div className="table-wrapper">
              <table className="styled-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Borrower</th>
                    <th>Borrow Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBooks.map((book) => {
                    const daysOverdue = getDaysOverdue(book.dueDate);
                    return (
                      <tr key={book._id}>
                        <td className="d-flex justify-content-center align-items-center">
                          {book.image && (
                            <img
                              src={book.image ? book.image : ""}
                              alt={book.title}
                              style={{
                                width: "60px",
                                height: "80px",
                                objectFit: "cover",
                                borderRadius: "4px",
                                border: "1px solid #ddd"
                              }}
                              onError={(e) => e.target.style.display = 'none'}
                            />
                          )}
                        </td>
                        <td>{book.title}</td>
                        <td>{book.userEmail}</td>
                        <td>{formatDate(book.borrowDate)}</td>
                        <td>{formatDate(book.dueDate || book.returnDate)}</td>
                        <td>
                          <span className={`status-badge ${book.status}`} style={{ color: 'black' }}>
                            {book.status}
                          </span>
                          {daysOverdue > 0 && book.status === 'active' && (
                            <span className="overdue-badge">
                              {daysOverdue} days overdue
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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

export default BorrowedBooksTable;
