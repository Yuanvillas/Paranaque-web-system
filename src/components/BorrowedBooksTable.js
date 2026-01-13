import React, { useEffect, useState } from 'react';
import './App.css';
import Swal from 'sweetalert2';

const BorrowedBooksTable = () => {
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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


  const handleReturn = async (bookId, userEmail) => {
    console.log("handleReturn Clicked!", bookId, userEmail);
    try {
      const res = await fetch(`https://paranaque-web-system.onrender.com/api/books/return/${bookId}`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bookId, userEmail })
      });
      console.log("Response status:", res.status, res.ok);

      if (res.ok) {
        const data = await res.json();
        console.log("Return successful:", data);
        await Swal.fire({
          title: "Parañaledge",
          text: "Book returned successfully!",
          icon: "success",
          confirmButtonText: "OK"
        });
        // Refresh the data after successful return
        console.log("Fetching all books after return...");
        await fetchAllBooks();
        console.log("Books refreshed");
      } else {
        const data = await res.json();
        console.error("Return failed:", data);
        await Swal.fire({
          title: "Parañaledge",
          text: data.message || "Failed to return book",
          icon: "error",
          confirmButtonText: "OK"
        });
      }
    } catch (err) {
      console.error("Error in handleReturn:", err);
      await Swal.fire({
        title: "Parañaledge",
        text: "Error returning book",
        icon: "error",
        confirmButtonText: "OK"
      });
    }
  };

  // handleReturnBook removed (no longer used)

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
      ) : (
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
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.map((book) => {
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
                    <td>
                      <button className="btn green" onClick={() => handleReturn(book._id, book.borrowedBy)}>Return</button>
                    </td>
                    {/* Actions column removed */}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BorrowedBooksTable;
