import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

function Login() {
  const navigate = useNavigate();
  const { authenticate } = useAuth();
  const [submitting,setSubmitting] = useState(false);

  const [isCreateAccount, setIsCreateAccount] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [googleEnabled,setGoogleEnabled] = useState(false);
  useEffect(() => {
    if(new URLSearchParams(window.location.search).has('authError')) setError('Google sign-in failed. Please try again.');
    api('/auth/providers').then(data=>setGoogleEnabled(data.google)).catch(()=>{});
  },[]);

  async function handleSubmit(event) {
    event.preventDefault(); setError(''); setSubmitting(true);
    try { await authenticate(isCreateAccount?'register':'login',username.trim(),password); navigate('/dashboard'); }
    catch(e) { setError(e.message); }
    finally { setSubmitting(false); }
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
              minLength={isCreateAccount ? 12 : 1}
              required
            />

            <small>
              {isCreateAccount ? "Minimum 12 characters" : "Use your account password"}
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
            disabled={submitting}
            className="login-submit"
          >
            {isCreateAccount
              ? "Create Account"
              : "Sign In"}
          </button>
        </form>
        <div className="login-alternative">
          <span>or</span>
          {googleEnabled ? (
            <a className="google-signin" href="/api/auth/google"><strong aria-hidden="true">G</strong> Continue with Google</a>
          ) : (
            <button className="google-signin" type="button" disabled title="Google sign-in needs a configured Google OAuth client"><strong aria-hidden="true">G</strong> Continue with Google</button>
          )}
          {!googleEnabled && <small>Google sign-in requires OAuth setup. See README.</small>}
        </div>
      </section>
    </main>
  );
}

export default Login;
