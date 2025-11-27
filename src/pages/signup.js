import { useState } from "react";
import { useRouter } from "next/router";
import { signUp } from "../lib/supabase";

export default function SignUp() {
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
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }
    
    const res = await signUp(email, password);
    
    if (!res.ok) {
      setError(res.message || "Signup failed");
      setLoading(false);
      return;
    }
    
    // Check if email confirmation is required
    if (res.data?.user && !res.data.session) {
      setError("Please check your email to confirm your account");
      setLoading(false);
      return;
    }
    
    router.push("/watchlist");
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Sign Up</h1>

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
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          {error && <p style={{ color: "#ff6b6b", marginTop: 12 }}>{error}</p>}
        </form>

        <p>
          Already have an account? <a href="/login">Sign in</a>
        </p>
      </div>
    </div>
  );
}