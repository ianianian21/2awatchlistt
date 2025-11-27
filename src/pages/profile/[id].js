import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar'
import { getCurrentUser, getUserRatings } from '../../lib/supabase'
import { getMovieById } from '../../lib/localdb'
import { getImageUrl } from '../../lib/supabase'

export default function ProfilePage() {
  const router = useRouter()
  const { id } = router.query
  const [user, setUser] = useState(null)
  const [ratings, setRatings] = useState([])
  const [enriched, setEnriched] = useState([])

  useEffect(() => {
    async function load() {
      if (!id) return
      let uid = id
      if (id === 'me') {
        const me = await getCurrentUser()
        if (!me) {
          router.replace('/login')
          return
        }
        setUser(me)
        uid = me.id
      } else {
        setUser({ id })
      }

      const rs = await getUserRatings(uid)
      setRatings(rs)

      // Enrich ratings with movie title/poster (local fallback then TMDB)
      const enrichedList = await Promise.all(rs.map(async (r) => {
        const movieId = String(r.movie_id)
        let title = movieId
        let poster = '/placeholder-movie.jpg'

        if (movieId.startsWith('m')) {
          const local = getMovieById(movieId)
          if (local) {
            title = local.title
            poster = local.poster || poster
          }
        } else {
          // try TMDB lookup client-side
          const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY
          if (apiKey) {
            try {
              const resp = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}`)
              const data = await resp.json()
              if (data?.title) {
                title = data.title
                poster = data.poster_path ? getImageUrl(data.poster_path) : poster
              }
            } catch (e) {
              // ignore and keep placeholders
            }
          }
        }

        return {
          ...r,
          movieTitle: title,
          moviePoster: poster,
        }
      }))

      setEnriched(enrichedList)
    }
    load()
  }, [id])

  if (!id) return null

  return (
    <div>
      <Navbar />
      <main style={{ padding: 24 }}>
        <h1>Profile: {user?.email || user?.id || id}</h1>
        <p style={{ color: '#999' }}>Ratings submitted: {ratings.length}</p>

        {enriched.length === 0 && <p style={{ color: '#aaa' }}>No ratings yet.</p>}

        {enriched.map(r => (
          <div key={r.id || (r.movie_id + '_' + r.created_at)} style={{ padding: 12, borderBottom: '1px solid #222', display: 'flex', gap: 12, alignItems: 'center' }}>
            <img src={r.moviePoster} alt={r.movieTitle} style={{ width: 64, height: 96, objectFit: 'cover', borderRadius: 6 }} />
            <div style={{ flex: 1 }}>
              <a href={`/movie/${r.movie_id}`} style={{ color: '#fff', fontWeight: 700 }}>{r.movieTitle}</a>
              <div style={{ color: '#e5b45a', fontWeight: 600 }}>⭐ {r.rating}</div>
              <div style={{ color: '#ccc', marginTop: 8 }}>{r.review}</div>
              <div style={{ color: '#666', marginTop: 6, fontSize: 12 }}>{new Date(r.created_at).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
