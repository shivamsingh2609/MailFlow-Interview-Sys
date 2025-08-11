import { useEffect, useState, ReactNode } from "react";
import { Navigate } from "react-router-dom";
import apiClient from "../api/axiosInstance";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setIsValid(false);
      setLoading(false);
      return;
    }

    apiClient
      .get("/api/auth/validate-token")
      .then(() => {
        setIsValid(true);
      })
      .catch(() => {
        setIsValid(false);
        localStorage.removeItem("token"); 
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p>Loading...</p>; 
  }

  return isValid ? <>{children}</> : <Navigate to="/" replace />;
}
