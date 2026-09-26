import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";

function Navigation() {
  const navigate = useNavigate();
  const [logoutError,setLogoutError]=useState('');

  const { user, profile, logout } = useAuth();
  const username = profile?.displayName || user?.username || 'Student';
  async function handleLogout() { try {await logout(); navigate('/');} catch(e) {setLogoutError(e.message);} }

  return (
    <header className="navigation">
      <div className="nav-container">

        <NavLink
          className="brand"
          to="/dashboard"
        >
          BalanceBoard
        </NavLink>

        <nav aria-label="Main navigation">
          <NavLink to="/dashboard">
            Dashboard
          </NavLink>

          <NavLink to="/analytics">
            Analytics
          </NavLink>

          <NavLink to="/calendar">
            Calendar
          </NavLink>

          <NavLink to="/achievements">
            Achievements
          </NavLink>
        </nav>

        <div className="profile-section">

          <NavLink to="/profile" className="profile-info profile-link" aria-label="Profile and alarm settings">
            <div
              className="profile-avatar"
              aria-hidden="true"
            >
              {username.charAt(0).toUpperCase()}
            </div>

            <span className="profile-name">
              {username}
            </span>
          </NavLink>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
          {logoutError && <span role="alert">{logoutError}</span>}

        </div>

      </div>
    </header>
  );
}

export default Navigation;
