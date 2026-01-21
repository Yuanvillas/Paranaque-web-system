import React, { useEffect, useState } from 'react';
import './App.css';

const AdminDashboardTable = () => {
  const [stats, setStats] = useState({
    totalBooks: 0,
    borrowedBooks: 0,
    returnedBooks: 0,
    ongoingRequests: 0,
    authorsListed: 0,
    categoriesListed: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch all books
      const booksRes = await fetch('https://paranaque-web-system.onrender.com/api/books?limit=10000');
      const booksData = await booksRes.json();
      const books = booksData.books || [];
      
      // Fetch borrowed books
      const borrowedRes = await fetch('https://paranaque-web-system.onrender.com/api/books/borrowed?limit=10000');
      const borrowedData = await borrowedRes.json();
      const borrowedBooks = borrowedData.books || [];
      
      // Fetch pending requests
      const requestsRes = await fetch('https://paranaque-web-system.onrender.com/api/transactions/pending-requests?limit=10000');
      const requestsData = await requestsRes.json();
      const allRequests = requestsData.transactions || [];
      const pendingRequests = allRequests.filter(req => req.status === 'pending').length;
      
      // Calculate returned books (completed transactions)
      const transRes = await fetch('https://paranaque-web-system.onrender.com/api/transactions?limit=10000');
      const transData = await transRes.json();
      const completedTransactions = transData.transactions ? transData.transactions.filter(t => t.status === 'completed').length : 0;
      
      // Get unique authors and categories
      const uniqueAuthors = new Set(books.map(b => b.author).filter(a => a));
      const uniqueCategories = new Set(books.map(b => b.category).filter(c => c));
      
      setStats({
        totalBooks: books.length,
        borrowedBooks: borrowedBooks.length,
        returnedBooks: completedTransactions,
        ongoingRequests: pendingRequests,
        authorsListed: uniqueAuthors.size,
        categoriesListed: uniqueCategories.size
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Error loading dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}><p>Loading dashboard...</p></div>;
  }

  const metricCards = [
    { label: 'Books Listed', value: stats.totalBooks, icon: '📚' },
    { label: 'Times Book Issued', value: stats.borrowedBooks, icon: '📤' },
    { label: 'Times Books Returned', value: stats.returnedBooks, icon: '♻️' },
    { label: 'Ongoing Requests', value: stats.ongoingRequests, icon: '⏳' },
    { label: 'Authors Listed', value: stats.authorsListed, icon: '✍️' },
    { label: 'Listed Categories', value: stats.categoriesListed, icon: '📂' }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontWeight: '600', fontSize: '25px', marginBottom: '30px' }}>Dashboard Overview</h1>
      
      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        {metricCards.map((card, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              padding: '25px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              ':hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.12)'
              }
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            }}
          >
            <div style={{
              fontSize: '40px',
              marginBottom: '15px'
            }}>
              {card.icon}
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#2e7d32',
              marginBottom: '10px'
            }}>
              {card.value}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#666',
              fontWeight: '500'
            }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboardTable;
