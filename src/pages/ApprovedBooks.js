import React, { useState, useEffect } from 'react';
import '../components/App.css';

const ApprovedBooks = () => {
  const [approvedBooks, setApprovedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingBook, setEditingBook] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchApprovedBooks();
  }, []);

  const fetchApprovedBooks = async () => {
    try {
      const response = await fetch('https://paranaque-web-system.onrender.com/api/approved-books');
      if (!response.ok) {
        throw new Error('Failed to fetch approved books');
      }
      const data = await response.json();
      setApprovedBooks(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const filteredBooks = approvedBooks.filter(book => {
    const matchesSearch = (book.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                         (book.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesStatus = filterStatus === 'all' || book.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#4CAF50'; // Green
      case 'returned':
        return '#2196F3'; // Blue
      default:
        return '#757575'; // Grey
    }
  };

  const startEdit = (book) => {
    setEditingBook(book._id);
    setEditForm({
      title: book.title,
      author: book.author || '',
      publisher: book.publisher || '',
      year: book.year,
      stock: book.stock,
      category: book.category || '',
      status: book.status || 'active'
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: name === 'year' || name === 'stock' ? parseInt(value) : value
    }));
  };

  const saveEdit = async () => {
    try {
      const response = await fetch(`https://paranaque-web-system.onrender.com/api/books/${editingBook}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (response.ok) {
        const updatedBooks = approvedBooks.map(book =>
          book._id === editingBook ? { ...book, ...editForm } : book
        );
        setApprovedBooks(updatedBooks);
        setEditingBook(null);
      } else {
        alert('Failed to update book');
      }
    } catch (err) {
      alert('Error updating book: ' + err.message);
    }
  };

  const cancelEdit = () => {
    setEditingBook(null);
    setEditForm({});
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="approved-books-container">
      <h2 style={{ fontWeight: '600', fontSize: '25px', marginTop: "-5px" }}>Approved Books</h2>
      
      <div className="filters">
        <input
          type="text"
          placeholder="Search by title or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="status-filter"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="returned">Returned</option>
        </select>
      </div>

      <div className="table-container">
        <table className="approved-books-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>User</th>
              <th>Borrow Date</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Approved By</th>
              <th>Return Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBooks.map((book) => (
              <tr key={book._id}>
                <td>{book.title}</td>
                <td>{book.userEmail}</td>
                <td>{formatDate(book.borrowDate)}</td>
                <td>{formatDate(book.returnDate)}</td>
                <td>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(book.status) }}
                  >
                    {book.status}
                  </span>
                </td>
                <td>{book.approvedBy}</td>
                <td>
                  {book.actualReturnDate ? formatDate(book.actualReturnDate) : '-'}
                </td>
                <td>
                  <button 
                    onClick={() => startEdit(book)}
                    style={{
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    ✏️ Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredBooks.length === 0 && (
        <div className="no-books">
          No approved books found
        </div>
      )}

      {/* Edit Modal */}
      {editingBook && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ marginTop: 0 }}>Edit Book Details</h2>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Title</label>
              <input
                type="text"
                name="title"
                value={editForm.title}
                onChange={handleEditChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Author</label>
              <input
                type="text"
                name="author"
                value={editForm.author}
                onChange={handleEditChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Publisher</label>
              <input
                type="text"
                name="publisher"
                value={editForm.publisher}
                onChange={handleEditChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Year</label>
                <input
                  type="number"
                  name="year"
                  value={editForm.year}
                  onChange={handleEditChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Stock</label>
                <input
                  type="number"
                  name="stock"
                  value={editForm.stock}
                  onChange={handleEditChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Category</label>
              <input
                type="text"
                name="category"
                value={editForm.category}
                onChange={handleEditChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Status</label>
              <select
                name="status"
                value={editForm.status}
                onChange={handleEditChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  fontSize: '14px'
                }}
              >
                <option value="active">Active</option>
                <option value="returned">Returned</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={cancelEdit}
                style={{
                  backgroundColor: '#757575',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovedBooks;
