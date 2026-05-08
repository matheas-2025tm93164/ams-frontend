import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await login(email, password);
      nav("/", { replace: true });
    } catch {
      setErr("Login failed. Check credentials.");
    }
  }

  return (
    <main className="auth-shell" aria-label="Sign in">
      <div className="auth-card">
        <h1>Sign in</h1>
        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div aria-live="assertive" aria-atomic="true">
            {err ? (
              <p className="error auth-error" role="alert">
                {err}
              </p>
            ) : null}
          </div>
          <div className="auth-submit-wrap">
            <button type="submit" className="btn btn-primary">
              <span className="mi" aria-hidden="true">login</span> Sign in
            </button>
          </div>
        </form>
        <p className="auth-footer subtle">
          New residents and staff are onboarded by a building administrator.
        </p>
      </div>
    </main>
  );
}
