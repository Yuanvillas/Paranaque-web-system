import React, { useEffect, useState } from 'react';
import './App.css';

const ReservedBooksTable = () => {
  const [reservedBooks, setReservedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchReservedBooks();
  }, []);

  const fetchReservedBooks = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://paranaque-web-system.onrender.com/api/transactions/reserved-books?limit=10000');
      const data = await response.json();
      if (response.ok) {
        setReservedBooks(data.reservedBooks || []);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="pending-reservations-container"><h2>Reserved Books</h2><p>Loading reserved books...</p></div>;
  }

  const filteredBooks = reservedBooks.filter((book) =>
    book.bookTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pending-container">
      <div className="header-row">
        <h2 style={{ fontWeight: '600', fontSize: '25px', marginTop: "5px" }}>📝 Reserved Books</h2>

        <div className="search-container ">
          <input type="text" placeholder="Search analytics..." onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      {!error && filteredBooks.length === 0 ? (
        <div className="no-reservations-message">
          <p>No reserved books found.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="styled-table">
            <thead>
              <tr>
                <th>Book Title</th>
                <th>Reserved By</th>
                <th>Reservation Date</th>
                <th>Approved By</th>
                <th>Approval Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.map((reservation) => (
                <tr key={reservation._id}>
                  <td>{reservation.bookTitle}</td>
                  <td>{reservation.userEmail}</td>
                  <td>{formatDate(reservation.reservedAt)}</td>
                  <td>{reservation.approvedBy}</td>
                  <td>{reservation.approvalDate ? formatDate(reservation.approvalDate) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReservedBooksTable;
