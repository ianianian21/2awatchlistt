import { useEffect } from "react";
import { useRouter } from "next/router";
import { isAuthenticated, logout, getAuthUser } from "../lib/auth";
import Navbar from "../components/Navbar";
import MovieCard from "../components/MovieCard";

export default function Watchlist() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    }
  }, [router]);
  const demoMovies = [
    { title: "Interstellar", poster: "/poster1.jpg" },
    { title: "Inception", poster: "/poster2.jpg" },
    { title: "The Dark Knight", poster: "/poster3.jpg" },
  ];

  const user = getAuthUser();

  return (
    <div>
      <Navbar />

      <main style={{ padding: "18px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2>My Watchlist</h2>
          <div>
            <span style={{ marginRight: 12 }}>{user}</span>
            <button onClick={() => { logout(); router.replace('/login'); }}>Logout</button>
          </div>
        </div>

        <section className="movies-grid">
          {demoMovies.map((m, i) => (
            <MovieCard key={i} movie={m} />
          ))}
        </section>
      </main>
    </div>
  );
}
