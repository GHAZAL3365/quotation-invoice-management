
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, ReceiptText } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login({
        email: email.trim(),
        password,
      });

      const destination = location.state?.from?.pathname || "/";
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-5">
      <section className="w-full max-w-md rounded-2xl border border-border bg-surface p-7 shadow-lg sm:p-9">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-text-inverse">
            <ReceiptText size={28} />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-text-primary">
            Ultrakey
          </h1>

          <p className="mt-2 text-sm text-text-secondary">
            Sign in to your invoice management account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-text-primary"
            >
              Email address
            </label>

            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
              <Mail size={18} className="shrink-0 text-text-secondary" />

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="min-w-0 flex-1 bg-transparent py-3 text-sm text-text-primary outline-none placeholder:text-text-secondary"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-text-primary"
            >
              Password
            </label>

            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
              <LockKeyhole
                size={18}
                className="shrink-0 text-text-secondary"
              />

              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="min-w-0 flex-1 bg-transparent py-3 text-sm text-text-primary outline-none placeholder:text-text-secondary"
                required
              />
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-text-inverse transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

          <div className="rounded-lg bg-background border border-border p-3 text-xs text-text-secondary">
            <div className="font-semibold text-text-primary mb-1">Demo Account:</div>
            <div>Email: <code className="text-primary font-mono font-semibold">admin@example.com</code></div>
            <div>Password: <code className="text-primary font-mono font-semibold">admin123</code></div>
            <button
              type="button"
              onClick={() => { setEmail("admin@example.com"); setPassword("admin123"); }}
              className="mt-2 text-xs font-semibold text-primary underline hover:text-primary-hover"
            >
              Fill demo credentials
            </button>
          </div>

          <p className="mt-7 text-center text-xs text-text-secondary">
            Secure invoice management by Ultrakey IT Solutions
          </p>
      </section>
    </main>
  );
}
