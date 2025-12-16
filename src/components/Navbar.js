import Link from 'next/link';
import { useRouter } from 'next/router'
import { useEffect, useState, useRef } from 'react'
import { getCurrentUser, signOut } from '../lib/supabase'

export default function Navbar() {
  const router = useRouter()
  const [term, setTerm] = useState('')
  const [user, setUser] = useState(null)
  const [open, setOpen] = useState(false)
  const menuRef = useRef()

  useEffect(() => {
    // keep navbar search input in sync with ?search= param when available
    const q = router?.query?.search
    if (typeof q === 'string') setTerm(q)
  }, [router?.query?.search])

  useEffect(() => {
    // load current user for avatar
    let mounted = true
    ;(async () => {
      const me = await getCurrentUser()
      if (mounted) setUser(me)
    })()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    function onDoc(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

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
      <div className="nav-right" style={{ position: 'relative' }}>
        <input
          className="search"
          placeholder="Search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={handleEnter}
        />

        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 6,
              overflow: 'hidden',
              border: 'none',
              background: '#222',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title={user?.email || 'Profile'}
          >
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 22, height: 22, background: '#444', borderRadius: 4 }} />
            )}
          </button>

          {open && (
            <div style={{ position: 'absolute', right: 0, marginTop: 8, background: '#0b0b0b', border: '1px solid #222', borderRadius: 6, minWidth: 160, zIndex: 50 }}>
              <Link href="/profile/me"><div style={{ display: 'block', padding: '10px 12px', color: '#ddd', textDecoration: 'none', cursor: 'pointer' }}>Profile</div></Link>
              <button onClick={async () => { await signOut(); router.push('/login') }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 'none', color: '#ddd', cursor: 'pointer' }}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
