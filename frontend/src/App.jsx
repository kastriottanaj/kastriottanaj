import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Portfolio from './pages/Portfolio';
import Contact from './pages/Contact';
import ScrollToTop from './components/ScrollToTop';
import ExitPopup from './components/ExitPopup';
import CookieConsent from './components/CookieConsent';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <ExitPopup />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <Footer />
      <CookieConsent />
    </>
  );
}
