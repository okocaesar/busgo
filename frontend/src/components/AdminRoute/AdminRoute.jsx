import React from "react";
import {
  Navigate,
  Outlet,
  useLocation
} from "react-router-dom";


// =========================================
// ADMIN ROUTE
// =========================================

function AdminRoute() {

  const location = useLocation();

  // =======================================
  // GET AUTHENTICATION DATA
  // =======================================

  const token =
    localStorage.getItem("authToken");

  const currentUser = JSON.parse(
    localStorage.getItem("currentUser") || "null"
  );


  // =======================================
  // NOT LOGGED IN
  // =======================================

  if (
    !token ||
    !currentUser
  ) {

    return (

      <Navigate
        to="/login"
        replace
        state={{
          from: location
        }}
      />

    );

  }


  // =======================================
  // USER IS NOT ADMIN
  // =======================================

  if (
    currentUser.role !== "admin"
  ) {

    return (

      <Navigate
        to="/"
        replace
      />

    );

  }


  // =======================================
  // ADMIN IS AUTHORIZED
  // =======================================

  return <Outlet />;

}


export default AdminRoute;