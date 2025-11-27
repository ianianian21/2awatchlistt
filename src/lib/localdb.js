/*
  Minimal localStorage-backed data helper for demo purposes.
  Stores movies and ratings in localStorage so the UI can show details,
  ratings by users, and allow submitting ratings without a backend.
*/

export function getMovies() {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem('watchlist_movies');
  if (raw) return JSON.parse(raw);

  // seed demo movies
  const seed = [
    { id: 'm1', title: 'Interstellar', poster: '/poster1.jpg', genres: ['Sci-Fi', 'Drama'], synopsis: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.', cast: ['Matthew McConaughey','Anne Hathaway','Jessica Chastain'], trailer: 'zSWdZVtXT7E', dateAdded: Date.now() - 1000*60*60*24*10 },
    { id: 'm2', title: 'Inception', poster: '/poster2.jpg', genres: ['Sci-Fi','Action'], synopsis: 'A thief who steals corporate secrets through use of dream-sharing technology is given the inverse task of planting an idea into the mind of a CEO.', cast: ['Leonardo DiCaprio','Joseph Gordon-Levitt','Ellen Page'], trailer: '8hP9D6kZseM', dateAdded: Date.now() - 1000*60*60*24*20 },
    { id: 'm3', title: 'The Dark Knight', poster: '/poster3.jpg', genres: ['Action','Drama'], synopsis: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.', cast: ['Christian Bale','Heath Ledger','Aaron Eckhart'], trailer: 'EXeTwQWrcwY', dateAdded: Date.now() - 1000*60*60*24*5 },
    { id: 'm4', title: 'The Matrix', poster: '/poster4.jpg', genres: ['Sci-Fi','Action'], synopsis: 'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.', cast: ['Keanu Reeves','Laurence Fishburne','Carrie-Anne Moss'], trailer: 'm8e-FF8MsqU', dateAdded: Date.now() - 1000*60*60*24*30 },
  ];
  localStorage.setItem('watchlist_movies', JSON.stringify(seed));
  return seed;
}

export function getMovieById(id) {
  if (typeof window === 'undefined') return null;
  const movies = getMovies();
  return movies.find(m => m.id === id) || null;
}

export function getRatings(movieId) {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('watchlist_ratings');
    const map = raw ? JSON.parse(raw) : {};
    return map[movieId] || [];
  } catch (e) { return []; }
}

export function addRating(movieId, user, score, text) {
  if (typeof window === 'undefined') return { ok: false };
  const raw = localStorage.getItem('watchlist_ratings');
  const map = raw ? JSON.parse(raw) : {};
  if (!map[movieId]) map[movieId] = [];
  const entry = { id: `${movieId}_r_${Date.now()}`, user, score: Number(score), text: text || '', createdAt: Date.now() };
  map[movieId].push(entry);
  localStorage.setItem('watchlist_ratings', JSON.stringify(map));
  return { ok: true, entry };
}

export function getUserRatings(user) {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem('watchlist_ratings');
  const map = raw ? JSON.parse(raw) : {};
  const all = Object.values(map).flat();
  return all.filter(r => r.user === user);
}

export function getAverageRating(movieId) {
  const rs = getRatings(movieId);
  if (!rs.length) return null;
  const sum = rs.reduce((s, r) => s + Number(r.score), 0);
  return Number((sum / rs.length).toFixed(1));
}
