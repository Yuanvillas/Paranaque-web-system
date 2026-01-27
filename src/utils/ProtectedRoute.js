import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * ProtectedRoute component that verifies user authentication
 * and prevents unauthorized access to protected pages
 */
const ProtectedRoute = ({ element, requiredRole = null }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const userEmail = localStorage.getItem("userEmail");
      const user = localStorage.getItem("user");

      // If no authentication data, redirect to login
      if (!userEmail || !user) {
        navigate("/", { replace: true });
        return;
      }

      // If a specific role is required, check it
      if (requiredRole) {
        try {
          const userData = JSON.parse(user);
          if (userData.role !== requiredRole) {
            navigate("/", { replace: true });
            return;
          }
        } catch (e) {
          console.error("Error parsing user data:", e);
          navigate("/", { replace: true });
          return;
        }
      }
    };

    checkAuth();
  }, [navigate, requiredRole]);

  return element;
};

export default ProtectedRoute;
