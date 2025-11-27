export function getUsers() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("watchlist_users");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveUsers(users) {
  if (typeof window === "undefined") return;
  localStorage.setItem("watchlist_users", JSON.stringify(users));
}

export function signup(email, password) {
  const users = getUsers();
  if (users.find((u) => u.email === email)) {
    return { ok: false, message: "User already exists" };
  }
  users.push({ email, password });
  saveUsers(users);
  localStorage.setItem("watchlist_auth", email);
  return { ok: true };
}

export function login(email, password) {
  const users = getUsers();
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) return { ok: false, message: "Invalid credentials" };
  localStorage.setItem("watchlist_auth", email);
  return { ok: true };
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("watchlist_auth");
}

export function getAuthUser() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("watchlist_auth");
}

export function isAuthenticated() {
  return !!getAuthUser();
}
