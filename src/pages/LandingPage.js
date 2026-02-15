import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark as fasBookmark } from "@fortawesome/free-solid-svg-icons";
import { faBookmark as farBookmark } from "@fortawesome/free-regular-svg-icons";
import { faBook, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";
import "../styles/landing-page.css";
import logo from "../imgs/liblogo.png";

library.add(faArrowRight, fasBookmark, farBookmark, faBook);

const LandingPage = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchBooks = useCallback(() => {
    const limit = 24;
    const timestamp = new Date().getTime();
    fetch(`https://paranaque-web-system.onrender.com/api/books?page=${page}&limit=${limit}&_t=${timestamp}`)
      .then((res) => res.json())
      .then((data) => {
        setBooks(data.books || []);
        setTotalPages(data.totalPages || 1);
      })
      .catch(console.error);
  }, [page]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const filteredBooks = books.filter(
    (book) =>
      (book.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (book.author?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  const openModal = (book) => {
    setSelectedBook(book);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedBook(null);
  };

  const handleLoginPrompt = () => {
    Swal.fire({
      title: "Parañaledge",
      text: "Please log in to borrow or reserve books.",
      icon: "info",
      confirmButtonText: "Go to Login",
      showCancelButton: true,
      cancelButtonText: "Continue Browsing"
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/");
      }
    });
  };

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-logo-section">
          <img src={logo} alt="Parañaledge" className="landing-logo" />
          <div>
            <h1 className="landing-title">Parañaledge</h1>
            <p className="landing-subtitle">Paranaque City Public Library</p>
          </div>
        </div>
        <button 
          className="landing-login-btn"
          onClick={() => navigate("/")}
        >
          <FontAwesomeIcon icon={faArrowRight} style={{ marginRight: "8px" }} />
          Sign In
        </button>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-content">
          <h2>Discover Our Collection</h2>
          <p>Browse thousands of books available in our library. Sign in to borrow or reserve your favorite reads.</p>
          <div className="hero-search">
            <input
              type="text"
              placeholder="Search books by title or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </section>

      {/* Books Grid */}
      <section className="landing-books">
        <div className="books-container">
          {filteredBooks.length > 0 ? (
            <div className="books-grid">
              {filteredBooks.map((book) => {
                const avail = book.availableStock ?? book.available ?? book.stock ?? 0;
                return (
                  <div
                    key={book._id}
                    className="landing-book-card"
                    onClick={() => openModal(book)}
                  >
                    {avail <= 0 && (
                      <span className="availability-badge not-available">Not Available</span>
                    )}
                    {avail > 0 && avail < 3 && (
                      <span className="availability-badge low-stock">Low Stock</span>
                    )}
                    {avail >= 3 && (
                      <span className="availability-badge available">Available</span>
                    )}

                    <div className="book-image-container">
                      {book.image ? (
                        <img
                          src={book.image}
                          alt={book.title}
                          className="book-image"
                          onError={(e) => {
                            e.target.style.display = "none";
                            const placeholder = e.target.nextElementSibling;
                            if (placeholder) placeholder.style.display = "flex";
                          }}
                        />
                      ) : null}
                      {!book.image && (
                        <div className="book-placeholder">📖</div>
                      )}
                    </div>

                    <div className="book-details">
                      <h3 className="book-title">{book.title}</h3>
                      <p className="book-author">{book.author || "Unknown Author"}</p>
                      <div className="book-meta">
                        <span className="book-category">
                          {book.category || "Uncategorized"}
                        </span>
                        <span className="book-year">{book.year || "N/A"}</span>
                      </div>
                      {avail > 0 && (
                        <p className="book-availability">
                          {avail} available
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-results">
              <p>No books found. Try a different search term.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="landing-pagination">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="pagination-btn"
            >
              ← Previous
            </button>
            <div className="page-numbers">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = page <= 3 ? i + 1 : page + i - 2;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`page-number ${page === pageNum ? "active" : ""}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="pagination-btn"
            >
              Next →
            </button>
          </div>
        )}
      </section>

      {/* Book Details Modal */}
      {showModal && selectedBook && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>
            <div className="modal-body">
              <div className="modal-image">
                {selectedBook.image ? (
                  <img src={selectedBook.image} alt={selectedBook.title} />
                ) : (
                  <div className="modal-placeholder">📖</div>
                )}
              </div>
              <div className="modal-info">
                <h2>{selectedBook.title}</h2>
                <p className="modal-author">
                  <strong>Author:</strong> {selectedBook.author || "Unknown"}
                </p>
                <p className="modal-meta">
                  <strong>Category:</strong> {selectedBook.category || "Uncategorized"}
                </p>
                <p className="modal-meta">
                  <strong>Year:</strong> {selectedBook.year || "N/A"}
                </p>
                <p className="modal-meta">
                  <strong>ISBN:</strong> {selectedBook.isbn || "N/A"}
                </p>
                {selectedBook.description && (
                  <>
                    <h4>Description</h4>
                    <p className="modal-description">{selectedBook.description}</p>
                  </>
                )}
                <div className="modal-availability">
                  {(() => {
                    const avail =
                      selectedBook.availableStock ??
                      selectedBook.available ??
                      selectedBook.stock ??
                      0;
                    return avail > 0 ? (
                      <p style={{ color: "#2e7d32", fontWeight: "600" }}>
                        ✓ {avail} copies available
                      </p>
                    ) : (
                      <p style={{ color: "#d32f2f", fontWeight: "600" }}>
                        ✗ Currently unavailable
                      </p>
                    );
                  })()}
                </div>
                <button
                  className="modal-login-btn"
                  onClick={handleLoginPrompt}
                >
                  Sign In to Borrow or Reserve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; 2026 Paranaque City Public Library. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
