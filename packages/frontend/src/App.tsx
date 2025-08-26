import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { Navbar } from "./components/Navbar";
import "./App.css";
import { UsersPage } from "./pages/UsersPage";
import { AuctionPage } from "./pages/AuctionPage";

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/auctions" element={<AuctionPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
