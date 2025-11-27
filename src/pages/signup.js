

import { useState } from "react";
import { useRouter } from "next/router";
import { signup } from "../lib/auth";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e) => {
    e && e.preventDefault && e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Provide email and password");
      return;
    }
    const res = signup(email, password);
    if (!res.ok) {
      setError(res.message || "Signup failed");
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
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">Create Account</button>

          {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}
        </form>

        <p>
          Already have an account? {" "}
          <a href="/login">Sign in</a>
        </p>
      </div>
    </div>
  );
}
