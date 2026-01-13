// src/pages/Analytics.js
import React, { useEffect, useState, useRef } from "react";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import "../components/App.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faUndo, faTrash, faBook, faTimes } from "@fortawesome/free-solid-svg-icons";
import logo from "../imgs/liblogo.png";
import printIcon from "../imgs/print-icon.png";
import BorrowedReturnedChart from "../components/BorrowedReturnedChart";

const Analytics = () => {
  const reportRef = useRef();
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [todayCount, setTodayCount] = useState(0);
  const [borrowedWeekCount, setBorrowedWeekCount] = useState(0);
  const [error, setError] = useState(null);
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModal, setSelectedModal] = useState(null);
  const [todayBooks, setTodayBooks] = useState([]);
  const [searchStored, setSearchStored] = useState("");
  const [searchToday, setSearchToday] = useState("");
  const [searchWeek, setSearchWeek] = useState("");
  const [weekBorrowedBooks, setWeekBorrowedBooks] = useState([]);
  const [mostBorrowedBooks, setMostBorrowedBooks] = useState([]);
  const [searchMostBorrowed, setSearchMostBorrowed] = useState("");
  const [borrowedTab, setBorrowedTab] = useState('week'); // 'day', 'week', 'month'
  const [dayBorrowedBooks, setDayBorrowedBooks] = useState([]);
  const [monthBorrowedBooks, setMonthBorrowedBooks] = useState([]);
  const [searchBorrowedBooks, setSearchBorrowedBooks] = useState("");

  const exportToExcel = (data, filename) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${filename}_${new Date().toLocaleDateString()}.xlsx`);
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

    fetchBooks();
    fetchTodayCount();
    fetchBorrowedWeekCount();
    fetchBorrowedTodayBooks();
    fetchBorrowedMonthBooks();
    fetchMostBorrowedBooks();
    fetchBorrowedBooks();
  }, []);

  const handleExportReport = () => {
    // Prepare data for Excel export
    const excelData = filteredBooks.map((book) => ({
      Title: book.title,
      Year: book.year,
      Category: book.category,
      Author: book.author,
      "Accession Number": book.accessionNumber,
      "Call Number": book.callNumber,
      Location: book.location
        ? `${book.location.genreCode}-${book.location.shelf}-${book.location.level}`
        : "N/A",
      Status: book.status ? book.status : "Available",
    }));

    // Create a new workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stored Books");

    // Set column widths
    const columnWidths = [
      { wch: 30 }, // Title
      { wch: 8 },  // Year
      { wch: 15 }, // Category
      { wch: 20 }, // Author
      { wch: 18 }, // Accession Number
      { wch: 15 }, // Call Number
      { wch: 20 }, // Location
      { wch: 12 }, // Status
    ];
    worksheet["!cols"] = columnWidths;

    // Save the file
    XLSX.writeFile(workbook, "library-report.xlsx");
  };

  const filteredBooks = books.filter((book) =>
    book.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false
  );

  return (
    <div className="dashboard">
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

      <main className="main-content">

        <section className="content" ref={reportRef} style={{ marginTop: "40px" }}>
          <h2 className="page-title" style={{marginTop: "0px"}}>Analytics Overview</h2>

          {error && <div className="error-message">{error}</div>}

          <div className="pending-container" style={{padding: "20px", marginBottom: "40px"}}>
            <div style={{backgroundColor: "#f9f9f9", padding: "20px", borderRadius: "8px", width: "100%"}}>
              <BorrowedReturnedChart borrowedBooks={borrowedBooks} allBooks={books} />
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
                <h2>Most Borrowed Books ({mostBorrowedBooks.filter(b => 
                  (b.title?.toLowerCase().includes(searchMostBorrowed.toLowerCase()) || false) ||
                  (b.author?.toLowerCase().includes(searchMostBorrowed.toLowerCase()) || false)
                ).length})</h2>
                <input 
                  type="text" 
                  placeholder="Search by title or author..." 
                  value={searchMostBorrowed}
                  onChange={(e) => setSearchMostBorrowed(e.target.value)}
                  style={{ width: '100%', padding: '10px', marginTop: '15px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ddd' }}
                />
                {mostBorrowedBooks.filter(b => 
                  (b.title?.toLowerCase().includes(searchMostBorrowed.toLowerCase()) || false) ||
                  (b.author?.toLowerCase().includes(searchMostBorrowed.toLowerCase()) || false)
                ).length === 0 ? (
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
                      {mostBorrowedBooks.filter(b => 
                        (b.title?.toLowerCase().includes(searchMostBorrowed.toLowerCase()) || false) ||
                        (b.author?.toLowerCase().includes(searchMostBorrowed.toLowerCase()) || false)
                      ).map((book) => (
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

        </section>
      </main>
    </div >
  );
};

export default Analytics;
