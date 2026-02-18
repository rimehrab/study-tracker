import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminView from "./pages/AdminView";
import SuperAdmin from "./pages/SuperAdmin";

function RoleRoute({ children, allowed }) {
  const { currentUser, role, loading } = useAuth();

  if (loading) return null;
  if (!currentUser) return <Navigate to="/login" />;
  if (!allowed.includes(role)) return <Navigate to="/dashboard" />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <RoleRoute allowed={["user", "admin", "superadmin"]}>
                <Dashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <RoleRoute allowed={["admin", "superadmin"]}>
                <AdminView />
              </RoleRoute>
            }
          />
          <Route
            path="/superadmin"
            element={
              <RoleRoute allowed={["superadmin"]}>
                <SuperAdmin />
              </RoleRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
