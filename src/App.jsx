import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Calendar from "./pages/Calendar";
import Achievements from "./pages/Achievements";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Routes>
      {/* Login Page */}
      <Route path="/" element={<Login />} />

      {/* Main Dashboard */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* Analytics */}
      <Route path="/analytics" element={<Analytics />} />

      {/* Calendar */}
      <Route path="/calendar" element={<Calendar />} />

      {/* Achievements */}
      <Route path="/achievements" element={<Achievements />} />

      {/* 404 Page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;