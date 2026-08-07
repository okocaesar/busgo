import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home";
import RoutesPage from "./pages/Routes/Routes";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Booking from "./pages/Booking/Booking";
import Offers from "./pages/Offers/Offers";
import About from "./pages/AboutUs/AboutUs";
import Confirmation from "./pages/Confirmation/Confirmation";
import Dashboard from "./pages/Dashboard/Dashboard";
import Payment from "./pages/Payment/Payment";
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<h1>Page Not Found</h1>} />
        <Route path="/confirmation" element={<Confirmation />}/>
        <Route path="/dashboard" element={<Dashboard />}/>
        <Route path="/payment" element={<Payment />}/>
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;