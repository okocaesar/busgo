import React, { useState } from "react";
import logo from "../../assets/logo.png";
import { NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";


function Navbar() {


  const navigate = useNavigate();


  const [loggedIn, setLoggedIn] = useState(
    localStorage.getItem("loggedIn")
  );



  const logout = () => {


    localStorage.removeItem("loggedIn");

    localStorage.removeItem("currentUser");


    setLoggedIn(false);


    navigate("/login");

  };



  return (

    <nav className="navbar">


      <div className="logo">
  <img src={logo} alt="BusGo Logo" className="logo-img" />
</div>




      <div className="nav-links">


        <NavLink to="/">
          Home
        </NavLink>


        <NavLink to="/routes">
          Routes
        </NavLink>


        <NavLink to="/offers">
          Offers
        </NavLink>



        {
          loggedIn && (

            <NavLink to="/dashboard">
              Dashboard
            </NavLink>

          )
        }


      </div>





      <div className="auth-buttons">


        {
          loggedIn ? (


            <button

              className="signup-btn"

              onClick={logout}

            >

              Logout

            </button>


          ) : (


            <>


              <NavLink to="/login">

                <button className="login-btn">

                  Login

                </button>

              </NavLink>



              <NavLink to="/register">

                <button className="signup-btn">

                  Register

                </button>

              </NavLink>



            </>


          )

        }


      </div>


    </nav>

  );

}


export default Navbar;