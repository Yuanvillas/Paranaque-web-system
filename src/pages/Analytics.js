// src/pages/Analytics.js
import React, { useEffect, useState, useRef } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import "../components/App.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faTimes } from "@fortawesome/free-solid-svg-icons";
import logo from "../imgs/liblogo.png";
import BooksListedChart from "../components/BooksListedChart";
import BooksAddedTodayChart from "../components/BooksAddedTodayChart";
import BorrowReturnChart from "../components/BorrowReturnChart";
import MostBorrowedBooksChart from "../components/MostBorrowedBooksChart";

const Analytics = ({ onClose }) => {
  const reportRef = useRef();
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [booksListedFilter, setBooksListedFilter] = useState("all");
  const [todayCount, setTodayCount] = useState(0);
  const [borrowedWeekCount, setBorrowedWeekCount] = useState(0);
  const [error, setError] = useState(null);
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [selectedModal, setSelectedModal] = useState(null);
  const [todayBooks, setTodayBooks] = useState([]);
  const [searchStored, setSearchStored] = useState("");
  const [searchToday, setSearchToday] = useState("");
  const [weekBorrowedBooks, setWeekBorrowedBooks] = useState([]);
  const [mostBorrowedBooks, setMostBorrowedBooks] = useState([]);
  const [searchMostBorrowed, setSearchMostBorrowed] = useState("");
  const [borrowedTab, setBorrowedTab] = useState('week'); // 'day', 'week', 'month'
  const [dayBorrowedBooks, setDayBorrowedBooks] = useState([]);
  const [monthBorrowedBooks, setMonthBorrowedBooks] = useState([]);
  const [searchBorrowedBooks, setSearchBorrowedBooks] = useState("");
  const [monthlyUsers, setMonthlyUsers] = useState([]);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState(null);

  const borrowedCount = borrowedBooks.length;
  const returnedCount = books.length - borrowedCount;
  const filteredMostBorrowedBooks = mostBorrowedBooks.filter(book =>
    (book.title?.toLowerCase().includes(searchMostBorrowed.toLowerCase()) || false) ||
    (book.author?.toLowerCase().includes(searchMostBorrowed.toLowerCase()) || false)
  );
  const filteredListedBooks = books.filter((book) => {
    const stock = Math.max(0, Number(book.stock) || 0);
    const availableStock = Math.max(0, Number(book.availableStock) || 0);
    const borrowedStock = Math.max(0, stock - availableStock);

    if (booksListedFilter === "borrowed") return borrowedStock > 0;
    if (booksListedFilter === "available") return availableStock > 0;
    return true;
  });
  const borrowReturnExportData = borrowedBooks.map(book => ({
    "Book Title": book.title || "-",
    Borrower: book.borrowedBy || "N/A",
    "Borrow Date": book.borrowedAt ? new Date(book.borrowedAt).toLocaleDateString() : "N/A",
    "Due Date": book.dueDate ? new Date(book.dueDate).toLocaleDateString() : "N/A",
    "Returned Date": book.returnedAt ? new Date(book.returnedAt).toLocaleDateString() : "Not Returned",
    Status: book.returnedAt ? "Returned" : "Borrowed"
  }));
  const borrowReturnExportRows = borrowReturnExportData.map(book => Object.values(book));
  const mostBorrowedExportData = filteredMostBorrowedBooks.map(book => ({
    Title: book.title || "-",
    Author: book.author || "-",
    Category: book.category || "-",
    Year: book.year || "-",
    "Times Borrowed": book.borrowCount || 0,
    Stock: book.stock ?? "-",
    Available: book.availableStock ?? "-"
  }));
  const reportExportButtonStyle = {
    padding: "8px 14px",
    backgroundColor: "#2e7d32",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold"
  };

  const openBooksListedModal = (filter) => {
    setBooksListedFilter(filter);
    setSelectedModal("booksListed");
  };

  const exportWorkbook = (sheets, filename) => {
    const wb = XLSX.utils.book_new();
    sheets.forEach(({ name, data }) => {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), name);
    });
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportToExcel = (data, filename) => {
    exportWorkbook([{ name: "Report", data }], filename);
  };

  const exportToPDF = (title, filename, headers, rows, summaryRows = []) => {
    const doc = new jsPDF("landscape", "mm", "a4");
    doc.setFontSize(14);
    doc.text(title, 14, 12);

    let startY = 20;
    if (summaryRows.length > 0) {
      autoTable(doc, {
        head: [["Metric", "Count"]],
        body: summaryRows,
        startY,
        styles: { fontSize: 9, cellPadding: 2 }
      });
      startY = doc.lastAutoTable.finalY + 8;
    }

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY,
      margin: { left: 10, right: 10, bottom: 12 },
      styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" }
    });
    doc.save(`${filename}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const exportBorrowReturnToExcel = () => {
    exportWorkbook([
      {
        name: "Summary",
        data: [
          { Metric: "Borrowed", Count: borrowedCount },
          { Metric: "Returned", Count: returnedCount },
          { Metric: "Total", Count: books.length }
        ]
      },
      { name: "Borrow Details", data: borrowReturnExportData }
    ], "Borrow_vs_Return_Report");
  };

  const exportBorrowReturnToPDF = () => {
    exportToPDF(
      "Borrow vs Return Summary",
      "Borrow_vs_Return_Report",
      ["Book Title", "Borrower", "Borrow Date", "Due Date", "Returned Date", "Status"],
      borrowReturnExportRows,
      [
        ["Borrowed", borrowedCount],
        ["Returned", returnedCount],
        ["Total", books.length]
      ]
    );
  };

  const exportMostBorrowedToExcel = () => {
    exportToExcel(mostBorrowedExportData, "Most_Borrowed_Books_Report");
  };

  const exportMostBorrowedToPDF = () => {
    exportToPDF(
      "Most Borrowed Books",
      "Most_Borrowed_Books_Report",
      ["Title", "Author", "Category", "Year", "Times Borrowed", "Stock", "Available"],
      mostBorrowedExportData.map(book => Object.values(book))
    );
  };

  const migrateUserTimestamps = async () => {
    setIsMigrating(true);
    setMigrationMessage(null);
    try {
      const res = await fetch("https://paranaque-web-system.onrender.com/api/auth/migrate-user-timestamps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      const data = await res.json();
      
      if (res.ok) {
        setMigrationMessage({
          type: 'success',
          text: `✅ Migration successful! ${data.usersUpdated} users updated. Refreshing data...`,
          usersUpdated: data.usersUpdated
        });
        
        // Refresh the monthly users data after successful migration
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMigrationMessage({
          type: 'error',
          text: `❌ Migration failed: ${data.error || data.message}`
        });
      }
    } catch (err) {
      setMigrationMessage({
        type: 'error',
        text: `❌ Error: ${err.message}`
      });
    } finally {
      setIsMigrating(false);
    }
  };

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await fetch("https://paranaque-web-system.onrender.com/api/books?limit=10000");
        const data = await res.json();
        if (res.ok) {
          setBooks(data.books.filter((b) => !b.archived));
        } else {
          setError(data.error || "Failed to fetch books.");
        }
      } catch (err) {
        setError("Error fetching books.");
        console.error(err);
      }
    };

    const fetchBorrowedBooks = async () => {
      try {
        const res = await fetch("https://paranaque-web-system.onrender.com/api/books/borrowed?limit=10000");
        const data = await res.json();

        if (res.ok) {
          setBorrowedBooks(data.books.filter((b) => !b.archived));
        } else {
          setBorrowedBooks([]);
          setError(data.error || "Failed to fetch books.");
        }
      } catch (err) {
        setError("Error fetching books.");
        console.error(err);
      }
    };

    const fetchTodayCount = async () => {
      try {
        const res = await fetch("https://paranaque-web-system.onrender.com/api/books/stats/today");
        const data = await res.json();
        if (res.ok) {
          setTodayCount(data.todayCount);
          setTodayBooks(data.books || []);
        }
      } catch (err) {
        console.error("Error fetching today's book count:", err);
      }
    };

    const fetchBorrowedWeekCount = async () => {
      try {
        const res = await fetch(
          "https://paranaque-web-system.onrender.com/api/books/stats/borrowed-week"
        );
        const data = await res.json();
        if (res.ok) {
          setBorrowedWeekCount(data.borrowedWeekCount);
          setWeekBorrowedBooks(data.books || []);
        } else {
          setError(data.error || "Failed to fetch weekly borrowed count.");
        }
      } catch (err) {
        console.error("Error fetching borrowed books this week:", err);
      }
    };

    const fetchMostBorrowedBooks = async () => {
      try {
        const res = await fetch(
          "https://paranaque-web-system.onrender.com/api/books/stats/most-borrowed"
        );
        const data = await res.json();
        if (res.ok) {
          setMostBorrowedBooks(data.mostBorrowedBooks || []);
        } else {
          console.error("Failed to fetch most borrowed books:", data.error);
        }
      } catch (err) {
        console.error("Error fetching most borrowed books:", err);
      }
    };

    const fetchBorrowedTodayBooks = async () => {
      try {
        const res = await fetch(
          "https://paranaque-web-system.onrender.com/api/books/stats/borrowed-today"
        );
        const data = await res.json();
        if (res.ok) {
          setDayBorrowedBooks(data.books || []);
        } else {
          console.error("Failed to fetch today's borrowed books:", data.error);
        }
      } catch (err) {
        console.error("Error fetching borrowed books for today:", err);
      }
    };

    const fetchBorrowedMonthBooks = async () => {
      try {
        const res = await fetch(
          "https://paranaque-web-system.onrender.com/api/books/stats/borrowed-month"
        );
        const data = await res.json();
        if (res.ok) {
          setMonthBorrowedBooks(data.books || []);
        } else {
          console.error("Failed to fetch month's borrowed books:", data.error);
        }
      } catch (err) {
        console.error("Error fetching borrowed books for the month:", err);
      }
    };

    const fetchMonthlyUsers = async () => {
      try {
        const res = await fetch(
          "https://paranaque-web-system.onrender.com/api/auth/monthly-stats"
        );
        const data = await res.json();
        if (res.ok) {
          setMonthlyUsers(data.monthlyStats || []);
        } else {
          console.error("Failed to fetch monthly users:", data.error);
        }
      } catch (err) {
        console.error("Error fetching monthly users:", err);
      }
    };

    fetchBooks();
    fetchTodayCount();
    fetchBorrowedWeekCount();
    fetchBorrowedTodayBooks();
    fetchBorrowedMonthBooks();
    fetchMostBorrowedBooks();
    fetchBorrowedBooks();
    fetchMonthlyUsers();
  }, []);

  return (
    <div className="dashboard">
      {!onClose && (
      <aside className="sidebar">
        <div className="logo2">
          <img style={{ width: '50px' }} src={logo} alt="School" />
        </div>
        <nav className="nav-links">
          <button onClick={() => navigate("/admin-dashboard", { state: { openResource: true } })}>
            <FontAwesomeIcon icon={faArrowLeft} />
            <span style={{ marginLeft: 8 }}>Back to Dashboard</span>
          </button>
        </nav>
      </aside>
      )}

      <main className="main-content" style={onClose ? { width: '100%', marginLeft: 0, padding: '0', backgroundColor: 'transparent' } : {}}>

        <section className="content" ref={reportRef} style={{ marginTop: "10px", padding: onClose ? "0 15px" : "0 30px" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h2 className="page-title" style={{marginTop: "0px", fontSize: '28px'}}>Analytics Overview</h2>
            {monthlyUsers.length === 0 && (
              <button 
                onClick={migrateUserTimestamps}
                disabled={isMigrating}
                style={{
                  padding: '10px 20px',
                  backgroundColor: isMigrating ? '#ccc' : '#2e7d32',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isMigrating ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => !isMigrating && (e.target.style.backgroundColor = '#1b5e20')}
                onMouseLeave={(e) => !isMigrating && (e.target.style.backgroundColor = '#2e7d32')}
              >
                {isMigrating ? '⏳ Migrating...' : '📊 Populate User Data'}
              </button>
            )}
          </div>

          {migrationMessage && (
            <div style={{
              padding: '15px',
              marginBottom: '20px',
              borderRadius: '6px',
              backgroundColor: migrationMessage.type === 'success' ? '#e8f5e9' : '#ffebee',
              color: migrationMessage.type === 'success' ? '#2e7d32' : '#c62828',
              border: `1px solid ${migrationMessage.type === 'success' ? '#4caf50' : '#f44336'}`
            }}>
              {migrationMessage.text}
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <div style={{display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "15px", marginBottom: "30px", padding: "15px", width: "100%"}}>
            <div style={{backgroundColor: "#f9f9f9", padding: "15px", borderRadius: "8px", height: "320px", overflow: "hidden", cursor: "pointer", transition: "all 0.3s ease"}} onClick={() => openBooksListedModal("all")} onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"} onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}>
              <div style={{ height: "270px" }}>
                <BooksListedChart books={books} />
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openBooksListedModal("available");
                  }}
                  style={{ padding: "7px 12px", border: "none", borderRadius: "5px", backgroundColor: "#4caf50", color: "white", cursor: "pointer" }}
                >
                  View Available
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openBooksListedModal("borrowed");
                  }}
                  style={{ padding: "7px 12px", border: "none", borderRadius: "5px", backgroundColor: "#ffb300", color: "#333", cursor: "pointer" }}
                >
                  View Borrowed
                </button>
              </div>
            </div>
            <div style={{backgroundColor: "#f9f9f9", padding: "15px", borderRadius: "8px", height: "280px", overflow: "hidden", cursor: "pointer", transition: "all 0.3s ease"}} onClick={() => setSelectedModal('monthlyUsers')} onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"} onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}>
              <BooksAddedTodayChart monthlyUsers={monthlyUsers} />
            </div>
            <div style={{backgroundColor: "#f9f9f9", padding: "15px", borderRadius: "8px", height: "280px", overflow: "hidden", cursor: "pointer", transition: "all 0.3s ease"}} onClick={() => setSelectedModal('borrowReturn')} onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"} onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}>
              <BorrowReturnChart borrowedBooks={borrowedBooks} allBooks={books} />
            </div>
            <div style={{backgroundColor: "#f9f9f9", padding: "15px", borderRadius: "8px", height: "280px", overflow: "hidden", cursor: "pointer", transition: "all 0.3s ease"}} onClick={() => setSelectedModal('mostBorrowed')} onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"} onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}>
              <MostBorrowedBooksChart mostBorrowedBooks={mostBorrowedBooks} />
            </div>
          </div>

          <div className="dashboard-summary">
            <div className="summary-box" onClick={() => setSelectedModal('stored')} style={{ cursor: 'pointer', transition: 'all 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              <h3>Total Active Stored Books</h3>
              <p>{books.length}</p>
            </div>

            <div className="summary-box" onClick={() => setSelectedModal('today')} style={{ cursor: 'pointer', transition: 'all 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              <h3>Books Added Today</h3>
              <p>{todayCount}</p>
            </div>

            <div className="summary-box" onClick={() => setSelectedModal('week')} style={{ cursor: 'pointer', transition: 'all 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              <h3>Books Borrowed Per Week</h3>
              <p>{borrowedWeekCount}</p>
            </div>

            <div className="summary-box" onClick={() => setSelectedModal('monthlyUsers')} style={{ cursor: 'pointer', transition: 'all 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              <h3>Monthly Users</h3>
              <p>{monthlyUsers.reduce((sum, u) => sum + (u.count || 0), 0)}</p>
            </div>

            <div className="summary-box" onClick={() => setSelectedModal('mostBorrowed')} style={{ cursor: 'pointer', transition: 'all 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              <h3>Most Borrowed Books</h3>
              <p>{mostBorrowedBooks.length}</p>
            </div>
          </div>

          {/* Modal for Stored Books */}
          {selectedModal === 'stored' && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '30px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', position: 'relative', width: '100%', marginLeft: '20px', marginRight: '20px' }}>
                <button onClick={() => setSelectedModal(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer' }}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2>Total Active Stored Books ({books.filter(b => b.title?.toLowerCase().includes(searchStored.toLowerCase()) || false).length})</h2>
                  <button 
                    onClick={() => {
                      const data = books.filter(b => 
                        (b.title?.toLowerCase().includes(searchStored.toLowerCase()) || false) ||
                        (b.author?.toLowerCase().includes(searchStored.toLowerCase()) || false) ||
                        (b.accessionNumber?.toLowerCase().includes(searchStored.toLowerCase()) || false)
                      ).map(book => ({
                        Title: book.title,
                        Author: book.author,
                        Year: book.year,
                        Category: book.category,
                        'Accession Number': book.accessionNumber,
                        Location: book.location ? `${book.location.genreCode}-${book.location.shelf}-${book.location.level}` : 'N/A',
                        Status: book.status || 'Available'
                      }));
                      exportToExcel(data, "Stored_Books_Report");
                    }}
                    style={{ padding: '8px 16px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
                  >
                    📥 Export to Excel
                  </button>
                </div>
                <input 
                  type="text" 
                  placeholder="Search by title, author, or accession number..." 
                  value={searchStored}
                  onChange={(e) => setSearchStored(e.target.value)}
                  style={{ width: '100%', padding: '10px', marginTop: '15px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ddd' }}
                />
                <table className="styled-table" style={{ marginTop: '20px' }}>
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Title</th>
                      <th>Year</th>
                      <th>Category</th>
                      <th>Author</th>
                      <th>Accession Number</th>
                      <th>Location</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.filter(b => 
                      (b.title?.toLowerCase().includes(searchStored.toLowerCase()) || false) ||
                      (b.author?.toLowerCase().includes(searchStored.toLowerCase()) || false) ||
                      (b.accessionNumber?.toLowerCase().includes(searchStored.toLowerCase()) || false)
                    ).map((book) => (
                      <tr key={book._id}>
                        <td>{book.image ? <img src={book.image} alt={book.title} style={{ width: '50px', height: 'auto' }} /> : 'No Image'}</td>
                        <td>{book.title}</td>
                        <td>{book.year}</td>
                        <td>{book.category}</td>
                        <td>{book.author}</td>
                        <td>{book.accessionNumber}</td>
                        <td>{book.location ? `${book.location.genreCode}-${book.location.shelf}-${book.location.level}` : 'N/A'}</td>
                        <td>{book.status ? book.status : 'Available'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal for Books Listed (from chart) */}
          {selectedModal === 'booksListed' && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '30px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', position: 'relative', width: '100%', marginLeft: '20px', marginRight: '20px' }}>
                <button onClick={() => setSelectedModal(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer' }}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2>Books Listed Status ({filteredListedBooks.length})</h2>
                  <button 
                    onClick={() => {
                      const data = filteredListedBooks.map(book => ({
                        Title: book.title,
                        Author: book.author,
                        Year: book.year,
                        Category: book.category,
                        'Accession Number': book.accessionNumber,
                        Location: book.location ? `${book.location.genreCode}-${book.location.shelf}-${book.location.level}` : 'N/A',
                        Status: book.status || 'Available',
                        'Available': book.availableStock || 0,
                        'Borrowed': (book.stock || 0) - (book.availableStock || 0)
                      }));
                      exportToExcel(data, "Books_Listed_Status");
                    }}
                    disabled={filteredListedBooks.length === 0}
                    style={{ padding: '8px 16px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', cursor: filteredListedBooks.length === 0 ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 'bold', opacity: filteredListedBooks.length === 0 ? 0.6 : 1 }}
                  >
                    📥 Export to Excel
                  </button>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '15px' }}>
                  <span>Filter by availability:</span>
                  <select
                    value={booksListedFilter}
                    onChange={(e) => setBooksListedFilter(e.target.value)}
                    aria-label="Filter books by borrowed or available copies"
                    style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #ddd' }}
                  >
                    <option value="all">All Books</option>
                    <option value="borrowed">Borrowed (has copies out)</option>
                    <option value="available">Available (has copies in stock)</option>
                  </select>
                </label>
                <table className="styled-table" style={{ marginTop: '20px' }}>
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Title</th>
                      <th>Author</th>
                      <th>Category</th>
                      <th>Year</th>
                      <th>Stock</th>
                      <th>Available</th>
                      <th>Borrowed</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredListedBooks.length === 0 ? (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                          No books match this filter.
                        </td>
                      </tr>
                    ) : filteredListedBooks.map((book) => (
                      <tr key={book._id}>
                        <td>{book.image ? <img src={book.image} alt={book.title} style={{ width: '50px', height: 'auto' }} /> : 'No Image'}</td>
                        <td>{book.title}</td>
                        <td>{book.author}</td>
                        <td>{book.category}</td>
                        <td>{book.year}</td>
                        <td>{book.stock || 0}</td>
                        <td><span style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{book.availableStock || 0}</span></td>
                        <td><span style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{(book.stock || 0) - (book.availableStock || 0)}</span></td>
                        <td>{book.status ? book.status : 'Available'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal for Borrow vs Return (from chart) */}
          {selectedModal === 'borrowReturn' && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '30px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', position: 'relative', width: '100%', marginLeft: '20px', marginRight: '20px' }}>
                <button onClick={() => setSelectedModal(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer' }}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', paddingRight: '45px', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0 }}>Borrow vs Return Summary</h2>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button type="button" onClick={exportBorrowReturnToPDF} style={reportExportButtonStyle}>
                      Export PDF
                    </button>
                    <button type="button" onClick={exportBorrowReturnToExcel} style={reportExportButtonStyle}>
                      Export Excel
                    </button>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '30px' }}>
                  <div style={{ backgroundColor: '#ffebee', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                    <h3 style={{ color: '#c62828', margin: '0 0 10px 0' }}>Borrowed</h3>
                    <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#c62828', margin: 0 }}>{borrowedCount}</p>
                  </div>
                  <div style={{ backgroundColor: '#e8f5e9', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                    <h3 style={{ color: '#2e7d32', margin: '0 0 10px 0' }}>Returned</h3>
                    <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#2e7d32', margin: 0 }}>{returnedCount}</p>
                  </div>
                  <div style={{ backgroundColor: '#f3e5f5', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                    <h3 style={{ color: '#6a1b9a', margin: '0 0 10px 0' }}>Total</h3>
                    <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#6a1b9a', margin: 0 }}>{books.length}</p>
                  </div>
                </div>

                <h3>Book Transactions Detail</h3>
                <table className="styled-table" style={{ marginTop: '20px' }}>
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Title</th>
                      <th>Borrower</th>
                      <th>Borrow Date</th>
                      <th>Due Date</th>
                      <th>Returned Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {borrowedBooks.map((book) => (
                      <tr key={book._id}>
                        <td>{book.image ? <img src={book.image} alt={book.title} style={{ width: '50px', height: 'auto' }} /> : 'No Image'}</td>
                        <td>{book.title}</td>
                        <td>{book.borrowedBy || 'N/A'}</td>
                        <td>{book.borrowedAt ? new Date(book.borrowedAt).toLocaleDateString() : 'N/A'}</td>
                        <td>{book.dueDate ? new Date(book.dueDate).toLocaleDateString() : 'N/A'}</td>
                        <td>{book.returnedAt ? new Date(book.returnedAt).toLocaleDateString() : 'Not Returned'}</td>
                        <td>
                          {book.returnedAt ? (
                            <span style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Returned</span>
                          ) : (
                            <span style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Borrowed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal for Books Added Today */}
          {selectedModal === 'today' && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '30px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', position: 'relative', width: '100%', marginLeft: '20px', marginRight: '20px' }}>
                <button onClick={() => setSelectedModal(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer' }}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
                <h2>Books Added Today ({todayBooks.filter(b => b.title?.toLowerCase().includes(searchToday.toLowerCase()) || false).length})</h2>
                <input 
                  type="text" 
                  placeholder="Search by title, author, or accession number..." 
                  value={searchToday}
                  onChange={(e) => setSearchToday(e.target.value)}
                  style={{ width: '100%', padding: '10px', marginTop: '15px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ddd' }}
                />
                {todayBooks.filter(b => 
                  (b.title?.toLowerCase().includes(searchToday.toLowerCase()) || false) ||
                  (b.author?.toLowerCase().includes(searchToday.toLowerCase()) || false) ||
                  (b.accessionNumber?.toLowerCase().includes(searchToday.toLowerCase()) || false)
                ).length === 0 ? (
                  <p style={{ marginTop: '20px', color: '#999' }}>No books found</p>
                ) : (
                  <table className="styled-table" style={{ marginTop: '20px' }}>
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Title</th>
                        <th>Year</th>
                        <th>Category</th>
                        <th>Author</th>
                        <th>Accession Number</th>
                        <th>Location</th>
                        <th>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayBooks.filter(b => 
                        (b.title?.toLowerCase().includes(searchToday.toLowerCase()) || false) ||
                        (b.author?.toLowerCase().includes(searchToday.toLowerCase()) || false) ||
                        (b.accessionNumber?.toLowerCase().includes(searchToday.toLowerCase()) || false)
                      ).map((book) => (
                        <tr key={book._id}>
                          <td>{book.image ? <img src={book.image} alt={book.title} style={{ width: '50px', height: 'auto' }} /> : 'No Image'}</td>
                          <td>{book.title}</td>
                          <td>{book.year}</td>
                          <td>{book.category}</td>
                          <td>{book.author}</td>
                          <td>{book.accessionNumber}</td>
                          <td>{book.location ? `${book.location.genreCode}-${book.location.shelf}-${book.location.level}` : 'N/A'}</td>
                          <td>{book.stock || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Modal for Books Borrowed - with tabs */}
          {selectedModal === 'week' && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '30px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', position: 'relative', width: '100%', marginLeft: '20px', marginRight: '20px' }}>
                <button onClick={() => setSelectedModal(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer' }}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
                <h2 style={{ marginBottom: '20px' }}>Borrowed Books</h2>
                
                {/* Tab Buttons */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                  <button
                    onClick={() => setBorrowedTab('day')}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: borrowedTab === 'day' ? '#2e7d32' : '#f0f0f0',
                      color: borrowedTab === 'day' ? 'white' : '#333',
                      border: 'none',
                      borderRadius: '6px 6px 0 0',
                      cursor: 'pointer',
                      fontWeight: borrowedTab === 'day' ? '600' : '400',
                      fontSize: '14px'
                    }}
                  >
                    Per Day
                  </button>
                  <button
                    onClick={() => setBorrowedTab('week')}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: borrowedTab === 'week' ? '#2e7d32' : '#f0f0f0',
                      color: borrowedTab === 'week' ? 'white' : '#333',
                      border: 'none',
                      borderRadius: '6px 6px 0 0',
                      cursor: 'pointer',
                      fontWeight: borrowedTab === 'week' ? '600' : '400',
                      fontSize: '14px'
                    }}
                  >
                    Per Week
                  </button>
                  <button
                    onClick={() => setBorrowedTab('month')}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: borrowedTab === 'month' ? '#2e7d32' : '#f0f0f0',
                      color: borrowedTab === 'month' ? 'white' : '#333',
                      border: 'none',
                      borderRadius: '6px 6px 0 0',
                      cursor: 'pointer',
                      fontWeight: borrowedTab === 'month' ? '600' : '400',
                      fontSize: '14px'
                    }}
                  >
                    Per Month
                  </button>
                </div>

                {/* Search Bar */}
                <input 
                  type="text" 
                  placeholder="Search by title, author, or borrower..." 
                  value={searchBorrowedBooks}
                  onChange={(e) => setSearchBorrowedBooks(e.target.value)}
                  style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ddd' }}
                />

                {/* Content based on selected tab */}
                {borrowedTab === 'day' && (
                  dayBorrowedBooks.filter(b => 
                    (b.title?.toLowerCase().includes(searchBorrowedBooks.toLowerCase()) || false) ||
                    (b.author?.toLowerCase().includes(searchBorrowedBooks.toLowerCase()) || false) ||
                    (b.borrowedBy?.toLowerCase().includes(searchBorrowedBooks.toLowerCase()) || false)
                  ).length === 0 ? (
                    <p style={{ marginTop: '20px', color: '#999' }}>No books found</p>
                  ) : (
                    <table className="styled-table" style={{ marginTop: '20px' }}>
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
                        {dayBorrowedBooks.filter(b => 
                          (b.title?.toLowerCase().includes(searchBorrowedBooks.toLowerCase()) || false) ||
                          (b.author?.toLowerCase().includes(searchBorrowedBooks.toLowerCase()) || false) ||
                          (b.borrowedBy?.toLowerCase().includes(searchBorrowedBooks.toLowerCase()) || false)
                        ).map((book) => (
                          <tr key={book._id}>
                            <td>{book.image ? <img src={book.image} alt={book.title} style={{ width: '50px', height: 'auto' }} /> : 'No Image'}</td>
                            <td>{book.title}</td>
                            <td>{book.borrowedBy || 'N/A'}</td>
                            <td>{book.borrowedAt ? new Date(book.borrowedAt).toLocaleDateString() : 'N/A'}</td>
                            <td>{book.dueDate ? new Date(book.dueDate).toLocaleDateString() : 'N/A'}</td>
                            <td><span style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Active</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                )}

                {borrowedTab === 'week' && (
                  weekBorrowedBooks.filter(b => 
                    (b.title?.toLowerCase().includes(searchBorrowedBooks.toLowerCase()) || false) ||
                    (b.author?.toLowerCase().includes(searchBorrowedBooks.toLowerCase()) || false) ||
                    (b.borrowedBy?.toLowerCase().includes(searchBorrowedBooks.toLowerCase()) || false)
                  ).length === 0 ? (
                    <p style={{ marginTop: '20px', color: '#999' }}>No books found</p>
                  ) : (
                    <table className="styled-table" style={{ marginTop: '20px' }}>
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
                        {weekBorrowedBooks.filter(b => 
                          (b.title?.toLowerCase().includes(searchBorrowedBooks.toLowerCase()) || false) ||
                          (b.author?.toLowerCase().includes(searchBorrowedBooks.toLowerCase()) || false) ||
                          (b.borrowedBy?.toLowerCase().includes(searchBorrowedBooks.toLowerCase()) || false)
                        ).map((book) => (
                          <tr key={book._id}>
                            <td>{book.image ? <img src={book.image} alt={book.title} style={{ width: '50px', height: 'auto' }} /> : 'No Image'}</td>
                            <td>{book.title}</td>
                            <td>{book.borrowedBy || 'N/A'}</td>
                            <td>{book.borrowedAt ? new Date(book.borrowedAt).toLocaleDateString() : 'N/A'}</td>
                            <td>{book.dueDate ? new Date(book.dueDate).toLocaleDateString() : 'N/A'}</td>
                            <td><span style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Active</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                )}

                {borrowedTab === 'month' && (
                  monthBorrowedBooks.filter(b => 
                    (b.title?.toLowerCase().includes(searchBorrowedBooks.toLowerCase()) || false) ||
                    (b.author?.toLowerCase().includes(searchBorrowedBooks.toLowerCase()) || false) ||
                    (b.borrowedBy?.toLowerCase().includes(searchBorrowedBooks.toLowerCase()) || false)
                  ).length === 0 ? (
                    <p style={{ marginTop: '20px', color: '#999' }}>No books found</p>
                  ) : (
                    <table className="styled-table" style={{ marginTop: '20px' }}>
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
                        {monthBorrowedBooks.filter(b => 
                          (b.title?.toLowerCase().includes(searchBorrowedBooks.toLowerCase()) || false) ||
                          (b.author?.toLowerCase().includes(searchBorrowedBooks.toLowerCase()) || false) ||
                          (b.borrowedBy?.toLowerCase().includes(searchBorrowedBooks.toLowerCase()) || false)
                        ).map((book) => (
                          <tr key={book._id}>
                            <td>{book.image ? <img src={book.image} alt={book.title} style={{ width: '50px', height: 'auto' }} /> : 'No Image'}</td>
                            <td>{book.title}</td>
                            <td>{book.borrowedBy || 'N/A'}</td>
                            <td>{book.borrowedAt ? new Date(book.borrowedAt).toLocaleDateString() : 'N/A'}</td>
                            <td>{book.dueDate ? new Date(book.dueDate).toLocaleDateString() : 'N/A'}</td>
                            <td><span style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Active</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                )}
              </div>
            </div>
          )}

          {/* Modal for Most Borrowed Books */}
          {selectedModal === 'mostBorrowed' && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '30px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', position: 'relative', width: '100%', marginLeft: '20px', marginRight: '20px' }}>
                <button onClick={() => setSelectedModal(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer' }}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', paddingRight: '45px' }}>
                  <h2 style={{ margin: 0 }}>Most Borrowed Books ({filteredMostBorrowedBooks.length})</h2>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={exportMostBorrowedToPDF}
                      disabled={filteredMostBorrowedBooks.length === 0}
                      style={{ ...reportExportButtonStyle, opacity: filteredMostBorrowedBooks.length === 0 ? 0.6 : 1, cursor: filteredMostBorrowedBooks.length === 0 ? 'not-allowed' : 'pointer' }}
                    >
                      Export PDF
                    </button>
                    <button
                      type="button"
                      onClick={exportMostBorrowedToExcel}
                      disabled={filteredMostBorrowedBooks.length === 0}
                      style={{ ...reportExportButtonStyle, opacity: filteredMostBorrowedBooks.length === 0 ? 0.6 : 1, cursor: filteredMostBorrowedBooks.length === 0 ? 'not-allowed' : 'pointer' }}
                    >
                      Export Excel
                    </button>
                  </div>
                </div>
                <input 
                  type="text" 
                  placeholder="Search by title or author..." 
                  value={searchMostBorrowed}
                  onChange={(e) => setSearchMostBorrowed(e.target.value)}
                  style={{ width: '100%', padding: '10px', marginTop: '15px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ddd' }}
                />
                {filteredMostBorrowedBooks.length === 0 ? (
                  <p style={{ marginTop: '20px', color: '#999' }}>No books found</p>
                ) : (
                  <table className="styled-table" style={{ marginTop: '20px' }}>
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Category</th>
                        <th>Year</th>
                        <th>Times Borrowed</th>
                        <th>Stock</th>
                        <th>Available</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMostBorrowedBooks.map((book) => (
                        <tr key={book._id}>
                          <td>{book.image ? <img src={book.image} alt={book.title} style={{ width: '50px', height: 'auto' }} /> : 'No Image'}</td>
                          <td>{book.title}</td>
                          <td>{book.author}</td>
                          <td>{book.category}</td>
                          <td>{book.year}</td>
                          <td><strong style={{ color: '#2e7d32', fontSize: '16px' }}>{book.borrowCount}</strong></td>
                          <td>{book.stock || '-'}</td>
                          <td>{book.availableStock || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Modal for Monthly Users */}
          {selectedModal === 'monthlyUsers' && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '30px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', position: 'relative', width: '100%', marginLeft: '20px', marginRight: '20px' }}>
                <button onClick={() => setSelectedModal(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer' }}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2>Monthly User Statistics (Total: {monthlyUsers.reduce((sum, u) => sum + (u.count || 0), 0)})</h2>
                  <button 
                    onClick={() => {
                      const data = monthlyUsers.map(stat => ({
                        Month: stat.month,
                        'Users Registered': stat.count
                      }));
                      exportToExcel(data, "Monthly_Users_Report");
                    }}
                    style={{ padding: '8px 16px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
                  >
                    📥 Export to Excel
                  </button>
                </div>
                {monthlyUsers.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                    <p style={{ fontSize: '16px' }}>No monthly user data available yet.</p>
                    <p style={{ fontSize: '14px', marginTop: '10px' }}>Users will be listed here as they register in the system.</p>
                  </div>
                ) : (
                  <table className="styled-table" style={{ marginTop: '20px', width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '70%' }}>Month</th>
                        <th style={{ width: '30%', textAlign: 'center' }}>Users Registered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyUsers.map((stat, index) => (
                        <tr key={index}>
                          <td><strong>{stat.month}</strong></td>
                          <td style={{ textAlign: 'center', fontSize: '16px', color: '#2e7d32', fontWeight: 'bold' }}>{stat.count}</td>
                        </tr>
                      ))}
                      <tr style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
                        <td>Total</td>
                        <td style={{ textAlign: 'center', color: '#2e7d32', fontSize: '16px' }}>{monthlyUsers.reduce((sum, u) => sum + (u.count || 0), 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

        </section>
      </main>
    </div >
  );
};

export default Analytics;
