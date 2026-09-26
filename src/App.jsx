import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Calendar from "./pages/Calendar";
import Achievements from "./pages/Achievements";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";

function Private({ children }) {
  const {user,checking}=useAuth();
  if(checking) return <p className="auth-loading">Loading BalanceBoard…</p>;
  return user ? children : <Navigate to="/" replace />;
}
function App() {
  const {user,checking}=useAuth();
  return (
    <Routes>
      {/* Login Page */}
      <Route path="/" element={checking ? <p className="auth-loading">Loading BalanceBoard…</p> : user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/login" element={checking ? <p className="auth-loading">Loading BalanceBoard…</p> : user ? <Navigate to="/dashboard" replace /> : <Login />} />

      {/* Main Dashboard */}
      <Route path="/dashboard" element={<Private><Dashboard /></Private>} />

      {/* Analytics */}
      <Route path="/analytics" element={<Private><Analytics /></Private>} />

      {/* Calendar */}
      <Route path="/calendar" element={<Private><Calendar /></Private>} />

      {/* Achievements */}
      <Route path="/achievements" element={<Private><Achievements /></Private>} />
      <Route path="/profile" element={<Private><Profile /></Private>} />

      {/* 404 Page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
