import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

import "./Dashboard.css";


function Dashboard() {
    const navigate = useNavigate();


const [user, setUser] = useState(null);


  const [bookings, setBookings] = useState([]);



  useEffect(() => {


  const loggedIn =
    localStorage.getItem("loggedIn");


  const currentUser =
    JSON.parse(
      localStorage.getItem("currentUser")
    );



  if(!loggedIn || !currentUser){

    navigate("/login");

    return;

  }



  setUser(currentUser);



  const savedBookings =
    JSON.parse(
      localStorage.getItem("bookings")
    ) || [];



  const userBookings =
    savedBookings.filter(

      (ticket)=>
      ticket.email === currentUser.email

    );



  setBookings(userBookings);



}, [navigate]);




  return (

    <>

      <Navbar />


      <section className="dashboard-page">


        <div className="dashboard-container">


          <h1>

Welcome {user?.name}

</h1>


<p className="dashboard-subtitle">

My BusGo Tickets

</p>



          {
            bookings.length === 0 ?

            (

              <div className="empty">

                <h2>
                  No bookings found
                </h2>

                <p>
                  Your purchased tickets will appear here.
                </p>

              </div>

            )

            :

            (

              <div className="ticket-list">


              {
                bookings.map((ticket,index)=>(


                  <div 
                    className="ticket-card"
                    key={index}
                  >


                    <h2>
                      BUSGO
                    </h2>


                    <p>
                      <strong>
                        Ticket:
                      </strong>

                      {ticket.ticketNumber}
                    </p>



                    <p>
                      <strong>
                        Passenger:
                      </strong>

                      {ticket.name}
                    </p>



                    <p>
                      <strong>
                        Route:
                      </strong>

                      {ticket.from} → {ticket.to}
                    </p>



                    <p>
                      <strong>
                        Bus:
                      </strong>

                      {ticket.busType}
                    </p>



                    <p>
                      <strong>
                        Seats:
                      </strong>

                      {ticket.seats.join(", ")}
                    </p>



                    <p>
                      <strong>
                        Date:
                      </strong>

                      {ticket.date}
                    </p>



                    <h3>

                      XAF {ticket.total.toLocaleString("en-GB")}

                    </h3>



                  </div>


                ))
              }


              </div>

            )

          }


        </div>


      </section>


      <Footer />

    </>

  );

}


export default Dashboard;