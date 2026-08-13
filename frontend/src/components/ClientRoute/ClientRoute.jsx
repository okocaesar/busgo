import React from "react";
import {
  Navigate,
  Outlet
} from "react-router-dom";

function ClientRoute() {

  const token =
    localStorage.getItem("authToken");

  const currentUser = JSON.parse(
    localStorage.getItem("currentUser") || "null"
  );

  // Not logged in
  if (!token || !currentUser) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // Admin trying to access client area
  if (currentUser.role === "admin") {
    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }

  return <Outlet />;
}

export default ClientRoute;