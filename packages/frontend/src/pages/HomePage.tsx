import React from "react";

export const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      <header className="hero">
        <h1>Fullstack TypeScript Monorepo</h1>
        <p>A modern fullstack application with Express.js + InversifyJS backend and React + Vite frontend</p>
      </header>

      <section className="features">
        <div className="feature">
          <h3>🔧 Backend</h3>
          <ul>
            <li>Express.js web framework</li>
            <li>InversifyJS dependency injection</li>
            <li>TypeScript for type safety</li>
            <li>RESTful API structure</li>
          </ul>
        </div>

        <div className="feature">
          <h3>⚛️ Frontend</h3>
          <ul>
            <li>React 18 with hooks</li>
            <li>Vite for fast development</li>
            <li>TypeScript integration</li>
            <li>React Router for navigation</li>
          </ul>
        </div>

        <div className="feature">
          <h3>🏗️ Monorepo</h3>
          <ul>
            <li>Workspace-based structure</li>
            <li>Shared configurations</li>
            <li>Concurrent development</li>
            <li>Unified build process</li>
          </ul>
        </div>
      </section>
    </div>
  );
};
