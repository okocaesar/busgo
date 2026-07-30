import React, { useState } from "react";
import { useLocation, NavLink, useNavigate } from "react-router-dom";import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { QRCodeCanvas } from "qrcode.react";

import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

import "./Confirmation.css";


function Confirmation() {

  const navigate = useNavigate();

  const location = useLocation();

const booking = location.state;


const [ticketNumber] = useState(
  "BG-" + Math.floor(100000 + Math.random() * 900000)
);



const qrData = `
BUSGO TICKET

Ticket: ${ticketNumber}

Passenger: ${booking?.name}

Phone: ${booking?.phone}

Route:
${booking?.from} → ${booking?.to}

Bus:
${booking?.busType}

Seats:
${booking?.seats?.join(", ")}

Date:
${booking?.date}

Total:
XAF ${booking?.total?.toLocaleString("en-GB")}
`;

const confirmBooking = () => {


  const savedTicket = {

    ticketNumber,

    email: JSON.parse(
  localStorage.getItem("currentUser")
)?.email,

    name: booking.name,

    phone: booking.phone,

    from: booking.from,

    to: booking.to,

    busType: booking.busType,

    seats: booking.seats,

    date: booking.date,

    total: booking.total,

    paymentStatus: booking.paymentStatus,

    paymentMethod: booking.paymentMethod,

    paymentDate: booking.paymentDate,

    createdAt: new Date().toLocaleDateString("en-GB")

  };



  const existingTickets =

    JSON.parse(
      localStorage.getItem("bookings")
    ) || [];



  localStorage.setItem(

    "bookings",

    JSON.stringify(
      [
        ...existingTickets,
        savedTicket
      ]
    )

  );



  alert(
    "Booking confirmed successfully!"
  );


  navigate("/dashboard");


};

  const downloadTicket = () => {


    const ticket = document.getElementById("ticket");


    html2canvas(ticket)
    .then((canvas)=>{


      const imgData =
      canvas.toDataURL("image/png");


      const pdf =
      new jsPDF(
        "p",
        "mm",
        "a4"
      );


      const width = 190;

      const height =
      (canvas.height * width)
      / canvas.width;



      pdf.addImage(
        imgData,
        "PNG",
        10,
        10,
        width,
        height
      );


      pdf.save(
        `BusGo-${ticketNumber}.pdf`
      );


    });


  };



  if(!booking){

    return(

      <>

      <Navbar />

      <div className="empty-booking">

        <h2>
          No booking found
        </h2>


        <NavLink to="/booking">
          Make Booking
        </NavLink>

      </div>

      <Footer />

      </>

    );

  }



  return (

    <>


    <Navbar />


    <section className="ticket-page">


      <div 
        className="ticket"
        id="ticket"
      >



        <div className="ticket-header">


          <h1>
            BUSGO
          </h1>


          <p>
            BUS TRANSPORT RESERVATION
          </p>


        </div>



        <div className="ticket-number">

          Ticket No:
          <strong>
            {ticketNumber}
          </strong>

        </div>



        <div className="route-box">


          <div>

            <small>
              FROM
            </small>

            <h2>
              {booking.from}
            </h2>

          </div>



          <span>
            →
          </span>



          <div>

            <small>
              TO
            </small>

            <h2>
              {booking.to}
            </h2>

          </div>


        </div>




        <div className="details">


          <p>
            <span>
              Passenger
            </span>

            {booking.name}

          </p>



          <p>

            <span>
              Phone
            </span>

            {booking.phone}

          </p>



          <p>

            <span>
              Bus Type
            </span>

            {booking.busType}

          </p>



          <p>

            <span>
              Seats
            </span>

            {booking.seats.join(", ")}

          </p>



          <p>

            <span>
              Travel Date
            </span>

            {booking.date}

          </p>

          <p>

<span>
Payment
</span>

{booking.paymentMethod}

</p>


<p>

<span>
Status
</span>

<span className="paid">

Paid ✓

</span>

</p>



        </div>




        <div className="price-box">

          TOTAL

          <h2>
            XAF {booking.total.toLocaleString("en-GB")}
          </h2>

        </div>



        <div className="qr-box">

  <QRCodeCanvas

    value={qrData}

    size={120}

    bgColor="#ffffff"

    fgColor="#0b7d45"

  />

</div>



        <p className="thank">

          Thank you for travelling with BusGo

        </p>



      </div>



      <button
  className="download-btn"
  onClick={downloadTicket}
>

  Download Ticket PDF

</button>



<button
  className="print-btn"
  onClick={()=>window.print()}
>

  Print Ticket

</button>



<button

  className="confirm-btn"

  onClick={confirmBooking}

>

  Confirm Booking

</button>



    </section>



    <Footer />


    </>

  );

}


export default Confirmation;