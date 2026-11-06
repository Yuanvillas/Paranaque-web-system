import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute component that verifies user authentication
 * and prevents unauthorized access to protected pages
 */
const ProtectedRoute = ({ element, requiredRole = null }) => {
  const userEmail = localStorage.getItem("userEmail");
  const storedUser = localStorage.getItem("user");
  let userData = null;

  if (storedUser) {
    try {
      userData = JSON.parse(storedUser);
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }

  if (!userEmail || !userData || typeof userData !== "object" || Array.isArray(userData)) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && userData.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return element;
};

export default ProtectedRoute;
