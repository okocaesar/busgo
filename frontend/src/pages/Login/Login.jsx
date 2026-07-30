import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "./Login.css";

import background from "../../assets/1010.jpg";

function Login() {
  const [loginData, setLoginData] = useState({

  email:"",
  password:""

});

const handleLogin = (e)=>{

  e.preventDefault();


  const savedUser = JSON.parse(
    localStorage.getItem("user")
  );


  if(!savedUser){

    alert(
      "No account found. Please register first."
    );

    return;

  }



  if(
    loginData.email === savedUser.email &&
    loginData.password === savedUser.password
  ){

    localStorage.setItem(
      "loggedIn",
      "true"
    );


    localStorage.setItem(
      "currentUser",
      JSON.stringify(savedUser)
    );


    // alert(
    //   "Login successful!"
    // );


    window.location.href="/";


  }else{


    alert(
      "Invalid email or password"
    );


  }


};
  return (
    <section
      className="auth-page"
      style={{ backgroundImage: `url(${background})` }}
    >

      <div className="auth-overlay">

        <div className="auth-card">

          <h1>
            Welcome Back
          </h1>

          <p>
            Login to continue your journey with BusGo
          </p>


          <form onSubmit={handleLogin}>

            <div className="input-box">

              <label>Email</label>

              <input

type="email"

name="email"

value={loginData.email}

onChange={(e)=>
setLoginData({

...loginData,

email:e.target.value

})

}

placeholder="Enter your email"

/>

            </div>


            <div className="input-box">

              <label>Password</label>

              <input

type="password"

name="password"

value={loginData.password}

onChange={(e)=>
setLoginData({

...loginData,

password:e.target.value

})

}

placeholder="Enter your password"

/>

            </div>


            <button type="submit">
              Login
            </button>

          </form>


          <div className="auth-link">

            Don't have an account?

            <NavLink to="/register">
              Register
            </NavLink>

          </div>


        </div>

      </div>

    </section>
  );
}

export default Login;