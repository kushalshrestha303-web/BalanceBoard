import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [isCreateAccount, setIsCreateAccount] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Please enter your username.");
      return;
    }

    if (password.length < 4) {
      setError("Password must contain at least 4 characters.");
      return;
    }

    const user = {
      username: username.trim(),
    };

    /*
      FRONTEND DEMO ONLY

      Do NOT use localStorage passwords in a real production
      application. Real authentication should be implemented
      securely on a backend.
    */

    localStorage.setItem(
      "balanceboardUser",
      JSON.stringify(user)
    );

    navigate("/dashboard");
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="brand-logo">
            ⚖️
          </div>

          <h1>BalanceBoard</h1>

          <p>
            Balance your studies and wellbeing.
          </p>
        </div>

        <div className="login-tabs">
          <button
            type="button"
            className={!isCreateAccount ? "active-tab" : ""}
            onClick={() => {
              setIsCreateAccount(false);
              setError("");
            }}
          >
            Sign In
          </button>

          <button
            type="button"
            className={isCreateAccount ? "active-tab" : ""}
            onClick={() => {
              setIsCreateAccount(true);
              setError("");
            }}
          >
            Create Account
          </button>
        </div>

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >
          <div className="form-group">
            <label htmlFor="username">
              Username
            </label>

            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete={
                isCreateAccount
                  ? "new-password"
                  : "current-password"
              }
              minLength="4"
              required
            />

            <small>
              Minimum 4 characters
            </small>
          </div>

          {error && (
            <p
              className="login-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="login-submit"
          >
            {isCreateAccount
              ? "Create Account"
              : "Sign In"}
          </button>
        </form>

  

        <Link
          to="/dashboard"
          className="guest-link"
        >
          Continue as guest →
        </Link>
      </section>
    </main>
  );
}

export default Login;