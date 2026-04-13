import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

export async function ensureAuth(timeout = 5000): Promise<void> {
  if (auth.currentUser) return;

  // Wait briefly for any background sign-in state to settle
  const settled = await new Promise<boolean>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(!!user);
    });
    // fallback after timeout
    setTimeout(() => { unsubscribe(); resolve(false); }, timeout);
  });

  if (settled) return;

  await signInAnonymously(auth);
}

export default ensureAuth;
