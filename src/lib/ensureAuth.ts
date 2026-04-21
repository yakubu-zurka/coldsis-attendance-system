// This file is kept as a stub after migrating from Firebase to MongoDB.
// Firebase anonymous auth is no longer needed.
export async function ensureAuth(): Promise<void> {
  // No-op: Authentication is now handled by JWT via the Express backend.
  return Promise.resolve();
}
