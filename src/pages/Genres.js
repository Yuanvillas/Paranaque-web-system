import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Genres = () => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all books, then extract unique genres
    setLoading(true);
    fetch("https://paranaque-web-system.onrender.com/api/books")
      .then((res) => res.json())
      .then((data) => {
        const allGenres = (data.books || [])
          .map((book) => book.category)
          .filter(Boolean);
        const uniqueGenres = Array.from(new Set(allGenres)).sort();
        setGenres(uniqueGenres);
        console.log("Fetched genres:", uniqueGenres);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Catalogs</h2>
      <div style={styles.catalogsGrid}>
        {loading ? (
          <p style={styles.loadingText}>Loading catalogs...</p>
        ) : genres.length > 0 ? (
          genres.map((g, idx) => (
            <Link
              key={idx}
              to={`/user-home/genres/${encodeURIComponent(g)}`}
              style={styles.catalogButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#45a049";
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#4CAF50";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.12)";
              }}
            >
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </Link>
          ))
        ) : (
          <p style={styles.noDataText}>No catalog found.</p>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "24px",
    marginTop: "20px",
  },
  title: {
    fontWeight: "700",
    fontSize: "28px",
    color: "#333",
    marginBottom: "24px",
    animation: "fadeInDown 0.6s ease",
  },
  catalogsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: "16px",
    marginTop: "16px",
  },
  catalogButton: {
    textDecoration: "none",
    backgroundColor: "#4CAF50",
    color: "white",
    padding: "16px 24px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
    transition: "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    fontSize: "16px",
    fontWeight: "600",
    textAlign: "center",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60px",
    animation: "fadeInUp 0.5s ease",
  },
  loadingText: {
    color: "#999",
    fontSize: "16px",
    textAlign: "center",
    gridColumn: "1 / -1",
    padding: "40px 0",
  },
  noDataText: {
    color: "#999",
    fontSize: "16px",
    textAlign: "center",
    gridColumn: "1 / -1",
    padding: "40px 0",
  },
};

// Add CSS animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(styleSheet);

export default Genres;
