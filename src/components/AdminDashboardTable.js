import React, { useEffect, useState } from 'react';
import './App.css';

const AdminDashboardTable = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchReservedBooks();
  }, []);

  const fetchReservedBooks = async () => {
    try {
      setLoading(true);
      const timestamp = new Date().getTime();
      const response = await fetch(`https://paranaque-web-system.onrender.com/api/books/?_t=${timestamp}`);
      const data = await response.json();
      if (response.ok) {
        console.log("📚 Admin fetched books:", data.books?.length, "books with images");
        setBooks(data.books || []);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch reserved books');
      }
    } catch (err) {
      setError('Error connecting to server. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return <div className="pending-reservations-container"><h2>Created Books</h2><p>Loading books...</p></div>;
  }

  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pending-container">
      <div className="header-row">
        <h2 style={{ fontWeight: '600', fontSize: '25px', marginTop: "5px" }}>Books</h2>

        <div className="search-container ">
          <input type="text" placeholder="Search analytics..." onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      {!error && books.length === 0 ? (
        <div className="no-reservations-message">
          <p>No reserved books found.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="styled-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Book Title</th>
                <th>Year</th>
                <th>Category</th>
                <th>Author</th>
                <th>Accession Number</th>
                <th>Call Number</th>
                <th>Stock</th>
                <th>Available Stock</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.map((book) => (
                <tr key={book._id}>
                  <td>
                    {book.image ? (
                      <img
                        src={book.image}
                        alt={book.title}
                        style={{ width: "60px", height: "80px", objectFit: "cover", borderRadius: "4px", border: "1px solid #ddd" }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextElementSibling) {
                            e.target.nextElementSibling.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    {!book.image && (
                      <div 
                        style={{ 
                          width: "60px", 
                          height: "80px", 
                          backgroundColor: '#f0f0f0', 
                          borderRadius: "4px", 
                          border: "1px solid #ddd",
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px',
                          color: '#ccc'
                        }}
                      >
                        📖
                      </div>
                    )}
                  </td>
                  <td>{book.title}</td>
                  <td>{book.year}</td>
                  <td>{book.category}</td>
                  <td>{book.author}</td>
                  <td>{book.accessionNumber}</td>
                  <td>{book.callNumber}</td>
                  <td>{book.stock || '-'}</td>
                  <td>{book.availableStock !== undefined ? book.availableStock : book.stock || '-'}</td>
                  <td>
                    {book.location
                      ? `${book.location.genreCode}-${book.location.shelf}-${book.location.level}`
                      : "N/A"}
                  </td>
                  <td>{book.status ? book.status : "Available"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardTable;
