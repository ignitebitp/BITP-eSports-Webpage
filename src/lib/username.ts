export function normalizeUsername(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const username = value.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(username)) {
    return null;
  }
  return username;
}

export function usernameFromEmail(email: string): string {
  const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9._-]/g, "").replace(/^[^a-z0-9]+/, "").slice(0, 30);
  return /^[a-z0-9][a-z0-9._-]{2,29}$/.test(base) ? base : `user${base}`.slice(0, 30);
}
