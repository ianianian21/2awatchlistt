import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Navbar from '../../components/Navbar'
import { getCurrentUser, getUserRatings, updateUserProfile, updateUserPassword, uploadAvatar } from '../../lib/supabase'
import { getMovieById } from '../../lib/localdb'
import { getImageUrl } from '../../lib/supabase'

export default function ProfilePage() {
  const router = useRouter()
  const { id } = router.query
  const [user, setUser] = useState(null)
  const [ratings, setRatings] = useState([])
  const [enriched, setEnriched] = useState([])
  const [editing, setEditing] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')
  const [avatarInput, setAvatarInput] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)

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
        setUsernameInput(me.user_metadata?.username || '')
        setAvatarInput(me.user_metadata?.avatar_url || '')
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
      
        {id === 'me' && (
          <section style={{ marginTop: 28, padding: 18, background: '#070707', borderRadius: 8 }}>
            <h2 style={{ marginTop: 0 }}>Edit Profile</h2>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 96, height: 96, borderRadius: 8, overflow: 'hidden', background: '#222' }}>
                <img src={avatarInput || '/placeholder-movie.jpg'} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: '#ddd', marginBottom: 6 }}>Profile Image URL</label>
                <input value={avatarInput} onChange={(e) => setAvatarInput(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: 8, borderRadius: 6, border: 'none', background: '#222', color: '#ddd' }} />
                <div style={{ marginTop: 8, color: '#aaa', fontSize: 13 }}>Or upload an image</div>
                <input type="file" accept="image/*" onChange={(e) => {
                  const f = e.target.files?.[0] || null
                  if (f) {
                    setAvatarFile(f)
                    try {
                      const obj = URL.createObjectURL(f)
                      setAvatarInput(obj)
                    } catch (err) {}
                  }
                }} style={{ marginTop: 8 }} />
                <label style={{ display: 'block', color: '#ddd', marginTop: 12, marginBottom: 6 }}>Username</label>
                <input value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} placeholder="Username" style={{ width: '100%', padding: 8, borderRadius: 6, border: 'none', background: '#222', color: '#ddd' }} />

                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={async () => {
                    setMsg('')
                    let avatar_url_to_save = avatarInput

                    // If the user selected a file, upload it to storage first
                    if (avatarFile) {
                      setMsg('Uploading image...')
                      const up = await uploadAvatar(avatarFile, user?.id)
                      if (!up.ok) { setMsg(up.message || 'Upload failed'); return }
                      avatar_url_to_save = up.url
                    }

                    const res = await updateUserProfile({ username: usernameInput, avatar_url: avatar_url_to_save })
                    if (!res.ok) {
                      setMsg(res.message || 'Failed to update')
                      return
                    }

                    // Try to upsert a row in `profiles` table so other parts of the app can read profile info.
                    // This may fail with a Row-Level Security policy if your Supabase project doesn't allow
                    // authenticated users to INSERT/UPDATE their own profile row. We'll surface a helpful
                    // message with the SQL to fix it.
                    try {
                      const up = await upsertProfileRow({ id: user.id, username: usernameInput, avatar_url: avatar_url_to_save })
                      if (!up.ok) {
                        // Show focused guidance when RLS prevents the write
                        setMsg(`Profile updated in auth, but failed to write profiles table: ${up.message}.\nIf you see a Row-Level Security error, run the SQL below in Supabase SQL editor to allow authenticated users to manage their own profile rows.\n\n-- SQL to apply in Supabase SQL editor:\n-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;\n-- CREATE POLICY "Allow users to insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);\n-- CREATE POLICY "Allow users to update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);\n-- CREATE POLICY "Allow select to everyone" ON profiles FOR SELECT USING (true);`)
                      } else {
                        setMsg('Profile updated')
                        const me = await getCurrentUser(); setUser(me)
                        setAvatarFile(null)
                      }
                    } catch (err) {
                      setMsg('Profile updated in auth but failed to update profiles table: ' + (err.message || String(err)))
                    }
                  }} style={{ padding: '8px 12px', background: '#e50914', color: '#fff', border: 'none', borderRadius: 6 }}>Save</button>
                  <button onClick={() => { setUsernameInput(user.user_metadata?.username || ''); setAvatarInput(user.user_metadata?.avatar_url || ''); setAvatarFile(null) }} style={{ padding: '8px 12px', background: '#333', color: '#ddd', border: 'none', borderRadius: 6 }}>Reset</button>
                </div>

                <div style={{ marginTop: 14 }}>
                  <h3 style={{ margin: 0, marginBottom: 8 }}>Change Password</h3>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" style={{ width: '100%', padding: 8, borderRadius: 6, border: 'none', background: '#222', color: '#ddd', marginBottom: 8 }} />
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password" style={{ width: '100%', padding: 8, borderRadius: 6, border: 'none', background: '#222', color: '#ddd' }} />
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <button onClick={async () => {
                      setMsg('')
                      if (!newPassword) { setMsg('Please enter a new password'); return }
                      if (newPassword !== confirmPassword) { setMsg('Passwords do not match'); return }
                      const res = await updateUserPassword(newPassword)
                      if (!res.ok) setMsg(res.message || 'Failed to update password')
                      else {
                        setMsg('Password updated successfully')
                        setNewPassword('')
                        setConfirmPassword('')
                      }
                    }} style={{ padding: '8px 12px', background: '#e50914', color: '#fff', border: 'none', borderRadius: 6 }}>Change Password</button>
                  </div>
                </div>

                {msg && <div style={{ marginTop: 12, color: '#ddd' }}>{msg}</div>}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
