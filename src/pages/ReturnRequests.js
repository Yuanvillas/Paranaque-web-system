import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import "../components/App.css";
import "../styles/user-management.css";

const ReturnRequests = () => {
  const [returnRequests, setReturnRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const navigate = useNavigate();

  const userEmail = localStorage.getItem("userEmail");
  const userRole = localStorage.getItem("userRole");

  useEffect(() => {
    // Check if user is librarian or admin
    if (userRole !== "librarian" && userRole !== "admin") {
      navigate("/user-home");
    }
    fetchReturnRequests();
  }, [userRole, navigate]);

  const fetchReturnRequests = async () => {
    try {
      setLoading(true);
      const endpoint = filterStatus === "all" 
        ? "https://paranaque-web-system.onrender.com/api/transactions/return-requests/all"
        : "https://paranaque-web-system.onrender.com/api/transactions/return-requests";
      
      const res = await fetch(endpoint);
      const data = await res.json();
      if (res.ok) {
        setReturnRequests(data.requests || []);
        setError("");
      } else {
        setError(data.message || "Failed to fetch return requests.");
      }
    } catch (err) {
      setError("Error fetching return requests.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Filter requests based on search term and status
    let filtered = returnRequests.filter(req => {
      const matchesSearch =
        req.bookTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.userName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === "all" || req.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });

    // Sort by request date (newest first)
    filtered.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));
    setFilteredRequests(filtered);
  }, [returnRequests, searchTerm, filterStatus]);

  const handleApprove = async (requestId) => {
    const confirm = window.confirm("Approve this return request?");
    if (!confirm) return;

    try {
      const res = await fetch(
        `https://paranaque-web-system.onrender.com/api/transactions/return-requests/${requestId}/approve`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approvedBy: userEmail })
        }
      );

      if (res.ok) {
        await Swal.fire({
          title: "Parañaledge",
          text: "Return request approved successfully!",
          icon: "success",
          confirmButtonText: "OK"
        });
        fetchReturnRequests();
      } else {
        const data = await res.json();
        await Swal.fire({
          title: "Parañaledge",
          text: data.message || "Failed to approve return request.",
          icon: "error",
          confirmButtonText: "OK"
        });
      }
    } catch (err) {
      console.error(err);
      await Swal.fire({
        title: "Parañaledge",
        text: "Error approving return request",
        icon: "error",
        confirmButtonText: "OK"
      });
    }
  };

  const handleReject = async (requestId) => {
    setRejectingRequest(requestId);
  };

  const submitRejection = async (requestId) => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    try {
      const res = await fetch(
        `https://paranaque-web-system.onrender.com/api/transactions/return-requests/${requestId}/reject`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            rejectionReason,
            approvedBy: userEmail
          })
        }
      );

      if (res.ok) {
        await Swal.fire({
          title: "Parañaledge",
          text: "Return request rejected successfully!",
          icon: "success",
          confirmButtonText: "OK"
        });
        setRejectingRequest(null);
        setRejectionReason("");
        fetchReturnRequests();
      } else {
        const data = await res.json();
        await Swal.fire({
          title: "Parañaledge",
          text: data.message || "Failed to reject return request.",
          icon: "error",
          confirmButtonText: "OK"
        });
      }
    } catch (err) {
      console.error(err);
      await Swal.fire({
        title: "Parañaledge",
        text: "Error rejecting return request",
        icon: "error",
        confirmButtonText: "OK"
      });
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "pending":
        return "#FF9800"; // Orange
      case "approved":
        return "#4CAF50"; // Green
      case "rejected":
        return "#F44336"; // Red
      default:
        return "#757575"; // Grey
    }
  };

  const getConditionBadgeColor = (condition) => {
    switch (condition) {
      case "good":
        return "#4CAF50"; // Green
      case "damaged":
        return "#FF9800"; // Orange
      case "lost":
        return "#F44336"; // Red
      default:
        return "#757575"; // Grey
    }
  };

  if (loading) {
    return <div className="dashboard"><p>Loading return requests...</p></div>;
  }

  return (
    <div className="dashboard">
      <main className="main-content">
        <section className="content">
          <div className="um">
            <div className="um-header">
              <button className="um-back-btn" onClick={() => navigate("/admin-dashboard")}>
                ← Back
              </button>
              <h1 className="um-title">Return Requests Management</h1>
            </div>

            {error && <div className="um-error">{error}</div>}

            {/* Filters */}
            <div style={{ marginBottom: "20px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Search by book title, user email, or user name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: "200px",
                  padding: "10px",
                  borderRadius: "5px",
                  border: "1px solid #ddd",
                  fontSize: "14px"
                }}
              />

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: "10px 15px",
                  borderRadius: "5px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                  cursor: "pointer"
                }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {filteredRequests.length === 0 ? (
              <p className="um-empty">No return requests found.</p>
            ) : (
              <div className="um-table-wrapper">
                <table className="um-table">
                  <thead>
                    <tr>
                      <th>Book Title</th>
                      <th>User Email</th>
                      <th>User Name</th>
                      <th>Condition</th>
                      <th>Request Date</th>
                      <th>Status</th>
                      <th>Notes</th>
                      <th className="um-actions-col">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRequests.map((request) => (
                      <tr 
                        key={request._id}
                        style={{
                          borderLeft: `4px solid ${getStatusBadgeColor(request.status)}`,
                          backgroundColor: request.status === "pending" ? "#FFFDE7" : "transparent"
                        }}
                      >
                        <td style={{ fontWeight: "bold" }}>{request.bookTitle}</td>
                        <td>{request.userEmail}</td>
                        <td>{request.userName || "-"}</td>
                        <td>
                          <span
                            style={{
                              backgroundColor: getConditionBadgeColor(request.condition),
                              color: "white",
                              padding: "5px 10px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: "bold"
                            }}
                          >
                            {request.condition.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {new Date(request.requestDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                        <td>
                          <span
                            style={{
                              backgroundColor: getStatusBadgeColor(request.status),
                              color: "white",
                              padding: "5px 10px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: "bold"
                            }}
                          >
                            {request.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontSize: "12px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {request.notes || "-"}
                        </td>
                        <td className="um-actions">
                          {request.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(request._id)}
                                className="um-btn um-edit"
                                style={{ backgroundColor: "#4CAF50", padding: "6px 10px", fontSize: "12px" }}
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => handleReject(request._id)}
                                className="um-btn um-delete"
                                style={{ backgroundColor: "#F44336", padding: "6px 10px", fontSize: "12px" }}
                              >
                                ✕ Reject
                              </button>
                            </>
                          )}
                          {request.status === "approved" && (
                            <span style={{ color: "#4CAF50", fontWeight: "bold" }}>
                              Approved by {request.approvedBy}
                            </span>
                          )}
                          {request.status === "rejected" && (
                            <span style={{ color: "#F44336", fontSize: "12px" }}>
                              Rejected: {request.rejectionReason}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Rejection Modal */}
          {rejectingRequest && (
            <div className="modal-overlay" onClick={() => setRejectingRequest(null)}>
              <div 
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: "500px" }}
              >
                <h2>Reject Return Request</h2>
                <p style={{ marginBottom: "15px", color: "#666" }}>
                  Please provide a reason for rejecting this return request:
                </p>

                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    minHeight: "100px",
                    fontSize: "14px",
                    fontFamily: "Arial, sans-serif",
                    boxSizing: "border-box",
                    marginBottom: "15px"
                  }}
                />

                <div className="modal-actions">
                  <button
                    className="modal-cancel"
                    onClick={() => setRejectingRequest(null)}
                    style={{ backgroundColor: "#757575" }}
                  >
                    Cancel
                  </button>
                  <button
                    className="modal-save"
                    onClick={() => submitRejection(rejectingRequest)}
                    style={{ backgroundColor: "#F44336" }}
                  >
                    Reject Request
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default ReturnRequests;
