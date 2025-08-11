import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import apiClient from "../api/axiosInstance";

interface PublicRouteProps {
  children: ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
     
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }

    apiClient
      .get("/api/auth/validate-token")
      .then(() => {
        setIsLoggedIn(true);
      })
      .catch(() => {
        setIsLoggedIn(false);
        localStorage.removeItem("token");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }


  return isLoggedIn ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}
