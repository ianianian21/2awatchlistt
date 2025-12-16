import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { signIn } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
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
      // If login failed and we had saved credentials, remove them
      try {
        const saved = localStorage.getItem('remember_creds')
        if (saved) localStorage.removeItem('remember_creds')
      } catch (err) {
        // ignore
      }
      return;
    }

    // Save credentials if user opted to remember them
    try {
      if (remember) {
        localStorage.setItem(
          'remember_creds',
          JSON.stringify({ email, password })
        )
      } else {
        localStorage.removeItem('remember_creds')
      }
    } catch (err) {
      // ignore storage errors
    }

    router.push("/watchlist");
  };

  useEffect(() => {
    // On mount try auto-login if credentials were saved
    try {
      const saved = localStorage.getItem('remember_creds')
      if (saved) {
        const { email: savedEmail, password: savedPassword } =
          JSON.parse(saved) || {}

        if (savedEmail && savedPassword) {
          setEmail(savedEmail)
          setPassword(savedPassword)
          setRemember(true)
          // attempt login automatically
          ;(async () => {
            setLoading(true)
            const res = await signIn(savedEmail, savedPassword)
            setLoading(false)
            if (res.ok) {
              router.push('/watchlist')
            } else {
              // clear invalid saved creds
              try { localStorage.removeItem('remember_creds') } catch (e) {}
            }
          })()
        }
      }
    } catch (err) {
      // ignore parse/storage errors
    }
  }, [])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#050505',
        padding: 24,
      }}
    >
      <div
        style={{
          width: 420,
          maxWidth: '100%',
          background: '#070707',
          padding: 28,
          borderRadius: 8,
          boxShadow: '0 6px 18px rgba(0,0,0,0.6)',
        }}
      >
        <h1 style={{ margin: 0, marginBottom: 18 }}>Sign In</h1>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 14px',
              marginBottom: 12,
              background: '#333',
              border: 'none',
              borderRadius: 6,
              color: '#ddd',
              fontSize: 14,
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 14px',
              marginBottom: 12,
              background: '#333',
              border: 'none',
              borderRadius: 6,
              color: '#ddd',
              fontSize: 14,
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
            <label htmlFor="remember" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#ddd', fontSize: 14 }}>
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                disabled={loading}
                style={{ width: 16, height: 16 }}
              />
              <span>Remember me</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 24px',
                background: '#e50914',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>

          {error && <p style={{ color: '#ff6b6b', marginTop: 12 }}>{error}</p>}
        </form>

        <p style={{ marginTop: 14, color: '#ddd', fontSize: 13 }}>
          New to the site? <a href="/signup" style={{ color: '#e50914' }}>Sign up now</a>
        </p>
      </div>
    </div>
  );
}