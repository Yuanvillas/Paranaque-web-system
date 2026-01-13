import React, { useEffect, useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import './App.css';
import printIcon from "../imgs/print-icon.png";

const BorrowedBooksPerTable = () => {
  const reportRef = useRef();
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [approvedBooks, setApprovedBooks] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("day");

  useEffect(() => {
    const fetchAllBooks = async () => {
      try {
        setLoading(true);

        const borrowedRes = await fetch("https://paranaque-web-system.onrender.com/api/books/borrowed");
        const borrowedData = await borrowedRes.json();

        const approvedRes = await fetch("https://paranaque-web-system.onrender.com/api/transactions/approved-books");
        const approvedData = await approvedRes.json();

        if (borrowedRes.ok && approvedRes.ok) {
          setBorrowedBooks(borrowedData.books || []);
          setApprovedBooks(approvedData || []);
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

  const allBooks = [
    ...borrowedBooks.map(book => ({
      ...book,
      type: 'regular',
      borrowDate: book.borrowedAt || book.borrowDate,
      userEmail: book.borrowedBy || book.userEmail
    })),
    ...approvedBooks.map(book => ({
      ...book,
      type: 'approved',
      _id: book.bookId || book._id
    }))
  ];

  const filteredBooks = allBooks.filter(book => book.status === 'active');

  const now = new Date();
  const filteredByDate = filteredBooks.filter(book => {
    const borrowDate = new Date(book.borrowDate);
    if (filter === "day") {
      return borrowDate.toDateString() === now.toDateString();
    } else if (filter === "week") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      return borrowDate >= sevenDaysAgo;
    } else if (filter === "month") {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return borrowDate >= firstOfMonth;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="book-table-container">
        <h2>Borrowed Books</h2>
        <p>Loading borrowed books...</p>
      </div>
    );
  }
  const handlePrintPDF = async () => {
    const input = reportRef.current;
    if (!input) return;

    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`borrowed-books-${filter}.pdf`);
  };

  return (
    <div className="pending-container" style={{padding: "0px", marginTop: "26px"}}>
      <h2 style={{ fontWeight: '600', fontSize: '25px', marginTop: "5px" }}>Borrowed Books</h2>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div style={{ marginBottom: '15px' }}>
          <button
            className={`filter-tab ${filter === 'day' ? 'active' : ''}`}
            onClick={() => setFilter('day')}
          >
            Per Day
          </button>
          <button
            className={`filter-tab ${filter === 'week' ? 'active' : ''}`}
            onClick={() => setFilter('week')}
          >
            Per Week
          </button>
          <button
            className={`filter-tab ${filter === 'month' ? 'active' : ''}`}
            onClick={() => setFilter('month')}
          >
            Per Month
          </button>
        </div>
        <button onClick={handlePrintPDF} style={{
          marginBottom: "20px",
          padding: "10px 20px",
          backgroundColor: "#1dbf73",
          color: "white",
          border: "none",
          borderRadius: "5px",
          fontWeight: "600",
          cursor: "pointer"
        }}
        >
          <img src={printIcon} alt="Print Reports" style={{ width: "20px", height: "auto" }} />
        </button>
      </div>


      {error && <div className="error-message">{error}</div>}

      {!error && filteredByDate.length === 0 ? (
        <div className="no-books-message">
          <p>No borrowed books for selected time range.</p>
        </div>
      ) : (
        <div className="table-scroll">
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
              {filteredByDate.map((book) => {
                const daysOverdue = getDaysOverdue(book.returnDate);
                return (
                  <tr key={book._id}>
                    <td>
                      {book.image && (
                        <img
                          src={book.image ? book.image : ""}
                          alt={book.title}
                          style={{ width: "60px", height: "80px", objectFit: "cover", borderRadius: "4px", border: "1px solid #ddd" }}
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      )}
                    </td>
                    <td>{book.title}</td>
                    <td>{book.userEmail}</td>
                    <td>{formatDate(book.borrowDate)}</td>
                    <td>{formatDate(book.returnDate)}</td>
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
      )}
    </div>
  );
};

export default BorrowedBooksPerTable;
