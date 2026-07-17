import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import { ProtectedRoute } from "../ProtectedRoute";

const mockUseAuth = vi.fn();

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

const renderProtected = (initialEntries = ["/dashboard"]) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<div>Dashboard content</div>} />
        </Route>
        <Route path="/auth/login" element={<div>Login page</div>} />
        <Route path="/auth/unauthorized" element={<div>Unauthorized</div>} />
      </Routes>
    </MemoryRouter>
  );

describe("ProtectedRoute", () => {
  it("shows loading when auth is loading", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    renderProtected();
    expect(screen.getByTestId("full-screen-loader")).toBeInTheDocument();
  });

  it("redirects to login when not authenticated", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    renderProtected();
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("redirects to unauthorized when role mismatched", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "1", email: "test@test.com", role: "Student" },
      loading: false,
    });
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<ProtectedRoute requiredRoles={["Admin"]} />}>
            <Route path="dashboard" element={<div>Dashboard content</div>} />
          </Route>
          <Route path="/auth/login" element={<div>Login page</div>} />
          <Route path="/auth/unauthorized" element={<div>Unauthorized</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Unauthorized")).toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "1", email: "test@test.com", role: "Student" },
      loading: false,
    });
    renderProtected();
    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
  });
});
