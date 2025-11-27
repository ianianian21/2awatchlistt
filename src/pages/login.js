

import { useState } from "react";
import { useRouter } from "next/router";
import { login } from "../lib/auth";

export default function Login() {
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
    const res = login(email, password);
    if (!res.ok) {
      setError(res.message || "Login failed");
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
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">Sign In</button>

          {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}
        </form>

        <p>
          New to the site? {" "}
          <a href="/signup">Sign up now</a>
        </p>
      </div>
    </div>
  );
}
