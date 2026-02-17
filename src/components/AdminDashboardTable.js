import React, { useEffect, useState } from 'react';
import './App.css';

const AdminDashboardTable = ({ onViewResources }) => {
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
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [detailedData, setDetailedData] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

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
      const pendingBorrowReserveRequests = allRequests.filter(req => req.status === 'pending').length;
      
      // Fetch return requests
      const returnRes = await fetch('https://paranaque-web-system.onrender.com/api/transactions/return-requests');
      const returnData = await returnRes.json();
      const allReturnRequests = returnData.requests || [];
      const pendingReturnRequests = allReturnRequests.filter(req => req.status === 'pending').length;
      
      // Total pending requests = borrow/reserve + return
      const pendingRequests = pendingBorrowReserveRequests + pendingReturnRequests;
      
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

  const handleCardClick = async (metric) => {
    setSelectedMetric(metric);
    setDetailLoading(true);

    try {
      switch(metric) {
        case 'books':
          const booksRes = await fetch('https://paranaque-web-system.onrender.com/api/books?limit=10000');
          const booksData = await booksRes.json();
          setDetailedData(booksData.books || []);
          break;

        case 'issued':
          const borrowedRes = await fetch('https://paranaque-web-system.onrender.com/api/books/borrowed?limit=10000');
          const borrowedData = await borrowedRes.json();
          setDetailedData(borrowedData.books || []);
          break;

        case 'returned':
          const transRes = await fetch('https://paranaque-web-system.onrender.com/api/transactions?limit=10000');
          const transData = await transRes.json();
          const completedTrans = transData.transactions ? transData.transactions.filter(t => t.status === 'completed') : [];
          setDetailedData(completedTrans);
          break;

        case 'requests':
          const requestsRes = await fetch('https://paranaque-web-system.onrender.com/api/transactions/pending-requests?limit=10000');
          const requestsData = await requestsRes.json();
          const pendingReqs = requestsData.transactions ? requestsData.transactions.filter(t => t.status === 'pending') : [];
          setDetailedData(pendingReqs);
          break;

        case 'categories':
          const booksRes2 = await fetch('https://paranaque-web-system.onrender.com/api/books?limit=10000');
          const booksData2 = await booksRes2.json();
          const books = booksData2.books || [];
          const categoryMap = {};
          books.forEach(book => {
            if (book.category) {
              categoryMap[book.category] = (categoryMap[book.category] || 0) + 1;
            }
          });
          const categories = Object.entries(categoryMap).map(([name, count]) => ({
            name,
            count,
            _id: name
          }));
          setDetailedData(categories);
          break;

        default:
          setDetailedData([]);
      }
    } catch (err) {
      console.error('Error fetching detailed data:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}><p>Loading dashboard...</p></div>;
  }

  const metricCards = [
    { label: 'Books Listed', value: stats.totalBooks, icon: '📚', id: 'books' },
    { label: 'Times Book Issued', value: stats.borrowedBooks, icon: '📤', id: 'issued' },
    { label: 'Times Books Returned', value: stats.returnedBooks, icon: '♻️', id: 'returned' },
    { label: 'Ongoing Requests', value: stats.ongoingRequests, icon: '⏳', id: 'requests' },
    { label: 'Listed Categories', value: stats.categoriesListed, icon: '📂', id: 'categories' }
  ];

  // Detail view components
  const renderDetailView = () => {
    if (!selectedMetric) return null;

    const title = metricCards.find(c => c.id === selectedMetric)?.label;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }} onClick={() => setSelectedMetric(null)}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '25px',
          maxHeight: '80vh',
          overflowY: 'auto',
          width: '100%',
          maxWidth: '900px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          animation: 'slideIn 0.3s ease-out'
        }} onClick={(e) => e.stopPropagation()}>
          <style>{`
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translateY(-50px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>{title}</h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {selectedMetric === 'issued' && (
                <button
                  onClick={() => {
                    setSelectedMetric(null);
                    onViewResources();
                  }}
                  style={{
                    backgroundColor: '#1976d2',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    transition: 'background-color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                >
                  📚 Resources
                </button>
              )}
              {selectedMetric === 'books' && (
                <button
                  onClick={() => {
                    setSelectedMetric(null);
                    onViewResources();
                  }}
                  style={{
                    backgroundColor: '#1976d2',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    transition: 'background-color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                >
                  📚 Resources
                </button>
              )}
              {selectedMetric === 'requests' && (
                <button
                  onClick={() => {
                    setSelectedMetric(null);
                    onViewResources();
                  }}
                  style={{
                    backgroundColor: '#1976d2',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    transition: 'background-color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                >
                  📚 Resources
                </button>
              )}
              <button
                onClick={() => setSelectedMetric(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#999'
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {detailLoading ? (
            <p>Loading data...</p>
          ) : detailedData.length === 0 ? (
            <p style={{ color: '#999' }}>No data available</p>
          ) : (
            <>
              {selectedMetric === 'categories' ? (
                // Categories view
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
                  {detailedData.map((category, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '15px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '18px', fontWeight: '600', color: '#2e7d32', marginBottom: '5px' }}>
                        {category.count}
                      </div>
                      <div style={{ color: '#666', fontSize: '13px' }}>
                        {category.name}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Table view for other metrics
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '14px'
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                        {selectedMetric === 'books' && (
                          <>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Title</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Author</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Category</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>Stock</th>
                          </>
                        )}
                        {selectedMetric === 'issued' && (
                          <>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Title</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Borrowed By</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Borrow Date</th>
                          </>
                        )}
                        {selectedMetric === 'returned' && (
                          <>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Book Title</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>User</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Return Date</th>
                          </>
                        )}
                        {selectedMetric === 'requests' && (
                          <>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Book Title</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Requested By</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Type</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Date</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Calculate pagination
                        const totalPages = Math.ceil(detailedData.length / pageSize);
                        const startIndex = (currentPage - 1) * pageSize;
                        const endIndex = startIndex + pageSize;
                        const paginatedData = detailedData.slice(startIndex, endIndex);

                        // Reset to page 1 if current page exceeds total pages
                        if (currentPage > totalPages && totalPages > 0) {
                          setCurrentPage(1);
                        }

                        return paginatedData.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                            {selectedMetric === 'books' && (
                              <>
                                <td style={{ padding: '10px' }}>{item.title}</td>
                                <td style={{ padding: '10px' }}>{item.author}</td>
                                <td style={{ padding: '10px' }}>{item.category}</td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>{item.stock || 0}</td>
                              </>
                            )}
                            {selectedMetric === 'issued' && (
                              <>
                                <td style={{ padding: '10px' }}>{item.title}</td>
                                <td style={{ padding: '10px' }}>{item.borrowedBy}</td>
                                <td style={{ padding: '10px' }}>
                                  {item.borrowedAt ? new Date(item.borrowedAt).toLocaleDateString() : '-'}
                                </td>
                              </>
                            )}
                            {selectedMetric === 'returned' && (
                              <>
                                <td style={{ padding: '10px' }}>{item.bookTitle}</td>
                                <td style={{ padding: '10px' }}>{item.userEmail}</td>
                                <td style={{ padding: '10px' }}>
                                  {item.endDate ? new Date(item.endDate).toLocaleDateString() : '-'}
                                </td>
                              </>
                            )}
                            {selectedMetric === 'requests' && (
                              <>
                                <td style={{ padding: '10px' }}>{item.bookTitle}</td>
                                <td style={{ padding: '10px' }}>{item.userEmail}</td>
                                <td style={{ padding: '10px', textTransform: 'capitalize' }}>{item.type}</td>
                                <td style={{ padding: '10px' }}>
                                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}
                                </td>
                              </>
                            )}
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {(() => {
                  const totalPages = Math.ceil(detailedData.length / pageSize);
                  return totalPages > 1 ? (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '20px',
                      padding: '15px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '5px'
                    }}>
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        style={{
                          padding: '10px 16px',
                          backgroundColor: currentPage === 1 ? '#ccc' : '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        ← Previous
                      </button>

                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                        Page {currentPage} of {totalPages} (Showing {Math.min(pageSize, detailedData.length - (currentPage - 1) * pageSize)} of {detailedData.length})
                      </span>

                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        style={{
                          padding: '10px 16px',
                          backgroundColor: currentPage === totalPages ? '#ccc' : '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        Next →
                      </button>
                    </div>
                  ) : null;
                })()}
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      
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
            onClick={() => handleCardClick(card.id)}
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
              position: 'relative',
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
            {/* Notification badge for Ongoing Requests */}
            {card.id === 'requests' && card.value > 0 && (
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                backgroundColor: '#FF5252',
                color: 'white',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                animation: 'pulse 1.5s infinite'
              }}>
                {card.value}
              </div>
            )}
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

      {renderDetailView()}
    </div>
  );
};

export default AdminDashboardTable;
