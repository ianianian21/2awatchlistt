import Link from 'next/link';

export default function MovieCard({ movie }) {
  return (
    <Link href={`/movie/${movie.id}`}>
      <a className="movie-card" style={{ display: 'block' }}>
        <div className="poster-wrap">
          <img src={movie.poster} alt={movie.title} className="poster" />
        </div>
        <div className="movie-info">
          <h4 className="movie-title">{movie.title}</h4>
        </div>
      </a>
    </Link>
  );
}
