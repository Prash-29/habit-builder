// Allowed admin emails come from the ADMIN_EMAILS env var (comma-separated).
// e.g. ADMIN_EMAILS="alice@x.com, bob@y.com"
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}
