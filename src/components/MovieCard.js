export default function MovieCard({ movie }) {
  return (
    <div className="movie-card">
      <div className="poster-wrap">
        <img src={movie.poster} alt={movie.title} className="poster" />
      </div>
      <div className="movie-info">
        <h4 className="movie-title">{movie.title}</h4>
      </div>
    </div>
  );
}
