import { useEffect, useState } from 'react';
import { ref, onValue, set, push, remove, update } from 'firebase/database';
import { database } from '../lib/firebase';

export function useFirebaseRead<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dbRef = ref(database, path);
    const unsubscribe = onValue(
      dbRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData(snapshot.val());
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [path]);

  return { data, loading, error };
}

export async function firebaseWrite(path: string, data: any) {
  try {
    await set(ref(database, path), data);
  } catch (err: any) {
    throw new Error(err.message);
  }
}

export async function firebasePush(path: string, data: any) {
  try {
    const newRef = push(ref(database, path));
    await set(newRef, data);
    return newRef.key;
  } catch (err: any) {
    throw new Error(err.message);
  }
}

export async function firebaseUpdate(path: string, data: any) {
  try {
    await update(ref(database, path), data);
  } catch (err: any) {
    throw new Error(err.message);
  }
}

export async function firebaseDelete(path: string) {
  try {
    await remove(ref(database, path));
  } catch (err: any) {
    throw new Error(err.message);
  }
}
