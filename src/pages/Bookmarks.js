import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark, faTrash, faBook } from "@fortawesome/free-solid-svg-icons";
import "../styles/bookmarks.css";
import Swal from "sweetalert2";
import API_BASE_URL from "../config/api";

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const userEmail = localStorage.getItem("userEmail");

  const loadBookmarks = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    if (!userEmail) {
      setBookmarks([]);
      setLoadError("Please log in to view your bookmarks.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/bookmarks/get?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to load bookmarks.");
      }
      if (!Array.isArray(data.bookmarks)) {
        throw new Error("The bookmarks response was invalid.");
      }

      setBookmarks(data.bookmarks.filter(
        (bookmark) => bookmark?.book_id && typeof bookmark.book_id === "object" && bookmark.book_id._id
      ));
    } catch (error) {
      console.error("Error loading bookmarks:", error);
      setBookmarks([]);
      setLoadError("Unable to load your bookmarks. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const removeBookmark = async (bookId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookmarks/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book_id: bookId, email: userEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Unable to remove this bookmark.");
      }

      setBookmarks((currentBookmarks) => currentBookmarks.filter(
        (bookmark) => bookmark.book_id._id !== bookId
      ));
      await Swal.fire({
        title: "Parañaledge",
        text: data.message || "Bookmark removed successfully.",
        icon: "success",
        confirmButtonText: "OK"
      });
    } catch (error) {
      console.error("Error removing bookmark:", error);
      await Swal.fire({
        title: "Parañaledge",
        text: error.message || "Unable to remove this bookmark.",
        icon: "error",
        confirmButtonText: "OK"
      });
    }
  };

  const clearAllBookmarks = async () => {
    if (window.confirm("Are you sure you want to clear all bookmarks?")) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/bookmarks/delete/all`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userEmail }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Unable to clear bookmarks.");
        }

        setBookmarks([]);
        await Swal.fire({
          title: "Parañaledge",
          text: data.message || "All bookmarks removed successfully.",
          icon: "success",
          confirmButtonText: "OK"
        });
      } catch (error) {
        console.error("Error clearing bookmarks:", error);
        await Swal.fire({
          title: "Parañaledge",
          text: error.message || "Unable to clear bookmarks.",
          icon: "error",
          confirmButtonText: "OK"
        });
      }
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
        {loadError ? (
          <div className="empty-state" role="alert">
            <FontAwesomeIcon icon={faBook} className="empty-icon" />
            <h2>Unable to load bookmarks</h2>
            <p>{loadError}</p>
            {userEmail && (
              <button className="retry-btn" onClick={loadBookmarks}>
                Try Again
              </button>
            )}
          </div>
        ) : bookmarks.length === 0 ? (
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
                      {typeof bookmark.book_id.description === "string" && bookmark.book_id.description
                        ? `${bookmark.book_id.description.substring(0, 100)}...`
                        : "No description available"}
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
