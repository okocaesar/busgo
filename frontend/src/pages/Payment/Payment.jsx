import React, {useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

import "./Payment.css";


function Payment(){


const location = useLocation();

const navigate = useNavigate();


const booking = location.state;



const [method,setMethod] = useState("");



const handlePayment = ()=>{


if(!method){

alert("Please select a payment method");

return;

}



const paymentData = {

  ...booking,

  paymentStatus: "Paid",

  paymentMethod: method,

  paymentDate: new Date().toLocaleDateString("en-GB")

};



navigate("/confirmation",{

state: paymentData

});


};



if(!booking){

return(

<h2>
No booking information found
</h2>

);

}



return(

<>


<Navbar/>


<section className="payment-page">


<div className="payment-card">


<h1>
Complete Payment
</h1>


<p>
Amount to pay
</p>


<h2 className="amount">

XAF {booking.total.toLocaleString("en-GB")}

</h2>



<label>
Select Payment Method
</label>


<select

value={method}

onChange={(e)=>setMethod(e.target.value)}

>


<option value="">
Choose method
</option>


<option value="MTN Mobile Money">
MTN Mobile Money
</option>


<option value="Orange Money">
Orange Money
</option>


<option value="Bank Card">
Bank Card
</option>


</select>




<button

onClick={handlePayment}

>

Pay Now

</button>



</div>


</section>


<Footer/>


</>

);


}


export default Payment;