import { NavLink, useNavigate } from "react-router-dom";

function Navigation() {
  const navigate = useNavigate();

  const userData = localStorage.getItem("balanceboardUser");

  const user = userData
    ? JSON.parse(userData)
    : null;

  const username = user?.username || "Student";

  function handleLogout() {
    localStorage.removeItem("balanceboardUser");

    navigate("/");
  }

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

          <div className="profile-info">
            <div
              className="profile-avatar"
              aria-hidden="true"
            >
              {username.charAt(0).toUpperCase()}
            </div>

            <span className="profile-name">
              {username}
            </span>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </div>
    </header>
  );
}

export default Navigation;