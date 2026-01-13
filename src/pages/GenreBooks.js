import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Swal from "sweetalert2";

const GenreBooks = () => {
  const { genre } = useParams();
  const [books, setBooks] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reserveDate, setReserveDate] = useState("");
  const userEmail = localStorage.getItem("userEmail");

  const fetchBooks = (p = page) => {
    const limit = 24; // 4 rows x 6 columns
    const timestamp = new Date().getTime();
    fetch(`https://paranaque-web-system.onrender.com/api/books?genre=${encodeURIComponent(genre)}&page=${p}&limit=${limit}&_t=${timestamp}`)
      .then((res) => res.json())
      .then((data) => {
        setBooks(data.books || []);
        setTotalPages(data.totalPages || 1);
      })
      .catch(console.error);
  };

  // Reset to page 1 when genre changes
  useEffect(() => {
    setPage(1);
  }, [genre]);

  useEffect(() => {
    if (!genre) return;
    fetchBooks(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genre, page]);

  const handleBorrow = async () => {
    if (!userEmail) {
      await Swal.fire({ title: "Parañaledge", text: "User email not found. Please log in.", icon: "error", confirmButtonText: "OK" });
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
        await Swal.fire({ title: "Parañaledge", text: "Borrow request submitted! Pending admin approval.", icon: "success", confirmButtonText: "OK" });
        closeModal();
      } else {
        await Swal.fire({ title: "Parañaledge", text: data.message || data.error || "Error requesting borrow", icon: "error", confirmButtonText: "OK" });
      }
    } catch (err) {
      console.error(err);
      await Swal.fire({ title: "Parañaledge", text: "Network error while requesting borrow.", icon: "error", confirmButtonText: "OK" });
    }
  };

  const handleReserve = async () => {
    if (!userEmail) {
      await Swal.fire({ title: "Parañaledge", text: "User not logged in.", icon: "error", confirmButtonText: "OK" });
      return;
    }

    if (!reserveDate) {
      await Swal.fire({ title: "Parañaledge", text: "Please select a reservation date.", icon: "warning", confirmButtonText: "OK" });
      return;
    }

    try {
      const res = await fetch(`https://paranaque-web-system.onrender.com/api/transactions/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: selectedBook._id, userEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        await Swal.fire({ title: "Parañaledge", text: "Book reserved successfully! Pending admin approval.", icon: "success", confirmButtonText: "OK" });
        closeModal();
      } else {
        await Swal.fire({ title: "Parañaledge", text: data.error || "Error reserving book", icon: "error", confirmButtonText: "OK" });
      }
    } catch (err) {
      console.error(err);
      await Swal.fire({ title: "Parañaledge", text: "Network error while reserving book.", icon: "error", confirmButtonText: "OK" });
    }
  };

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

  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 3);
  const max = maxDate.toISOString().split("T")[0];

  if (!genre || typeof genre !== "string" || genre.length === 0) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>Invalid genre or loading...</h2>
        <Link to="/user-home/genres" style={{ color: "#007bff" }}>← Back to Genres</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ fontSize: "28px", marginBottom: "10px" }}>Catalogs — {genre.charAt(0).toUpperCase() + genre.slice(1)} Books</h2>

      <Link to="/user-home/genres" className="back-btn">← Back to Catalogs</Link>

      <div className="book-list" style={{ display: "grid", marginTop: "15px", gap: "20px" }}>
        {books.length > 0 ? (
          books.map((book, idx) => (
            <div key={idx} className="book-item">
              {(() => {
                const avail = book.availableStock ?? book.available ?? book.stock ?? 0;
                return avail <= 0 ? (
                  <span className="out-of-stock-badge">Out of stock</span>
                ) : null;
              })()}
              {book.image && (
                <img src={book.image} alt={book.title} className="book-image" />
              )}
              <div style={{ padding: '16px' }} className="book-footer">
                <h4 style={{ marginTop: '0', marginBottom: '8px', textAlign: 'left', fontSize: '16px', fontWeight: '600', minHeight: '48px', display: 'flex', alignItems: 'center' }}>{book.title}</h4>
                <div className="book-info-actions">
                  <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>{book.year}</p>
                  <div className="book-actions">
                    {(() => {
                      const avail = book.availableStock ?? book.available ?? book.stock ?? 0;
                      return (
                        <button
                          onClick={(e) => { e.stopPropagation(); if (avail > 0) openModal(book); else Swal.fire({ title: 'Parañaledge', text: 'This book is currently unavailable.', icon: 'warning', confirmButtonText: 'OK' }); }}
                          title={avail > 0 ? 'View' : 'Unavailable'}
                          disabled={avail <= 0}
                          style={{ marginTop: "10px", padding: "8px 16px", background: avail > 0 ? "#0a66ff" : '#ccc', border: "none", color: "white", borderRadius: "6px", cursor: avail > 0 ? 'pointer' : 'not-allowed', width: "100%" }}
                        >
                          {avail > 0 ? 'Borrow' : 'Unavailable'}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p style={{ fontSize: "16px", marginTop: "20px" }}>No books found in this genre.</p>
        )}
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
            </div>

            <div className="modal-body-flex">
              <div className="image-info-container">
                {selectedBook.image && (
                  <div className="modal-image-wrapper" style={{ minWidth: '300px', minHeight: '400px' }}>
                    <img src={selectedBook.image} alt={selectedBook.title} className="modal-image" style={{ minWidth: '300px', minHeight: '400px' }} />
                  </div>
                )}

                <div className="modal-right">
                  <div className="book-details-grid">
                    <p className="book-info"><strong>Author:</strong> {selectedBook.author || "-"}</p>
                    <p className="book-info"><strong>Publisher:</strong> {selectedBook.publisher || "-"}</p>
                    <p className="book-info"><strong>Accession No.:</strong> {selectedBook.accessionNumber || "-"}</p>
                    <p className="book-info"><strong>Call Number:</strong> {selectedBook.callNumber || "-"}</p>
                    <p className="book-info"><strong>Category:</strong> {selectedBook.category || "-"}</p>
                    <p className="book-info"><strong>Stock:</strong> {selectedBook.stock ?? selectedBook.copies ?? "-"}</p>
                    <p className="book-info"><strong>Available:</strong> {selectedBook.availableStock ?? selectedBook.available ?? "-"}</p>
                    {selectedBook.borrowedBy && <p><strong>Borrowed By:</strong> {selectedBook.borrowedBy}</p>}
                    {selectedBook.dueDate && <p><strong>Due Date:</strong> {new Date(selectedBook.dueDate).toLocaleString()}</p>}
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
                    <input type="date" value={reserveDate} min={today} max={max} onChange={(e) => setReserveDate(e.target.value)} />
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
    </div>
  );
};

export default GenreBooks;
