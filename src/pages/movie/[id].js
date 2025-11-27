import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar'
import { getAllRatingsForMovie, rateMovie } from '../../lib/supabase'
import { getMovieById } from '../../lib/localdb'
import { getImageUrl } from '../../lib/supabase'

export default function MovieDetail() {
  const router = useRouter()
  const { id } = router.query
  const [movie, setMovie] = useState(null)
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [myRating, setMyRating] = useState(0)
  const [review, setReview] = useState('')

  useEffect(() => {
    if (!id) return
    async function load() {
      setLoading(true)

      // If id looks like our local seeded id (starts with 'm'), use localdb
      if (String(id).startsWith('m')) {
        const local = getMovieById(id)
        setMovie(local)
      } else {
        // Try TMDB fetch (client-side). Will require NEXT_PUBLIC_TMDB_API_KEY set in env.
        try {
          const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY
          if (apiKey) {
            const resp = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&append_to_response=videos,credits`)
            const data = await resp.json()
            setMovie({
              id: data.id,
              title: data.title,
              poster: data.poster_path ? getImageUrl(data.poster_path, 'w500') : '/placeholder-movie.jpg',
              synopsis: data.overview,
              genres: (data.genres || []).map(g => g.name),
              cast: (data.credits?.cast || []).slice(0,6).map(c => c.name),
              trailer: (data.videos?.results || []).find(v => v.type === 'Trailer' && v.site === 'YouTube')?.key || null
            })
          } else {
            setMovie(getMovieById(id))
          }
        } catch (e) {
          setMovie(getMovieById(id))
        }
      }

      const rs = await getAllRatingsForMovie(id)
      setRatings(rs)
      setLoading(false)
    }

    load()
  }, [id])

  async function submitRating() {
    if (!myRating) {
      alert('Select a rating 1-10')
      return
    }
    const res = await rateMovie(id, myRating, review)
    if (res.ok) {
      const rs = await getAllRatingsForMovie(id)
      setRatings(rs)
      setReview('')
      alert('Rating saved')
    } else {
      alert(res.message || 'Failed to save rating')
    }
  }

  if (!movie && loading) return null

  return (
    <div>
      <Navbar />
      <main style={{ padding: 24 }}>
        <button onClick={() => router.back()} style={{ marginBottom: 12 }}>← Back</button>

        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <img src={movie?.poster || '/placeholder-movie.jpg'} alt={movie?.title} style={{ width: 260, borderRadius: 8 }} />

          <div style={{ maxWidth: 800 }}>
            <h1 style={{ marginBottom: 8 }}>{movie?.title}</h1>
            <p style={{ color: '#aaa', marginBottom: 12 }}>{movie?.genres?.join(' · ')}</p>
            <p style={{ lineHeight: 1.5 }}>{movie?.synopsis}</p>

            <h3 style={{ marginTop: 18 }}>Cast</h3>
            <p style={{ color: '#ddd' }}>{(movie?.cast || []).join(', ')}</p>

            {movie?.trailer && (
              <div style={{ marginTop: 18 }}>
                <h3>Trailer</h3>
                <div style={{ position: 'relative', paddingTop: '56.25%' }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${movie.trailer}`}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    title="Trailer"
                    frameBorder="0"
                  />
                </div>
              </div>
            )}

            <section style={{ marginTop: 20 }}>
              <h3>Ratings ({ratings.length})</h3>
              {ratings.length === 0 && <p style={{ color: '#999' }}>No ratings yet — be the first!</p>}
              {ratings.map(r => (
                <div key={r.id} style={{ padding: 10, borderBottom: '1px solid #222' }}>
                  <strong style={{ color: '#fff' }}>{r.user || r.user_id || 'User'}</strong>
                  <span style={{ marginLeft: 8, color: '#e5b45a' }}>⭐ {r.rating}</span>
                  <div style={{ color: '#ccc', marginTop: 6 }}>{r.review}</div>
                </div>
              ))}

              <div style={{ marginTop: 16 }}>
                <h4>Your Rating</h4>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button key={n} onClick={() => setMyRating(n)} style={{ background: myRating===n? '#e50914':'#333', color: '#fff', padding: 8, borderRadius: 4 }}>{n}</button>
                  ))}
                </div>
                <textarea value={review} onChange={e => setReview(e.target.value)} placeholder="Write a short review (optional)" style={{ width: '100%', minHeight: 80, background: '#111', color: '#fff', padding: 10, borderRadius: 6 }} />
                <div style={{ marginTop: 8 }}>
                  <button onClick={submitRating} style={{ background: '#e50914', color: '#fff', padding: '10px 16px', borderRadius: 6 }}>Submit</button>
                </div>
              </div>

            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
