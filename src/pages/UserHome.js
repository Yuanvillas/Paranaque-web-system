// src/pages/UserHome.js
import React, { useEffect, useState, useContext } from "react";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import { SearchContext } from "../layouts/UserLayout";
import "../components/App.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark as fasBookmark } from "@fortawesome/free-solid-svg-icons"; // filled
import { faBookmark as farBookmark } from "@fortawesome/free-regular-svg-icons"; // outline
import { faBook, faBookOpen } from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";

library.add(faBookOpen, fasBookmark, farBookmark, faBook);


const UserHome = () => {
  const [books, setBooks] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reserveDate, setReserveDate] = useState("");
  const [pendingReservations, setPendingReservations] = useState([]);
  const searchTerm = useContext(SearchContext);
  const userEmail = localStorage.getItem("userEmail");
  const [bookmarks, setBookmarks] = useState([]);
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const [allBooks, setAllBooks] = useState([]);

  useEffect(() => {
    fetchPendingReservations();
    fetchBookmarks();
    fetchBorrowedBooks();
    fetchAllBooksForRecommendations();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [page]);

  useEffect(() => {
    if (allBooks.length > 0 && borrowedBooks.length > 0) {
      console.log("useEffect triggered - calling generateRecommendations with", borrowedBooks.length, "borrowed books");
      generateRecommendations(borrowedBooks, bookmarks, pendingReservations);
    } else if (allBooks.length > 0) {
      console.log("No borrowed books yet");
      setRecommendedBooks([]);
    }
  }, [borrowedBooks, bookmarks, pendingReservations, allBooks]);

  const fetchBooks = () => {
    // Use pagination: 4 rows x 6 columns = 24 items per page
    const limit = 24;
    // Add cache busting with timestamp
    const timestamp = new Date().getTime();
    fetch(`https://paranaque-web-system.onrender.com/api/books?page=${page}&limit=${limit}&_t=${timestamp}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("📚 Fetched books with images:", data.books?.map(b => ({ title: b.title, hasImage: !!b.image })));
        setBooks(data.books || []);
        setTotalPages(data.totalPages || 1);
      })
      .catch(console.error);
  };

  const fetchAllBooksForRecommendations = async () => {
    try {
      const timestamp = new Date().getTime();
      const res = await fetch(`https://paranaque-web-system.onrender.com/api/books?limit=10000&_t=${timestamp}`);
      const data = await res.json();
      setAllBooks(data.books || []);
    } catch (error) {
      console.error("Error fetching all books:", error);
    }
  };

  const fetchPendingReservations = async () => {
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) return;

    try {
      const response = await fetch(`https://paranaque-web-system.onrender.com/api/transactions/user/${userEmail}`);
      const data = await response.json();
      if (response.ok) {
        // Filter only pending and approved reservations
        const reservations = data.transactions.filter(
          transaction => transaction.type === 'reserve' &&
            ['pending', 'approved'].includes(transaction.status)
        );
        setPendingReservations(reservations);
      } else {
        console.error("Failed to fetch reservations:", data.message);
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
    }
  };

  const handleBorrow = async () => {
    const avail = selectedBook ? (selectedBook.availableStock ?? selectedBook.available ?? selectedBook.stock ?? 0) : 0;

    if (avail <= 0) {
      await Swal.fire({ title: "Parañaledge", text: "This book is currently unavailable.", icon: "warning", confirmButtonText: "OK" });
      return;
    }

    if (!userEmail) {
      await Swal.fire({
        title: "Parañaledge",
        text: "User email not found. Please log in again.",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }
    try {
      const res = await fetch(`https://paranaque-web-system.onrender.com/api/transactions/borrow-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: selectedBook._id, userEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        await Swal.fire({
          title: "Parañaledge",
          text: "Borrow request submitted! Pending admin approval.",
          icon: "success",
          confirmButtonText: "OK"
        });
        fetchBooks();
        closeModal();
      } else {
        await Swal.fire({
          title: "Parañaledge",
          text: data.message || data.error || "Error requesting borrow",
          icon: "error",
          confirmButtonText: "OK"
        });
      }
    } catch (err) {
      console.error(err);
      await Swal.fire({
        title: "Parañaledge",
        text: "Network error while requesting borrow.",
        icon: "error",
        confirmButtonText: "OK"
      });
    }
  };

  const handleReserve = async () => {
    const userEmail = localStorage.getItem("userEmail");
    const avail = selectedBook ? (selectedBook.availableStock ?? selectedBook.available ?? selectedBook.stock ?? 0) : 0;
    if (avail <= 0) {
      await Swal.fire({ title: "Parañaledge", text: "This book is currently unavailable.", icon: "warning", confirmButtonText: "OK" });
      return;
    }

    if (!userEmail) {
      await Swal.fire({
        title: "Parañaledge",
        text: "User not logged in.",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }

    if (!reserveDate) {
      await Swal.fire({
        title: "Parañaledge",
        text: "Please select a reservation date.",
        icon: "warning",
        confirmButtonText: "OK"
      });
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const res = await fetch(`https://paranaque-web-system.onrender.com/api/transactions/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: selectedBook._id, userEmail }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const data = await res.json();
      if (res.ok) {
        await Swal.fire({
          title: "Parañaledge",
          html: `<div style="text-align: left;">
            <p><strong>✓ Book Reserved Successfully!</strong></p>
            <p><strong>Book:</strong> ${selectedBook.title}</p>
            <p><strong>Status:</strong> Pending Admin Approval</p>
            <p style="font-size: 12px; color: #666; margin-top: 10px;">
              An email notification has been sent to <strong>${userEmail}</strong>. 
              The librarian will review your request and notify you once it's approved.
            </p>
          </div>`,
          icon: "success",
          confirmButtonText: "OK"
        });
        fetchBooks();
        fetchPendingReservations(); // Refresh pending reservations
        closeModal();
      } else {
        await Swal.fire({
          title: "Parañaledge",
          text: data.error || data.message || "Error reserving book",
          icon: "error",
          confirmButtonText: "OK"
        });
      }
    } catch (err) {
      console.error(err);
      let errorMessage = "Network error while reserving book.";
      if (err.name === 'AbortError') {
        errorMessage = "Request timeout. The server took too long to respond. Please check your internet connection and try again.";
      }
      await Swal.fire({
        title: "Parañaledge",
        text: errorMessage,
        icon: "error",
        confirmButtonText: "OK"
      });
    }
  };

  const handleBookmark = async (bookId) => {
    try {
      const res = await fetch("https://paranaque-web-system.onrender.com/api/bookmarks/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book_id: bookId, email: userEmail }),
      });
      const data = await res.json();
      console.log("res", data)
      if (res.ok && data.bookmark) {
        setBookmarks((prev) => [...prev, data.bookmark]);
        console.log("update:", bookmarks)
      }
      await Swal.fire({
        title: "Parañaledge",
        text: data.message,
        icon: res.ok ? "success" : "error",
        confirmButtonText: "OK"
      });

    } catch (error) {
      await Swal.fire({
        title: "Parañaledge",
        text: "Something went wrong.",
        icon: "error",
        confirmButtonText: "OK"
      });
    }
  };

  const fetchBorrowedBooks = async () => {
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) return;

    try {
      const response = await fetch(`https://paranaque-web-system.onrender.com/api/transactions/user/${userEmail}`);
      const data = await response.json();
      
      if (response.ok && data.transactions && Array.isArray(data.transactions)) {
        let borrowed = data.transactions.filter(t => 
          (t.type === 'borrow' || t.transactionType === 'borrow')
        );
        
        console.log("All borrow transactions found:", borrowed.length, borrowed);
        setBorrowedBooks(borrowed);
      }
    } catch (error) {
      console.error("Error fetching borrowed books:", error);
    }
  };

  const generateRecommendations = async (borrowed, bookmarks, reservations) => {
    console.log("=== GENERATING AI RECOMMENDATIONS ===");
    console.log("Borrowed books:", borrowed);
    console.log("Borrowed books count:", borrowed?.length || 0);

    if (!borrowed || borrowed.length === 0) {
      console.log("No borrowed books yet - no recommendations");
      setRecommendedBooks([]);
      return;
    }

    try {
      console.log("Calling AI recommend endpoint with borrowed books:", borrowed);
      const response = await fetch('https://paranaque-web-system.onrender.com/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          borrowedBooks: borrowed,
          limit: 6
        })
      });

      console.log("API Response status:", response.status);
      const data = await response.json();
      console.log("AI Recommendations response:", data);
      console.log("First recommendation book object:", data.recommendations?.[0]);
      
      if (data.recommendations && data.recommendations.length > 0) {
        console.log("Setting recommendations:", data.recommendations.map(r => ({ title: r.title, image: r.image })));
        setRecommendedBooks(data.recommendations);
      } else {
        console.log("No recommendations returned");
        setRecommendedBooks([]);
      }
    } catch (error) {
      console.error("Error fetching AI recommendations:", error);
      setRecommendedBooks([]);
    }
  };

  const fetchBookmarks = async () => {
    try {
      const res = await fetch(`https://paranaque-web-system.onrender.com/api/bookmarks/get?email=${userEmail}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      console.log("fetched:", data)
      setBookmarks(data.bookmarks);
    } catch (error) {
      await Swal.fire({
        title: "Parañaledge",
        text: "Error listing in booksmarks",
        icon: "error",
        confirmButtonText: "OK"
      });
    }
  }

  const openModal = (book) => {
    setSelectedBook(book);
    setReserveDate("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedBook(null);
    setReserveDate("");
  };

  const filteredBooks = books.filter((book) =>
    (book.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (book.author?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 3);
  const max = maxDate.toISOString().split("T")[0];

  return (
    <>
      <div style={{ margin: "20px" }}>
        <div style={{ 
          backgroundColor: "#f9f9f9", 
          padding: "25px", 
          borderRadius: "8px", 
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: '0', fontSize: '24px', fontWeight: '700', color: '#333' }}>📚 Recommended For You</h2>
            <Link to="/user-home/shelf" className="no-underline">
              <button className="shelf-button">
                <FontAwesomeIcon icon={faBook} style={{ marginRight: "8px" }} />
                My Shelf
              </button>
            </Link>
          </div>
          
          {recommendedBooks.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
              {recommendedBooks.map(book => (
                <div 
                  key={book._id} 
                  onClick={() => openModal(book)}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: 'white',
                    padding: '12px',
                    borderRadius: '6px',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    border: '1px solid #eee'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {book.image ? (
                    <img 
                      src={book.image} 
                      alt={book.title} 
                      style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        // Show placeholder instead
                        const placeholder = e.target.nextElementSibling;
                        if (placeholder) placeholder.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  {!book.image && (
                    <div 
                      style={{ 
                        width: '100%', 
                        height: '140px', 
                        backgroundColor: '#f0f0f0', 
                        borderRadius: '4px', 
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '40px',
                        color: '#ccc'
                      }}
                    >
                      📖
                    </div>
                  )}
                  <p style={{ fontSize: '12px', fontWeight: '600', margin: '8px 0 4px', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</p>
                  <p style={{ fontSize: '11px', color: '#999', margin: '0 0 6px' }}>{book.author || 'Unknown Author'}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <p style={{ fontSize: '10px', backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '4px 8px', borderRadius: '4px', margin: '0', flex: 1 }}>{book.category || 'Uncategorized'}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookmark(book._id);
                      }}
                      title="Bookmark"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        padding: '4px 8px',
                        color: bookmarks.some((bookmark) => bookmark.book_id._id === book._id) ? '#2e7d32' : '#ccc',
                        transition: 'color 0.2s ease'
                      }}
                    >
                      <FontAwesomeIcon
                        icon={bookmarks.some((bookmark) => bookmark.book_id._id === book._id) ? fasBookmark : farBookmark}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#999', fontSize: '14px', margin: '0', textAlign: 'center', padding: '20px' }}>
              Start borrowing, reserving, or bookmarking books to get personalized recommendations!
            </p>
          )}
        </div>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, margin: '12px 0' }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} style={{ padding: '6px 10px', background: page === i + 1 ? '#2e7d32' : '#fff', color: page === i + 1 ? '#fff' : '#000', borderRadius: 4, border: '1px solid #ccc' }}>{i + 1}</button>
          ))}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</button>
        </div>
      )}

      <div style={{ margin: "10px", marginTop: '-10px', borderTop: '1px #ccc solid' }} className="featured">
        <h2 style={{ margin: "30px", fontSize: '20px', fontWeight: '600', marginBottom: '-10px' }}>Latest Books Added</h2>
        <div className="book-list">
          {filteredBooks.length > 0 ? (
            filteredBooks.map((book, idx) => (
              <div
                key={idx}
                className="book-item"
              >
                {(() => {
                  const avail = book.availableStock ?? book.available ?? book.stock ?? 0;
                  return avail <= 0 ? (
                    <span className="out-of-stock-badge">Out of stock</span>
                  ) : null;
                })()}
                {book.image ? (
                  <img
                    src={book.image}
                    alt={book.title}
                    className="book-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '180px',
                    backgroundColor: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '60px',
                    color: '#ccc'
                  }}>
                    📖
                  </div>
                )}
                <div style={{ padding: '20px' }} className="book-footer">
                  <h4 style={{ marginTop: book.image ? '-110px' : '0px', textAlign: 'left' }}>{book.title}</h4>
                  <div className="book-info-actions">
                    <p>{book.year}</p>
                    <div className="book-actions">
                      {(() => {
                        const avail = book.availableStock ?? book.available ?? book.stock ?? 0;
                        return (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (avail > 0) openModal(book);
                              else Swal.fire({ title: 'Parañaledge', text: 'This book is currently unavailable.', icon: 'warning', confirmButtonText: 'OK' });
                            }}
                            title={avail > 0 ? "View" : "Unavailable"}
                            disabled={avail <= 0}
                            style={{
                              opacity: avail > 0 ? 1 : 0.6,
                              cursor: avail > 0 ? 'pointer' : 'not-allowed',
                              background: avail > 0 ? '#0a66ff' : '#ccc',
                              border: 'none',
                              color: 'white',
                              padding: '8px 12px',
                              borderRadius: 6
                            }}
                          >
                            {avail > 0 ? <FontAwesomeIcon icon="book-open" /> : 'Unavailable'}
                          </button>
                        );
                      })()}

                      <button
                        onClick={(e) => {
                          handleBookmark(book._id)
                        }}
                        title="Bookmark"
                      >
                        <FontAwesomeIcon
                          icon={bookmarks.some((bookmark) => bookmark.book_id._id === book._id) ? fasBookmark : farBookmark}
                        />
                      </button>

                    </div>
                  </div>
                </div>

              </div>
            ))
          ) : (
            <p>No books available.</p>
          )}

        </div>
      </div>

      {showModal && selectedBook && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{selectedBook.title}</h2>

            <div className="modal-details">
              <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
                <p style={{ fontSize: '15px', fontWeight: '500' }}>Year: {selectedBook.year}</p>
                <p style={{ fontSize: '15px', fontWeight: '500' }}>Category: {selectedBook.category}</p>
              </div>
              {selectedBook.borrowedBy && <p><strong>Borrowed By:</strong> {selectedBook.borrowedBy}</p>}
              {selectedBook.dueDate && <p><strong>Due Date:</strong> {new Date(selectedBook.dueDate).toLocaleString()}</p>}
              {selectedBook.reservedAt && <p><strong>Reserved At:</strong> {new Date(selectedBook.reservedAt).toLocaleString()}</p>}
              {selectedBook.reserveUntil && <p><strong>Reserve Until:</strong> {new Date(selectedBook.reserveUntil).toLocaleString()}</p>}
            </div>

            <div className="modal-body-flex">
              <div className="image-info-container">
                {selectedBook.image ? (
                  <div className="modal-image-wrapper" style={{ minWidth: '300px', minHeight: '400px' }}>
                    <img
                      src={selectedBook.image}
                      alt={selectedBook.title}
                      className="modal-image"
                      style={{ minWidth: '300px', minHeight: '400px', objectFit: 'cover', borderRadius: '8px' }}
                      onError={(e) => {
                        console.log("Image failed to load:", selectedBook.image);
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ minWidth: '300px', minHeight: '400px', backgroundColor: '#f0f0f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ color: '#999' }}>No image available</p>
                  </div>
                )}

                <div className="modal-right">
                  <div className="book-details-grid">
                    <p className="book-info"><strong>Author:</strong> {selectedBook.author || "-"}</p>
                    <p className="book-info"><strong>Publisher:</strong> {selectedBook.publisher || "-"}</p>
                    <p className="book-info"><strong>Accession No.:</strong> {selectedBook.accessionNumber || "-"}</p>
                    <p className="book-info"><strong>Call Number:</strong> {selectedBook.callNumber || "-"}</p>
                    <p className="book-info"><strong>Category:</strong> {selectedBook.category || "-"}</p>
                    <p className="book-info"><strong>Stock:</strong> {selectedBook.stock || selectedBook.copies || "Not available"}</p>
                    <p className="book-info"><strong>Available:</strong> {selectedBook.availableStock || selectedBook.available || "Not available"}</p>
                    {selectedBook.borrowedBy && <p><strong>Borrowed By:</strong> {selectedBook.borrowedBy}</p>}
                    {selectedBook.dueDate && <p><strong>Due Date:</strong> {new Date(selectedBook.dueDate).toLocaleString()}</p>}
                    {selectedBook.reservedAt && <p><strong>Reserved At:</strong> {new Date(selectedBook.reservedAt).toLocaleString()}</p>}
                    {selectedBook.reserveUntil && <p><strong>Reserve Until:</strong> {new Date(selectedBook.reserveUntil).toLocaleString()}</p>}
                  </div>
                </div>
              </div>

              <div className="modal-inputs">
                <div className="modal-form">
                  <button
                    className="modal-btn green"
                    onClick={handleBorrow}
                    disabled={((selectedBook ? (selectedBook.availableStock ?? selectedBook.available ?? selectedBook.stock ?? 0) : 0) <= 0)}
                    style={{ opacity: ((selectedBook ? (selectedBook.availableStock ?? selectedBook.available ?? selectedBook.stock ?? 0) : 0) <= 0) ? 0.6 : 1, cursor: ((selectedBook ? (selectedBook.availableStock ?? selectedBook.available ?? selectedBook.stock ?? 0) : 0) <= 0) ? 'not-allowed' : 'pointer' }}
                  >
                    Confirm Borrow
                  </button>
                </div>

                <div className="modal-form">
                  <label>
                    Reserve date:
                    <input
                      type="date"
                      value={reserveDate}
                      min={today}
                      max={max}
                      onChange={(e) => setReserveDate(e.target.value)}
                    />
                  </label>
                  <button
                    className="modal-btn blue"
                    onClick={handleReserve}
                    disabled={((selectedBook ? (selectedBook.availableStock ?? selectedBook.available ?? selectedBook.stock ?? 0) : 0) <= 0)}
                    style={{ opacity: ((selectedBook ? (selectedBook.availableStock ?? selectedBook.available ?? selectedBook.stock ?? 0) : 0) <= 0) ? 0.6 : 1, cursor: ((selectedBook ? (selectedBook.availableStock ?? selectedBook.available ?? selectedBook.stock ?? 0) : 0) <= 0) ? 'not-allowed' : 'pointer' }}
                  >
                    Confirm Reserve
                  </button>
                </div>

                <button className="modal-btn cancel" onClick={closeModal}>Cancel</button>
              </div>
            </div>
          </div>
        </div>

      )}

    </>
  );
};

export default UserHome;
