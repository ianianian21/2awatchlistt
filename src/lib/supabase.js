import { createBrowserClient } from '@supabase/ssr'

let supabaseInstance = null

export function getSupabase() {
  if (!supabaseInstance && typeof window !== 'undefined') {
    supabaseInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
  return supabaseInstance
}

// Auth functions
export async function signUp(email, password) {
  const supabase = getSupabase()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  
  if (error) {
    return { ok: false, message: error.message }
  }
  
  return { ok: true, data }
}

export async function signIn(email, password) {
  const supabase = getSupabase()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    return { ok: false, message: error.message }
  }
  
  return { ok: true, data }
}

export async function signOut() {
  const supabase = getSupabase()
  await supabase.auth.signOut()

  // Remove saved "remember me" credentials when user signs out
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('remember_creds')
    }
  } catch (err) {
    // ignore storage errors
  }
}

// Update user profile metadata (username, avatar_url)
export async function updateUserProfile({ username, avatar_url }) {
  const supabase = getSupabase()
  const updates = {}
  if (typeof username !== 'undefined') updates.username = username
  if (typeof avatar_url !== 'undefined') updates.avatar_url = avatar_url

  try {
    const { data, error } = await supabase.auth.updateUser({ data: updates })
    if (error) return { ok: false, message: error.message }
    return { ok: true, data }
  } catch (err) {
    return { ok: false, message: err.message }
  }
}

// Change user password
export async function updateUserPassword(newPassword) {
  const supabase = getSupabase()
  try {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { ok: false, message: error.message }
    return { ok: true, data }
  } catch (err) {
    return { ok: false, message: err.message }
  }
}

// Upload avatar file to Supabase Storage (bucket: 'avatars') and return public URL
export async function uploadAvatar(file, userId) {
  const supabase = getSupabase()
  if (!file) return { ok: false, message: 'No file provided' }

  // create a unique filename
  const ext = file.name?.split('.')?.pop() || 'png'
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`
  // store under user-specific folder when userId available
  const prefix = userId ? `avatars/${userId}` : 'avatars'
  const filePath = `${prefix}/${fileName}`

  try {
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)
    if (uploadError) return { ok: false, message: uploadError.message }

    const { data: urlData, error: urlError } = supabase.storage.from('avatars').getPublicUrl(filePath)
    if (urlError) return { ok: false, message: urlError.message }
    const publicUrl = urlData?.publicUrl || null
    if (!publicUrl) return { ok: false, message: 'Failed to get public URL' }

    return { ok: true, url: publicUrl }
  } catch (err) {
    return { ok: false, message: err.message }
  }
}

export async function getCurrentUser() {
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Watchlist functions
export async function addToWatchlist(movieId, movieTitle, moviePoster) {
  const supabase = getSupabase()
  const user = await getCurrentUser()
  
  if (!user) {
    return { ok: false, message: 'Not authenticated' }
  }
  
  const { data, error } = await supabase
    .from('watchlist')
    .insert({
      user_id: user.id,
      movie_id: movieId,
      movie_title: movieTitle,
      movie_poster: moviePoster,
    })
  
  if (error) {
    return { ok: false, message: error.message }
  }
  
  return { ok: true, data }
}

export async function removeFromWatchlist(movieId) {
  const supabase = getSupabase()
  const user = await getCurrentUser()
  
  if (!user) {
    return { ok: false, message: 'Not authenticated' }
  }
  
  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', user.id)
    .eq('movie_id', movieId)
  
  if (error) {
    return { ok: false, message: error.message }
  }
  
  return { ok: true }
}

export async function getWatchlist() {
  const supabase = getSupabase()
  const user = await getCurrentUser()
  
  if (!user) {
    return []
  }
  
  const { data, error } = await supabase
    .from('watchlist')
    .select('*')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching watchlist:', error)
    return []
  }
  
  return data || []
}

// Rating functions
export async function rateMovie(movieId, rating, review = '') {
  const supabase = getSupabase()
  const user = await getCurrentUser()
  
  if (!user) {
    return { ok: false, message: 'Not authenticated' }
  }
  
  const { data, error } = await supabase
    .from('ratings')
    .upsert({
      user_id: user.id,
      movie_id: movieId,
      rating,
      review,
      updated_at: new Date().toISOString(),
    })
  
  if (error) {
    return { ok: false, message: error.message }
  }
  
  return { ok: true, data }
}

export async function getMovieRating(movieId) {
  const supabase = getSupabase()
  const user = await getCurrentUser()
  
  if (!user) {
    return null
  }
  
  const { data, error } = await supabase
    .from('ratings')
    .select('*')
    .eq('user_id', user.id)
    .eq('movie_id', movieId)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data
}

export async function getAllRatingsForMovie(movieId) {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('ratings')
    .select('rating, review, created_at')
    .eq('movie_id', movieId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching ratings:', error)
    return []
  }
  
  return data || []
}

export async function getUserRatings(userId) {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('ratings')
    .select('movie_id, rating, review, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user ratings:', error)
    return []
  }

  return data || []
}

// TMDB API functions
export async function searchMovies(query) {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY
  
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}`
    )
    const data = await response.json()
    return data.results || []
  } catch (error) {
    console.error('Error searching movies:', error)
    return []
  }
}

export async function getPopularMovies() {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY
  
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}`
    )
    const data = await response.json()
    return data.results || []
  } catch (error) {
    console.error('Error fetching popular movies:', error)
    return []
  }
}

export function getImageUrl(path, size = 'w500') {
  if (!path) return '/placeholder-movie.jpg'
  return `https://image.tmdb.org/t/p/${size}${path}`
}

// Upsert a row into a `profiles` table. Useful to keep a separate profiles table in sync.
export async function upsertProfileRow({ id, username, avatar_url }) {
  const supabase = getSupabase()
  try {
    const { data, error } = await supabase.from('profiles').upsert({ id, username, avatar_url })
    if (error) return { ok: false, message: error.message }
    return { ok: true, data }
  } catch (err) {
    return { ok: false, message: err.message }
  }
}