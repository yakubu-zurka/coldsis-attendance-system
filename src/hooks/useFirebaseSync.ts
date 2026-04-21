// This file is kept as a stub after migrating from Firebase to MongoDB.
// All Firebase sync operations are replaced by REST API + Socket.io in src/hooks/useApi.ts

export function useFirebaseRead<T>(_path: string) {
  return { data: null as T | null, loading: false, error: null };
}

export function useFirebaseQuery<T>(_path: string, _childKey: string, _value: any, _limit?: number) {
  return { data: null as T | null, loading: false, error: null };
}

export function useFirebaseRecent<T>(_path: string, _limit: number = 100) {
  return { data: null as T | null, loading: false, error: null };
}

export async function firebaseWrite(_path: string, _data: any) {}
export async function firebasePush(_path: string, _data: any) { return null; }
export async function firebaseUpdate(_path: string, _data: any) {}
export async function firebaseDelete(_path: string) {}
