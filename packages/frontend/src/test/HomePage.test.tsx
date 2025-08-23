import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { HomePage } from "../pages/HomePage";

describe("HomePage", () => {
  it("renders the main heading", () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    expect(screen.getByText("Fullstack TypeScript Monorepo")).toBeInTheDocument();
  });

  it("displays all three feature sections", () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    expect(screen.getByText("🔧 Backend")).toBeInTheDocument();
    expect(screen.getByText("⚛️ Frontend")).toBeInTheDocument();
    expect(screen.getByText("🏗️ Monorepo")).toBeInTheDocument();
  });
});
