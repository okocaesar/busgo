import Navbar from "../../components/Navbar/Navbar";
import Hero from "../../components/Hero/Hero";
import SearchCard from "../../components/SearchCard/SearchCard";
import Features from "../../components/Features/Features";
import PopularRoutes from "../../components/PopularRoutes/PopularRoutes";
import Testimonials from "../../components/Testimonials/Testimonials";
import Footer from "../../components/Footer/Footer";

function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <SearchCard />
      <Features />
      <PopularRoutes />
      <Testimonials />
      <Footer />
    </>
  );
}

export default Home;