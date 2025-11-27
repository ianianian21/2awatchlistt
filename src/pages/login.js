import { useState } from "react";
import { useRouter } from "next/router";
import { signIn } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError("");
    setLoading(true);
    
    if (!email || !password) {
      setError("Please provide email and password");
      setLoading(false);
      return;
    }
    
    const res = await signIn(email, password);
    
    if (!res.ok) {
      setError(res.message || "Login failed");
      setLoading(false);
      return;
    }
    
    router.push("/watchlist");
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Sign In</h1>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}
        </form>

        <p>
          New to the site? <a href="/signup">Sign up now</a>
        </p>
      </div>
    </div>
  );
}