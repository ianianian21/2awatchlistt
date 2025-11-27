import Navbar from '../components/Navbar'
import { getPopularMovies, getImageUrl } from '../lib/supabase'
import { useEffect, useState } from 'react'

export default function Movies() {
  const [movies, setMovies] = useState([])

  useEffect(() => {
    async function load() {
      const m = await getPopularMovies()
      setMovies(m)
    }
    load()
  }, [])

  return (
    <div>
      <Navbar />
      <main style={{ padding: 24 }}>
        <h2>Movies</h2>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 16 }}>
          {movies.map(m => (
            <div key={m.id} className="movie-card">
              <img src={getImageUrl(m.poster_path)} alt={m.title} className="poster" />
              <div className="movie-info">
                <h4 className="movie-title">{m.title}</h4>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
