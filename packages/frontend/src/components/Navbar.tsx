import React from "react";

export const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <a href="/" className="nav-logo">
          Fullstack App
        </a>
        <div className="nav-links">
          <a href="/" className="nav-link">
            Home
          </a>
          <a href="/users" className="nav-link">
            Users
          </a>
        </div>
      </div>
    </nav>
  );
};
