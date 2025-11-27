import Link from 'next/link';
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const router = useRouter()
  const [term, setTerm] = useState('')

  useEffect(() => {
    // keep navbar search input in sync with ?search= param when available
    const q = router?.query?.search
    if (typeof q === 'string') setTerm(q)
  }, [router?.query?.search])

  const handleEnter = (e) => {
    if (e.key === 'Enter') {
      const q = term || ''
      router.push(`/watchlist?search=${encodeURIComponent(q)}`)
    }
  }

  return (
    <nav className="nav">
      <div className="nav-left">
        <div className="brand"><Link href="/watchlist">2AWatchlist</Link></div>
        <ul className="nav-links">
          <Link href="/watchlist"><li className={`nav-item ${router.pathname === '/watchlist' ? 'active' : ''}`}>Home</li></Link>
          <Link href="/movies"><li className={`nav-item ${router.pathname === '/movies' ? 'active' : ''}`}>Movies</li></Link>
        </ul>
      </div>
      <div className="nav-right">
        <input
          className="search"
          placeholder="Search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={handleEnter}
        />
        <div className="avatar" />
      </div>
    </nav>
  );
}
