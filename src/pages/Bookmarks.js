import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark, faTrash, faBook } from "@fortawesome/free-solid-svg-icons";
import "../styles/bookmarks.css";
import Swal from "sweetalert2";

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const userEmail = localStorage.getItem("userEmail");

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      if (!userEmail) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`https://paranaque-web-system.onrender.com/api/bookmarks/get?email=${userEmail}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        });
        const data = await res.json();
        setBookmarks(data.bookmarks);

        console.log("bookmarks: ", data.bookmarks)
      } catch (error) {
        await Swal.fire({
          title: "Parañaledge",
          text: "Error listing in booksmarks",
          icon: "error",
          confirmButtonText: "OK"
        });
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading bookmarks:", error);
      setLoading(false);
    }
  };

  const removeBookmark = async (bookId) => {
    try {
      try {
        const res = await fetch("https://paranaque-web-system.onrender.com/api/bookmarks/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ book_id: bookId, email: userEmail }),
        });

        const data = await res.json();

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

      const updatedBookmarks = bookmarks.filter(bookmark => bookmark.book_id._id !== bookId);
      setBookmarks(updatedBookmarks);

    } catch (error) {
      console.error("Error removing bookmark:", error);
    }
  };

  const clearAllBookmarks = async() => {
    if (window.confirm("Are you sure you want to clear all bookmarks?")) {
      try {
        const res = await fetch("https://paranaque-web-system.onrender.com/api/bookmarks/delete/all", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userEmail }),
        });

        const data = await res.json();

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

      setBookmarks([]);

    }
  };

  if (loading) {
    return (
      <div className="bookmarks-container">
        <div className="loading">Loading bookmarks...</div>
      </div>
    );
  }

  return (
    <div className="bookmarks-container">
      {/* Header Section */}
      <div className="bookmarks-header">
        <h1>
          <FontAwesomeIcon icon={faBookmark} /> My Bookmarks
        </h1>
        <p>Books you want to check out later</p>
      </div>

      {/* Main Content */}
      <div className="bookmarks-content">
        {bookmarks.length === 0 ? (
          <div className="empty-state">
            <FontAwesomeIcon icon={faBook} className="empty-icon" />
            <h2>No Bookmarks Yet</h2>
            <p>Start bookmarking books to save them for later!</p>
          </div>
        ) : (
          <>
            <div className="bookmarks-info">
              <span className="bookmark-count">
                {bookmarks.length} {bookmarks.length === 1 ? "book" : "books"} saved
              </span>
              {bookmarks.length > 0 && (
                <button className="clear-all-btn" onClick={clearAllBookmarks}>
                  Clear All
                </button>
              )}
            </div>

            <div className="bookmarks-grid">
              {bookmarks.map((bookmark) => (
                <div key={bookmark.book_id._id} className="bookmark-card">
                  <div className="book-cover">
                    {bookmark.book_id.image ? (
                      <img src={bookmark.book_id.image} alt={bookmark.book_id.title} />
                    ) : (
                      <div className="no-cover">
                        <FontAwesomeIcon icon={faBook} />
                      </div>
                    )}
                  </div>

                  <div className="book-details">
                    <h3>{bookmark.book_id.title}</h3>
                    <p className="author">{bookmark.book_id.author || "Unknown Author"}</p>
                    <p className="category">{bookmark.book_id.category || "Unknown Category"}</p>

                    <div className="book-info">
                      {bookmark.book_id.year && (
                        <span className="year">{bookmark.book_id.year}</span>
                      )}
                      {bookmark.book_id.bookisbn && (
                        <span className="isbn">ISBN: {bookmark.book_id.bookisbn}</span>
                      )}
                    </div>

                    <p className="description">
                      {bookmark.book_id.description ? bookmark.book_id.description.substring(0, 100) + "..." : "No description available"}
                    </p>
                  </div>

                  <div className="card-actions">
                    <button
                      className="remove-btn"
                      onClick={() => removeBookmark(bookmark.book_id._id)}
                      title="Remove from bookmarks"
                    >
                      <FontAwesomeIcon icon={faTrash} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Bookmarks;
