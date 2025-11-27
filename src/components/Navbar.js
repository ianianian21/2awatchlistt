import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="nav">
      <div className="nav-left">
        <div className="brand">2aWatchlist</div>
        <ul className="nav-links">
          <li><Link href="/watchlist">Home</Link></li>
          <li><a>Movies</a></li>
          <li><a>My List</a></li>
        </ul>
      </div>
      <div className="nav-right">
        <input className="search" placeholder="Search" />
        <div className="avatar" />
      </div>
    </nav>
  );
}
