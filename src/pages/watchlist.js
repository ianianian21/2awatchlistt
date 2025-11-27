import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  getCurrentUser,
  signOut,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  searchMovies,
  getPopularMovies,
  getImageUrl,
  rateMovie,
  getMovieRating,
} from "../lib/supabase";
import Navbar from "../components/Navbar";
import { useToast } from "../components/ToastContext";

export default function Watchlist() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("watchlist"); // watchlist, search, popular
  const [ratingModal, setRatingModal] = useState(null); // { movieId, title }
  const [currentRating, setCurrentRating] = useState(0);
  const [review, setReview] = useState("");
  const toast = useToast();

  useEffect(() => {
    checkAuth();
    loadWatchlist();
    loadPopularMovies();
  }, []);

  // If navigated here with ?search=..., run the search automatically
  useEffect(() => {
    const q = router?.query?.search
    if (q && String(q).trim()) {
      (async () => {
        const results = await searchMovies(String(q))
        setSearchResults(results)
        setActiveTab('search')
        setSearchQuery(String(q))
      })()
    }
  }, [router?.query?.search])

  async function checkAuth() {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.replace("/login");
      return;
    }
    setUser(currentUser);
  }

  async function loadWatchlist() {
    setLoading(true);
    const data = await getWatchlist();
    setWatchlist(data);
    setLoading(false);
  }

  async function loadPopularMovies() {
    const movies = await getPopularMovies();
    setPopularMovies(movies);
  }

  async function handleSearch(e) {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    
    const results = await searchMovies(searchQuery);
    setSearchResults(results);
    setActiveTab("search");
  }

  async function handleAddToWatchlist(movie) {
    const result = await addToWatchlist(
      movie.id,
      movie.title,
      getImageUrl(movie.poster_path)
    );
    
    if (result.ok) {
      loadWatchlist();
      toast.showToast && toast.showToast(`Added "${movie.title}" to your watchlist`, { type: 'success' });
    } else {
      toast.showToast && toast.showToast(result.message || "Failed to add", { type: 'error' });
    }
  }

  async function handleRemoveFromWatchlist(movieId) {
    const result = await removeFromWatchlist(movieId);
    
    if (result.ok) {
      loadWatchlist();
      toast.showToast && toast.showToast('Removed from watchlist', { type: 'info' });
    } else {
      toast.showToast && toast.showToast(result.message || "Failed to remove", { type: 'error' });
    }
  }

  async function openRatingModal(movieId, title) {
    setRatingModal({ movieId, title });
    const existingRating = await getMovieRating(movieId);
    
    if (existingRating) {
      setCurrentRating(existingRating.rating);
      setReview(existingRating.review || "");
    } else {
      setCurrentRating(0);
      setReview("");
    }
  }

  async function handleSubmitRating() {
    if (currentRating === 0) {
      toast.showToast && toast.showToast("Please select a rating", { type: 'error' });
      return;
    }
    
    const result = await rateMovie(ratingModal.movieId, currentRating, review);
    
    if (result.ok) {
      toast.showToast && toast.showToast("Rating submitted!", { type: 'success' });
      setRatingModal(null);
      setCurrentRating(0);
      setReview("");
    } else {
      toast.showToast && toast.showToast(result.message || "Failed to submit rating", { type: 'error' });
    }
  }

  async function handleLogout() {
    await signOut();
    router.replace("/login");
  }

  if (!user) return null;

  return (
    <div>
      <Navbar />

      <main style={{ padding: "18px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2>2aWatchlist</h2>
          <div>
            <span style={{ marginRight: 12 }}>{user.email}</span>
            <button 
              onClick={handleLogout}
              style={{ 
                padding: "8px 16px", 
                background: "#e50914", 
                borderRadius: "4px",
                color: "white",
                fontWeight: "600"
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{ marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Search for movies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              maxWidth: "600px",
              padding: "12px",
              background: "#222",
              border: "1px solid #333",
              borderRadius: "4px",
              color: "white",
              fontSize: "16px"
            }}
          />
        </form>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, borderBottom: "1px solid #333" }}>
          <button 
            onClick={() => setActiveTab("watchlist")}
            style={{
              padding: "10px 20px",
              background: "transparent",
              color: activeTab === "watchlist" ? "#e50914" : "#999",
              borderBottom: activeTab === "watchlist" ? "2px solid #e50914" : "none",
              fontWeight: activeTab === "watchlist" ? "600" : "400"
            }}
          >
            My Watchlist ({watchlist.length})
          </button>
          <button 
            onClick={() => setActiveTab("search")}
            style={{
              padding: "10px 20px",
              background: "transparent",
              color: activeTab === "search" ? "#e50914" : "#999",
              borderBottom: activeTab === "search" ? "2px solid #e50914" : "none",
              fontWeight: activeTab === "search" ? "600" : "400"
            }}
          >
            Search Results
          </button>
          <button 
            onClick={() => setActiveTab("popular")}
            style={{
              padding: "10px 20px",
              background: "transparent",
              color: activeTab === "popular" ? "#e50914" : "#999",
              borderBottom: activeTab === "popular" ? "2px solid #e50914" : "none",
              fontWeight: activeTab === "popular" ? "600" : "400"
            }}
          >
            Popular
          </button>
        </div>

        {/* Watchlist Tab */}
        {activeTab === "watchlist" && (
          <section className="movies-grid">
            {loading && <p>Loading...</p>}
            {!loading && watchlist.length === 0 && <p>Your watchlist is empty. Search for movies to add!</p>}
            {watchlist.map((item) => (
              <div key={item.id} className="movie-card">
                <img src={item.movie_poster} alt={item.movie_title} className="poster" />
                <div className="movie-info">
                  <h4 className="movie-title">{item.movie_title}</h4>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button 
                      onClick={() => openRatingModal(item.movie_id, item.movie_title)}
                      style={{ 
                        padding: "6px 12px", 
                        background: "#333", 
                        borderRadius: "4px",
                        fontSize: "12px"
                      }}
                    >
                      ⭐ Rate
                    </button>
                    <button 
                      onClick={() => handleRemoveFromWatchlist(item.movie_id)}
                      style={{ 
                        padding: "6px 12px", 
                        background: "#e50914", 
                        borderRadius: "4px",
                        fontSize: "12px"
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Search Results Tab */}
        {activeTab === "search" && (
          <section className="movies-grid">
            {searchResults.length === 0 && <p>No search results. Try searching for a movie above.</p>}
            {searchResults.map((movie) => (
              <div key={movie.id} className="movie-card">
                <img src={getImageUrl(movie.poster_path)} alt={movie.title} className="poster" />
                <div className="movie-info">
                  <h4 className="movie-title">{movie.title}</h4>
                  <p style={{ fontSize: "12px", color: "#999" }}>⭐ {movie.vote_average?.toFixed(1)}</p>
                  <button 
                    onClick={() => handleAddToWatchlist(movie)}
                    style={{ 
                      marginTop: 8,
                      padding: "6px 12px", 
                      background: "#e50914", 
                      borderRadius: "4px",
                      fontSize: "12px",
                      width: "100%"
                    }}
                  >
                    + Add to Watchlist
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Popular Tab */}
        {activeTab === "popular" && (
          <section className="movies-grid">
            {popularMovies.map((movie) => (
              <div key={movie.id} className="movie-card">
                <img src={getImageUrl(movie.poster_path)} alt={movie.title} className="poster" />
                <div className="movie-info">
                  <h4 className="movie-title">{movie.title}</h4>
                  <p style={{ fontSize: "12px", color: "#999" }}>⭐ {movie.vote_average?.toFixed(1)}</p>
                  <button 
                    onClick={() => handleAddToWatchlist(movie)}
                    style={{ 
                      marginTop: 8,
                      padding: "6px 12px", 
                      background: "#e50914", 
                      borderRadius: "4px",
                      fontSize: "12px",
                      width: "100%"
                    }}
                  >
                    + Add to Watchlist
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Rating Modal */}
        {ratingModal && (
          <div 
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.8)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000
            }}
            onClick={() => setRatingModal(null)}
          >
            <div 
              style={{
                background: "#181818",
                padding: "30px",
                borderRadius: "8px",
                maxWidth: "400px",
                width: "90%"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ marginBottom: 20 }}>Rate: {ratingModal.title}</h3>
              
              <div style={{ marginBottom: 20 }}>
                <p style={{ marginBottom: 10 }}>Rating (1-10):</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[1,2,3,4,5,6,7,8,9,10].map(num => (
                    <button
                      key={num}
                      onClick={() => setCurrentRating(num)}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "4px",
                        background: currentRating === num ? "#e50914" : "#333",
                        fontSize: "16px",
                        fontWeight: "600"
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <p style={{ marginBottom: 10 }}>Review (optional):</p>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Write your review..."
                  style={{
                    width: "100%",
                    minHeight: "100px",
                    padding: "10px",
                    background: "#222",
                    border: "1px solid #333",
                    borderRadius: "4px",
                    color: "white",
                    fontSize: "14px"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleSubmitRating}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#e50914",
                    borderRadius: "4px",
                    fontWeight: "600"
                  }}
                >
                  Submit Rating
                </button>
                <button
                  onClick={() => setRatingModal(null)}
                  style={{
                    padding: "12px 20px",
                    background: "#333",
                    borderRadius: "4px"
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}